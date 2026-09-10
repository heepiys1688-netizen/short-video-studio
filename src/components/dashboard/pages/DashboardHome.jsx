import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { WORKFLOW_STEPS, PLATFORMS } from '../../../data/constants'

// 数据概览
const STATS_CARDS = [
  { id: 'today', label: '今日产出', value: '12', unit: '条', icon: 'Video', color: 'from-brand-500 to-accent-500', trend: '+3' },
  { id: 'week', label: '本周发布', value: '47', unit: '条', icon: 'Share2', color: 'from-emerald-500 to-teal-500', trend: '+15' },
  { id: 'assets', label: '素材总量', value: '1,283', unit: '个', icon: 'FolderOpen', color: 'from-amber-500 to-orange-500', trend: '+86' },
  { id: 'tasks', label: '任务进行中', value: '3', unit: '个', icon: 'ListChecks', color: 'from-rose-500 to-pink-500', trend: '实时' },
]

// 最近任务模拟数据
const RECENT_TASKS = [
  {
    id: 1,
    title: '夏季防晒种草口播 - 小红书',
    status: 'completed',
    statusText: '已完成',
    progress: 100,
    platform: 'xiaohongshu',
    time: '2小时前',
  },
  {
    id: 2,
    title: '职场干货分享系列 - 第3集',
    status: 'processing',
    statusText: '合成中',
    progress: 65,
    platform: 'douyin',
    time: '15分钟前',
  },
  {
    id: 3,
    title: '美食探店Vlog混剪 - 视频号',
    status: 'processing',
    statusText: '配音中',
    progress: 40,
    platform: 'shipinhao',
    time: '32分钟前',
  },
  {
    id: 4,
    title: '知识科普短视频 - 快手矩阵',
    status: 'pending',
    statusText: '排队中',
    progress: 0,
    platform: 'kuaishou',
    time: '1小时前',
  },
]

const STATUS_STYLES = {
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  processing: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

// 平台今日发布数模拟数据
const PLATFORM_STATS = [
  { id: 'douyin', today: 18, week: 52 },
  { id: 'xiaohongshu', today: 12, week: 38 },
  { id: 'shipinhao', today: 9, week: 25 },
  { id: 'kuaishou', today: 8, week: 20 },
]

export default function DashboardHome() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(null)

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

  const getPlatform = (id) => PLATFORMS.find((p) => p.id === id)

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
          <h1 className="text-3xl font-bold text-white mb-2">
            欢迎回来，创作者 👋
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

      {/* 数据概览卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS_CARDS.map((stat) => {
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

      {/* 最近任务 + 平台状态 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 最近任务列表 */}
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
            {RECENT_TASKS.map((task, idx) => {
              const platform = getPlatform(task.platform)
              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-4 p-4 hover:bg-white/5 transition-colors ${
                    idx !== RECENT_TASKS.length - 1 ? 'border-b border-white/5' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center text-lg flex-shrink-0">
                    {platform?.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white truncate">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-dark-400">{task.time}</span>
                      <span className="text-xs text-dark-500">{platform?.name}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${STATUS_STYLES[task.status]}`}>
                      {task.statusText}
                    </span>
                    {task.progress > 0 && (
                      <div className="w-20 h-1 rounded-full bg-dark-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 平台状态概览 */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">平台状态</h2>
          <div className="glass-card rounded-2xl p-5 space-y-4">
            {PLATFORM_STATS.map((ps) => {
              const platform = getPlatform(ps.id)
              const maxWeek = Math.max(...PLATFORM_STATS.map((p) => p.week))
              const barWidth = (ps.week / maxWeek) * 100
              return (
                <div key={ps.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{platform?.icon}</span>
                      <span className="text-sm text-white">{platform?.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-white">{ps.today}</span>
                      <span className="text-xs text-dark-400 ml-1">今日</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-dark-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${barWidth}%`,
                        background: `linear-gradient(90deg, ${platform?.color}88, ${platform?.color})`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-dark-500">本周 {ps.week} 条</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
