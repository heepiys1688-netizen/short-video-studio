import { useState, useRef, useEffect } from 'react'
import {
  Shuffle,
  Scissors,
  LayoutGrid,
  FileText,
  Mic,
  LayoutTemplate,
  Play,
  Check,
  Wand2,
  Film,
  Clapperboard,
  Clock,
  Crop,
  Image as ImageIcon,
} from 'lucide-react'
import { MIX_MODES } from '../../../data/constants'

// 图标映射
const ICON_MAP = {
  Scissors: Scissors,
  Shuffle: Shuffle,
  LayoutGrid: LayoutGrid,
  FileText: FileText,
  Mic: Mic,
  LayoutTemplate: LayoutTemplate,
}

// 模拟素材库
const MATERIALS = [
  { id: 'm-1', name: '产品展示片段A.mp4', duration: '00:15', type: 'video' },
  { id: 'm-2', name: '使用场景片段B.mp4', duration: '00:20', type: 'video' },
  { id: 'm-3', name: '口播讲解片段.mp4', duration: '00:30', type: 'video' },
  { id: 'm-4', name: '产品特写镜头.mp4', duration: '00:10', type: 'video' },
  { id: 'm-5', name: '用户反馈片段.mp4', duration: '00:18', type: 'video' },
  { id: 'm-6', name: '背景空镜素材.mp4', duration: '00:25', type: 'video' },
  { id: 'm-7', name: '产品包装图.png', duration: '图片', type: 'image' },
  { id: 'm-8', name: '品牌Logo素材.png', duration: '图片', type: 'image' },
]

// 时长选项
const DURATIONS = [
  { id: '15', name: '15秒' },
  { id: '30', name: '30秒' },
  { id: '60', name: '60秒' },
  { id: 'auto', name: '自适应' },
]

// 画面比例
const RATIOS = [
  { id: '9:16', name: '9:16', desc: '竖屏' },
  { id: '16:9', name: '16:9', desc: '横屏' },
  { id: '1:1', name: '1:1', desc: '方形' },
]

export default function MixedEdit() {
  const [activeMode, setActiveMode] = useState(MIX_MODES[0].id)
  const [selectedMaterials, setSelectedMaterials] = useState(['m-1', 'm-2', 'm-3'])
  const [outputCount, setOutputCount] = useState(5)
  const [duration, setDuration] = useState('30')
  const [ratio, setRatio] = useState('9:16')

  // 任务列表
  const [tasks, setTasks] = useState([])
  // 已完成成片
  const [completed, setCompleted] = useState([])
  const timerRef = useRef(null)

  // 清理
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // 当前模式
  const currentMode = MIX_MODES.find((m) => m.id === activeMode)

  // 切换素材选择
  const toggleMaterial = (id) => {
    setSelectedMaterials((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    )
  }

  // 开始混剪
  const handleStartMix = () => {
    if (selectedMaterials.length === 0) return
    // 创建新任务
    const newTasks = Array.from({ length: Math.min(outputCount, 5) }, (_, i) => ({
      id: `task-${Date.now()}-${i}`,
      name: `${currentMode.name}-成片${i + 1}`,
      progress: 0,
      status: 'running',
      mode: currentMode.name,
    }))
    setTasks((prev) => [...newTasks, ...prev])

    // 模拟进度推进
    timerRef.current = setInterval(() => {
      setTasks((prev) => {
        const updated = prev.map((t) => {
          if (t.status !== 'running') return t
          const newProgress = t.progress + Math.floor(Math.random() * 15) + 5
          if (newProgress >= 100) {
            // 完成成片
            setCompleted((c) => [
              {
                id: t.id,
                name: t.name,
                mode: t.mode,
                color: currentMode.color,
              },
              ...c,
            ])
            return { ...t, progress: 100, status: 'done' }
          }
          return { ...t, progress: newProgress }
        })
        // 如果没有 running 任务了，停止
        if (!updated.some((t) => t.status === 'running')) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        return updated
      })
    }, 800)
  }

  const hasRunning = tasks.some((t) => t.status === 'running')

  return (
    <div className="min-h-screen bg-dark-950 text-dark-100">
      {/* 顶部标题区 */}
      <div className="border-b border-white/5 bg-dark-900/50">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-lg shadow-brand-500/20">
              <Shuffle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">智能混剪 · 矩阵铺量</h1>
              <p className="mt-1 text-sm text-dark-400">
                选择混剪模式，批量产出差异化成片，一套素材快速铺量起号
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* 混剪模式标签页 */}
        <div className="glass-card rounded-xl p-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {MIX_MODES.map((mode) => {
              const Icon = ICON_MAP[mode.icon] || Shuffle
              const isActive = activeMode === mode.id
              return (
                <button
                  key={mode.id}
                  onClick={() => setActiveMode(mode.id)}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition ${
                    isActive
                      ? 'border-brand-500/50 bg-brand-500/10 shadow-lg shadow-brand-500/10'
                      : 'border-white/5 bg-dark-800/40 hover:border-white/10 hover:bg-dark-700/40'
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${mode.color} ${
                      isActive ? 'opacity-100' : 'opacity-70'
                    }`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-dark-200'}`}>
                      {mode.name}
                    </div>
                    <div className="text-[10px] text-dark-400">{mode.tag}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 模式描述 */}
        <div className="glass-card mt-6 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${currentMode.color}`}
            >
              {(() => {
                const Icon = ICON_MAP[currentMode.icon] || Shuffle
                return <Icon className="h-6 w-6 text-white" />
              })()}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">{currentMode.name}</h2>
              <p className="mt-1 text-sm leading-relaxed text-dark-300">{currentMode.desc}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {currentMode.features.map((feat, idx) => (
                  <span
                    key={idx}
                    className="rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-xs text-brand-300"
                  >
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 模式配置区 */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* 素材选择 */}
          <div className="glass-card rounded-xl p-6 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="h-5 w-5 text-brand-400" />
                <h2 className="text-lg font-semibold text-white">素材选择</h2>
              </div>
              <span className="text-xs text-dark-400">
                已选 {selectedMaterials.length}/{MATERIALS.length}
              </span>
            </div>
            <div className="space-y-2">
              {MATERIALS.map((mat) => {
                const isSelected = selectedMaterials.includes(mat.id)
                return (
                  <div
                    key={mat.id}
                    onClick={() => toggleMaterial(mat.id)}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                      isSelected
                        ? 'border-brand-500/40 bg-brand-500/5'
                        : 'border-white/5 bg-dark-800/40 hover:bg-dark-700/40'
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition ${
                        isSelected
                          ? 'border-brand-500 bg-gradient-to-br from-brand-500 to-accent-500'
                          : 'border-dark-500'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div
                      className={`flex h-9 w-14 flex-shrink-0 items-center justify-center rounded ${
                        mat.type === 'video'
                          ? 'bg-gradient-to-br from-brand-500/20 to-accent-500/20'
                          : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20'
                      }`}
                    >
                      {mat.type === 'video' ? (
                        <Clapperboard className="h-4 w-4 text-brand-300" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-amber-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-dark-100">{mat.name}</div>
                    </div>
                    <span className="text-xs text-dark-400">{mat.duration}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 出片参数 */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">出片参数</h2>
            <div className="space-y-5">
              {/* 出片数量 */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-dark-200">
                    <Wand2 className="h-4 w-4 text-brand-400" />
                    出片数量
                  </label>
                  <span className="rounded bg-brand-500/20 px-2 py-0.5 text-xs font-medium text-brand-300">
                    {outputCount} 条
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={outputCount}
                  onChange={(e) => setOutputCount(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="mt-1 flex justify-between text-xs text-dark-500">
                  <span>1</span>
                  <span>50</span>
                </div>
              </div>

              {/* 时长设置 */}
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-dark-200">
                  <Clock className="h-4 w-4 text-brand-400" />
                  时长设置
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDuration(d.id)}
                      className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                        duration === d.id
                          ? 'border-brand-500/50 bg-brand-500/10 text-white'
                          : 'border-white/5 bg-dark-800/40 text-dark-300 hover:bg-dark-700/40'
                      }`}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 画面比例 */}
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-dark-200">
                  <Crop className="h-4 w-4 text-brand-400" />
                  画面比例
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {RATIOS.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setRatio(r.id)}
                      className={`rounded-lg border px-2 py-2 text-center transition ${
                        ratio === r.id
                          ? 'border-brand-500/50 bg-brand-500/10 text-white'
                          : 'border-white/5 bg-dark-800/40 text-dark-300 hover:bg-dark-700/40'
                      }`}
                    >
                      <div className="text-sm font-semibold">{r.name}</div>
                      <div className="text-[10px] text-dark-400">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 开始混剪按钮 */}
            <button
              onClick={handleStartMix}
              disabled={selectedMaterials.length === 0 || hasRunning}
              className="glow-hover mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Wand2 className="h-4 w-4" />
              {hasRunning ? '混剪进行中...' : '开始混剪'}
            </button>
          </div>
        </div>

        {/* 底部结果区 */}
        {(tasks.length > 0 || completed.length > 0) && (
          <div className="mt-6 space-y-6">
            {/* 生成中的任务列表 */}
            {tasks.filter((t) => t.status === 'running').length > 0 && (
              <div className="glass-card rounded-xl p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  <Wand2 className="h-5 w-5 animate-pulse text-brand-400" />
                  生成中任务
                </h2>
                <div className="space-y-3">
                  {tasks
                    .filter((t) => t.status === 'running')
                    .map((task) => (
                      <div key={task.id} className="rounded-lg bg-dark-800/50 p-3">
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="text-dark-200">{task.name}</span>
                          <span className="text-xs text-brand-300">{task.progress}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-dark-700">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-300"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 已完成成片网格 */}
            {completed.length > 0 && (
              <div className="glass-card rounded-xl p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  <Check className="h-5 w-5 text-emerald-400" />
                  已完成成片
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                    {completed.length}
                  </span>
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {completed.map((item) => (
                    <div
                      key={item.id}
                      className="group overflow-hidden rounded-xl border border-white/5 bg-dark-800/40 transition hover:border-white/10"
                    >
                      {/* 缩略图 */}
                      <div
                        className={`relative aspect-[9/16] bg-gradient-to-br ${item.color}`}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-lg transition group-hover:opacity-100">
                            <Play className="h-5 w-5 translate-x-0.5 text-dark-900" />
                          </button>
                        </div>
                        <span className="absolute bottom-1.5 left-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white backdrop-blur">
                          {duration === 'auto' ? '自适应' : `${duration}s`}
                        </span>
                      </div>
                      <div className="p-2">
                        <div className="truncate text-xs font-medium text-dark-100">{item.name}</div>
                        <div className="mt-0.5 text-[10px] text-dark-400">{ratio} · {item.mode}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
