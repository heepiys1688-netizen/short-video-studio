import { useState } from 'react'
import {
  ListChecks,
  Search,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Filter,
  Play,
  Pause,
  Eye,
  Download,
} from 'lucide-react'

// 任务状态配置
const STATUS_CONFIG = {
  completed: { text: '已完成', icon: CheckCircle2, style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  processing: { text: '处理中', icon: Loader2, style: 'bg-brand-500/10 text-brand-400 border-brand-500/20' },
  pending: { text: '排队中', icon: Clock, style: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  failed: { text: '失败', icon: AlertCircle, style: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
}

// 任务类型
const TASK_TYPES = {
  extract: '文案提取',
  rewrite: 'AI改写',
  voice: '声音合成',
  digital: '数字人',
  edit: '剪辑合成',
  mix: '智能混剪',
  publish: '多平台发布',
}

// 模拟任务列表
const TASKS = [
  { id: 'T20260910-001', title: '夏季防晒种草口播 - 小红书', type: 'publish', status: 'completed', progress: 100, platform: 'xiaohongshu', createdAt: '2026-09-10 14:23', completedAt: '2026-09-10 14:28', duration: '5分钟' },
  { id: 'T20260910-002', title: '职场干货分享系列 - 第3集', type: 'edit', status: 'processing', progress: 65, platform: 'douyin', createdAt: '2026-09-10 14:05', completedAt: '-', duration: '进行中' },
  { id: 'T20260910-003', title: '美食探店Vlog混剪 - 视频号', type: 'voice', status: 'processing', progress: 40, platform: 'shipinhao', createdAt: '2026-09-10 13:48', completedAt: '-', duration: '进行中' },
  { id: 'T20260910-004', title: '知识科普短视频 - 快手矩阵', type: 'mix', status: 'pending', progress: 0, platform: 'kuaishou', createdAt: '2026-09-10 13:30', completedAt: '-', duration: '排队中' },
  { id: 'T20260909-018', title: '护肤好物种草 - 多平台分发', type: 'publish', status: 'completed', progress: 100, platform: 'douyin', createdAt: '2026-09-09 18:15', completedAt: '2026-09-09 18:22', duration: '7分钟' },
  { id: 'T20260909-017', title: '防晒口播文案AI改写', type: 'rewrite', status: 'completed', progress: 100, platform: 'xiaohongshu', createdAt: '2026-09-09 17:50', completedAt: '2026-09-09 17:52', duration: '2分钟' },
  { id: 'T20260909-016', title: '数字人口播视频生成 - 温柔学姐', type: 'digital', status: 'completed', progress: 100, platform: 'shipinhao', createdAt: '2026-09-09 16:30', completedAt: '2026-09-09 16:38', duration: '8分钟' },
  { id: 'T20260909-015', title: '抖音文案提取 - 防晒种草', type: 'extract', status: 'completed', progress: 100, platform: 'douyin', createdAt: '2026-09-09 16:10', completedAt: '2026-09-09 16:11', duration: '1分钟' },
  { id: 'T20260908-012', title: '快手混剪批量出片(10条)', type: 'mix', status: 'failed', progress: 30, platform: 'kuaishou', createdAt: '2026-09-08 20:45', completedAt: '-', duration: '失败' },
]

const PLATFORM_ICONS = {
  douyin: '🎵',
  xiaohongshu: '📕',
  shipinhao: '📺',
  kuaishou: '⚡',
}

const FILTER_TABS = [
  { id: 'all', name: '全部' },
  { id: 'processing', name: '处理中' },
  { id: 'completed', name: '已完成' },
  { id: 'pending', name: '排队中' },
  { id: 'failed', name: '失败' },
]

export default function TaskCenter() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)

  const filteredTasks = TASKS.filter((task) => {
    const matchFilter = activeFilter === 'all' || task.status === activeFilter
    const matchSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        task.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchFilter && matchSearch
  })

  const stats = {
    total: TASKS.length,
    processing: TASKS.filter((t) => t.status === 'processing').length,
    completed: TASKS.filter((t) => t.status === 'completed').length,
    pending: TASKS.filter((t) => t.status === 'pending').length,
    failed: TASKS.filter((t) => t.status === 'failed').length,
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <ListChecks className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">任务中心</h1>
        </div>
        <p className="text-sm text-dark-400 ml-10">
          追踪每一条视频的处理与发布状态，全流程可视化
        </p>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: '总任务', value: stats.total, icon: ListChecks, color: 'from-brand-500 to-accent-500' },
          { label: '处理中', value: stats.processing, icon: Loader2, color: 'from-blue-500 to-cyan-500' },
          { label: '已完成', value: stats.completed, icon: CheckCircle2, color: 'from-emerald-500 to-teal-500' },
          { label: '排队中', value: stats.pending, icon: Clock, color: 'from-amber-500 to-orange-500' },
          { label: '失败', value: stats.failed, icon: AlertCircle, color: 'from-rose-500 to-pink-500' },
        ].map((stat) => {
          const Icon = stat.icon
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

      {/* 工具栏 */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 p-1 bg-dark-900/80 rounded-xl border border-white/5">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeFilter === tab.id
                  ? 'bg-brand-500/15 text-brand-300'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索任务名称或ID..."
            className="w-full bg-dark-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all"
          />
        </div>
      </div>

      {/* 任务列表 */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {filteredTasks.map((task, idx) => {
          const statusConfig = STATUS_CONFIG[task.status]
          const StatusIcon = statusConfig.icon
          return (
            <div
              key={task.id}
              className={`flex items-center gap-4 p-4 hover:bg-white/5 transition-colors cursor-pointer ${
                idx !== filteredTasks.length - 1 ? 'border-b border-white/5' : ''
              } ${selectedTask === task.id ? 'bg-brand-500/5' : ''}`}
              onClick={() => setSelectedTask(selectedTask === task.id ? null : task.id)}
            >
              {/* 状态图标 */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${statusConfig.style} border`}>
                <StatusIcon className={`w-5 h-5 ${task.status === 'processing' ? 'animate-spin' : ''}`} />
              </div>

              {/* 任务信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white truncate">{task.title}</span>
                  <span className="text-base">{PLATFORM_ICONS[task.platform]}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-dark-400">
                  <span className="font-mono">{task.id}</span>
                  <span>·</span>
                  <span>{TASK_TYPES[task.type]}</span>
                  <span>·</span>
                  <span>{task.createdAt}</span>
                </div>
              </div>

              {/* 进度 */}
              <div className="hidden md:flex flex-col items-end gap-1.5 w-32 flex-shrink-0">
                <span className={`px-2 py-0.5 rounded-md text-xs border ${statusConfig.style}`}>
                  {statusConfig.text}
                </span>
                {task.progress > 0 && task.status !== 'completed' && (
                  <div className="w-full h-1 rounded-full bg-dark-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* 耗时 */}
              <div className="hidden lg:block text-right w-20 flex-shrink-0">
                <div className="text-xs text-dark-300">{task.duration}</div>
              </div>

              {/* 操作 */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {task.status === 'completed' && (
                  <>
                    <button className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/5 transition-all">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/5 transition-all">
                      <Download className="w-4 h-4" />
                    </button>
                  </>
                )}
                {task.status === 'processing' && (
                  <button className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/5 transition-all">
                    <Pause className="w-4 h-4" />
                  </button>
                )}
                {task.status === 'pending' && (
                  <button className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/5 transition-all">
                    <Play className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
        {filteredTasks.length === 0 && (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-dark-800 flex items-center justify-center mb-3">
              <ListChecks className="w-6 h-6 text-dark-500" />
            </div>
            <p className="text-sm text-dark-400 mb-1">没有找到匹配的任务</p>
            <p className="text-xs text-dark-500">试试更换筛选条件或搜索关键词</p>
          </div>
        )}
      </div>
    </div>
  )
}
