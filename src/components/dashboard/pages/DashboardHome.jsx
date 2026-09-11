import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { WORKFLOW_STEPS } from '../../../data/constants'
import { getStats, getTasks, on, timeAgo, formatSize } from '../../../services/store'

// 任务状态徽章映射
const STATUS_MAP = {
  processing: { text: '进行中', style: 'bg-brand-500/10 text-brand-400 border-brand-500/20' },
  completed: { text: '已完成', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  failed: { text: '失败', style: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

// 作品分布配置
const WORK_TYPE_META = {
  video: { name: '视频', icon: 'Video', bar: 'from-brand-500 to-accent-500', text: 'text-brand-400' },
  image: { name: '图片', icon: 'Image', bar: 'from-emerald-500 to-teal-500', text: 'text-emerald-400' },
  audio: { name: '音频', icon: 'AudioLines', bar: 'from-amber-500 to-orange-500', text: 'text-amber-400' },
}

export default function DashboardHome() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(null)
  const [stats, setStats] = useState(null)
  const [recentTasks, setRecentTasks] = useState([])

  // 加载真实数据
  const refresh = useCallback(async () => {
    try {
      const s = await getStats()
      setStats(s)
    } catch { /* 忽略统计读取失败 */ }
    setRecentTasks(getTasks().slice(0, 5))
  }, [])

  useEffect(() => {
    refresh()
    // 订阅任务与作品变化，实时刷新
    const offTasks = on('tasks', refresh)
    const offWorks = on('works', refresh)
    const offAssets = on('assets', refresh)
    return () => { offTasks(); offWorks(); offAssets() }
  }, [refresh])

  const handleStepClick = (step) => {
    setActiveStep(step.step)
    const stepRoutes = {
      1: '/dashboard/extract',
      2: '/dashboard/rewrite',
      3: '/dashboard/voice',
      4: '/dashboard/edit',
      5: '/dashboard/publish',
    }
    const route = stepRoutes[step.step]
    if (route) {
      setTimeout(() => navigate(route), 200)
    }
  }

  // 数据概览卡片（全部来自真实统计）
  const statsCards = [
    {
      id: 'today',
      label: '今日产出',
      value: stats?.todayWorks ?? 0,
      unit: '条',
      icon: 'Video',
      color: 'from-brand-500 to-accent-500',
      trend: stats ? `累计作品 ${stats.totalWorks} 条` : '读取中',
    },
    {
      id: 'week',
      label: '本周产出',
      value: stats?.weekWorks ?? 0,
      unit: '条',
      icon: 'TrendingUp',
      color: 'from-emerald-500 to-teal-500',
      trend: '近 7 天生成',
    },
    {
      id: 'assets',
      label: '素材总量',
      value: stats?.totalAssets ?? 0,
      unit: '个',
      icon: 'FolderOpen',
      color: 'from-amber-500 to-orange-500',
      trend: stats ? `存储 ${formatSize(stats.storageUsed)}` : '读取中',
    },
    {
      id: 'tasks',
      label: '任务进行中',
      value: stats?.runningTasks ?? 0,
      unit: '个',
      icon: 'ListChecks',
      color: 'from-rose-500 to-pink-500',
      trend: stats ? `累计任务 ${stats.totalTasks} 个` : '实时',
    },
  ]

  const worksTotal = stats ? stats.worksByType.video + stats.worksByType.image + stats.worksByType.audio : 0
  const storagePercent = stats && stats.storageQuota > 0
    ? Math.min(100, (stats.storageUsed / stats.storageQuota) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* 欢迎横幅 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-950 via-dark-900 to-dark-900 border border-white/5 p-8">
        <div className="hero-glow w-[300px] h-[300px] bg-brand-500 -top-20 -right-10" />
        <div className="hero-glow w-[200px] h-[200px] bg-accent-500 -bottom-10 right-1/3" style={{ animationDelay: '1s' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-medium border border-brand-500/20">
              工作台
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            欢迎回来，创作者 <Icons.Sparkles className="w-7 h-7 text-brand-400" />
          </h1>
          <p className="text-dark-400 text-sm leading-relaxed max-w-xl">
            从一条视频链接开始，5步生成可投放的短视频成片。点击下方流程入口，或从「文案提取」开始你的创作。
          </p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => navigate('/dashboard/extract')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-brand-500/30 transition-all"
            >
              <Icons.Link2 className="w-4 h-4" />
              快速开始
            </button>
            <button
              onClick={() => navigate('/dashboard/mixed-edit')}
              className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold flex items-center gap-2 hover:bg-white/10 transition-all"
            >
              <Icons.Shuffle className="w-4 h-4" />
              智能混剪
            </button>
          </div>
        </div>
      </div>

      {/* 数据概览卡片（真实统计） */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = Icons[stat.icon] || Icons.Circle
          return (
            <div
              key={stat.id}
              className="glass-card rounded-2xl p-5 hover:border-white/15 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-dark-500">{stat.trend}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white">{stat.value}</span>
                <span className="text-sm text-dark-400">{stat.unit}</span>
              </div>
              <div className="text-xs text-dark-400 mt-1">{stat.label}</div>
            </div>
          )
        })}
      </div>

      {/* 快捷操作区 - 5步流程 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">快捷流程入口</h2>
          <span className="text-xs text-dark-400">点击任意步骤直接跳转</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {WORKFLOW_STEPS.map((step) => {
            const Icon = Icons[step.icon] || Icons.Circle
            const isActive = activeStep === step.step
            return (
              <button
                key={step.step}
                onClick={() => handleStepClick(step)}
                className={`glass-card rounded-2xl p-5 text-left hover:border-brand-500/30 hover:bg-white/5 transition-all group relative overflow-hidden ${
                  isActive ? 'border-brand-500/40 bg-brand-500/5' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 border border-brand-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5 text-brand-400" />
                  </div>
                  <span className="text-2xl font-bold text-white/10 group-hover:text-white/20 transition-colors">
                    {step.step}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{step.title}</h3>
                <p className="text-xs text-dark-400 leading-relaxed line-clamp-2">{step.desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* 最近任务 + 作品分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 最近任务列表（真实数据） */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">最近任务</h2>
            <button
              onClick={() => navigate('/dashboard/tasks')}
              className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
            >
              查看全部
              <Icons.ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            {recentTasks.length > 0 ? recentTasks.map((task, idx) => {
              const status = STATUS_MAP[task.status] || STATUS_MAP.processing
              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-4 p-4 hover:bg-white/5 transition-colors ${
                    idx !== recentTasks.length - 1 ? 'border-b border-white/5' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center flex-shrink-0">
                    <Icons.ListChecks className="w-4 h-4 text-dark-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white truncate">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-dark-400">{timeAgo(task.createdAt)}</span>
                      <span className="text-xs text-dark-500">
                        {task.type}{task.module ? ` · ${task.module}` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${status.style}`}>
                      {status.text}
                    </span>
                    {task.status === 'processing' && (
                      <div className="w-20 h-1 rounded-full bg-dark-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all"
                          style={{ width: `${task.progress || 0}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )
            }) : (
              /* 空状态 */
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-dark-800 flex items-center justify-center mb-3">
                  <Icons.Inbox className="w-6 h-6 text-dark-500" />
                </div>
                <p className="text-sm text-dark-400 mb-1">暂无任务记录</p>
                <p className="text-xs text-dark-500 mb-4">从文案提取或文生视频开始，创建你的第一个创作任务</p>
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
        </div>

        {/* 作品分布 + 存储用量（真实数据） */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">作品分布</h2>
          <div className="glass-card rounded-2xl p-5 space-y-4">
            {worksTotal > 0 ? (
              Object.entries(WORK_TYPE_META).map(([type, meta]) => {
                const count = stats?.worksByType?.[type] || 0
                const percent = worksTotal > 0 ? (count / worksTotal) * 100 : 0
                const Icon = Icons[meta.icon] || Icons.Circle
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${meta.text}`} />
                        <span className="text-sm text-white">{meta.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-white">{count}</span>
                        <span className="text-xs text-dark-400 ml-1">条</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-dark-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${meta.bar} transition-all`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-dark-500">占比 {percent.toFixed(0)}%</span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-xl bg-dark-800 flex items-center justify-center mb-3">
                  <Icons.PieChart className="w-5 h-5 text-dark-500" />
                </div>
                <p className="text-xs text-dark-400 mb-1">还没有生成任何作品</p>
                <p className="text-xs text-dark-500">生成视频 / 图片 / 音频后这里会展示分布</p>
              </div>
            )}

            {/* 存储用量 */}
            <div className="pt-3 border-t border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icons.HardDrive className="w-4 h-4 text-dark-400" />
                  <span className="text-sm text-white">存储用量</span>
                </div>
                <span className="text-xs text-dark-400">
                  {formatSize(stats?.storageUsed || 0)}
                  {stats?.storageQuota ? ` / ${formatSize(stats.storageQuota)}` : ''}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-dark-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all"
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
              <p className="text-xs text-dark-500 mt-1.5">浏览器本地存储（IndexedDB）</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
