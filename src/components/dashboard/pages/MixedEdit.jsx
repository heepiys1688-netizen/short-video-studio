import { useState, useRef, useEffect, useCallback } from 'react'
import * as Icons from 'lucide-react'
import { recordCanvas, downloadVideo } from '../../../services/videoApi'
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

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

const fmtTime = (s) => {
  if (!isFinite(s)) return '0.0s'
  const m = Math.floor(s / 60)
  const sec = Math.round((s % 60) * 10) / 10
  return m > 0 ? `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}` : `${sec}s`
}

const extOfBlob = (blob) => {
  const t = blob?.type || ''
  if (t.includes('mp4')) return 'mp4'
  if (t.includes('webm')) return 'webm'
  return 'mp4'
}

// 解析视频元信息 + 生成首帧缩略图
const probeVideo = (file) =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const v = document.createElement('video')
    v.muted = true
    v.playsInline = true
    v.preload = 'auto'
    let done = false
    const finish = (data) => {
      if (done) return
      done = true
      clearTimeout(timeout)
      resolve(data)
    }
    const timeout = setTimeout(() => finish(null), 5000)

    v.onloadedmetadata = () => {
      const duration = v.duration || 0
      const width = v.videoWidth || 0
      const height = v.videoHeight || 0
      if (!duration || !width) {
        finish({ url, name: file.name, duration, width, height, thumb: '' })
        return
      }
      v.onseeked = () => {
        let thumb = ''
        try {
          const c = document.createElement('canvas')
          const tw = 160
          const th = Math.max(1, Math.round((tw * height) / width))
          c.width = tw
          c.height = th
          const ctx = c.getContext('2d')
          ctx.drawImage(v, 0, 0, tw, th)
          thumb = c.toDataURL('image/jpeg', 0.75)
        } catch { thumb = '' }
        finish({ url, name: file.name, duration, width, height, thumb })
      }
      try { v.currentTime = Math.min(0.1, duration / 2) } catch { finish({ url, name: file.name, duration, width, height, thumb: '' }) }
    }
    v.onerror = () => finish(null)
    v.src = url
  })

// cover 适配绘制（居中裁剪）
const drawCover = (ctx, el, W, H) => {
  const vw = el.videoWidth
  const vh = el.videoHeight
  if (!vw || !vh) return
  const scale = Math.max(W / vw, H / vh)
  const dw = vw * scale
  const dh = vh * scale
  ctx.drawImage(el, (W - dw) / 2, (H - dh) / 2, dw, dh)
}

// 计算混剪时间轴
const computeTimeline = (clips, fadeOn) => {
  const fadeDur = fadeOn ? 0.5 : 0
  const durs = clips.map((c) => {
    const raw = c.duration || 1
    const trim = c.trim && c.trim > 0 ? Math.min(c.trim, raw) : raw
    return Math.max(0.2, trim)
  })
  const starts = [0]
  for (let i = 1; i < durs.length; i++) starts.push(starts[i - 1] + durs[i - 1] - fadeDur)
  const total = starts[durs.length - 1] + durs[durs.length - 1]
  return { fadeDur, durs, starts, total }
}

/* ============================== 组件 ============================== */

export default function MixedEdit() {
  const [clips, setClips] = useState([])
  const [fadeOn, setFadeOn] = useState(true)
  const [endText, setEndText] = useState('')
  const [bgm, setBgm] = useState(null) // { url, name }
  const [bgmVolume, setBgmVolume] = useState(50)

  const [mixing, setMixing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const [history, setHistory] = useState([])

  const videoInputRef = useRef(null)
  const bgmInputRef = useRef(null)
  const aliveRef = useRef(true)
  const audioCtxRef = useRef(null)
  const objectUrlsRef = useRef([])

  /* ---------- 历史作品 ---------- */
  const loadHistory = useCallback(async () => {
    try {
      const works = await getWorks('video')
      setHistory(works.filter((w) => w.meta?.module === 'mixed-edit'))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    loadHistory()
    const off = on('works', loadHistory)
    return () => off()
  }, [loadHistory])

  /* ---------- 卸载清理 ---------- */
  useEffect(() => {
    return () => {
      aliveRef.current = false
      try { audioCtxRef.current?.close() } catch { /* ignore */ }
      objectUrlsRef.current.forEach((u) => { try { URL.revokeObjectURL(u) } catch { /* ignore */ } })
    }
  }, [])

  /* ---------- 素材操作 ---------- */
  const handleAddVideos = async (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('video/'))
    if (files.length === 0) return
    setError('')
    const next = []
    for (const f of files) {
      const info = await probeVideo(f)
      if (info) {
        info.id = uid()
        info.trim = 0
        objectUrlsRef.current.push(info.url)
        next.push(info)
      }
    }
    if (next.length) setClips((prev) => [...prev, ...next])
    else setError('无法读取所选视频，请确认文件格式')
    if (videoInputRef.current) videoInputRef.current.value = ''
  }

  const moveClip = (i, dir) => {
    setClips((prev) => {
      const arr = [...prev]
      const j = i + dir
      if (j < 0 || j >= arr.length) return prev
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return arr
    })
  }

  const removeClip = (i) => {
    setClips((prev) => {
      const target = prev[i]
      if (target) {
        const idx = objectUrlsRef.current.indexOf(target.url)
        if (idx >= 0) objectUrlsRef.current.splice(idx, 1)
        try { URL.revokeObjectURL(target.url) } catch { /* ignore */ }
      }
      return prev.filter((_, idx) => idx !== i)
    })
  }

  const shuffleClips = () => {
    setClips((prev) => {
      const arr = [...prev]
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
      }
      return arr
    })
  }

  const setClipTrim = (i, value) => {
    setClips((prev) => prev.map((c, idx) => {
      if (idx !== i) return c
      const max = c.duration || 0
      return { ...c, trim: Math.max(0, Math.min(value, max)) }
    }))
  }

  const handleBgmUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (bgm?.url) URL.revokeObjectURL(bgm.url)
    const url = URL.createObjectURL(file)
    objectUrlsRef.current.push(url)
    setBgm({ url, name: file.name })
  }

  const removeBgm = () => {
    if (bgm?.url) {
      const idx = objectUrlsRef.current.indexOf(bgm.url)
      if (idx >= 0) objectUrlsRef.current.splice(idx, 1)
      URL.revokeObjectURL(bgm.url)
    }
    setBgm(null)
  }

  const timeline = computeTimeline(clips, fadeOn)

  /* ---------- 开始混剪（真实逐段录制） ---------- */
  const handleMix = async () => {
    if (mixing || clips.length === 0) return
    setError('')
    setResult(null)
    setProgress(0)
    setElapsed(0)

    const { fadeDur, durs, starts, total } = computeTimeline(clips, fadeOn)

    // 输出尺寸取首段（cover 适配），过长边封顶 1920 保证编码流畅
    const baseW = clips[0].width || 1280
    const baseH = clips[0].height || 720
    let outW = baseW
    let outH = baseH
    const MAX = 1920
    if (outW > MAX || outH > MAX) {
      const s = Math.min(MAX / outW, MAX / outH)
      outW = Math.round(outW * s)
      outH = Math.round(outH * s)
    }

    // 统一音轨：所有片段 + 背景音乐混入同一个 MediaStreamDestination
    const AC = window.AudioContext || window.webkitAudioContext
    let actx = null
    let dest = null
    try {
      actx = new AC()
      dest = actx.createMediaStreamDestination()
      await actx.resume()
    } catch { /* 音频不可用时仅导出画面 */ }
    audioCtxRef.current = actx

    const elements = clips.map(() => {
      const el = document.createElement('video')
      el.muted = false
      el.playsInline = true
      el.preload = 'auto'
      el.src = ''
      return el
    })

    clips.forEach((c, i) => {
      elements[i].src = c.url
      if (dest) {
        try {
          const sn = actx.createMediaElementSource(elements[i])
          sn.connect(dest)
        } catch { /* ignore */ }
      }
    })

    let bgmEl = null
    if (bgm?.url && dest) {
      bgmEl = document.createElement('audio')
      bgmEl.src = bgm.url
      bgmEl.loop = true
      try {
        const sn = actx.createMediaElementSource(bgmEl)
        const gain = actx.createGain()
        gain.gain.value = bgmVolume / 100
        sn.connect(gain)
        gain.connect(dest)
      } catch { /* ignore */ }
    }

    const extraTracks = dest ? dest.stream.getAudioTracks() : []

    // 等待所有片段可读
    await Promise.all(elements.map((el) => new Promise((res) => {
      if (el.readyState >= 1) return res()
      el.onloadedmetadata = () => res()
      el.onerror = () => res()
      el.onloadeddata = () => res()
    })))

    const started = new Array(clips.length).fill(false)

    const draw = (ctx, t, durT) => {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, outW, outH)

      // 按全局时间播放/暂停每个片段
      for (let i = 0; i < clips.length; i++) {
        const s = starts[i]
        const d = durs[i]
        if (t >= s && t < s + d) {
          if (!started[i]) {
            started[i] = true
            try { elements[i].currentTime = 0; elements[i].play() } catch { /* ignore */ }
          }
        } else if (t >= s + d) {
          if (started[i]) {
            started[i] = false
            try { elements[i].pause() } catch { /* ignore */ }
          }
        }
      }

      // 绘制活跃片段（相邻转场交叉淡化）
      for (let i = 0; i < clips.length; i++) {
        const s = starts[i]
        const d = durs[i]
        if (t < s || t >= s + d) continue
        let alpha = 1
        if (fadeDur > 0) {
          if (i > 0) {
            const pIn = (t - s) / fadeDur
            if (pIn < 1) alpha = Math.min(1, Math.max(0, pIn))
          }
          if (i < clips.length - 1) {
            const pOut = (t - starts[i + 1]) / fadeDur
            if (pOut >= 0 && pOut <= 1) alpha = Math.min(1, Math.max(0, 1 - pOut))
          }
        }
        if (alpha <= 0) continue
        ctx.save()
        ctx.globalAlpha = alpha
        drawCover(ctx, elements[i], outW, outH)
        ctx.restore()
      }

      // 片尾文字水印（末尾淡入）
      if (endText.trim()) {
        const endDur = Math.min(2.5, total * 0.35)
        const rt = total - t
        if (rt <= endDur) {
          const alpha = Math.max(0, Math.min(1, (endDur - rt) / 0.6))
          ctx.save()
          ctx.globalAlpha = alpha
          ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
          ctx.fillRect(0, 0, outW, outH)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
          ctx.font = `600 ${Math.round(outW * 0.05)}px "PingFang SC", "Noto Sans CJK SC", sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(endText, outW / 2, outH / 2)
          ctx.restore()
        }
      }
    }

    const task = createTask({ title: `智能混剪：${clips.length} 段视频`, type: '混剪', module: 'mixed-edit' })
    setMixing(true)

    try {
      try { bgmEl?.play() } catch { /* ignore */ }

      const { blob, ext } = await recordCanvas({
        width: outW,
        height: outH,
        duration: total,
        fps: 30,
        draw,
        extraTracks,
        onProgress: (p) => {
          if (!aliveRef.current) return
          setProgress(p)
          setElapsed((p / 100) * total)
          updateTask(task.id, { progress: Math.round(p) })
        },
      })

      // 清理
      elements.forEach((el) => { try { el.pause(); el.src = '' } catch { /* ignore */ } })
      try { bgmEl?.pause() } catch { /* ignore */ }
      try { actx?.close() } catch { /* ignore */ }
      audioCtxRef.current = null

      if (!aliveRef.current) return

      const url = URL.createObjectURL(blob)
      const record = await saveWork({
        type: 'video',
        name: `混剪_${Date.now()}`,
        blob,
        meta: { module: 'mixed-edit', clips: clips.length, duration: Math.round(total) },
      })
      updateTask(task.id, { status: 'completed', progress: 100, workId: record.id, finishedAt: Date.now() })
      setResult({ url, ext, name: record.name, duration: total })
      setProgress(100)
      loadHistory()
    } catch (err) {
      elements.forEach((el) => { try { el.pause(); el.src = '' } catch { /* ignore */ } })
      try { bgmEl?.pause() } catch { /* ignore */ }
      try { actx?.close() } catch { /* ignore */ }
      audioCtxRef.current = null
      updateTask(task.id, { status: 'failed', progress: 0, error: err.message, finishedAt: Date.now() })
      setError(`混剪失败：${err.message || '请重试'}`)
    } finally {
      if (aliveRef.current) setMixing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <Icons.Shuffle className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">智能混剪</h1>
        </div>
        <p className="text-sm text-dark-400 ml-10">
          上传多段视频，按顺序拼接、转场淡化、混入背景音乐，一键导出真实混剪成片
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
        {/* 左侧：素材列表 */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icons.Film className="w-4 h-4 text-brand-400" />
                <h2 className="text-base font-semibold text-white">视频片段</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={shuffleClips}
                  disabled={clips.length < 2}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-dark-300 text-xs flex items-center gap-1.5 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40"
                >
                  <Icons.Shuffle className="w-3.5 h-3.5" />
                  随机打乱
                </button>
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-500 to-accent-500 text-white text-xs font-semibold flex items-center gap-1.5 hover:shadow-lg hover:shadow-brand-500/30 transition-all"
                >
                  <Icons.Upload className="w-3.5 h-3.5" />
                  添加视频
                </button>
              </div>
              <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={handleAddVideos} />
            </div>

            {clips.length === 0 ? (
              <div
                onClick={() => videoInputRef.current?.click()}
                className="py-16 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-brand-500/40 hover:bg-brand-500/5 transition-all"
              >
                <Icons.Clapperboard className="w-12 h-12 text-dark-500" />
                <p className="text-sm text-dark-400">上传多个视频片段开始混剪</p>
                <p className="text-xs text-dark-500">支持一次多选，将按列表顺序拼接合成</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {clips.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-dark-900/50 border border-white/5">
                    <div className="w-16 h-12 rounded-lg bg-dark-800 overflow-hidden flex-shrink-0">
                      {c.thumb ? (
                        <img src={c.thumb} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icons.Video className="w-4 h-4 text-dark-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{c.name}</div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-dark-400 flex-shrink-0">{fmtTime(c.duration)}</span>
                        <input
                          type="range"
                          min={0}
                          max={c.duration || 0}
                          step={0.5}
                          value={c.trim}
                          onChange={(e) => setClipTrim(i, parseFloat(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-xs text-brand-400 flex-shrink-0">
                          {c.trim > 0 ? `截取 ${fmtTime(c.trim)}` : '完整'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button
                        onClick={() => moveClip(i, -1)}
                        disabled={i === 0}
                        className="p-1 rounded hover:bg-white/10 text-dark-400 hover:text-white transition-colors disabled:opacity-30"
                        title="上移"
                      >
                        <Icons.ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveClip(i, 1)}
                        disabled={i === clips.length - 1}
                        className="p-1 rounded hover:bg-white/10 text-dark-400 hover:text-white transition-colors disabled:opacity-30"
                        title="下移"
                      >
                        <Icons.ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeClip(i)}
                        className="p-1 rounded hover:bg-white/10 text-dark-400 hover:text-rose-400 transition-colors"
                        title="删除"
                      >
                        <Icons.Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右侧：合成设置 */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 space-y-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Icons.Settings2 className="w-4 h-4 text-brand-400" />
              合成设置
            </h3>

            {/* 转场 */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white">转场淡入淡出</div>
                <div className="text-xs text-dark-400 mt-0.5">片段之间交叉淡化过渡（0.5s）</div>
              </div>
              <button
                onClick={() => setFadeOn(!fadeOn)}
                className={`relative w-10 h-5 rounded-full transition-all ${fadeOn ? 'bg-brand-500' : 'bg-dark-700'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${fadeOn ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>

            {/* 片尾文字 */}
            <div>
              <label className="block text-xs text-dark-400 mb-2">片尾文字水印</label>
              <input
                type="text"
                value={endText}
                onChange={(e) => setEndText(e.target.value)}
                placeholder="如：感谢观看，点赞关注不迷路"
                className="w-full bg-dark-900/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 transition-all"
              />
            </div>

            {/* 背景音乐 */}
            <div>
              <label className="block text-xs text-dark-400 mb-2">背景音乐（可选）</label>
              {bgm ? (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-dark-900/50 border border-white/5">
                  <Icons.Music className="w-4 h-4 text-brand-400 flex-shrink-0" />
                  <span className="text-sm text-white truncate flex-1">{bgm.name}</span>
                  <button onClick={removeBgm} className="p-1 rounded hover:bg-white/10 text-dark-400 hover:text-rose-400">
                    <Icons.X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => bgmInputRef.current?.click()}
                  className="w-full py-2.5 rounded-xl border-2 border-dashed border-white/10 text-dark-400 text-xs flex items-center justify-center gap-1.5 hover:border-brand-500/40 hover:text-white transition-all"
                >
                  <Icons.Music2 className="w-4 h-4" />
                  上传音频文件（循环混入）
                </button>
              )}
              <input ref={bgmInputRef} type="file" accept="audio/*" className="hidden" onChange={handleBgmUpload} />

              {bgm && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-dark-400 mb-1.5">
                    <span>音乐音量</span>
                    <span className="text-brand-400">{bgmVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={bgmVolume}
                    onChange={(e) => setBgmVolume(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* 时长估算 */}
            <div className="flex items-center justify-between text-xs text-dark-400 pt-1 border-t border-white/5">
              <span>预计成片时长</span>
              <span className="text-white">{fmtTime(timeline.total)}</span>
            </div>

            <button
              onClick={handleMix}
              disabled={mixing || clips.length === 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {mixing ? (
                <>
                  <Icons.Loader2 className="w-4 h-4 animate-spin" />
                  混剪中... {Math.round(progress)}%
                </>
              ) : (
                <>
                  <Icons.Clapperboard className="w-4 h-4" />
                  开始混剪
                </>
              )}
            </button>
          </div>

          {/* 进度 */}
          {mixing && (
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2 text-xs">
                <span className="text-dark-300">已录时长 <span className="text-brand-400">{fmtTime(elapsed)}</span></span>
                <span className="text-dark-400">总时长 {fmtTime(timeline.total)}</span>
              </div>
              <div className="w-full h-2 bg-dark-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 结果预览 */}
      {result && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Icons.CheckCircle className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-white">混剪完成 · 共 {fmtTime(result.duration)}</h2>
          </div>
          <video src={result.url} controls playsInline className="w-full max-w-2xl rounded-xl border border-white/10 bg-dark-950" />
          <div className="mt-3">
            <button
              onClick={() => downloadVideo(result.url, result.name, result.ext)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 hover:shadow-lg hover:shadow-brand-500/30 transition-all"
            >
              <Icons.Download className="w-4 h-4" />
              下载视频
            </button>
          </div>
        </div>
      )}

      {/* 历史作品 */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icons.History className="w-5 h-5 text-brand-400" />
            <h2 className="text-base font-semibold text-white">混剪作品</h2>
          </div>
          {history.length > 0 && <span className="text-xs text-dark-500">共 {history.length} 条</span>}
        </div>

        {history.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-dark-800 flex items-center justify-center mb-3">
              <Icons.Shuffle className="w-5 h-5 text-dark-500" />
            </div>
            <p className="text-sm text-dark-400 mb-1">暂无混剪作品</p>
            <p className="text-xs text-dark-500">上传片段开始混剪后，成片会自动保存在这里</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((w) => (
              <div key={w.id} className="bg-dark-900/50 border border-white/5 rounded-xl overflow-hidden">
                <div className="aspect-video bg-dark-950">
                  <video src={w.url} controls playsInline className="w-full h-full" />
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
                          <span>{fmtTime(w.meta.duration)}</span>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}