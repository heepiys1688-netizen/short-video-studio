/**
 * 本地数据持久化层（真实存储，无任何模拟数据）
 *
 * - IndexedDB（shiguangji_studio）：作品（works）与素材（assets）的二进制 Blob 存储
 * - localStorage：任务队列、文案记录
 * - 事件订阅：on('works' | 'assets' | 'tasks' | 'scripts', cb) 数据变化时通知各页面实时刷新
 */

const DB_NAME = 'shiguangji_studio'
const DB_VERSION = 1

let dbPromise = null

const openDB = () => {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('works')) {
        db.createObjectStore('works', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('assets')) {
        db.createObjectStore('assets', { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

/* ============================== 事件总线 ============================== */

const listeners = { works: new Set(), assets: new Set(), tasks: new Set(), scripts: new Set() }

export const on = (event, cb) => {
  listeners[event]?.add(cb)
  return () => listeners[event]?.delete(cb)
}

const emit = (event) => {
  listeners[event]?.forEach((cb) => { try { cb() } catch { /* ignore */ } })
}

/* ============================== IndexedDB 通用操作 ============================== */

const idbPut = async (storeName, record) => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    tx.objectStore(storeName).put(record)
    tx.oncomplete = () => resolve(record)
    tx.onerror = () => reject(tx.error)
  })
}

const idbGetAll = async (storeName) => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const req = tx.objectStore(storeName).getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}

const idbDelete = async (storeName, id) => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    tx.objectStore(storeName).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/* ============================== 作品（生成的视频/图片/音频） ============================== */

/**
 * 保存作品
 * @param {Object} p - { type: 'video'|'image'|'audio', name, blob: Blob, meta: { module, prompt, model, duration, resolution, ... } }
 */
export const saveWork = async ({ type, name, blob, meta = {} }) => {
  const record = {
    id: uid(),
    type,
    name: name || `${type}_${Date.now()}`,
    blob,
    size: blob?.size || 0,
    meta,
    createdAt: Date.now(),
  }
  await idbPut('works', record)
  emit('works')
  return { ...record, url: record.blob ? URL.createObjectURL(record.blob) : '' }
}

/** 获取作品列表（新的在前），每条附带可用的 objectURL（无 blob 时回退到远程地址） */
export const getWorks = async (type) => {
  const all = await idbGetAll('works')
  return all
    .filter((w) => !type || w.type === type)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((w) => ({ ...w, url: w.blob ? URL.createObjectURL(w.blob) : (w.meta?.remoteUrl || '') }))
}

export const getWorkById = async (id) => {
  const all = await idbGetAll('works')
  const w = all.find((x) => x.id === id)
  return w ? { ...w, url: w.blob ? URL.createObjectURL(w.blob) : (w.meta?.remoteUrl || '') } : null
}

export const deleteWork = async (id) => {
  await idbDelete('works', id)
  emit('works')
}

/* ============================== 素材库 ============================== */

export const saveAsset = async ({ name, blob, kind, meta = {} }) => {
  const record = {
    id: uid(),
    name: name || `asset_${Date.now()}`,
    kind: kind || (blob?.type?.startsWith('video') ? 'video' : blob?.type?.startsWith('audio') ? 'audio' : 'image'),
    blob,
    size: blob?.size || 0,
    meta,
    createdAt: Date.now(),
  }
  await idbPut('assets', record)
  emit('assets')
  return record
}

export const getAssets = async (kind) => {
  const all = await idbGetAll('assets')
  return all
    .filter((a) => !kind || a.kind === kind)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((a) => ({ ...a, url: a.blob ? URL.createObjectURL(a.blob) : '' }))
}

export const deleteAsset = async (id) => {
  await idbDelete('assets', id)
  emit('assets')
}

/* ============================== 任务中心（localStorage） ============================== */

const TASKS_KEY = 'sgj_tasks'

const readTasks = () => {
  try { return JSON.parse(localStorage.getItem(TASKS_KEY) || '[]') } catch { return [] }
}

const writeTasks = (tasks) => {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks.slice(0, 100)))
  emit('tasks')
}

/** 创建任务，返回 task（页面在生成流程中实时 updateTask） */
export const createTask = ({ title, type, module }) => {
  const task = {
    id: uid(),
    title,
    type, // '文生视频' | '图生视频' | 'AI改写' | '配音' | '数字人' | '剪辑' | '混剪' | '文案提取' | '发布' | ...
    module: module || '',
    status: 'processing',
    progress: 0,
    createdAt: Date.now(),
    finishedAt: null,
    error: '',
    workId: null,
  }
  writeTasks([task, ...readTasks()])
  return task
}

export const updateTask = (id, patch) => {
  const tasks = readTasks().map((t) => (t.id === id ? { ...t, ...patch } : t))
  writeTasks(tasks)
}

export const getTasks = () =>
  readTasks().sort((a, b) => b.createdAt - a.createdAt)

export const clearFinishedTasks = () => {
  writeTasks(readTasks().filter((t) => t.status === 'processing'))
}

export const removeTask = (id) => {
  writeTasks(readTasks().filter((t) => t.id !== id))
}

/* ============================== 文案记录（提取/改写） ============================== */

const SCRIPTS_KEY = 'sgj_scripts'

export const saveScript = ({ title, content, tags = '', source = '', kind = '改写' }) => {
  const list = readScripts()
  const record = { id: uid(), title, content, tags, source, kind, createdAt: Date.now() }
  localStorage.setItem(SCRIPTS_KEY, JSON.stringify([record, ...list].slice(0, 100)))
  emit('scripts')
  return record
}

const readScripts = () => {
  try { return JSON.parse(localStorage.getItem(SCRIPTS_KEY) || '[]') } catch { return [] }
}

export const getScripts = () => readScripts().sort((a, b) => b.createdAt - a.createdAt)

export const deleteScript = (id) => {
  localStorage.setItem(SCRIPTS_KEY, JSON.stringify(readScripts().filter((s) => s.id !== id)))
  emit('scripts')
}

/* ============================== 统计（全部基于真实数据计算） ============================== */

export const getStats = async () => {
  const works = await idbGetAll('works')
  const assets = await idbGetAll('assets')
  const tasks = readTasks()
  const dayStart = new Date().setHours(0, 0, 0, 0)
  const weekStart = dayStart - 6 * 24 * 3600 * 1000

  let storageUsed = 0
  let storageQuota = 0
  try {
    const est = await navigator.storage.estimate()
    storageUsed = est.usage || 0
    storageQuota = est.quota || 0
  } catch { /* ignore */ }

  return {
    todayWorks: works.filter((w) => w.createdAt >= dayStart).length,
    weekWorks: works.filter((w) => w.createdAt >= weekStart).length,
    totalWorks: works.length,
    totalAssets: assets.length,
    runningTasks: tasks.filter((t) => t.status === 'processing').length,
    totalTasks: tasks.length,
    storageUsed,
    storageQuota,
    worksByType: {
      video: works.filter((w) => w.type === 'video').length,
      image: works.filter((w) => w.type === 'image').length,
      audio: works.filter((w) => w.type === 'audio').length,
    },
  }
}

/* ============================== 工具 ============================== */

export const timeAgo = (ts) => {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m}分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}小时前`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}天前`
  return new Date(ts).toLocaleDateString('zh-CN')
}

export const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

/** dataURL → Blob */
export const dataUrlToBlob = async (dataUrl) => (await fetch(dataUrl)).blob()

export default {
  on, saveWork, getWorks, getWorkById, deleteWork,
  saveAsset, getAssets, deleteAsset,
  createTask, updateTask, getTasks, clearFinishedTasks, removeTask,
  saveScript, getScripts, deleteScript,
  getStats, timeAgo, formatSize, dataUrlToBlob,
}
