import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Icons from 'lucide-react'
import {
  getTasks,
  removeTask,
  clearFinishedTasks,
  getWorkById,
  on,
  timeAgo,
} from '../../../services/store'

// 任务状态配置
const STATUS_CONFIG = {
  processing: { text: '进行中', icon: 'Loader2', style: 'bg-brand-500/10 text-brand-400 border-brand-500/20' },
  completed: { text: '已完成', icon: 'CheckCircle2', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  failed: { text: '失败', icon: 'XCircle', style: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

// Tab 过滤配置
const FILTER_TABS = [
  { id: 'all', name: '全部' },
  { id: 'processing', name: '进行中' },
  { id: 'completed', name: '已完成' },
  { id: 'failed', name: '失败' },
]

export default function TaskCenter() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [previewWork, setPreviewWork] = useState(null) // { name, type, url }
  const [previewLoading, setPreviewLoading] = useState(false)

  // 加载真实任务列表
  const refresh = useCallback(() => {
    setTasks(getTasks())
  }, [])

  useEffect(() => {
    refresh()
    // 订阅任务变化，实时刷新
    const off = on('tasks', refresh)
    return off
  }, [refresh])

  const filteredTasks = tasks.filter((task) => activeFilter === 'all' || task.status === activeFilter)

  const countOf = (status) => (status === 'all' ? tasks.length : tasks.filter((t) => t.status === status).length)
  const finishedCount = tasks.filter((t) => t.status === 'completed' || t.status === 'failed').length

  // 删除任务（仅已完成/失败）
  const handleRemove = (task) => {
    if (task.status === 'processing') return
    removeTask(task.id)
  }

  // 清空已结束任务
  const handleClearFinished = () => {
    clearFinishedTasks()
  }

  // 查看作品（已完成且有关联 workId）
  const handleViewWork = async (task) => {
    if (!task.workId) return
    setPreviewLoading(true)
    try {
      const work = await getWorkById(task.workId)
      if (work) {
        setPreviewWork(work)
      }
    } catch { /* 忽略读取失败 */ } finally {
      setPreviewLoading(false)
    }
  }

  const stats = [
    { label: '总任务', value: tasks.length, icon: 'ListChecks', color: 'from-brand-500 to-accent-500' },
    { label: '进行中', value: countOf('processing'), icon: 'Loader2', color: 'from-blue-500 to-cyan-500' },
    { label: '已完成', value: countOf('completed'), icon: 'CheckCircle2', color: 'from-emerald-500 to-teal-500' },
    { label: '失败', value: countOf('failed'), icon: 'XCircle', color: 'from-rose-500 to-pink-500' },
  ]

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <Icons.ListChecks className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">任务中心</h1>
        </div>
        <p className="text-sm text-dark-400 ml-10">
          追踪每一次生成与发布的真实状态，全流程可视化
        </p>
      </div>

      {/* 统计概览（真实计数） */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = Icons[stat.icon] || Icons.Circle
          return (
            <div key={stat.label} className="glass-card rounded-2xl p-4">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-dark-400 mt-0.5">{stat.label}</div>
            </div>
          )
        })}
      </div>

      {/* 工具栏：Tab 过滤 + 清空已结束 */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 p-1 bg-dark-900/80 rounded-xl border border-white/5">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeFilter === tab.id
                  ? 'bg-brand-500/15 text-brand-300'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              {tab.name}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeFilter === tab.id ? 'bg-brand-500/20 text-brand-300' : 'bg-dark-800 text-dark-500'
              }`}>
                {countOf(tab.id)}
              </span>
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button
          onClick={handleClearFinished}
          disabled={finishedCount === 0}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-dark-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Icons.Trash2 className="w-3.5 h-3.5" />
          清空已结束（{finishedCount}）
        </button>
      </div>

      {/* 任务列表（真实数据） */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {filteredTasks.length > 0 ? filteredTasks.map((task, idx) => {
          const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.processing
          const StatusIcon = Icons[statusConfig.icon] || Icons.Circle
          const canViewWork = task.status === 'completed' && task.workId
          const canDelete = task.status === 'completed' || task.status === 'failed'
          return (
            <div
              key={task.id}
              className={`flex items-center gap-4 p-4 hover:bg-white/5 transition-colors ${
                idx !== filteredTasks.length - 1 ? 'border-b border-white/5' : ''
              }`}
            >
              {/* 状态图标 */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${statusConfig.style}`}>
                <StatusIcon className={`w-5 h-5 ${task.status === 'processing' ? 'animate-spin' : ''}`} />
              </div>

              {/* 任务信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white truncate">{task.title}</span>
                  <span className="px-1.5 py-0.5 rounded bg-dark-800 text-dark-400 text-[10px] flex-shrink-0">
                    {task.type}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-dark-400 flex-wrap">
                  <span>{timeAgo(task.createdAt)}</span>
                  {task.module && (
                    <>
                      <span className="text-dark-600">·</span>
                      <span>{task.module}</span>
                    </>
                  )}
                  {task.status === 'failed' && task.error && (
                    <>
                      <span className="text-dark-600">·</span>
                      <span className="text-red-400 truncate max-w-[280px]" title={task.error}>
                        失败原因：{task.error}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* 状态 + 真实进度 */}
              <div className="hidden md:flex flex-col items-end gap-1.5 w-32 flex-shrink-0">
                <span className={`px-2 py-0.5 rounded-md text-xs border ${statusConfig.style}`}>
                  {statusConfig.text}
                </span>
                {task.status === 'processing' && (
                  <div className="w-full h-1 rounded-full bg-dark-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all"
                      style={{ width: `${task.progress || 0}%` }}
                    />
                  </div>
                )}
              </div>

              {/* 操作区 */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {canViewWork && (
                  <button
                    onClick={() => handleViewWork(task)}
                    disabled={previewLoading}
                    className="px-2.5 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium hover:bg-brand-500/20 transition-all flex items-center gap-1"
                  >
                    <Icons.Eye className="w-3.5 h-3.5" />
                    查看作品
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => handleRemove(task)}
                    className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="删除任务"
                  >
                    <Icons.Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )
        }) : (
          /* 空状态 */
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-dark-800 flex items-center justify-center mb-3">
              <Icons.ListChecks className="w-6 h-6 text-dark-500" />
            </div>
            <p className="text-sm text-dark-400 mb-1">
              {activeFilter === 'all' ? '暂无任务记录' : `暂无${FILTER_TABS.find((t) => t.id === activeFilter)?.name}任务`}
            </p>
            <p className="text-xs text-dark-500 mb-4">从「文生视频」开始你的第一次 AI 创作，任务会自动出现在这里</p>
            <button
              onClick={() => navigate('/dashboard/text-to-video')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-xs font-semibold flex items-center gap-1.5 hover:shadow-lg hover:shadow-brand-500/30 transition-all"
            >
              <Icons.Type className="w-3.5 h-3.5" />
              去文生视频
            </button>
          </div>
        )}
      </div>

      {/* 作品预览弹窗 */}
      {previewWork && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewWork(null)}
        >
          <div
            className="glass-card rounded-2xl w-full max-w-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">{previewWork.name}</h3>
                <p className="text-xs text-dark-400 mt-0.5">
                  {previewWork.type === 'video' ? '视频作品' : previewWork.type === 'audio' ? '音频作品' : '图片作品'}
                  {' · '}{timeAgo(previewWork.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setPreviewWork(null)}
                className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/5 transition-all flex-shrink-0"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 bg-dark-950/60 flex items-center justify-center max-h-[70vh]">
              {previewWork.type === 'video' && (
                <video src={previewWork.url} controls autoPlay className="max-w-full max-h-[60vh] rounded-xl" />
              )}
              {previewWork.type === 'audio' && (
                <audio src={previewWork.url} controls autoPlay className="w-full" />
              )}
              {previewWork.type === 'image' && (
                <img src={previewWork.url} alt={previewWork.name} className="max-w-full max-h-[60vh] rounded-xl object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
