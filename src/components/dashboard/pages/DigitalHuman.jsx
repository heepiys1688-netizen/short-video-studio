import { useState, useRef, useEffect, useCallback } from 'react'
import * as Icons from 'lucide-react'
import { recordCanvas, downloadVideo } from '../../../services/videoApi'
import {
  generateImage,
  generateSpeechCloud,
  getLocalVoices,
  speakLocal,
  CLOUD_VOICES,
} from '../../../services/aiApi'
import {
  saveWork,
  getWorks,
  deleteWork,
  createTask,
  updateTask,
  on,
  timeAgo,
  formatSize,
} from '../../../services/store'

/* ============================== 工具函数 ============================== */

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = src
  })

// 按中文标点切句，用于字幕逐句推进
const splitSentences = (text) => {
  const parts = text
    .split(/(?<=[。！？!?；;])/)
    .map((s) => s.trim())
    .filter(Boolean)
  return parts.length ? parts : text.trim() ? [text.trim()] : []
}

// 文本自动换行
const wrapText = (ctx, text, maxWidth) => {
  const lines = []
  let line = ''
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxWidth && line) {
      lines.push(line)
      line = ch
    } else {
      line += ch
    }
  }
  if (line) lines.push(line)
  return lines
}

// 圆角矩形（兼容旧浏览器）
const roundRectPath = (ctx, x, y, w, h, r) => {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

// 根据 blob 类型推断扩展名
const extOfBlob = (blob) => {
  const t = blob?.type || ''
  if (t.includes('mp4')) return 'mp4'
  if (t.includes('webm')) return 'webm'
  return 'mp4'
}

/* ============================== 组件 ============================== */

export default function DigitalHuman() {
  // 形象
  const [avatarSrc, setAvatarSrc] = useState(null)
  const [avatarName, setAvatarName] = useState('')
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageGenerating, setImageGenerating] = useState(false)

  // 文案
  const [text, setText] = useState('')

  // 声音
  const [voiceTab, setVoiceTab] = useState('cloud')
  const [localVoices, setLocalVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState(null)

  // 流程状态
  const [recording, setRecording] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('')
  const [result, setResult] = useState(null)
  const [isLocalVoice, setIsLocalVoice] = useState(false)
  const [error, setError] = useState('')

  // 历史
  const [history, setHistory] = useState([])

  const avatarInputRef = useRef(null)
  const aliveRef = useRef(true)
  const stopLocalRef = useRef(null)
  const audioCtxRef = useRef(null)

  /* ---------- 本地真实音色加载 ---------- */
  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const load = () => setLocalVoices(getLocalVoices())
    load()
    window.speechSynthesis.addEventListener?.('voiceschanged', load)
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', load)
      try { window.speechSynthesis.cancel() } catch { /* ignore */ }
    }
  }, [])

  // 默认选中第一个云端音色
  useEffect(() => {
    if (selectedVoice) return
    if (CLOUD_VOICES.length > 0) setSelectedVoice({ group: 'cloud', id: CLOUD_VOICES[0].id })
  }, [selectedVoice])

  /* ---------- 历史作品（真实） ---------- */
  const loadHistory = useCallback(async () => {
    try {
      const works = await getWorks('video')
      setHistory(works.filter((w) => w.meta?.module === 'digital-human'))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    loadHistory()
    const off = on('works', loadHistory)
    return () => off()
  }, [loadHistory])

  /* ---------- 卸载清理：停止录音/播放，避免泄漏 ---------- */
  useEffect(() => {
    return () => {
      aliveRef.current = false
      try { stopLocalRef.current?.stop() } catch { /* ignore */ }
      try { audioCtxRef.current?.close() } catch { /* ignore */ }
      try { window.speechSynthesis?.cancel() } catch { /* ignore */ }
    }
  }, [])

  /* ---------- 形象：上传照片 ---------- */
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setAvatarSrc(reader.result)
      setAvatarName(file.name)
    }
    reader.readAsDataURL(file)
  }

  /* ---------- 形象：AI 生成（写实人像英文 prompt，768x1024） ---------- */
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      setError('请输入数字人形象描述')
      return
    }
    if (imageGenerating) return
    setImageGenerating(true)
    setError('')
    try {
      const prompt = `A photorealistic professional studio portrait headshot of ${imagePrompt.trim()}, facing camera, shoulders up, clean dark gradient studio background, soft cinematic rim lighting, sharp focus on face, ultra detailed, 8k`
      const res = await generateImage(prompt, {
        width: 768,
        height: 1024,
        seed: Math.floor(Math.random() * 1e6),
      })
      setAvatarSrc(res.url)
      setAvatarName('AI 生成形象')
    } catch (err) {
      setError(`AI 生成形象失败：${err.message || '请重试'}（可改用上传照片）`)
    } finally {
      setImageGenerating(false)
    }
  }

  const selectedVoiceName = selectedVoice
    ? selectedVoice.group === 'cloud'
      ? CLOUD_VOICES.find((v) => v.id === selectedVoice.id)?.name || selectedVoice.id
      : localVoices.find((v) => v.id === selectedVoice.id)?.name || selectedVoice.id
    : ''

  /* ---------- 生成口播视频（真实录制） ---------- */
  const handleGenerate = async () => {
    if (recording) return
    const content = text.trim()
    if (!avatarSrc) { setError('请先上传照片或 AI 生成数字人形象'); return }
    if (!content) { setError('请输入口播文案'); return }
    if (!selectedVoice) { setError('请选择一个声音音色'); return }

    setError('')
    setResult(null)
    setProgress(0)
    setStatusText('')

    const isCloud = selectedVoice.group === 'cloud'
    setIsLocalVoice(!isCloud)

    let avatarImg = null
    try {
      avatarImg = await loadImage(avatarSrc)
    } catch (err) {
      setError(`头像加载失败：${err.message}`)
      return
    }

    let audioEl = null
    let actx = null
    let analyser = null
    let freqData = null
    let extraTracks = []
    let duration = 0

    // 准备配音：云端出 MP3 + 混音轨；本地直接现场播报
    if (isCloud) {
      setStatusText('正在生成云端配音 MP3...')
      const voice = CLOUD_VOICES.find((v) => v.id === selectedVoice.id) || CLOUD_VOICES[0]
      try {
        const speech = await generateSpeechCloud(content, { voice: voice.id })
        audioEl = new Audio(speech.url)
        audioEl.preload = 'auto'
        await new Promise((resolve, reject) => {
          audioEl.onloadedmetadata = resolve
          audioEl.onerror = () => reject(new Error('云端音频加载失败'))
          if (audioEl.readyState >= 1) resolve()
        })
        duration = audioEl.duration || Math.max(3, Math.ceil(content.length * 0.28))
        const AC = window.AudioContext || window.webkitAudioContext
        actx = new AC()
        const srcNode = actx.createMediaElementSource(audioEl)
        const dest = actx.createMediaStreamDestination()
        analyser = actx.createAnalyser()
        analyser.fftSize = 256
        srcNode.connect(dest)
        srcNode.connect(analyser)
        srcNode.connect(actx.destination) // 同时监听播放
        extraTracks = dest.stream.getAudioTracks()
        await actx.resume()
        audioCtxRef.current = actx
        freqData = new Uint8Array(analyser.frequencyBinCount)
      } catch (err) {
        setError(`配音准备失败：${err.message || '请重试'}。可切换「本地音色」现场播报后再试。`)
        try { actx?.close() } catch { /* ignore */ }
        return
      }
    } else {
      // 本地口语速约 0.28s/字估算时长
      duration = Math.max(3, Math.ceil(content.length * 0.28))
    }

    // 字幕分段（按字数占比均分到总时长）
    const sentences = splitSentences(content)
    const totalChars = sentences.reduce((s, x) => s + x.length, 0) || 1
    let cum = 0
    const segRanges = sentences.map((s) => {
      const start = (cum / totalChars) * duration
      cum += s.length
      const end = (cum / totalChars) * duration
      return { text: s, start, end }
    })

    const W = 1080
    const H = 1920

    // 每帧绘制：深色渐变背景 + 光斑 + 头像呼吸/口型 + 顶部标题条 + 底部字幕
    const draw = (ctx, t, dur) => {
      // 背景渐变
      const grad = ctx.createLinearGradient(0, 0, 0, H)
      grad.addColorStop(0, '#111827')
      grad.addColorStop(0.45, '#1e1b4b')
      grad.addColorStop(1, '#020617')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)

      // 装饰光斑
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      const spots = [
        { x: W * 0.18, y: H * 0.18, r: H * 0.2, hue: 240 },
        { x: W * 0.85, y: H * 0.3, r: H * 0.18, hue: 300 },
        { x: W * 0.7, y: H * 0.85, r: H * 0.16, hue: 210 },
      ]
      spots.forEach((s, i) => {
        const rx = s.x + Math.sin(t * 0.35 + i * 2) * W * 0.02
        const ry = s.y + Math.cos(t * 0.3 + i) * H * 0.02
        const rg = ctx.createRadialGradient(rx, ry, 0, rx, ry, s.r)
        rg.addColorStop(0, `hsla(${s.hue}, 85%, 65%, 0.28)`)
        rg.addColorStop(1, 'transparent')
        ctx.fillStyle = rg
        ctx.fillRect(0, 0, W, H)
      })
      ctx.restore()

      // 顶部标题条
      ctx.save()
      roundRectPath(ctx, W * 0.08, H * 0.035, W * 0.84, H * 0.07, H * 0.035)
      ctx.fillStyle = 'rgba(99, 102, 241, 0.16)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.25)'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'
      ctx.font = `600 ${Math.round(H * 0.033)}px "PingFang SC", "Noto Sans CJK SC", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('AI 数字人 · 口播', W / 2, H * 0.07)
      ctx.restore()

      // 头像：圆形居中 + 呼吸缩放
      const cx = W / 2
      const cy = H * 0.44
      const breathe = 1 + 0.02 * Math.sin((t * Math.PI * 2) / 3)
      const r = W * 0.36 * breathe

      ctx.save()
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.45)'
      ctx.lineWidth = Math.max(2, H * 0.005)
      ctx.beginPath()
      ctx.arc(cx, cy, r + H * 0.012, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()

      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.clip()
      const ir = avatarImg.width / avatarImg.height
      let dw = 0
      let dh = 0
      if (ir > 1) {
        dh = r * 2
        dw = dh * ir
      } else {
        dw = r * 2
        dh = dw / ir
      }
      ctx.drawImage(avatarImg, cx - dw / 2, cy - dh / 2, dw, dh)
      ctx.restore()

      // 口型开合：云端用 AnalyserNode 频谱驱动，本地用正弦模拟
      let open = 0.5 + 0.5 * Math.sin(t * 16)
      if (analyser && freqData) {
        try {
          analyser.getByteFrequencyData(freqData)
          let sum = 0
          const n = Math.max(1, Math.floor(freqData.length * 0.2))
          for (let i = 0; i < n; i++) sum += freqData[i]
          open = Math.min(1, (sum / (n * 255)) * 3)
        } catch { /* ignore */ }
      }
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
      ctx.beginPath()
      ctx.ellipse(cx, cy + r * 0.58, r * 0.2, Math.max(H * 0.006, r * 0.015 + open * r * 0.09), 0, 0, Math.PI * 2)
      ctx.fill()

      // 底部字幕
      const seg = segRanges.find((s) => t >= s.start && t < s.end) || segRanges[segRanges.length - 1]
      if (seg) {
        ctx.save()
        ctx.font = `500 ${Math.round(H * 0.042)}px "PingFang SC", "Noto Sans CJK SC", sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const maxWidth = W * 0.82
        const lines = wrapText(ctx, seg.text, maxWidth)
        const lineH = H * 0.055
        const totalH = lines.length * lineH
        const boxX = W * 0.05
        const boxY = H * 0.86 - totalH / 2
        const boxW = W * 0.9
        const boxH = totalH + H * 0.03
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
        roundRectPath(ctx, boxX, boxY, boxW, boxH, H * 0.025)
        ctx.fill()
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
        lines.forEach((ln, i) => {
          ctx.fillText(ln, W / 2, boxY + lineH / 2 + H * 0.015 + i * lineH)
        })
        ctx.restore()
      }
    }

    // 登记任务
    const task = createTask({
      title: `数字人口播：${content.slice(0, 20)}${content.length > 20 ? '…' : ''}`,
      type: '数字人',
      module: 'digital-human',
    })

    setRecording(true)
    setStatusText(`正在录制口播视频（${Math.round(duration)} 秒）...`)

    let localInst = null
    try {
      if (!isCloud) {
        // 本地音色：录制期间同步现场播报（导出视频不含声音）
        const voiceURI = localVoices.find((v) => v.id === selectedVoice.id)?.id
        localInst = speakLocal(content, { voiceURI, rate: 1, pitch: 1 })
        stopLocalRef.current = localInst
      } else {
        try { await audioEl.play() } catch { /* 即使自动播放受限，仍继续录制画面 */ }
      }

      const { blob, ext } = await recordCanvas({
        width: W,
        height: H,
        duration,
        fps: 30,
        draw,
        extraTracks,
        onProgress: (p) => {
          if (!aliveRef.current) return
          setProgress(p)
          updateTask(task.id, { progress: Math.round(p) })
        },
      })

      try { audioEl?.pause() } catch { /* ignore */ }
      try { localInst?.stop() } catch { /* ignore */ }
      stopLocalRef.current = null
      try { actx?.close() } catch { /* ignore */ }
      audioCtxRef.current = null

      if (!aliveRef.current) return

      const url = URL.createObjectURL(blob)
      const record = await saveWork({
        type: 'video',
        name: `数字人口播_${Date.now()}`,
        blob,
        meta: { module: 'digital-human', text: content.slice(0, 30), voice: selectedVoiceName, duration: Math.round(duration) },
      })
      updateTask(task.id, { status: 'completed', progress: 100, workId: record.id, finishedAt: Date.now() })
      setResult({ url, ext, blob, name: record.name, duration: Math.round(duration), isLocalVoice: !isCloud })
      setProgress(100)
      loadHistory()
    } catch (err) {
      try { audioEl?.pause() } catch { /* ignore */ }
      try { localInst?.stop() } catch { /* ignore */ }
      stopLocalRef.current = null
      try { actx?.close() } catch { /* ignore */ }
      audioCtxRef.current = null
      updateTask(task.id, { status: 'failed', progress: 0, error: err.message, finishedAt: Date.now() })
      setError(`生成口播视频失败：${err.message || '请重试'}`)
    } finally {
      if (aliveRef.current) setRecording(false)
    }
  }

  const estDuration = Math.max(3, Math.ceil(text.trim().length * 0.28))

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <Icons.UserCircle className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">数字人口播</h1>
        </div>
        <p className="text-sm text-dark-400 ml-10">
          上传照片或 AI 生成形象，输入文案，选择音色，即可录制带口型动画与字幕的口播视频
        </p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl p-4 bg-rose-500/10 border border-rose-500/20">
          <Icons.AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-rose-300 leading-relaxed">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：控制面板 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 形象 */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-1.5">
              <Icons.UserRound className="w-4 h-4 text-brand-400" />
              数字人形象
            </h2>
            {avatarSrc ? (
              <div className="flex items-center gap-4">
                <img src={avatarSrc} alt="形象" className="w-20 h-20 rounded-2xl object-cover border border-white/10" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{avatarName || '已选择形象'}</div>
                  <div className="text-xs text-dark-400 mt-1">将居中圆形展示并做口型动画</div>
                  <button
                    onClick={() => { setAvatarSrc(null); setAvatarName('') }}
                    className="mt-2 text-xs text-rose-400 hover:text-rose-300"
                  >
                    移除形象
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="w-full h-24 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-1.5 hover:border-brand-500/40 hover:bg-brand-500/5 transition-all"
              >
                <Icons.Upload className="w-6 h-6 text-dark-500" />
                <span className="text-xs text-dark-400">上传照片（建议竖版人像）</span>
              </button>
            )}
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

            <div className="mt-4">
              <label className="block text-xs text-dark-400 mb-2">或输入描述，AI 生成写实人像（768×1024）</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="如：一位知性干练的女性主播"
                  className="flex-1 bg-dark-900/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 transition-all"
                />
                <button
                  onClick={handleGenerateImage}
                  disabled={imageGenerating || !imagePrompt.trim()}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-xs font-semibold flex items-center gap-1.5 hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {imageGenerating ? <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icons.Sparkles className="w-3.5 h-3.5" />}
                  生成
                </button>
              </div>
            </div>
          </div>

          {/* 文案 */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-1.5">
                <Icons.FileText className="w-4 h-4 text-brand-400" />
                口播文案
              </h2>
              <span className="text-xs text-dark-400">{text.trim().length} 字 · 约 {estDuration} 秒</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="输入口播文案，将按标点切句生成字幕..."
              className="w-full bg-dark-900/80 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* 右侧：声音 + 预览 + 生成 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 声音 */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-1.5">
              <Icons.AudioWaveform className="w-4 h-4 text-brand-400" />
              配音声音
            </h2>
            <div className="glass-card rounded-xl p-1 flex gap-1 mb-3 w-fit">
              <button
                onClick={() => setVoiceTab('cloud')}
                className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  voiceTab === 'cloud' ? 'bg-gradient-to-r from-brand-500 to-accent-500 text-white' : 'text-dark-400 hover:text-white'
                }`}
              >
                <Icons.Cloud className="w-3.5 h-3.5" />
                云端音色（混音导出）
              </button>
              <button
                onClick={() => setVoiceTab('local')}
                className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  voiceTab === 'local' ? 'bg-gradient-to-r from-brand-500 to-accent-500 text-white' : 'text-dark-400 hover:text-white'
                }`}
              >
                <Icons.MonitorSpeaker className="w-3.5 h-3.5" />
                本地音色（现场播报）
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {voiceTab === 'cloud'
                ? CLOUD_VOICES.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVoice({ group: 'cloud', id: v.id })}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        selectedVoice?.group === 'cloud' && selectedVoice?.id === v.id
                          ? 'bg-brand-500/10 border-brand-500/40'
                          : 'bg-dark-900/50 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="text-sm font-medium text-white truncate">{v.name}</div>
                      <div className="text-xs text-dark-400 truncate">{v.desc}</div>
                    </button>
                  ))
                : localVoices.length === 0
                  ? (
                    <div className="col-span-2 py-6 text-center">
                      <Icons.MonitorSpeaker className="w-5 h-5 text-dark-500 mx-auto mb-2" />
                      <p className="text-xs text-dark-400">未检测到本地音色（请使用 Chrome / Edge）</p>
                    </div>
                  )
                  : localVoices.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVoice({ group: 'local', id: v.id })}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        selectedVoice?.group === 'local' && selectedVoice?.id === v.id
                          ? 'bg-brand-500/10 border-brand-500/40'
                          : 'bg-dark-900/50 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="text-sm font-medium text-white truncate">{v.name}</div>
                      <div className="text-xs text-dark-400 truncate">{v.desc}</div>
                    </button>
                  ))}
            </div>
          </div>

          {/* 预览 / 结果 */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">预览</h2>
              {selectedVoiceName && <span className="text-xs text-dark-400">音色：{selectedVoiceName}</span>}
            </div>

            {recording ? (
              <div className="aspect-[9/16] max-h-[420px] mx-auto rounded-xl bg-dark-950 border border-white/5 flex flex-col items-center justify-center gap-3">
                <Icons.Loader2 className="w-10 h-10 text-brand-400 animate-spin" />
                <p className="text-sm text-dark-300">{statusText}</p>
                <div className="w-64 mt-2">
                  <div className="w-full h-2 bg-dark-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-xs text-dark-500">
                    <span>正在逐帧录制</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                </div>
                {isLocalVoice && (
                  <p className="text-xs text-amber-300/80 px-6 text-center">
                    本地配音为现场播放，导出视频不含声音
                  </p>
                )}
              </div>
            ) : result ? (
              <div className="space-y-4">
                <div className="aspect-[9/16] max-h-[420px] mx-auto rounded-xl overflow-hidden border border-white/10 bg-dark-950">
                  <video src={result.url} controls playsInline className="w-full h-full object-contain" />
                </div>
                {result.isLocalVoice && (
                  <p className="text-xs text-amber-300/80 text-center">本地配音为现场播放，本视频画面不含声音</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadVideo(result.url, result.name, result.ext)}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 hover:shadow-lg hover:shadow-brand-500/30 transition-all"
                  >
                    <Icons.Download className="w-4 h-4" />
                    下载视频
                  </button>
                </div>
              </div>
            ) : (
              <div className="aspect-[9/16] max-h-[420px] mx-auto rounded-xl bg-dark-950 border border-white/5 flex flex-col items-center justify-center gap-3">
                <Icons.Video className="w-10 h-10 text-dark-600" />
                <p className="text-sm text-dark-400">{avatarSrc ? '准备好后点击下方生成按钮' : '上传或生成形象后即可开始'}</p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={recording || !avatarSrc || !text.trim() || !selectedVoice}
              className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {recording ? (
                <>
                  <Icons.Loader2 className="w-4 h-4 animate-spin" />
                  录制中... {Math.round(progress)}%
                </>
              ) : (
                <>
                  <Icons.Video className="w-4 h-4" />
                  生成口播视频
                </>
              )}
            </button>
            <p className="text-xs text-dark-500 mt-3 text-center">
              云端音色经 MediaStream 混入视频音轨；本地音色语音由浏览器现场播放
            </p>
          </div>
        </div>
      </div>

      {/* 历史作品 */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icons.History className="w-5 h-5 text-brand-400" />
            <h2 className="text-base font-semibold text-white">数字人作品</h2>
          </div>
          {history.length > 0 && <span className="text-xs text-dark-500">共 {history.length} 条</span>}
        </div>

        {history.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-dark-800 flex items-center justify-center mb-3">
              <Icons.UserCircle className="w-5 h-5 text-dark-500" />
            </div>
            <p className="text-sm text-dark-400 mb-1">暂无数字人口播作品</p>
            <p className="text-xs text-dark-500">生成后会保存在这里，可随时播放、下载与删除</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((w) => (
              <div key={w.id} className="bg-dark-900/50 border border-white/5 rounded-xl overflow-hidden">
                <div className="aspect-[9/16] bg-dark-950">
                  <video src={w.url} controls playsInline className="w-full h-full object-contain" />
                </div>
                <div className="p-3">
                  <div className="text-sm font-medium text-white truncate">{w.name}</div>
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-2 text-xs text-dark-500">
                      <span>{timeAgo(w.createdAt)}</span>
                      <span>·</span>
                      <span>{formatSize(w.size)}</span>
                      {w.meta?.duration && (
                        <>
                          <span>·</span>
                          <span>{w.meta.duration}s</span>
                        </>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => downloadVideo(w.url, w.name, extOfBlob(w.blob))}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-dark-400 hover:text-white transition-colors"
                        title="下载"
                      >
                        <Icons.Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteWork(w.id)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-dark-400 hover:text-rose-400 transition-colors"
                        title="删除"
                      >
                        <Icons.Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {w.meta?.text && (
                    <p className="text-xs text-dark-400 mt-1.5 truncate">{w.meta.text}{w.meta.text.length >= 30 ? '…' : ''}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}