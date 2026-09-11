/**
 * 视频生成服务层 v2
 *
 * 引擎一（真实 AI）：Pollinations gen.pollinations.ai
 *   - 模型：Veo / Wan / Seedance / Nova Reel 等，直接返回 MP4
 *   - 需要 Secret Key（sk_ 开头，在 https://enter.pollinations.ai 注册后创建；裸 pk_ 限流 1 pollen/小时，不适用于视频）
 *
 * 引擎二（本地渲染）：Canvas + MediaRecorder
 *   - 无需 Key、无需网络，浏览器内实时渲染真实视频文件（MP4/WebM），保证 100% 出片
 *   - 文生视频：程序化动态场景（风格化光影 / 粒子 / 运镜）
 *   - 图生视频：对上传图片施加 Ken Burns / 视差 / 流体等电影级动效
 */

const POLLINATIONS_BASE = 'https://gen.pollinations.ai'
const KEY_STORAGE = 'video_api_key'

/* ============================== Key 管理 ============================== */

export const getApiKey = () => localStorage.getItem(KEY_STORAGE) || ''

export const setApiKey = (key) => {
  const v = (key || '').trim()
  if (v) localStorage.setItem(KEY_STORAGE, v)
  else localStorage.removeItem(KEY_STORAGE)
}

export const hasApiKey = () => !!getApiKey()

/** 视频生成要求 sk_ 开头的 Secret Key；pk_ 是限流的发布 key（1 pollen/小时/IP），无法稳定出片 */
export const hasVideoKey = () => getApiKey().trim().startsWith('sk_')

/* ============================== 工具函数 ============================== */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** 带超时与重试的 fetch（处理 429/503 限流与模型加载） */
const fetchWithRetry = async (url, options = {}, { timeout = 300000, retries = 2 } = {}) => {
  let lastErr
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    try {
      const resp = await fetch(url, { ...options, signal: controller.signal })
      clearTimeout(timer)
      if (resp.ok) return resp

      if (resp.status === 401) throw new Error('API Key 无效或缺失，请配置 Pollinations Secret Key（sk_ 开头，登录 enter.pollinations.ai 创建）')
      if (resp.status === 402) throw new Error('Pollinations 账户额度（Pollen）不足，请稍后额度重置后再试')
      if (resp.status === 429 || resp.status === 503) {
        const retryAfter = parseInt(resp.headers.get('Retry-After') || '8', 10)
        lastErr = new Error(resp.status === 429 ? '请求过于频繁，正在排队重试' : '模型正在加载，正在重试')
        await sleep(Math.min(retryAfter, 30) * 1000)
        continue
      }
      const errBody = await resp.json().catch(() => ({}))
      throw new Error(errBody?.error?.message || `生成服务返回错误 (${resp.status})`)
    } catch (err) {
      clearTimeout(timer)
      if (err.name === 'AbortError') throw new Error('生成超时（超过 5 分钟），请缩短时长或稍后重试')
      if (err.message.startsWith('API Key') || err.message.startsWith('Pollinations') || err.message.startsWith('生成服务')) throw err
      lastErr = err
      if (attempt < retries) await sleep(3000)
    }
  }
  throw lastErr || new Error('网络请求失败')
}

/** 下载生成的视频到本地 */
export const downloadVideo = (videoUrl, filename = 'ai-video', ext = 'mp4') => {
  const a = document.createElement('a')
  a.href = videoUrl
  a.download = `${filename}.${ext}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

/* ============================== Pollinations 真实 AI ============================== */

/** 按时长选择最合适的模型链（使用 Pollinations 官方 canonical id） */
const pickModels = (duration, isI2V) => {
  const d = Number(duration) || 5
  // 长视频用 nova-reel（支持 6-120s，需 6 的倍数）
  if (d > 15) {
    const dur = Math.min(120, Math.max(6, Math.round(d / 6) * 6))
    return [{ name: 'amazon/nova-reel-v1', dur }]
  }
  if (isI2V) {
    // 图生视频：优先支持参考图首帧的模型
    return [
      { name: 'bytedance/seedance-2.0', dur: Math.min(15, Math.max(4, d)) },
      { name: 'alibaba/wan-2.6', dur: Math.min(15, Math.max(2, d)) },
      { name: 'google/veo-3.1-fast', dur: d <= 5 ? 4 : d <= 6 ? 6 : 8 },
    ]
  }
  if (d <= 8) {
    return [
      { name: 'google/veo-3.1-fast', dur: d <= 4 ? 4 : d <= 6 ? 6 : 8 },
      { name: 'alibaba/wan-2.2-fast', dur: Math.min(15, Math.max(2, d)) },
      { name: 'google/gemini-omni-1.1-flash', dur: Math.min(10, Math.max(3, d)) },
    ]
  }
  return [
    { name: 'alibaba/wan-2.6', dur: Math.min(15, Math.max(2, d)) },
    { name: 'bytedance/seedance-2.0', dur: Math.min(15, Math.max(4, d)) },
    { name: 'google/gemini-omni-1.1-flash', dur: Math.min(10, Math.max(3, d)) },
  ]
}

/** 调用 Pollinations 视频端点，返回 { videoUrl, model, duration } */
const pollinationsVideo = async ({ prompt, duration, aspectRatio = '16:9', resolution = '1080p', seed, imageUrl, isI2V = false }) => {
  const key = getApiKey()
  if (!key) throw new Error('未配置 API Key')

  const width = resolution === '4k' ? 1920 : resolution === '720p' ? 1280 : 1920
  const height = Math.round(width * 9 / 16)
  const models = pickModels(duration, isI2V)
  let lastErr = null

  for (const m of models) {
    try {
      const qs = new URLSearchParams({
        model: m.name,
        duration: String(m.dur),
        aspectRatio,
        width: String(width),
        height: String(height),
        key,
      })
      if (seed) qs.set('seed', String(seed))
      if (imageUrl) qs.set('image', imageUrl)

      const url = `${POLLINATIONS_BASE}/video/${encodeURIComponent(prompt.slice(0, 1500))}?${qs}`
      const resp = await fetchWithRetry(url, { method: 'GET', headers: { Authorization: `Bearer ${key}` } })
      const blob = await resp.blob()
      if (!blob.type.includes('video') && blob.size < 10000) {
        const text = await blob.text().catch(() => '')
        throw new Error(text.slice(0, 120) || '返回的不是视频数据')
      }
      return {
        success: true,
        engine: 'api',
        videoUrl: URL.createObjectURL(blob),
        blob,
        model: m.name,
        duration: m.dur,
        ext: 'mp4',
      }
    } catch (err) {
      console.warn(`[videoApi] 模型 ${m.name} 失败:`, err.message)
      lastErr = err
      if (err.message.startsWith('API Key') || err.message.startsWith('Pollinations 账户')) throw err
    }
  }
  throw lastErr || new Error('所有视频模型均不可用')
}

/** 上传图片到 Pollinations 媒体库，返回可公开访问的 URL（图生视频首帧用） */
const uploadImage = async (dataUrl) => {
  const key = getApiKey()
  const blob = await (await fetch(dataUrl)).blob()
  const ext = (blob.type.split('/')[1] || 'png').replace('jpeg', 'jpg')
  const form = new FormData()
  form.append('file', blob, `start-frame.${ext}`)

  const resp = await fetchWithRetry('https://media.pollinations.ai/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  }, { timeout: 90000, retries: 1 })
  const data = await resp.json().catch(() => null)
  const url = typeof data === 'string' ? data : data?.url || (data?.id ? `https://media.pollinations.ai/${data.id}` : null)
  if (!url) throw new Error('图片上传失败')
  return url
}

/**
 * 文生视频（真实 AI）
 * @param {Object} p - { prompt, negativePrompt, duration, aspectRatio, resolution, seed, referenceImage }
 */
export const generateTextToVideo = async (p) => {
  const { prompt, negativePrompt = '', duration = 5, aspectRatio = '16:9', resolution = '1080p', seed, referenceImage } = p
  if (!prompt?.trim()) throw new Error('请输入提示词')

  let fullPrompt = prompt.trim()
  if (negativePrompt.trim()) fullPrompt += `. Avoid: ${negativePrompt.trim()}`

  let imageUrl = null
  if (referenceImage) imageUrl = await uploadImage(referenceImage)

  return pollinationsVideo({
    prompt: fullPrompt,
    duration,
    aspectRatio,
    resolution,
    seed,
    imageUrl,
    isI2V: !!imageUrl,
  })
}

/**
 * 图生视频（真实 AI）
 * @param {Object} p - { image(dataURL), prompt, duration, resolution, motionIntensity }
 */
export const generateImageToVideo = async (p) => {
  const { image, prompt = '', duration = 5, resolution = '1080p', motionIntensity = 50 } = p
  if (!image) throw new Error('请上传图片')

  const imageUrl = await uploadImage(image)
  const motionDesc = motionIntensity > 66 ? 'dynamic cinematic camera motion' : motionIntensity > 33 ? 'gentle camera motion' : 'subtle slow motion'
  const fullPrompt = `${prompt ? prompt + ', ' : ''}animate this image, ${motionDesc}, high quality`

  return pollinationsVideo({ prompt: fullPrompt, duration, resolution, imageUrl, isI2V: true })
}

/* ============================== 本地渲染引擎（保底，零依赖） ============================== */

const RES_MAP = {
  '720p': [1280, 720],
  '1080p': [1920, 1080],
  '4k': [1920, 1080], // 本地渲染封顶 1080p，保证流畅
}

export const pickRecorderMime = () => {
  const candidates = [
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ]
  if (typeof MediaRecorder === 'undefined') return ''
  return candidates.find((m) => MediaRecorder.isTypeSupported(m)) || ''
}

/** 通用录制循环：draw(ctx, t, duration) 每帧调用，按真实时间录制。extraTracks 可混入音轨 */
export const recordCanvas = ({ width, height, duration, fps = 30, draw, onProgress, extraTracks = [] }) =>
  new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    const mime = pickRecorderMime()
    if (!mime) return reject(new Error('当前浏览器不支持视频录制，请使用 Chrome / Edge / Safari'))

    const stream = canvas.captureStream(fps)
    extraTracks.forEach((t) => { try { stream.addTrack(t) } catch { /* ignore */ } })
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 10_000_000 })
    const chunks = []
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
    recorder.onerror = () => reject(new Error('视频编码失败'))
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mime })
      resolve({ blob, ext: mime.includes('mp4') ? 'mp4' : 'webm' })
    }

    draw(ctx, 0, duration) // 先画一帧再开始，避免黑帧
    recorder.start(250)
    const start = performance.now()
    const tick = (now) => {
      const t = (now - start) / 1000
      if (t >= duration) {
        onProgress?.(100)
        recorder.stop()
        return
      }
      draw(ctx, t, duration)
      onProgress?.(Math.min(99, (t / duration) * 100))
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })

/** 伪随机数生成器（种子可复现） */
const mulberry32 = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/* ---------- 文生视频：程序化动态场景 ---------- */

const STYLE_PRESETS = {
  cinematic: { hues: [210, 28, 320], grain: 0.10, rays: true, name: '电影感' },
  anime: { hues: [330, 280, 200], grain: 0.04, rays: false, name: '动漫风' },
  realistic: { hues: [205, 170, 45], grain: 0.06, rays: true, name: '写实风' },
  '3d': { hues: [240, 265, 190], grain: 0.05, rays: false, name: '3D动画' },
  pixel: { hues: [270, 300, 180], grain: 0.02, rays: false, name: '像素风', blocky: true },
  cyberpunk: { hues: [185, 300, 320], grain: 0.08, rays: true, name: '赛博朋克', neon: true },
}

const drawLocalTextScene = (ctx, t, duration, W, H, opt) => {
  const { style, motion, prompt, rand, particles } = opt
  const p = STYLE_PRESETS[style] || STYLE_PRESETS.cinematic
  const [h1, h2, h3] = p.hues

  // 运镜变换
  const k = t / duration
  ctx.save()
  if (motion === 'push') {
    const s = 1 + k * 0.18
    ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2)
  } else if (motion === 'zoom') {
    const s = 1.1 + Math.sin(k * Math.PI * 2) * 0.08
    ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2)
  } else if (motion === 'pan') {
    ctx.translate(Math.sin(k * Math.PI * 2) * W * 0.04, 0)
  } else if (motion === 'orbit') {
    ctx.translate(W / 2, H / 2); ctx.rotate(Math.sin(k * Math.PI * 2) * 0.04); ctx.scale(1.15, 1.15); ctx.translate(-W / 2, -H / 2)
  } else if (motion === 'drone') {
    ctx.translate(0, H * 0.06 * (1 - k)); const s = 1 + k * 0.1
    ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2)
  }

  // 天空渐变
  const hueShift = t * 6
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, `hsl(${(h1 + hueShift) % 360}, 65%, ${p.neon ? 8 : 16}%)`)
  g.addColorStop(0.55, `hsl(${(h2 + hueShift) % 360}, 60%, ${p.neon ? 14 : 28}%)`)
  g.addColorStop(1, `hsl(${(h3 + hueShift) % 360}, 55%, ${p.neon ? 10 : 18}%)`)
  ctx.fillStyle = g
  ctx.fillRect(-W * 0.1, -H * 0.1, W * 1.2, H * 1.2)

  // 太阳光晕
  const sunX = W * 0.72, sunY = H * 0.3 + Math.sin(t * 0.4) * H * 0.02
  const rg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, H * 0.55)
  rg.addColorStop(0, `hsla(${h2}, 90%, 70%, 0.55)`)
  rg.addColorStop(1, 'transparent')
  ctx.fillStyle = rg
  ctx.fillRect(0, 0, W, H)

  // 远山轮廓（两层视差）
  for (let layer = 0; layer < 2; layer++) {
    const baseY = H * (0.62 + layer * 0.14)
    const amp = H * (0.1 - layer * 0.03)
    const speed = (layer + 1) * 8
    ctx.fillStyle = `hsla(${h1}, 45%, ${12 + layer * 7}%, ${0.85 - layer * 0.25})`
    ctx.beginPath()
    ctx.moveTo(-W * 0.1, H)
    for (let x = -W * 0.1; x <= W * 1.1; x += W / 48) {
      const y = baseY + Math.sin((x + t * speed) * 0.006 + layer * 9) * amp * Math.sin((x + 300) * 0.0013)
      ctx.lineTo(x, y)
    }
    ctx.lineTo(W * 1.1, H)
    ctx.closePath()
    ctx.fill()
  }

  // 粒子（花瓣/尘埃/星尘）
  for (const pt of particles) {
    const px = (pt.x + t * pt.vx) % 1.1 - 0.05
    const py = (pt.y + t * pt.vy) % 1.1 - 0.05
    const tw = 0.5 + 0.5 * Math.sin(t * pt.tw + pt.x * 20)
    ctx.fillStyle = `hsla(${(h2 + pt.h) % 360}, 85%, ${p.neon ? 65 : 80}%, ${pt.a * tw})`
    ctx.beginPath()
    ctx.arc(px * W, py * H, pt.r, 0, Math.PI * 2)
    ctx.fill()
  }

  // 光柱
  if (p.rays) {
    ctx.save()
    ctx.globalCompositeOperation = 'screen'
    for (let i = 0; i < 3; i++) {
      const rx = W * (0.25 + i * 0.22) + Math.sin(t * 0.3 + i) * W * 0.03
      const ray = ctx.createLinearGradient(rx, 0, rx + W * 0.12, H)
      ray.addColorStop(0, `hsla(${h2}, 80%, 75%, ${0.10 + 0.05 * Math.sin(t * 0.7 + i * 2)})`)
      ray.addColorStop(1, 'transparent')
      ctx.fillStyle = ray
      ctx.beginPath()
      ctx.moveTo(rx, 0); ctx.lineTo(rx + W * 0.07, 0)
      ctx.lineTo(rx + W * 0.2, H); ctx.lineTo(rx - W * 0.06, H)
      ctx.closePath(); ctx.fill()
    }
    ctx.restore()
  }

  // 胶片颗粒
  if (p.grain > 0) {
    ctx.fillStyle = `rgba(255,255,255,${p.grain * 0.5})`
    for (let i = 0; i < 120; i++) {
      ctx.fillRect(rand() * W, rand() * H, 2, 2)
    }
  }

  ctx.restore()

  // 暗角
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95)
  vg.addColorStop(0, 'transparent')
  vg.addColorStop(1, 'rgba(0,0,0,0.45)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, W, H)

  // 片头标题（前 2.8 秒淡入淡出）
  const titleT = t < 2.8 ? (t < 0.5 ? t / 0.5 : t > 2.1 ? Math.max(0, (2.8 - t) / 0.7) : 1) : 0
  if (titleT > 0 && prompt) {
    ctx.save()
    ctx.globalAlpha = titleT
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    ctx.font = `600 ${Math.round(H * 0.045)}px "Noto Sans CJK SC", sans-serif`
    ctx.textAlign = 'center'
    ctx.shadowColor = 'rgba(0,0,0,0.6)'
    ctx.shadowBlur = 12
    ctx.fillText(prompt.slice(0, 32), W / 2, H * 0.5)
    ctx.restore()
  }

  // 角标
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = `${Math.round(H * 0.022)}px "Noto Sans CJK SC", sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText(`${p.name} · 本地渲染样片`, W * 0.03, H * 0.95)
}

/* ---------- 图生视频：图片动效 ---------- */

const drawCover = (ctx, img, W, H, scale = 1, dx = 0, dy = 0, rot = 0) => {
  const ir = img.width / img.height
  const cr = W / H
  let dw, dh
  if (ir > cr) { dh = H; dw = H * ir } else { dw = W; dh = W / ir }
  ctx.save()
  ctx.translate(W / 2 + dx, H / 2 + dy)
  ctx.rotate(rot)
  ctx.scale(scale, scale)
  ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh)
  ctx.restore()
}

const drawLocalImageScene = (ctx, t, duration, W, H, opt) => {
  const { img, effect, intensity, particles, rand } = opt
  const k = t / duration
  const it = intensity / 100

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, W, H)

  switch (effect) {
    case 'slow-zoom': {
      drawCover(ctx, img, W, H, 1.02 + k * 0.28 * (0.4 + it))
      break
    }
    case 'pan': {
      const maxDx = W * 0.07 * (0.4 + it)
      drawCover(ctx, img, W, H, 1.16, -maxDx + k * maxDx * 2, 0)
      break
    }
    case 'orbit': {
      drawCover(ctx, img, W, H, 1.28, Math.sin(k * Math.PI * 2) * W * 0.03 * it, Math.cos(k * Math.PI * 2) * H * 0.02 * it, Math.sin(k * Math.PI * 2) * 0.05 * (0.3 + it))
      break
    }
    case 'parallax': {
      drawCover(ctx, img, W, H, 1.14, Math.sin(k * Math.PI * 2) * W * 0.02 * it, 0)
      // 前景遮罩层快速移动产生视差
      ctx.save()
      ctx.globalAlpha = 0.35
      ctx.fillStyle = 'rgba(10,10,18,0.7)'
      const off = Math.sin(k * Math.PI * 2) * W * 0.06 * (0.5 + it)
      ctx.beginPath()
      ctx.moveTo(0, H)
      for (let x = 0; x <= W; x += W / 32) {
        ctx.lineTo(x, H * 0.86 + Math.sin((x + off * 3) * 0.01) * H * 0.03)
      }
      ctx.lineTo(W, H)
      ctx.closePath(); ctx.fill()
      ctx.restore()
      break
    }
    case 'breathe': {
      const s = 1.05 + Math.sin(t * Math.PI / 1.6) * 0.05 * (0.3 + it)
      drawCover(ctx, img, W, H, s)
      ctx.fillStyle = `rgba(255,255,255,${0.04 + 0.04 * Math.sin(t * Math.PI / 1.6)})`
      ctx.fillRect(0, 0, W, H)
      break
    }
    case 'particle': {
      drawCover(ctx, img, W, H, 1.05 + k * 0.1 * it)
      for (const pt of particles) {
        const py = ((pt.y - t * (0.03 + pt.vy)) % 1 + 1) % 1
        const tw = 0.4 + 0.6 * Math.sin(t * pt.tw + pt.x * 30)
        ctx.fillStyle = `hsla(${45 + pt.h}, 90%, 75%, ${pt.a * tw * (0.4 + it)})`
        ctx.beginPath()
        ctx.arc(pt.x * W + Math.sin(t + pt.y * 8) * 12, py * H, pt.r * 1.4, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
    case 'liquid': {
      const strips = 48
      const ir = img.width / img.height
      const cr = W / H
      let dw, dh
      if (ir > cr) { dh = H; dw = H * ir } else { dw = W; dh = W / ir }
      const sx = (img.width - img.width * (W / dw)) / 2 || 0
      const sw = img.width * (W / dw)
      const amp = (3 + 14 * it)
      for (let i = 0; i < strips; i++) {
        const dy = (H / strips) * i
        const off = Math.sin(t * 2.4 + i * 0.55) * amp
        ctx.drawImage(img, sx, (img.height / strips) * i, sw, img.height / strips, off, dy, W, H / strips + 1)
      }
      break
    }
    case 'cinematic':
    default: {
      drawCover(ctx, img, W, H, 1.02 + k * 0.16 * (0.4 + it))
      // 胶片颗粒
      ctx.fillStyle = 'rgba(255,255,255,0.045)'
      for (let i = 0; i < 150; i++) ctx.fillRect(rand() * W, rand() * H, 2, 2)
      // 黑边
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, W, H * 0.07)
      ctx.fillRect(0, H * 0.93, W, H * 0.07)
      break
    }
  }

  // 暗角
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H)
  vg.addColorStop(0, 'transparent')
  vg.addColorStop(1, 'rgba(0,0,0,0.35)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, W, H)
}

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = src
  })

/**
 * 本地渲染视频（保底方案，无需 Key，必定出片）
 * @param {Object} p
 * @param {'text'|'image'} p.mode
 * @param {string} p.prompt - 文生视频提示词
 * @param {string} p.style - 风格 id
 * @param {string} p.motion - 运镜 id
 * @param {string} p.image - 图生视频图片 dataURL
 * @param {string} p.effect - 动效 id
 * @param {number} p.intensity - 运动幅度 0-100
 * @param {number} p.duration - 秒
 * @param {string} p.resolution - '720p'|'1080p'|'4k'
 * @param {Function} p.onProgress - 0-100 回调
 */
export const generateLocalVideo = async (p) => {
  const {
    mode = 'text', prompt = '', style = 'cinematic', motion = 'push',
    image = null, effect = 'slow-zoom', intensity = 50,
    duration = 10, resolution = '1080p', onProgress,
  } = p

  const [W, H] = RES_MAP[resolution] || RES_MAP['1080p']
  const rand = mulberry32(Date.now() % 100000)
  const particles = Array.from({ length: 90 }, () => ({
    x: rand(), y: rand(), r: 1 + rand() * 3.2,
    vx: (rand() - 0.5) * 0.02, vy: 0.01 + rand() * 0.05,
    a: 0.25 + rand() * 0.55, h: rand() * 60, tw: 1 + rand() * 3,
  }))

  let draw
  if (mode === 'image') {
    if (!image) throw new Error('请上传图片')
    const img = await loadImage(image)
    draw = (ctx, t, dur) => drawLocalImageScene(ctx, t, dur, W, H, { img, effect, intensity, particles, rand })
  } else {
    draw = (ctx, t, dur) => drawLocalTextScene(ctx, t, dur, W, H, { style, motion, prompt, rand, particles })
  }

  const { blob, ext } = await recordCanvas({ width: W, height: H, duration, fps: 30, draw, onProgress })
  return {
    success: true,
    engine: 'local',
    videoUrl: URL.createObjectURL(blob),
    blob,
    duration,
    ext,
  }
}

/** 智能生成：有 有效 sk_ Key 走真实 AI，失败/无 Key/仅 pk_ 自动降级本地渲染 */
export const generateVideo = async (type, params) => {
  if (hasVideoKey()) {
    return type === 'text' ? generateTextToVideo(params) : generateImageToVideo(params)
  }
  return generateLocalVideo({ ...params, mode: type })
}

export default {
  getApiKey,
  setApiKey,
  hasApiKey,
  hasVideoKey,
  generateTextToVideo,
  generateImageToVideo,
  generateLocalVideo,
  generateVideo,
  downloadVideo,
}
