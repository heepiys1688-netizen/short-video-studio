import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AudioWaveform,
  Play,
  Pause,
  Plus,
  Mic,
  Volume2,
  Gauge,
  Smile,
  Loader2,
  ArrowRight,
  Check,
  Trash2,
  Download,
} from 'lucide-react'

// 模拟音色库
const VOICE_LIBRARY = [
  { id: 'v1', name: '温柧行者', desc: '适合情感/治愈内容', gender: '女', duration: '12s', sample: '温柔治愈系女声' },
  { id: 'v2', name: '知识学长', desc: '适合科普/知识类', gender: '男', duration: '15s', sample: '沉稳磁性男声' },
  { id: 'v3', name: '活力少女', desc: '适合种草/生活方式', gender: '女', duration: '10s', sample: '元气活泼少女音' },
  { id: 'v4', name: '磁性大叔', desc: '适合口播/商业内容', gender: '男', duration: '14s', sample: '低沉磁性大叔音' },
  { id: 'v5', name: '邻家姐姐', desc: '适合日常/分享类', gender: '女', duration: '11s', sample: '亲切自然邻家感' },
  { id: 'v6', name: '专业旁白', desc: '适合纪录片/解说', gender: '男', duration: '13s', sample: '标准播音专业旁白' },
]

const SAMPLE_TEXT = '夏天防晒别只知道涂脸！这3个部位漏了等于白涂。姐妹们听我说，夏天防晒真的不只是涂脸就够了！很多人涂防晒只涂脸，结果脖子、手背、耳朵后面全晒黑了，真的太亏了！'

export default function VoiceTTS() {
  const navigate = useNavigate()
  const [selectedVoice, setSelectedVoice] = useState('v3')
  const [text, setText] = useState(SAMPLE_TEXT)
  const [speed, setSpeed] = useState(1.0)
  const [pitch, setPitch] = useState(0)
  const [emotion, setEmotion] = useState('neutral')
  const [synthesizing, setSynthesizing] = useState(false)
  const [synthesized, setSynthesized] = useState(false)
  const [playing, setPlaying] = useState(false)

  const EMOTIONS = [
    { id: 'neutral', name: '中性' },
    { id: 'happy', name: '开心' },
    { id: 'calm', name: '平静' },
    { id: 'serious', name: '严肃' },
    { id: 'excited', name: '激动' },
  ]

  const handleSynthesize = () => {
    if (!text.trim()) return
    setSynthesizing(true)
    setSynthesized(false)
    setTimeout(() => {
      setSynthesizing(false)
      setSynthesized(true)
    }, 1800)
  }

  const handlePlay = () => {
    setPlaying(!playing)
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <AudioWaveform className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">声音合成</h1>
        </div>
        <p className="text-sm text-dark-400 ml-10">
          高精度TTS合成，情绪、语速、停顿精细可调，多音色管理，账号矩阵不串声
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：音色库 */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">音色库</h2>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-400 text-xs border border-brand-500/20 hover:bg-brand-500/20 transition-all">
              <Plus className="w-3.5 h-3.5" />
              克隆新音色
            </button>
          </div>
          <div className="glass-card rounded-2xl p-4 space-y-2 max-h-[560px] overflow-y-auto">
            {VOICE_LIBRARY.map((voice) => (
              <button
                key={voice.id}
                onClick={() => setSelectedVoice(voice.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedVoice === voice.id
                    ? 'bg-brand-500/10 border-brand-500/40'
                    : 'bg-dark-900/50 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    selectedVoice === voice.id
                      ? 'bg-gradient-to-br from-brand-500 to-accent-500'
                      : 'bg-dark-800'
                  }`}>
                    <Mic className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{voice.name}</span>
                      <span className="text-xs text-dark-500">{voice.gender}</span>
                    </div>
                    <div className="text-xs text-dark-400 truncate">{voice.desc}</div>
                  </div>
                  {selectedVoice === voice.id && (
                    <Check className="w-4 h-4 text-brand-400 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 右侧：合成区 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 文本输入 */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">配音文本</h2>
              <span className="text-xs text-dark-400">{text.length} 字 · 约 {Math.ceil(text.length / 4)}秒</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="输入或粘贴需要配音的文案..."
              className="w-full bg-dark-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all resize-none leading-relaxed"
            />
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleSynthesize}
                disabled={!text.trim() || synthesizing}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-40"
              >
                {synthesizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    合成中...
                  </>
                ) : (
                  <>
                    <AudioWaveform className="w-4 h-4" />
                    开始合成
                  </>
                )}
              </button>
              <button
                onClick={() => setText('')}
                className="px-4 py-2.5 rounded-xl bg-dark-900/50 border border-white/10 text-dark-400 text-sm hover:text-white transition-all"
              >
                清空
              </button>
            </div>
          </div>

          {/* 参数调节 */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-5">参数调节</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 语速 */}
              <div>
                <label className="flex items-center gap-1.5 text-xs text-dark-400 mb-3">
                  <Gauge className="w-3.5 h-3.5" />
                  语速 <span className="text-brand-400 ml-auto">{speed.toFixed(1)}x</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-dark-500 mt-1">
                  <span>0.5x 慢</span>
                  <span>2.0x 快</span>
                </div>
              </div>

              {/* 音调 */}
              <div>
                <label className="flex items-center gap-1.5 text-xs text-dark-400 mb-3">
                  <Volume2 className="w-3.5 h-3.5" />
                  音调 <span className="text-brand-400 ml-auto">{pitch > 0 ? `+${pitch}` : pitch}</span>
                </label>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="1"
                  value={pitch}
                  onChange={(e) => setPitch(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-dark-500 mt-1">
                  <span>低沉</span>
                  <span>高亢</span>
                </div>
              </div>
            </div>

            {/* 情绪 */}
            <div className="mt-6">
              <label className="flex items-center gap-1.5 text-xs text-dark-400 mb-3">
                <Smile className="w-3.5 h-3.5" />
                情绪
              </label>
              <div className="flex flex-wrap gap-2">
                {EMOTIONS.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setEmotion(e.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                      emotion === e.id
                        ? 'bg-brand-500/15 border-brand-500/40 text-brand-300'
                        : 'bg-dark-900/50 border-white/5 text-dark-400 hover:text-white'
                    }`}
                  >
                    {e.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 合成结果 */}
          {synthesizing && (
            <div className="glass-card rounded-2xl p-10 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-brand-400 animate-spin mb-3" />
              <p className="text-sm text-dark-400">正在合成语音...</p>
            </div>
          )}

          {synthesized && !synthesizing && (
            <div className="glass-card rounded-2xl p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">
                    合成完成
                  </span>
                  <span className="text-xs text-dark-400">
                    {VOICE_LIBRARY.find((v) => v.id === selectedVoice)?.name} · {speed}x · 约{Math.ceil(text.length / 4)}秒
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-dark-300 hover:text-white transition-all">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-dark-300 hover:text-white transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {/* 波形可视化 */}
              <div className="bg-dark-950/60 rounded-xl p-4 border border-white/5 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={handlePlay}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/30 flex-shrink-0"
                  >
                    {playing ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-[2px] h-12">
                      {Array.from({ length: 48 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-full bg-gradient-to-t from-brand-500 to-accent-500"
                          style={{
                            height: `${playing ? (20 + Math.sin(i * 0.5) * 30 + Math.random() * 50) : (15 + Math.sin(i * 0.3) * 20)}%`,
                            opacity: playing ? 1 : 0.4,
                            transition: 'height 0.3s ease',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-dark-400">
                  <span>00:00</span>
                  <span>00:{String(Math.ceil(text.length / 4)).padStart(2, '0')}</span>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => navigate('/dashboard/digital-human')}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-brand-500/30 transition-all"
                >
                  进入下一步：数字人
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
