import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Film,
  Play,
  Pause,
  Scissors,
  Type,
  Music,
  Image as ImageIcon,
  Layers,
  Loader2,
  ArrowRight,
  Download,
  Check,
  Settings2,
  Plus,
  Volume2,
  Maximize2,
} from 'lucide-react'

// 模拟时间轴片段
const TIMELINE_CLIPS = [
  { id: 1, name: '口播片段01', start: 0, duration: 8, type: 'video', color: 'bg-brand-500' },
  { id: 2, name: 'B-roll素材', start: 8, duration: 5, type: 'broll', color: 'bg-accent-500' },
  { id: 3, name: '口播片段02', start: 13, duration: 10, type: 'video', color: 'bg-brand-500' },
  { id: 4, name: '产品展示', start: 23, duration: 6, type: 'broll', color: 'bg-accent-500' },
  { id: 5, name: '结尾口播', start: 29, duration: 8, type: 'video', color: 'bg-brand-500' },
]

const SUBTITLE_TRACK = [
  { text: '夏天防晒别只知道涂脸', start: 0, duration: 3 },
  { text: '这3个部位漏了等于白涂', start: 3, duration: 3 },
  { text: '姐妹们听我说', start: 6, duration: 2 },
]

const TOOL_TABS = [
  { id: 'subtitle', name: '字幕', icon: Type },
  { id: 'music', name: '背景音乐', icon: Music },
  { id: 'overlay', name: '画中画', icon: Layers },
  { id: 'cover', name: '封面', icon: ImageIcon },
]

export default function Editing() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('subtitle')
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [synthesizing, setSynthesizing] = useState(false)
  const [synthesized, setSynthesized] = useState(false)
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true)
  const [bgmVolume, setBgmVolume] = useState(30)

  const totalDuration = 37

  const handleSynthesize = () => {
    setSynthesizing(true)
    setSynthesized(false)
    setTimeout(() => {
      setSynthesizing(false)
      setSynthesized(true)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <Film className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">剪辑合成</h1>
        </div>
        <p className="text-sm text-dark-400 ml-10">
          字幕自动对齐、画中画素材叠加、背景音乐混合，一键合成可投放的成片
        </p>
      </div>

      {/* 视频预览 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="glass-card rounded-2xl p-4">
            {/* 播放器 */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-dark-950 border border-white/5 mb-3">
              <div className="absolute inset-0 bg-gradient-to-br from-dark-800 to-dark-950 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3 mx-auto">
                    <Film className="w-8 h-8 text-dark-500" />
                  </div>
                  <p className="text-sm text-dark-400">视频预览</p>
                </div>
              </div>
              {/* 字幕层 */}
              {subtitlesEnabled && (
                <div className="absolute bottom-8 left-0 right-0 flex justify-center px-4">
                  <span className="px-4 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-sm font-medium">
                    {SUBTITLE_TRACK.find((s) => currentTime >= s.start && currentTime < s.start + s.duration)?.text || ''}
                  </span>
                </div>
              )}
              {/* 控制条 */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPlaying(!playing)}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                  >
                    {playing ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
                  </button>
                  <span className="text-xs text-white/80 tabular-nums">
                    00:{String(currentTime).padStart(2, '0')}
                  </span>
                  <div
                    className="flex-1 h-1 rounded-full bg-white/20 cursor-pointer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const pct = (e.clientX - rect.left) / rect.width
                      setCurrentTime(Math.round(pct * totalDuration))
                    }}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                      style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/80 tabular-nums">00:{String(totalDuration).padStart(2, '0')}</span>
                  <button className="text-white/60 hover:text-white">
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 时间轴 */}
          <div className="glass-card rounded-2xl p-4 mt-3">
            <div className="flex items-center gap-2 mb-3">
              <Scissors className="w-4 h-4 text-brand-400" />
              <span className="text-sm font-medium text-white">时间轴</span>
              <span className="text-xs text-dark-400 ml-auto">总时长 {totalDuration}s</span>
            </div>
            {/* 视频轨道 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-dark-400 w-16 flex-shrink-0">视频轨</span>
                <div className="flex-1 h-8 rounded-lg bg-dark-950/60 border border-white/5 flex overflow-hidden gap-1 p-1">
                  {TIMELINE_CLIPS.map((clip) => (
                    <div
                      key={clip.id}
                      className={`${clip.color} rounded h-full flex items-center px-2 text-xs text-white/90 truncate`}
                      style={{ width: `${(clip.duration / totalDuration) * 100}%` }}
                    >
                      {clip.name}
                    </div>
                  ))}
                </div>
              </div>
              {/* 字幕轨道 */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-dark-400 w-16 flex-shrink-0">字幕轨</span>
                <div className="flex-1 h-6 rounded-lg bg-dark-950/60 border border-white/5 flex overflow-hidden gap-1 p-1">
                  {SUBTITLE_TRACK.map((sub, idx) => (
                    <div
                      key={idx}
                      className="bg-accent-500/60 rounded h-full"
                      style={{
                        marginLeft: idx === 0 ? `${(sub.start / totalDuration) * 100}%` : '2px',
                        width: `${(sub.duration / totalDuration) * 100}%`,
                      }}
                    />
                  ))}
                </div>
              </div>
              {/* 音频轨道 */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-dark-400 w-16 flex-shrink-0">音频轨</span>
                <div className="flex-1 h-6 rounded-lg bg-dark-950/60 border border-white/5 flex items-center gap-[2px] px-2 overflow-hidden">
                  {Array.from({ length: 60 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-emerald-500/40 rounded-full"
                      style={{ height: `${30 + Math.sin(i * 0.3) * 40 + Math.random() * 30}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧工具面板 */}
        <div className="lg:col-span-1">
          <div className="glass-card rounded-2xl p-5">
            {/* 工具标签 */}
            <div className="flex gap-1 p-1 bg-dark-900/80 rounded-xl mb-5 border border-white/5">
              {TOOL_TABS.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-1 ${
                      activeTab === tab.id
                        ? 'bg-brand-500/15 text-brand-300'
                        : 'text-dark-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.name}
                  </button>
                )
              })}
            </div>

            {/* 字幕设置 */}
            {activeTab === 'subtitle' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">字幕开关</span>
                  <button
                    onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                    className={`relative w-10 h-5 rounded-full transition-all ${subtitlesEnabled ? 'bg-brand-500' : 'bg-dark-700'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${subtitlesEnabled ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
                <div>
                  <label className="block text-xs text-dark-400 mb-2">字幕样式</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['白底黑字', '黑底白字', '渐变描边', '简洁底部'].map((style, idx) => (
                      <button
                        key={style}
                        className={`p-2 rounded-lg text-xs border transition-all ${idx === 0 ? 'bg-brand-500/10 border-brand-500/40 text-brand-300' : 'bg-dark-900/50 border-white/5 text-dark-400 hover:text-white'}`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
                <button className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-dark-300 text-xs hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  添加自定义字幕
                </button>
              </div>
            )}

            {/* 背景音乐 */}
            {activeTab === 'music' && (
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-dark-400 mb-2">
                    <Volume2 className="w-3.5 h-3.5" />
                    BGM音量 <span className="text-brand-400 ml-auto">{bgmVolume}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={bgmVolume}
                    onChange={(e) => setBgmVolume(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  {['轻快节奏 - 夏日', '舒缓治愈 - 钢琴', '活力电子 - Vlog', '温暖原声 - 吉他'].map((music, idx) => (
                    <button
                      key={music}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all ${idx === 0 ? 'bg-brand-500/10 border-brand-500/40' : 'bg-dark-900/50 border-white/5 hover:border-white/10'}`}
                    >
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-dark-400" />
                        <span className="text-sm text-dark-200">{music}</span>
                      </div>
                      {idx === 0 && <Check className="w-4 h-4 text-brand-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 画中画 */}
            {activeTab === 'overlay' && (
              <div className="space-y-3">
                <p className="text-xs text-dark-400">在视频上叠加B-roll素材、产品图、贴纸等</p>
                {TIMELINE_CLIPS.filter((c) => c.type === 'broll').map((clip) => (
                  <div key={clip.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-dark-900/50 border border-white/5">
                    <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-accent-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{clip.name}</div>
                      <div className="text-xs text-dark-400">{clip.duration}s</div>
                    </div>
                  </div>
                ))}
                <button className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-dark-300 text-xs hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  添加画中画素材
                </button>
              </div>
            )}

            {/* 封面 */}
            {activeTab === 'cover' && (
              <div className="space-y-3">
                <p className="text-xs text-dark-400">选择或生成视频封面</p>
                <div className="grid grid-cols-2 gap-2">
                  {['封面模板A', '封面模板B', '封面模板C', '封面模板D'].map((cover, idx) => (
                    <button
                      key={cover}
                      className={`p-2 rounded-lg border transition-all ${idx === 0 ? 'bg-brand-500/10 border-brand-500/40' : 'bg-dark-900/50 border-white/5 hover:border-white/10'}`}
                    >
                      <div className="w-full aspect-video rounded bg-gradient-to-br from-brand-500/30 to-accent-500/30 mb-1.5 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-white/40" />
                      </div>
                      <span className="text-xs text-dark-300">{cover}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 合成按钮 */}
          <div className="mt-4 space-y-3">
            <button
              onClick={handleSynthesize}
              disabled={synthesizing}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-50"
            >
              {synthesizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  合成中...
                </>
              ) : (
                <>
                  <Film className="w-4 h-4" />
                  一键合成成片
                </>
              )}
            </button>
            {synthesized && (
              <div className="space-y-2 animate-fade-in">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-400">成片已合成，1080P / 30fps</span>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-dark-300 text-sm hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-1.5">
                    <Download className="w-4 h-4" />
                    下载
                  </button>
                  <button
                    onClick={() => navigate('/dashboard/mixed-edit')}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 hover:shadow-lg hover:shadow-brand-500/30 transition-all"
                  >
                    <ArrowRight className="w-4 h-4" />
                    下一步
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
