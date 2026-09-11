import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Icons from 'lucide-react'
import {
  getAssets,
  getWorks,
  saveAsset,
  deleteAsset,
  deleteWork,
  getStats,
  on,
  timeAgo,
  formatSize,
} from '../../../services/store'
import { downloadVideo } from '../../../services/videoApi'

// 类型过滤 Tab
const KIND_TABS = [
  { id: 'all', name: '全部', icon: 'Layers' },
  { id: 'video', name: '视频', icon: 'Video' },
  { id: 'image', name: '图片', icon: 'Image' },
  { id: 'audio', name: '音频', icon: 'Music' },
]

// 类型图标与配色
const KIND_META = {
  video: { icon: 'FileVideo', color: 'from-brand-500/30 to-accent-500/30', label: '视频' },
  image: { icon: 'FileImage', color: 'from-emerald-500/30 to-teal-500/30', label: '图片' },
  audio: { icon: 'FileAudio', color: 'from-amber-500/30 to-orange-500/30', label: '音频' },
}

// 按 MIME 判断素材类型
const kindOfFile = (file) => {
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'audio'
  return 'image'
}

// 推断文件扩展名
const extOf = (item) => {
  const fromName = item.name?.includes('.') ? item.name.split('.').pop() : ''
  if (fromName && fromName.length <= 5) return fromName.toLowerCase()
  const mime = item.blob?.type || ''
  if (mime.includes('/')) {
    const sub = mime.split('/')[1].split(';')[0]
    return sub === 'jpeg' ? 'jpg' : sub
  }
  return item.kind === 'video' ? 'mp4' : item.kind === 'audio' ? 'mp3' : 'png'
}

export default function AssetManager() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [stats, setStats] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [previewItem, setPreviewItem] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [notice, setNotice] = useState('')
  const fileInputRef = useRef(null)

  // 合并加载上传素材与 AI 生成作品（真实数据）
  const refresh = useCallback(async () => {
    try {
      const [assets, works, s] = await Promise.all([getAssets(), getWorks(), getStats()])
      const normalized = [
        ...assets.map((a) => ({
          ...a,
          kind: a.kind,
          source: 'asset',
          sourceLabel: '本地上传',
        })),
        ...works.map((w) => ({
          ...w,
          kind: w.type,
          source: 'work',
          sourceLabel: w.meta?.module ? `AI生成 · ${w.meta.module}` : 'AI生成',
        })),
      ].sort((a, b) => b.createdAt - a.createdAt)
      setItems(normalized)
      setStats(s)
    } catch { /* 忽略读取失败 */ }
  }, [])

  useEffect(() => {
    refresh()
    // 订阅素材与作品变化，实时刷新
    const offAssets = on('assets', refresh)
    const offWorks = on('works', refresh)
    return () => { offAssets(); offWorks() }
  }, [refresh])

  // 上传本地文件入库
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading(true)
    setNotice('')
    try {
      for (const file of files) {
        await saveAsset({
          name: file.name,
          blob: file,
          kind: kindOfFile(file),
          meta: { mime: file.type },
        })
      }
      setNotice(`已上传 ${files.length} 个文件到素材库`)
    } catch (err) {
      setNotice(`上传失败：${err.message || '请重试'}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // 下载（视频走 downloadVideo，其余用 a[download]）
  const handleDownload = (item) => {
    const ext = extOf(item)
    const baseName = item.name?.includes('.') ? item.name.replace(/\.[^.]+$/, '') : item.name
    if (item.kind === 'video') {
      downloadVideo(item.url, baseName, ext)
      return
    }
    const a = document.createElement('a')
    a.href = item.url
    a.download = `${baseName}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // 删除（按来源区分 deleteAsset / deleteWork）
  const handleDelete = async (item) => {
    try {
      if (item.source === 'asset') await deleteAsset(item.id)
      else await deleteWork(item.id)
      if (previewItem?.id === item.id) setPreviewItem(null)
    } catch {
      setNotice('删除失败，请重试')
    }
  }

  const filteredItems = items.filter((item) => {
    const matchTab = activeTab === 'all' || item.kind === activeTab
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchTab && matchSearch
  })

  const totalSize = items.reduce((sum, item) => sum + (item.size || 0), 0)
  const storagePercent = stats && stats.storageQuota > 0
    ? Math.min(100, (stats.storageUsed / stats.storageQuota) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* 页面标题 + 上传 */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
              <Icons.FolderOpen className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">素材资产库</h1>
          </div>
          <p className="text-sm text-dark-400 ml-10">
            统一管理本地上传素材与 AI 生成作品，全部保存在你的浏览器本地
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-50"
          >
            {uploading ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.Upload className="w-4 h-4" />}
            {uploading ? '上传中...' : '上传素材'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/*,image/*,audio/*"
            className="hidden"
            onChange={handleUpload}
          />
          {notice && <span className="text-xs text-dark-400">{notice}</span>}
        </div>
      </div>

      {/* 顶部统计（真实数量与大小） */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mb-3">
            <Icons.Database className="w-4 h-4 text-white" />
          </div>
          <div className="text-xl font-bold text-white">{items.length}</div>
          <div className="text-xs text-dark-400 mt-0.5">素材总数</div>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-3">
            <Icons.FileBox className="w-4 h-4 text-white" />
          </div>
          <div className="text-xl font-bold text-white">{formatSize(totalSize)}</div>
          <div className="text-xs text-dark-400 mt-0.5">素材总大小</div>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-3">
            <Icons.Wand2 className="w-4 h-4 text-white" />
          </div>
          <div className="text-xl font-bold text-white">{items.filter((i) => i.source === 'work').length}</div>
          <div className="text-xs text-dark-400 mt-0.5">AI 生成作品</div>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center mb-3">
            <Icons.HardDrive className="w-4 h-4 text-white" />
          </div>
          <div className="text-xl font-bold text-white">{formatSize(stats?.storageUsed || 0)}</div>
          <div className="text-xs text-dark-400 mt-0.5 mb-2">
            存储用量{stats?.storageQuota ? ` / ${formatSize(stats.storageQuota)}` : ''}
          </div>
          <div className="w-full h-1 rounded-full bg-dark-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all"
              style={{ width: `${storagePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 工具栏：类型 Tab + 搜索 */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 p-1 bg-dark-900/80 rounded-xl border border-white/5">
          {KIND_TABS.map((tab) => {
            const Icon = Icons[tab.icon] || Icons.Circle
            const count = tab.id === 'all' ? items.length : items.filter((i) => i.kind === tab.id).length
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-brand-500/15 text-brand-300'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.name}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-brand-500/20 text-brand-300' : 'bg-dark-800 text-dark-500'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
        <div className="relative flex-1 max-w-md">
          <Icons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索素材名称..."
            className="w-full bg-dark-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all"
          />
        </div>
      </div>

      {/* 素材网格 */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filteredItems.map((item) => {
            const meta = KIND_META[item.kind] || KIND_META.video
            const Icon = Icons[meta.icon] || Icons.File
            return (
              <div
                key={`${item.source}-${item.id}`}
                className="group overflow-hidden rounded-2xl border border-white/5 bg-dark-800/40 transition hover:border-white/10 hover:shadow-lg"
              >
                {/* 缩略图 */}
                <div
                  className={`relative aspect-video overflow-hidden bg-gradient-to-br ${meta.color} cursor-pointer`}
                  onClick={() => setPreviewItem(item)}
                >
                  {item.kind === 'image' ? (
                    <img src={item.url} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                  ) : item.kind === 'video' ? (
                    <video src={item.url} muted preload="metadata" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon className="h-8 w-8 text-white/40" />
                    </div>
                  )}
                  {/* 来源角标 */}
                  <span className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-medium backdrop-blur-sm ${
                    item.source === 'work'
                      ? 'bg-brand-500/70 text-white'
                      : 'bg-black/50 text-dark-200'
                  }`}>
                    {item.sourceLabel}
                  </span>
                  {/* 悬浮操作 */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreviewItem(item) }}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-lg transition hover:scale-110"
                      title="预览"
                    >
                      {item.kind === 'image'
                        ? <Icons.Eye className="h-4 w-4 text-dark-900" />
                        : <Icons.Play className="h-4 w-4 translate-x-0.5 text-dark-900" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownload(item) }}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-lg transition hover:scale-110"
                      title="下载"
                    >
                      <Icons.Download className="h-4 w-4 text-dark-900" />
                    </button>
                  </div>
                </div>
                {/* 信息 */}
                <div className="p-3">
                  <div className="truncate text-sm font-medium text-white" title={item.name}>
                    {item.name}
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-dark-400">
                      {formatSize(item.size)} · {timeAgo(item.createdAt)}
                    </span>
                    <button
                      onClick={() => handleDelete(item)}
                      className="text-dark-500 hover:text-red-400 transition-colors"
                      title="删除"
                    >
                      <Icons.Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* 空状态：引导上传或去生成 */
        <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-dark-800 flex items-center justify-center mb-3">
            <Icons.FolderOpen className="w-6 h-6 text-dark-500" />
          </div>
          <p className="text-sm text-dark-400 mb-1">
            {searchQuery || activeTab !== 'all' ? '没有找到匹配的素材' : '素材库还是空的'}
          </p>
          <p className="text-xs text-dark-500 mb-4">
            {searchQuery || activeTab !== 'all'
              ? '试试更换筛选类型或搜索关键词'
              : '上传本地素材，或用 AI 生成你的第一个作品'}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-white/10 transition-all"
            >
              <Icons.Upload className="w-3.5 h-3.5" />
              上传素材
            </button>
            <button
              onClick={() => navigate('/dashboard/text-to-video')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-xs font-semibold flex items-center gap-1.5 hover:shadow-lg hover:shadow-brand-500/30 transition-all"
            >
              <Icons.Wand2 className="w-3.5 h-3.5" />
              去生成作品
            </button>
          </div>
        </div>
      )}

      {/* 预览弹窗（真实播放/展示） */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="glass-card rounded-2xl w-full max-w-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">{previewItem.name}</h3>
                <p className="text-xs text-dark-400 mt-0.5">
                  {previewItem.sourceLabel} · {formatSize(previewItem.size)} · {timeAgo(previewItem.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleDownload(previewItem)}
                  className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/5 transition-all"
                  title="下载"
                >
                  <Icons.Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewItem(null)}
                  className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <Icons.X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-5 bg-dark-950/60 flex items-center justify-center max-h-[70vh]">
              {previewItem.kind === 'video' && (
                <video src={previewItem.url} controls autoPlay className="max-w-full max-h-[60vh] rounded-xl" />
              )}
              {previewItem.kind === 'audio' && (
                <div className="w-full space-y-4">
                  <div className="flex items-center justify-center py-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
                      <Icons.Music className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <audio src={previewItem.url} controls autoPlay className="w-full" />
                </div>
              )}
              {previewItem.kind === 'image' && (
                <img src={previewItem.url} alt={previewItem.name} className="max-w-full max-h-[60vh] rounded-xl object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
