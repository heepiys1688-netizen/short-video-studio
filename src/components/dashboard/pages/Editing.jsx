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

/* ============================== 常量与工具 ============================== */

const ASPECTS = [
  { id: 'original', name: '原始画幅', w: 0, h: 0 },
  { id: '9:16', name: '9:16 竖屏', w: 1080, h: 1920 },
  { id: '1:1', name: '1:1 方形', w: 1080, h: 1080 },
  { id: '4:5', name: '4:5 竖图', w: 1080, h: 1350 },
]

const WM_POSITIONS = [
  { id: 'tl', name: '左上', v: 'top', h: 'left' },
  { id: 'tc', name: '上中', v: 'top', h: 'center' },
  { id: 'tr', name: '右上', v: 'top', h: 'right' },
  { id: 'ml', name: '左中', v: 'middle', h: 'left' },
  { id: 'mc', name: '居中', v: 'middle', h: 'center' },
  { id: 'mr', name: '右中', v: 'middle', h: 'right' },
  { id: 'bl', name: '左下', v: 'bottom', h: 'left' },
  { id: 'bc', name: '下中', v: 'bottom', h: 'center' },
  { id: 'br', name: '右下', v: 'bottom', h: 'right' },
]

const outputSize = (videoW, videoH, aspectId) => {
  if (aspectId === 'original') {
    const w = videoW || 1280
    const h = videoH || 720
    return { w, h }
  }
  const a = ASPECTS.find((x) => x.id === aspectId) || ASPECTS[1]
  return { w: a.w, h: a.h }
}

const extOfBlob = (blob) => {
  const t = blob?.type || ''
  if (t.includes('mp4')) return 'mp4'
  if (t.includes('webm')) return 'webm'
  return 'mp4'
}

// 预览层水印定位（CSS 风格）
const wmOverlayStyle = (posId) => {
  const p = WM_POSITIONS.find((x) => x.id === posId) || WM_POSITIONS[4]
  const s = {}
  if (p.h === 'left') s.left = '3%'
  else if (p.h === 'right') s.right = '3%'
  else s.left = '50%'
  if (p.v === 'top') s.top = '3%'
  else if (p.v === 'bottom') s.bottom = '3%'
  else s.top = '50%'
  if (p.h === 'center' && p.v === 'middle') s.transform = 'translate(-50%, -50%)'
  else if (p.h === 'center') s.transform = 'translateX(-50%)'
  else if (p.v === 'middle') s.transform = 'translateY(-50%)'
  return s
}

// 画布上水印坐标
const wmCoordinate = (posId, W, H, tw, fontSize) => {
  const p = WM_POSITIONS.find((x) => x.id === posId) || WM_POSITIONS[4]
  const padX = W * 0.03
  const padY = H * 0.035
  let x
  let y
  if (p.h === 'left') x = padX
  else if (p.h === 'right') x = W - padX - tw
  else x = (W - tw) / 2
  if (p.v === 'top') y = padY + fontSize
  else if (p.v === 'bottom') y = H - padY
  else y = H / 2
  return { x, y }
}

const fmtTime = (s) => {
  if (!isFinite(s)) return '0.0s'
  const m = Math.floor(s / 60)
  const sec = (s % 60).toFixed(1)
  return m > 0 ? `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}.${sec.split('.')[1]}` : `${sec}s`
}

/* ============================== 组件 ============================== */

export default function Editing() {
  // 视频源
  const [videoSrc, setVideoSrc] = useState(null)
  const [videoName, setVideoName] = useState('')
  const [videoDuration, setVideoDuration] = useState(0)
  const [videoWidth, setVideoWidth] = useState(0)
  const [videoHeight, setVideoHeight] = useState(0)

  // 裁剪 / 速度
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)
  const [speed, setSpeed] = useState(1)

  // 滤镜
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const [grayscale, setGrayscale] = useState(0)

  // 文字水印
  const [watermarkText, setWatermarkText] = useState('')
  const [watermarkPos, setWatermarkPos] = useState('mc')
  const [watermarkOpacity, setWatermarkOpacity] = useState(60)

  // 画幅
  const [aspect, setAspect] = useState('original')

  // 流程
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [frameTime, setFrameTime] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  // 历史
  const [history, setHistory] = useState([])

  const fileInputRef = useRef(null)
  const previewRef = useRef(null)
  const aliveRef = useRef(true)
  const audioCtxRef = useRef(null)
  const objectUrlRef = useRef(null)

  /* ---------- 历史作品加载 ---------- */
  const loadHistory = useCallback(async () => {
    try {
      const works = await getWorks('video')
      setHistory(works.filter((w) => w.meta?.module === 'editing'))
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
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  // 播放器倍速实时生效
  useEffect(() => {
    if (previewRef.current) previewRef.current.playbackRate = speed
  }, [speed])

  /* ---------- 上传视频 ---------- */
  const handleUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    setVideoSrc(url)
    setVideoName(file.name)
    setResult(null)
    setError('')
    setTrimStart(0)
    setTrimEnd(0)

    const probe = document.createElement('video')
    probe.preload = 'metadata'
    probe.onloadedmetadata = () => {
      const d = probe.duration || 0
      setVideoDuration(d)
      setVideoWidth(probe.videoWidth || 0)
      setVideoHeight(probe.videoHeight || 0)
      setTrimStart(0)
      setTrimEnd(d)
    }
    probe.onerror = () => setError('视频加载失败，请更换文件')
    probe.src = url
  }

  const cssFilter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) grayscale(${grayscale}%)`

  /* ---------- 导出成片 ---------- */
  const handleExport = async () => {
    if (exporting || !videoSrc) return
    const d = videoDuration
    if (!d) { setError('请先上传视频'); return }

    const start = Math.max(0, Math.min(trimStart, d))
    const end = Math.min(d, Math.max(trimEnd, start + 0.1))
    if (end - start <= 0.05) { setError('导出区间过短，请调整裁剪起止点'); return }

    setError('')
    setResult(null)
    setProgress(0)
    setFrameTime(start)

    const { w: outW, h: outH } = outputSize(videoWidth, videoHeight, aspect)
    const exportDuration = (end - start) / speed

    // 离屏视频源（播放速度受 playbackRate 控制）
    const v = document.createElement('video')
    v.playsInline = true
    v.preload = 'auto'
    v.onloadedmetadata = () => {}
    v.src = videoSrc
    await new Promise((resolve, reject) => {
      if (v.readyState >= 1) return resolve()
      v.onloadedmetadata = resolve
      v.onerror = () => reject(new Error('无法读取视频用于导出'))
    })
    try { v.currentTime = start } catch { /* ignore */ }
    v.playbackRate = speed

    // 音轨：AudioContext 混入录制
    let actx = null
    let extraTracks = []
    try {
      const AC = window.AudioContext || window.webkitAudioContext
      actx = new AC()
      const srcNode = actx.createMediaElementSource(v)
      const dest = actx.createMediaStreamDestination()
      srcNode.connect(dest)
      await actx.resume()
      extraTracks = dest.stream.getAudioTracks()
    } catch { /* 音频不可用时仅导出画面 */ }
    audioCtxRef.current = actx

    try { await v.play() } catch { /* 自动播放受限时仍继续录制画面 */ }

    const filterStr = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) grayscale(${grayscale}%)`
    const fontSize = Math.round(outW * 0.04)

    const draw = (ctx, t, dur) => {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, outW, outH)
      if (videoWidth && videoHeight) {
        ctx.save()
        ctx.filter = filterStr
        const scale = Math.max(outW / videoWidth, outH / videoHeight)
        const dw = videoWidth * scale
        const dh = videoHeight * scale
        const dx = (outW - dw) / 2
        const dy = (outH - dh) / 2
        ctx.drawImage(v, dx, dy, dw, dh)
        ctx.restore()
      }
      // 文字水印
      if (watermarkText.trim()) {
        ctx.save()
        ctx.globalAlpha = watermarkOpacity / 100
        ctx.font = `600 ${fontSize}px "PingFang SC", "Noto Sans CJK SC", sans-serif`
        ctx.textAlign = 'left'
        ctx.textBaseline = 'alphabetic'
        const tw = ctx.measureText(watermarkText).width
        const { x, y } = wmCoordinate(watermarkPos, outW, outH, tw, fontSize)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
        ctx.shadowBlur = 8
        ctx.fillText(watermarkText, x, y)
        ctx.restore()
      }
    }

    const baseName = videoName.replace(/\.[^.]+$/, '') || `剪辑_${Date.now()}`
    const task = createTask({ title: `剪辑合成：${videoName || '视频'}`, type: '剪辑', module: 'editing' })
    setExporting(true)

    try {
      const { blob, ext } = await recordCanvas({
        width: outW,
        height: outH,
        duration: exportDuration,
        fps: 30,
        draw,
        extraTracks,
        onProgress: (p) => {
          if (!aliveRef.current) return
          setProgress(p)
          setFrameTime(start + (p / 100) * (end - start))
          updateTask(task.id, { progress: Math.round(p) })
        },
      })

      try { v.pause() } catch { /* ignore */ }
      try { actx?.close() } catch { /* ignore */ }
      audioCtxRef.current = null

      if (!aliveRef.current) return

      const url = URL.createObjectURL(blob)
      const record = await saveWork({
        type: 'video',
        name: `剪辑_${baseName}`,
        blob,
        meta: { module: 'editing', name: videoName, duration: Math.round(exportDuration * 10) / 10 },
      })
      updateTask(task.id, { status: 'completed', progress: 100, workId: record.id, finishedAt: Date.now() })
      setResult({ url, ext, name: record.name, duration: exportDuration })
      setProgress(100)
      loadHistory()
    } catch (err) {
      try { v.pause() } catch { /* ignore */ }
      try { actx?.close() } catch { /* ignore */ }
      audioCtxRef.current = null
      updateTask(task.id, { status: 'failed', progress: 0, error: err.message, finishedAt: Date.now() })
      setError(`导出成片失败：${err.message || '请重试'}`)
    } finally {
      if (aliveRef.current) setExporting(false)
    }
  }

  const pct = (val) => (videoDuration ? Math.min(100, Math.max(0, (val / videoDuration) * 100)) : 0)

  return (
    <div className="space-y-6">
      <style>{`
        .dual-range { position: relative; }
        .dual-range input[type="range"] {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          -webkit-appearance: none; appearance: none; background: transparent;
          pointer-events: none; margin: 0;
        }
        .dual-range input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%;
          background: #6366f1; border: 2px solid #fff; pointer-events: auto; cursor: pointer;
          box-shadow: 0 0 8px rgba(99, 102, 241, 0.6);
        }
        .dual-range input[type="range"]::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 50%; background: #6366f1;
          border: 2px solid #fff; pointer-events: auto; cursor: pointer;
        }
      `}</style>

      {/* 页面标题 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <Icons.Film className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">剪辑合成</h1>
        </div>
        <p className="text-sm text-dark-400 ml-10">
          上传视频，裁剪、调速、调色、加水印、改画幅，一键导出真实成片
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
        {/* 左侧：预览 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card rounded-2xl p-4">
            {videoSrc ? (
              <>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-dark-950 border border-white/5">
                  <video
                    ref={previewRef}
                    src={videoSrc}
                    controls
                    playsInline
                    className="w-full h-full"
                    style={{ filter: cssFilter }}
                  />
                  {watermarkText.trim() && (
                    <span
                      className="absolute pointer-events-none text-white font-semibold drop-shadow-lg whitespace-nowrap"
                      style={{ ...wmOverlayStyle(watermarkPos), opacity: watermarkOpacity / 100, fontSize: 'clamp(10px, 3vw, 22px)' }}
                    >
                      {watermarkText}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-dark-400">
                  <span className="truncate">{videoName}</span>
                  <span className="flex-shrink-0">{fmtTime(videoDuration)} · {videoWidth}×{videoHeight}</span>
                </div>
              </>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video rounded-xl bg-dark-950 border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-brand-500/40 hover:bg-brand-500/5 transition-all"
              >
                <Icons.Upload className="w-10 h-10 text-dark-500" />
                <p className="text-sm text-dark-400">点击上传要剪辑的视频</p>
                <p className="text-xs text-dark-500">支持 MP4 / WebM 等常见格式</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleUpload} />
          </div>

          {/* 结果预览 */}
          {result && (
            <div className="glass-card rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Icons.CheckCircle className="w-4 h-4 text-emerald-400" />
                成片已导出
              </h3>
              <video src={result.url} controls playsInline className="w-full rounded-xl border border-white/10 bg-dark-950" />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => downloadVideo(result.url, result.name, result.ext)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 hover:shadow-lg hover:shadow-brand-500/30 transition-all"
                >
                  <Icons.Download className="w-4 h-4" />
                  下载
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 右侧：功能区 */}
        <div className="space-y-4">
          {/* 裁剪 */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-1.5">
              <Icons.Scissors className="w-4 h-4 text-brand-400" />
              起止裁剪
            </h3>
            {videoSrc ? (
              <>
                <div className="flex items-center justify-between text-xs text-dark-400 mb-3">
                  <span>起点 <span className="text-brand-400">{fmtTime(trimStart)}</span></span>
                  <span>终点 <span className="text-brand-400">{fmtTime(trimEnd)}</span></span>
                  <span>区间 <span className="text-white">{fmtTime(Math.max(0, trimEnd - trimStart))}</span></span>
                </div>
                <div className="dual-range h-8">
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 rounded-full bg-dark-700" />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                    style={{ left: `${pct(trimStart)}%`, width: `${Math.max(0, pct(trimEnd) - pct(trimStart))}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={videoDuration || 0}
                    step={0.1}
                    value={Math.min(trimStart, videoDuration)}
                    onChange={(e) => setTrimStart(Math.min(Number(e.target.value), trimEnd - 0.1))}
                    aria-label="裁剪起点"
                  />
                  <input
                    type="range"
                    min={0}
                    max={videoDuration || 0}
                    step={0.1}
                    value={Math.min(trimEnd, videoDuration)}
                    onChange={(e) => setTrimEnd(Math.max(Number(e.target.value), trimStart + 0.1))}
                    aria-label="裁剪终点"
                  />
                </div>
              </>
            ) : (
              <p className="text-xs text-dark-500">上传视频后可用</p>
            )}
          </div>

          {/* 播放速度 */}
          <div className="glass-card rounded-2xl p-5">
            <label className="flex items-center justify-between text-sm font-semibold text-white mb-3">
              <span className="flex items-center gap-1.5">
                <Icons.Gauge className="w-4 h-4 text-brand-400" />
                播放速度
              </span>
              <span className="text-brand-400 text-xs">{speed.toFixed(1)}x</span>
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
              <span>0.5x 慢速</span>
              <span>2.0x 快速</span>
            </div>
          </div>

          {/* 滤镜 */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Icons.Palette className="w-4 h-4 text-brand-400" />
              颜色滤镜
            </h3>
            {[
              { key: 'brightness', label: '亮度', value: brightness, set: setBrightness, min: 50, max: 150, unit: '%' },
              { key: 'contrast', label: '对比度', value: contrast, set: setContrast, min: 50, max: 150, unit: '%' },
              { key: 'saturation', label: '饱和度', value: saturation, set: setSaturation, min: 0, max: 200, unit: '%' },
              { key: 'grayscale', label: '灰度', value: grayscale, set: setGrayscale, min: 0, max: 100, unit: '%' },
            ].map((f) => (
              <div key={f.key}>
                <div className="flex items-center justify-between text-xs text-dark-400 mb-1.5">
                  <span>{f.label}</span>
                  <span className="text-brand-400">{f.value}{f.unit}</span>
                </div>
                <input
                  type="range"
                  min={f.min}
                  max={f.max}
                  value={f.value}
                  onChange={(e) => f.set(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            ))}
          </div>

          {/* 文字水印 */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Icons.Type className="w-4 h-4 text-brand-400" />
              文字水印
            </h3>
            <input
              type="text"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              placeholder="输入水印文字（留空则不加）"
              className="w-full bg-dark-900/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 transition-all"
            />
            <div>
              <label className="block text-xs text-dark-400 mb-2">位置（九宫格）</label>
              <div className="grid grid-cols-3 gap-1.5">
                {WM_POSITIONS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setWatermarkPos(p.id)}
                    className={`py-1.5 rounded-lg text-xs border transition-all ${
                      watermarkPos === p.id
                        ? 'bg-brand-500/10 border-brand-500/40 text-brand-300'
                        : 'bg-dark-900/50 border-white/5 text-dark-400 hover:text-white'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-dark-400 mb-1.5">
                <span>透明度</span>
                <span className="text-brand-400">{watermarkOpacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={watermarkOpacity}
                onChange={(e) => setWatermarkOpacity(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* 画幅 */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-1.5">
              <Icons.Maximize2 className="w-4 h-4 text-brand-400" />
              输出画幅
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {ASPECTS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAspect(a.id)}
                  className={`py-2 rounded-lg text-xs border transition-all ${
                    aspect === a.id
                      ? 'bg-brand-500/10 border-brand-500/40 text-brand-300'
                      : 'bg-dark-900/50 border-white/5 text-dark-400 hover:text-white'
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>

          {/* 导出按钮 */}
          <button
            onClick={handleExport}
            disabled={exporting || !videoSrc}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <Icons.Loader2 className="w-4 h-4 animate-spin" />
                导出中... {Math.round(progress)}%
              </>
            ) : (
              <>
                <Icons.Film className="w-4 h-4" />
                导出成片
              </>
            )}
          </button>

          {/* 导出进度 */}
          {exporting && (
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2 text-xs">
                <span className="text-dark-300">当前帧时间 <span className="text-brand-400">{fmtTime(frameTime)}</span></span>
                <span className="text-dark-400">导出区间 {fmtTime(Math.max(0.1, trimEnd - trimStart))}</span>
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

      {/* 历史作品 */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icons.History className="w-5 h-5 text-brand-400" />
            <h2 className="text-base font-semibold text-white">剪辑作品</h2>
          </div>
          {history.length > 0 && <span className="text-xs text-dark-500">共 {history.length} 条</span>}
        </div>

        {history.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-dark-800 flex items-center justify-center mb-3">
              <Icons.Film className="w-5 h-5 text-dark-500" />
            </div>
            <p className="text-sm text-dark-400 mb-1">暂无剪辑作品</p>
            <p className="text-xs text-dark-500">上传视频并导出后，成片会自动保存在这里</p>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}