/**
 * 真实 AI 服务层（Pollinations 免费 API + 浏览器原生能力）
 *
 * - 文本生成：Pollinations text API（匿名可用，配置 Key 后走 gen.pollinations.ai 更稳定）
 * - 图片生成：Pollinations image API（匿名可用）
 * - 语音合成：浏览器 Web Speech API（真实 TTS，零配置）+ Pollinations 云端音色（可下载 MP3）
 * - 语音识别：浏览器 Web Speech API（真实 STT）
 *
 * 所有方法均为真实调用，失败时抛出可读的中文错误，绝不返回模拟数据。
 */

const TEXT_BASE = 'https://text.pollinations.ai'
const GEN_BASE = 'https://gen.pollinations.ai'
const IMAGE_BASE = 'https://image.pollinations.ai'

const getKey = () => localStorage.getItem('video_api_key') || ''
export const hasAiKey = () => !!getKey()

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const fetchTimeout = async (url, options = {}, timeout = 90000, retries = 1) => {
  let lastErr
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    try {
      const resp = await fetch(url, { ...options, signal: controller.signal })
      clearTimeout(timer)
      if (resp.ok) return resp
      if (resp.status === 429 || resp.status === 503) {
        const retryAfter = parseInt(resp.headers.get('Retry-After') || '5', 10)
        lastErr = new Error('服务繁忙，正在重试')
        await sleep(Math.min(retryAfter, 20) * 1000)
        continue
      }
      const body = await resp.text().catch(() => '')
      throw new Error(`AI 服务返回错误 (${resp.status})${body ? `: ${body.slice(0, 100)}` : ''}`)
    } catch (err) {
      clearTimeout(timer)
      if (err.name === 'AbortError') { lastErr = new Error('AI 服务响应超时，请重试'); continue }
      if (err.message.startsWith('AI 服务')) throw err
      lastErr = err
      if (i < retries) await sleep(2000)
    }
  }
  throw lastErr || new Error('网络请求失败，请检查网络后重试')
}

/* ============================== 文本生成 ============================== */

/**
 * 真实 AI 文本生成
 * @param {string} userPrompt
 * @param {Object} opts - { system, temperature }
 * @returns {Promise<string>}
 */
export const generateText = async (userPrompt, opts = {}) => {
  const { system = '你是一个资深短视频内容创作助手，输出简洁实用的中文内容。', temperature = 0.8 } = opts
  const key = getKey()

  // 路径一：已配置 Key → gen.pollinations.ai（OpenAI 兼容，稳定）
  if (key) {
    try {
      const resp = await fetchTimeout(`${GEN_BASE}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: 'openai-fast',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userPrompt },
          ],
          temperature,
        }),
      }, 90000, 2)
      const data = await resp.json()
      const text = data?.choices?.[0]?.message?.content
      if (text) return text.trim()
    } catch (err) {
      console.warn('[aiApi] key 通道失败，尝试匿名通道:', err.message)
    }
  }

  // 路径二：匿名 → text.pollinations.ai/openai
  try {
    const resp = await fetchTimeout(`${TEXT_BASE}/openai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai-fast',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt },
        ],
        private: true,
      }),
    }, 90000, 1)
    const data = await resp.json()
    const text = data?.choices?.[0]?.message?.content
    if (text) return text.trim()
    throw new Error('返回内容为空')
  } catch (err) {
    console.warn('[aiApi] openai 兼容通道失败，尝试 GET 通道:', err.message)
  }

  // 路径三：匿名 GET 纯文本
  const fullPrompt = `${system}\n\n用户需求：${userPrompt}`
  const resp = await fetchTimeout(
    `${TEXT_BASE}/${encodeURIComponent(fullPrompt.slice(0, 1800))}?model=openai-fast`,
    { method: 'GET' },
    90000,
    1
  )
  const text = await resp.text()
  if (text && !text.startsWith('{')) return text.trim()
  throw new Error('AI 文本服务暂时不可用，请稍后重试（或配置 Pollinations Key 获得稳定通道）')
}

/* ============================== 图片生成 ============================== */

/**
 * 真实 AI 图片生成（匿名可用）
 * @returns {Promise<{url: string, blob: Blob}>}
 */
export const generateImage = async (prompt, opts = {}) => {
  const { width = 1080, height = 1080, seed = Math.floor(Math.random() * 1e6), model = 'flux' } = opts
  const qs = new URLSearchParams({ width: String(width), height: String(height), seed: String(seed), nologo: 'true', model })
  const key = getKey()
  if (key) qs.set('key', key)
  const url = `${IMAGE_BASE}/prompt/${encodeURIComponent(prompt.slice(0, 800))}?${qs}`
  const resp = await fetchTimeout(url, { method: 'GET' }, 120000, 2)
  const blob = await resp.blob()
  if (!blob.type.startsWith('image')) throw new Error('图片生成失败，请调整描述后重试')
  return { url: URL.createObjectURL(blob), blob }
}

/* ============================== 语音合成 ============================== */

/** Pollinations 云端音色（可下载 MP3） */
export const CLOUD_VOICES = [
  { id: 'nova', name: 'Nova · 温柔女声', desc: '亲切自然，适合种草/情感类' },
  { id: 'alloy', name: 'Alloy · 知性女声', desc: '沉稳专业，适合知识科普' },
  { id: 'shimmer', name: 'Shimmer · 活力女声', desc: '明亮有活力，适合带货' },
  { id: 'onyx', name: 'Onyx · 浑厚男声', desc: '低沉磁性，适合故事解说' },
  { id: 'echo', name: 'Echo · 清亮男声', desc: '干净利落，适合新闻资讯' },
  { id: 'fable', name: 'Fable · 叙事男声', desc: '有故事感，适合剧情口播' },
]

/**
 * 云端 TTS（返回可下载的 MP3）。需要网络可访问 Pollinations，失败会抛错。
 * @returns {Promise<{url: string, blob: Blob, engine: 'cloud'}>}
 */
export const generateSpeechCloud = async (text, opts = {}) => {
  const { voice = 'nova' } = opts
  const qs = new URLSearchParams({ model: 'openai-audio', voice })
  const key = getKey()
  if (key) qs.set('key', key)
  const url = `${TEXT_BASE}/${encodeURIComponent(text.slice(0, 1500))}?${qs}`
  const resp = await fetchTimeout(url, { method: 'GET' }, 120000, 1)
  const blob = await resp.blob()
  if (!blob.type.includes('audio') && blob.size < 2000) throw new Error('云端配音失败')
  return { url: URL.createObjectURL(blob), blob, engine: 'cloud' }
}

/** 获取浏览器本地真实音色列表（Web Speech API） */
export const getLocalVoices = () => {
  if (!('speechSynthesis' in window)) return []
  const voices = window.speechSynthesis.getVoices()
  const zh = voices.filter((v) => v.lang.toLowerCase().startsWith('zh'))
  const rest = voices.filter((v) => !v.lang.toLowerCase().startsWith('zh'))
  return [...zh, ...rest].map((v) => ({
    id: v.voiceURI,
    name: `${v.name}`,
    desc: `${v.lang} · 浏览器本地音色`,
    lang: v.lang,
    localService: v.localService,
  }))
}

/**
 * 本地真实 TTS 播放（Web Speech API，零配置）
 * @returns {{ stop: () => void, promise: Promise<void> }}
 */
export const speakLocal = (text, opts = {}) => {
  const { voiceURI, rate = 1, pitch = 1 } = opts
  if (!('speechSynthesis' in window)) throw new Error('当前浏览器不支持语音合成')
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  const voices = window.speechSynthesis.getVoices()
  const v = voices.find((x) => x.voiceURI === voiceURI) || voices.find((x) => x.lang.toLowerCase().startsWith('zh'))
  if (v) utter.voice = v
  utter.rate = rate
  utter.pitch = pitch
  const promise = new Promise((resolve, reject) => {
    utter.onend = () => resolve()
    utter.onerror = (e) => (e.error === 'canceled' || e.error === 'interrupted' ? resolve() : reject(new Error('语音播放失败')))
  })
  window.speechSynthesis.speak(utter)
  return { stop: () => window.speechSynthesis.cancel(), promise }
}

/* ============================== 语音识别（真实 STT） ============================== */

export const isSttSupported = () =>
  typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)

/**
 * 创建真实语音识别器（浏览器 Web Speech API）
 * @param {Object} opts - { lang, onResult(text, isFinal), onEnd, onError }
 * @returns {{ start, stop } | null}
 */
export const createRecognizer = (opts = {}) => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) return null
  const rec = new SR()
  rec.lang = opts.lang || 'zh-CN'
  rec.continuous = true
  rec.interimResults = true
  rec.onresult = (e) => {
    let interim = ''
    let final = ''
    for (let i = 0; i < e.results.length; i++) {
      const r = e.results[i]
      if (r.isFinal) final += r[0].transcript
      else interim += r[0].transcript
    }
    opts.onResult?.(final, interim)
  }
  rec.onend = () => opts.onEnd?.()
  rec.onerror = (e) => opts.onError?.(e.error === 'not-allowed' ? new Error('请允许麦克风权限') : new Error(`识别失败: ${e.error}`))
  return {
    start: () => { try { rec.start() } catch { /* already started */ } },
    stop: () => { try { rec.stop() } catch { /* ignore */ } },
  }
}

/** 播放媒体并实时语音识别（用于视频/音频文案提取） */
export const transcribeMediaElement = (mediaEl, opts = {}) => {
  const recognizer = createRecognizer(opts)
  if (!recognizer) return null
  return {
    start: () => { recognizer.start(); mediaEl.play() },
    stop: () => { mediaEl.pause(); recognizer.stop() },
  }
}

export default {
  hasAiKey,
  generateText,
  generateImage,
  generateSpeechCloud,
  getLocalVoices,
  speakLocal,
  isSttSupported,
  createRecognizer,
  transcribeMediaElement,
  CLOUD_VOICES,
}
