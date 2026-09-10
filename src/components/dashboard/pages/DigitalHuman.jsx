import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UserCircle,
  Play,
  Pause,
  Check,
  Loader2,
  ArrowRight,
  Settings2,
  Sparkles,
  Video,
  Eye,
} from 'lucide-react'

// 模拟数字人形象库
const DIGITAL_HUMANS = [
  { id: 'dh1', name: '知性主播', desc: '适合知识/科普', gender: '女', style: 'from-pink-500 to-rose-500', scenes: ['知识科普', '口播讲解'] },
  { id: 'dh2', name: '阳光型男', desc: '适合生活/运动', gender: '男', style: 'from-blue-500 to-cyan-500', scenes: ['生活分享', '运动健身'] },
  { id: 'dh3', name: '温柔学姐', desc: '适合种草/美妆', gender: '女', style: 'from-purple-500 to-pink-500', scenes: ['美妆种草', '护肤分享'] },
  { id: 'dh4', name: '专业讲师', desc: '适合商业/干货', gender: '男', style: 'from-amber-500 to-orange-500', scenes: ['商业口播', '干货分享'] },
  { id: 'dh5', name: '元气少女', desc: '适合日常/美食', gender: '女', style: 'from-emerald-500 to-teal-500', scenes: ['美食探店', '日常分享'] },
  { id: 'dh6', name: '沉稳大叔', desc: '适合财经/资讯', gender: '男', style: 'from-indigo-500 to-blue-500', scenes: ['财经资讯', '深度解读'] },
]

const BACKGROUND_OPTIONS = [
  { id: 'office', name: '简约办公室', color: 'from-slate-600 to-slate-800' },
  { id: 'studio', name: '纯色背景', color: 'from-brand-600 to-accent-600' },
  { id: 'living', name: '温馨客厅', color: 'from-amber-600 to-orange-700' },
  { id: 'outdoor', name: '户外场景', color: 'from-emerald-600 to-teal-700' },
]

export default function DigitalHuman() {
  const navigate = useNavigate()
  const [selectedHuman, setSelectedHuman] = useState('dh3')
  const [selectedBg, setSelectedBg] = useState('office')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [playing, setPlaying] = useState(false)

  const handleGenerate = () => {
    setGenerating(true)
    setGenerated(false)
    setTimeout(() => {
      setGenerating(false)
      setGenerated(true)
    }, 2000)
  }

  const currentHuman = DIGITAL_HUMANS.find((h) => h.id === selectedHuman)
  const currentBg = BACKGROUND_OPTIONS.find((b) => b.id === selectedBg)

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <UserCircle className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">数字人口播</h1>
        </div>
        <p className="text-sm text-dark-400 ml-10">
          多形象可选，口型与音频自动精准对齐，批量输出口播视频
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：形象选择 */}
        <div className="lg:col-span-1 space-y-6">
          <div>
            <h2 className="text-base font-semibold text-white mb-4">选择数字人形象</h2>
            <div className="grid grid-cols-2 gap-3">
              {DIGITAL_HUMANS.map((human) => (
                <button
                  key={human.id}
                  onClick={() => setSelectedHuman(human.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedHuman === human.id
                      ? 'bg-brand-500/10 border-brand-500/40'
                      : 'bg-dark-900/50 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className={`w-full aspect-square rounded-lg bg-gradient-to-br ${human.style} mb-2 flex items-center justify-center relative`}>
                    <UserCircle className="w-8 h-8 text-white/80" />
                    {selectedHuman === human.id && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-medium text-white truncate">{human.name}</div>
                  <div className="text-xs text-dark-400 truncate">{human.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 背景选择 */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">背景场景</h3>
            <div className="grid grid-cols-2 gap-2">
              {BACKGROUND_OPTIONS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setSelectedBg(bg.id)}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    selectedBg === bg.id
                      ? 'bg-brand-500/10 border-brand-500/40'
                      : 'bg-dark-900/50 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className={`w-full h-8 rounded bg-gradient-to-br ${bg.color} mb-1.5`} />
                  <span className="text-xs text-dark-300">{bg.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧：预览 + 生成 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 预览区 */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">预览</h2>
              {currentHuman && (
                <span className="text-xs text-dark-400">
                  {currentHuman.name} · {currentBg?.name}
                </span>
              )}
            </div>

            {/* 视频预览框 */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-dark-950 border border-white/5">
              {/* 背景层 */}
              <div className={`absolute inset-0 bg-gradient-to-br ${currentBg?.color}`} />
              {/* 人物占位 */}
              <div className="absolute inset-0 flex items-center justify-center">
                {generating ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-10 h-10 text-white animate-spin mb-3" />
                    <p className="text-sm text-white/80">正在生成口播视频...</p>
                    <p className="text-xs text-white/50 mt-1">口型对齐 + 渲染中</p>
                  </div>
                ) : generated ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${currentHuman?.style} flex items-center justify-center shadow-2xl`}>
                      <UserCircle className="w-16 h-16 text-white" />
                    </div>
                    <button
                      onClick={() => setPlaying(!playing)}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-all"
                    >
                      {playing ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${currentHuman?.style} flex items-center justify-center shadow-2xl mb-4 opacity-60`}>
                      <UserCircle className="w-16 h-16 text-white" />
                    </div>
                    <p className="text-sm text-white/60">点击下方按钮生成口播视频</p>
                  </div>
                )}
              </div>
              {/* 顶部标签 */}
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="px-2 py-1 rounded-md bg-black/40 backdrop-blur-sm text-white text-xs">
                  {currentHuman?.name}
                </span>
                {generated && (
                  <span className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-xs border border-emerald-500/30">
                    已生成
                  </span>
                )}
              </div>
              {generated && (
                <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/40 backdrop-blur-sm text-white text-xs">
                  00:45 / 00:45
                </div>
              )}
            </div>

            {/* 生成按钮 */}
            <div className="flex items-center justify-between mt-5">
              <div className="text-xs text-dark-400">
                <Settings2 className="w-3.5 h-3.5 inline mr-1" />
                口型自动对齐 · 1080P · 30fps
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    生成中...
                  </>
                ) : generated ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    重新生成
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4" />
                    生成口播视频
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 适用场景 */}
          {currentHuman && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-brand-400" />
                适用场景
              </h3>
              <div className="flex flex-wrap gap-2">
                {currentHuman.scenes.map((scene, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-dark-200"
                  >
                    {scene}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 下一步 */}
          {generated && (
            <div className="flex items-center justify-end">
              <button
                onClick={() => navigate('/dashboard/edit')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-brand-500/30 transition-all"
              >
                进入下一步：剪辑合成
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
