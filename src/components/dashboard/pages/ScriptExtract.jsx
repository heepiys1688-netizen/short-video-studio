import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { generateText, isSttSupported, createRecognizer } from '../../../services/aiApi'
import { saveScript, getScripts, deleteScript, createTask, updateTask, on, timeAgo } from '../../../services/store'

// 解析 AI 结构化提取结果（约定【标题】【正文】【话题】【亮点钩子】分隔符），失败返回 null 整体展示
const parseExtractResult = (text) => {
  if (!text) return null
  const clean = text.replace(/```[a-zA-Z]*\n?/g, '').replace(/```/g, '').trim()
  const pick = (name, next) => {
    const re = next ? new RegExp(`【${name}】([\\s\\S]*?)(?=【${next}】)`) : new RegExp(`【${name}】([\\s\\S]*)$`)
    const m = clean.match(re)
    return m ? m[1].trim() : ''
  }
  const title = pick('标题', '正文')
  const body = pick('正文', '话题')
  const topicsRaw = pick('话题', '亮点钩子')
  const hooks = pick('亮点钩子')
  if (!title && !body) return null
  const tags = (topicsRaw.match(/#[^\s#，,。]+/g) || []).slice(0, 8)
  return { title, body, tags, topicsRaw, hooks, raw: clean }
}

export default function ScriptExtract() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('stt') // 'stt' | 'paste'
  const sttOk = isSttSupported()

  /* ---------- 模式一：语音识别提取 ---------- */
  const [mediaFile, setMediaFile] = useState(null) // { url, name, kind: 'video'|'audio' }
  const [recognizing, setRecognizing] = useState(false)
  const [finalText, setFinalText] = useState('')
  const [interimText, setInterimText] = useState('')
  const [sttError, setSttError] = useState('')
  const mediaRef = useRef(null)
  const fileInputRef = useRef(null)
  const recognizerRef = useRef(null)
  const recognizingRef = useRef(false)
  const finalTextRef = useRef('')
  const taskRef = useRef(null)

  /* ---------- 模式二：粘贴解析 ---------- */
  const [pasteText, setPasteText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState('')
  // result: { mode: 'stt'|'ai', parsed, title, body, tagsText, hooks, raw }
  const [result, setResult] = useState(null)

  const [copiedKey, setCopiedKey] = useState('')
  const [saveState, setSaveState] = useState('idle') // idle | saved
  const [history, setHistory] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const copyTimerRef = useRef(null)

  // 真实历史记录：kind = '提取' 的文案，订阅实时刷新
  useEffect(() => {
    const load = () => setHistory(getScripts().filter((s) => s.kind === '提取'))
    load()
    const off = on('scripts', load)
    return () => {
      off()
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    }
  }, [])

  // 卸载时停止识别并释放媒体 URL
  useEffect(() => {
    return () => {
      recognizingRef.current = false
      try { recognizerRef.current?.stop() } catch { /* ignore */ }
      if (mediaFile?.url) URL.revokeObjectURL(mediaFile.url)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const flashCopied = (key) => {
    setCopiedKey(key)
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    copyTimerRef.current = setTimeout(() => setCopiedKey(''), 2000)
  }

  const doCopy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text)
      flashCopied(key)
    } catch {
      setParseError('复制失败，请检查浏览器剪贴板权限')
    }
  }

  /* ==================== 语音识别模式 ==================== */

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    stopRecognize()
    if (mediaFile?.url) URL.revokeObjectURL(mediaFile.url)
    const kind = file.type.startsWith('audio') ? 'audio' : 'video'
    setMediaFile({ url: URL.createObjectURL(file), name: file.name, kind })
    setFinalText('')
    setInterimText('')
    finalTextRef.current = ''
    setSttError('')
    setResult(null)
    setSaveState('idle')
  }

  const startRecognize = () => {
    if (!mediaRef.current || !sttOk || recognizingRef.current) return
    setSttError('')
    setResult(null)
    setSaveState('idle')
    setFinalText('')
    setInterimText('')
    finalTextRef.current = ''

    const rec = createRecognizer({
      lang: 'zh-CN',
      onResult: (final, interim) => {
        if (final) {
          finalTextRef.current += final
          setFinalText(finalTextRef.current)
        }
        setInterimText(interim)
      },
      onEnd: () => {
        if (recognizingRef.current) {
          // 浏览器语音识别会自动休眠，识别中自动重启以保持连续
          try { recognizerRef.current?.start() } catch { /* ignore */ }
        } else {
          setRecognizing(false)
          setInterimText('')
          const text = finalTextRef.current.trim()
          if (text) {
            setResult({ mode: 'stt', parsed: false, title: '', body: text, tagsText: '', hooks: '', raw: text })
            if (taskRef.current) {
              updateTask(taskRef.current.id, { status: 'completed', progress: 100, finishedAt: Date.now() })
              taskRef.current = null
            }
          } else {
            if (taskRef.current) {
              updateTask(taskRef.current.id, { status: 'failed', progress: 0, error: '未识别到有效语音内容', finishedAt: Date.now() })
              taskRef.current = null
            }
            setSttError('未识别到有效内容：请确认媒体外放音量足够大、环境安静后重试')
          }
        }
      },
      onError: (err) => {
        setSttError(err.message)
      },
    })
    if (!rec) return
    recognizerRef.current = rec
    recognizingRef.current = true
    setRecognizing(true)
    taskRef.current = createTask({
      title: `语音识别提取：${mediaFile?.name || '媒体文件'}`,
      type: '文案提取',
      module: 'extract',
    })
    rec.start()
    mediaRef.current.currentTime = 0
    mediaRef.current.muted = false
    mediaRef.current.volume = 1
    mediaRef.current.play().catch(() => {})
  }

  const stopRecognize = () => {
    if (!recognizingRef.current) return
    recognizingRef.current = false
    try { recognizerRef.current?.stop() } catch { /* ignore */ }
    try { mediaRef.current?.pause() } catch { /* ignore */ }
  }

  const handleMediaEnded = () => {
    // 媒体播放结束，自动停止识别（结果在 onEnd 中落定）
    stopRecognize()
  }

  /* ==================== 粘贴解析模式 ==================== */

  const handleParse = async () => {
    const text = pasteText.trim()
    if (!text || parsing) return
    setParsing(true)
    setParseError('')
    setResult(null)
    setSaveState('idle')

    const task = createTask({ title: `粘贴解析：${text.slice(0, 20)}${text.length > 20 ? '…' : ''}`, type: '文案提取', module: 'extract' })
    try {
      const raw = await generateText(
        `下面是从短视频平台（抖音/小红书/视频号/快手）复制的分享文案或链接文本，请结构化提取内容，并严格按以下格式输出（不要输出任何额外说明，不要使用代码块）：
【标题】
（视频的标题或主题，若原文没有明确标题则根据内容概括一个）
【正文】
（口播/正文文案全文，整理为通顺段落；若粘贴内容只有链接没有正文，请在此说明"粘贴的内容仅包含链接，浏览器无法直接抓取平台页面内容，无法还原正文"，不要编造）
【话题】
（话题标签，以 # 开头，空格分隔，最多 8 个）
【亮点钩子】
（列出 2-3 条文案的亮点或开头钩子，各写一行）

粘贴的内容如下：
${text}`,
        { system: '你是资深短视频文案分析师，擅长从杂乱的分享文案中提取标题、正文、话题和亮点钩子。输出真实、克制，绝不编造原文没有的内容。' }
      )
      const parsed = parseExtractResult(raw)
      if (parsed) {
        setResult({
          mode: 'ai',
          parsed: true,
          title: parsed.title,
          body: parsed.body,
          tagsText: (parsed.tags.length ? parsed.tags : parsed.topicsRaw.split(/\s+/).filter(Boolean)).join(' '),
          hooks: parsed.hooks,
          raw: parsed.raw,
        })
      } else {
        setResult({ mode: 'ai', parsed: false, title: '', body: raw, tagsText: '', hooks: '', raw })
      }
      updateTask(task.id, { status: 'completed', progress: 100, finishedAt: Date.now() })
    } catch (err) {
      setParseError(err.message || '解析失败，请稍后重试')
      updateTask(task.id, { status: 'failed', progress: 0, error: err.message || '解析失败', finishedAt: Date.now() })
    } finally {
      setParsing(false)
    }
  }

  /* ==================== 结果通用操作 ==================== */

  const buildFullText = () => {
    if (!result) return ''
    if (!result.parsed) return result.body
    const tagLine = result.tagsText.trim()
    return `${result.title ? result.title + '\n\n' : ''}${result.body}${tagLine ? `\n\n${tagLine}` : ''}`
  }

  const handleSave = () => {
    if (!result || saveState === 'saved') return
    const content = buildFullText().trim()
    if (!content) return
    const title =
      (result.parsed && result.title.trim()) ||
      content.split('\n').find((l) => l.trim())?.trim().slice(0, 40) ||
      '提取文案'
    saveScript({
      title,
      content,
      tags: result.parsed ? result.tagsText.trim() : '',
      source: result.mode === 'stt' ? '语音识别提取' : '粘贴解析',
      kind: '提取',
    })
    setSaveState('saved')
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <Icons.FileText className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">提取原片文案</h1>
        </div>
        <p className="text-sm text-dark-400 ml-10">
          两种真实提取方式：播放视频/音频实时语音识别，或粘贴平台分享文案让 AI 结构化解析
        </p>
      </div>

      {/* 模式 Tab */}
      <div className="glass-card rounded-2xl p-1.5 flex gap-1.5">
        <button
          onClick={() => setTab('stt')}
          className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
            tab === 'stt' ? 'bg-gradient-to-r from-brand-500 to-accent-500 text-white' : 'text-dark-400 hover:text-white'
          }`}
        >
          <Icons.Mic className="w-4 h-4" />
          语音识别提取
        </button>
        <button
          onClick={() => setTab('paste')}
          className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
            tab === 'paste' ? 'bg-gradient-to-r from-brand-500 to-accent-500 text-white' : 'text-dark-400 hover:text-white'
          }`}
        >
          <Icons.ClipboardPaste className="w-4 h-4" />
          粘贴解析
        </button>
      </div>

      {/* ==================== 模式一：语音识别提取 ==================== */}
      {tab === 'stt' && (
        <div className="glass-card rounded-2xl p-6 space-y-5">
          {!sttOk ? (
            <div className="py-10 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
                <Icons.AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <p className="text-sm text-white mb-1">当前浏览器不支持语音识别</p>
              <p className="text-xs text-dark-400 max-w-sm">
                语音识别依赖浏览器 Web Speech API，请使用最新版 Chrome / Edge 浏览器后重试；也可以切换到「粘贴解析」模式提取文案。
              </p>
            </div>
          ) : (
            <>
              {/* 文件上传 */}
              <div>
                <label className="block text-xs text-dark-400 mb-3 font-medium">上传视频 / 音频文件</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {mediaFile ? (
                  <div className="flex items-center justify-between bg-dark-900/50 border border-white/5 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {mediaFile.kind === 'audio' ? (
                        <Icons.Music className="w-4 h-4 text-brand-400 flex-shrink-0" />
                      ) : (
                        <Icons.Film className="w-4 h-4 text-brand-400 flex-shrink-0" />
                      )}
                      <span className="text-sm text-white truncate">{mediaFile.name}</span>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={recognizing}
                      className="text-xs text-dark-400 hover:text-white transition-colors flex-shrink-0 ml-3 disabled:opacity-40"
                    >
                      重新选择
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border border-dashed border-white/10 rounded-xl py-10 flex flex-col items-center justify-center text-center hover:border-brand-500/40 hover:bg-brand-500/5 transition-all"
                  >
                    <Icons.Upload className="w-6 h-6 text-dark-500 mb-2" />
                    <p className="text-sm text-dark-300 mb-1">点击选择本地视频或音频文件</p>
                    <p className="text-xs text-dark-500">支持常见 MP4 / WebM / MP3 / WAV 等格式，文件不上传服务器，仅在本地播放识别</p>
                  </button>
                )}
              </div>

              {/* 媒体播放器 + 识别控制 */}
              {mediaFile && (
                <div className="space-y-4 animate-fade-in">
                  {mediaFile.kind === 'video' ? (
                    <video
                      ref={mediaRef}
                      src={mediaFile.url}
                      controls
                      onEnded={handleMediaEnded}
                      className="w-full max-h-[320px] rounded-xl border border-white/5 bg-black"
                    />
                  ) : (
                    <audio
                      ref={mediaRef}
                      src={mediaFile.url}
                      controls
                      onEnded={handleMediaEnded}
                      className="w-full"
                    />
                  )}

                  <div className="flex items-center gap-3">
                    {!recognizing ? (
                      <button
                        onClick={startRecognize}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-brand-500/30 transition-all"
                      >
                        <Icons.Mic className="w-4 h-4" />
                        开始识别
                      </button>
                    ) : (
                      <button
                        onClick={stopRecognize}
                        className="px-6 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-sm font-semibold flex items-center gap-2 hover:bg-rose-500/25 transition-all"
                      >
                        <Icons.Square className="w-4 h-4" />
                        停止并出结果
                      </button>
                    )}
                    {recognizing && (
                      <span className="flex items-center gap-2 text-xs text-brand-300">
                        <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                        正在播放并实时识别...
                      </span>
                    )}
                  </div>

                  {/* 诚实说明 */}
                  <div className="bg-dark-950/60 border border-white/5 rounded-xl px-4 py-3 text-xs text-dark-400 leading-relaxed">
                    识别原理：浏览器通过麦克风实时识别外放声音。点击「开始识别」后请<b className="text-dark-200">允许麦克风权限</b>、
                    <b className="text-dark-200">调大系统音量</b>并保持环境安静；浏览器无法直接抓取抖音/小红书等平台链接内容，如需提取线上视频请先下载到本地再上传。
                  </div>

                  {/* 实时识别文本 */}
                  {(recognizing || finalText || interimText) && (
                    <div>
                      <div className="text-xs text-dark-400 mb-2 flex items-center gap-1.5">
                        <Icons.Radio className="w-3.5 h-3.5 text-brand-400" />
                        实时识别内容
                      </div>
                      <div className="bg-dark-950/60 rounded-xl p-4 border border-white/5 min-h-[96px] max-h-56 overflow-y-auto">
                        <p className="text-sm text-dark-200 whitespace-pre-wrap leading-relaxed">
                          {finalText}
                          <span className="text-dark-500">{interimText}</span>
                          {!finalText && !interimText && <span className="text-dark-500">聆听中，请稍候...</span>}
                        </p>
                      </div>
                    </div>
                  )}

                  {sttError && (
                    <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                      <Icons.AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-rose-300 leading-relaxed">{sttError}</p>
                    </div>
                  )}
                </div>
              )}

              {!mediaFile && (
                <div className="bg-dark-950/60 border border-white/5 rounded-xl px-4 py-3 text-xs text-dark-500 leading-relaxed">
                  提示：浏览器无法直接抓取平台链接内容。请先在抖音/小红书 App 内把视频保存到本地（或录制音频），再上传到此处进行语音识别提取。
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ==================== 模式二：粘贴解析 ==================== */}
      {tab === 'paste' && (
        <div className="glass-card rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-xs text-dark-400 mb-3 font-medium">粘贴分享文案 / 链接文本</label>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={6}
              placeholder={'在抖音/小红书/视频号/快手 App 内点击「分享 → 复制链接」，把复制到的整段文字粘贴到这里，例如：\n\n3.56 复制打开抖音，看看【护肤小课堂的作品】夏天防晒别只知道涂脸... https://v.douyin.com/xxxx/'}
              className="w-full bg-dark-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all resize-none leading-relaxed"
            />
          </div>

          <div className="bg-dark-950/60 border border-white/5 rounded-xl px-4 py-3 text-xs text-dark-400 leading-relaxed">
            诚实说明：受浏览器网络安全限制，我们<b className="text-dark-200">无法直接抓取平台链接内的页面内容</b>。
            AI 会对你粘贴的文字做结构化提取（标题 / 正文 / 话题 / 亮点钩子）；若粘贴内容中本身就包含完整文案（如分享时自动附带的简介），提取效果最佳。
            只有链接没有文案时，请改用「语音识别提取」模式。
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleParse}
              disabled={!pasteText.trim() || parsing}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {parsing ? (
                <>
                  <Icons.Loader2 className="w-4 h-4 animate-spin" />
                  AI 解析中...
                </>
              ) : (
                <>
                  <Icons.Wand2 className="w-4 h-4" />
                  开始解析
                </>
              )}
            </button>
            {pasteText.trim() && !parsing && (
              <button
                onClick={() => { setPasteText(''); setResult(null); setParseError('') }}
                className="px-4 py-3 rounded-xl bg-dark-900/50 border border-white/10 text-dark-400 text-sm hover:text-white transition-all"
              >
                清空
              </button>
            )}
          </div>

          {parseError && (
            <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
              <Icons.AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-rose-300 leading-relaxed">{parseError}</p>
            </div>
          )}
        </div>
      )}

      {/* ==================== 提取结果区 ==================== */}
      {result && (
        <div className="glass-card rounded-2xl p-6 space-y-5 animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <Icons.FileText className="w-5 h-5 text-brand-400" />
              <h2 className="text-base font-semibold text-white">提取结果</h2>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">
                {result.mode === 'stt' ? '语音识别完成' : '解析完成'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => doCopy(buildFullText(), 'result')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-dark-300 hover:text-white hover:bg-white/10 transition-all"
              >
                {copiedKey === 'result' ? <Icons.Check className="w-3.5 h-3.5 text-emerald-400" /> : <Icons.Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'result' ? '已复制' : '复制全部'}
              </button>
              <button
                onClick={handleSave}
                disabled={saveState === 'saved'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300 hover:bg-brand-500/20 transition-all disabled:opacity-60"
              >
                {saveState === 'saved' ? <Icons.Check className="w-3.5 h-3.5 text-emerald-400" /> : <Icons.Save className="w-3.5 h-3.5" />}
                {saveState === 'saved' ? '已保存' : '保存文案'}
              </button>
            </div>
          </div>

          {result.parsed && (
            <div>
              <div className="text-xs text-dark-400 mb-2 flex items-center gap-1">
                <Icons.Sparkles className="w-3.5 h-3.5" />
                标题（可直接编辑）
              </div>
              <input
                value={result.title}
                onChange={(e) => setResult({ ...result, title: e.target.value })}
                placeholder="标题"
                className="w-full bg-dark-900/80 border border-white/10 rounded-xl px-3 py-2.5 text-sm font-semibold text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 transition-all"
              />
            </div>
          )}

          <div>
            <div className="text-xs text-dark-400 mb-2">正文内容（可直接编辑）</div>
            <textarea
              value={result.body}
              onChange={(e) => setResult({ ...result, body: e.target.value })}
              rows={8}
              className="w-full bg-dark-950/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-dark-200 focus:outline-none focus:border-brand-500 transition-all resize-none leading-relaxed"
            />
          </div>

          {result.parsed && (
            <>
              <div>
                <div className="text-xs text-dark-400 mb-2 flex items-center gap-1">
                  <Icons.Hash className="w-3.5 h-3.5" />
                  话题标签（空格分隔，可直接编辑）
                </div>
                <input
                  value={result.tagsText}
                  onChange={(e) => setResult({ ...result, tagsText: e.target.value })}
                  placeholder="#话题1 #话题2"
                  className="w-full bg-dark-900/80 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-brand-300 placeholder-dark-500 focus:outline-none focus:border-brand-500 transition-all"
                />
              </div>
              {result.hooks && (
                <div>
                  <div className="text-xs text-dark-400 mb-2 flex items-center gap-1">
                    <Icons.Zap className="w-3.5 h-3.5" />
                    亮点钩子
                  </div>
                  <div className="bg-dark-950/60 rounded-xl p-4 border border-white/5">
                    <pre className="text-sm text-dark-300 whitespace-pre-wrap leading-relaxed font-sans">{result.hooks}</pre>
                  </div>
                </div>
              )}
            </>
          )}

          {!result.parsed && result.mode === 'ai' && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              <Icons.AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300 leading-relaxed">AI 未按约定格式返回，已整体展示解析内容，可直接编辑后保存。</p>
            </div>
          )}

          <div className="flex items-center justify-end pt-2">
            <button
              onClick={() => navigate('/dashboard/rewrite')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-brand-500/30 transition-all"
            >
              进入下一步：AI改写
              <Icons.ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 空状态（粘贴模式且无结果时） */}
      {!result && tab === 'paste' && !parsing && (
        <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-dark-800 flex items-center justify-center mb-4">
            <Icons.ClipboardPaste className="w-7 h-7 text-dark-500" />
          </div>
          <p className="text-sm text-dark-400 mb-1">还没有提取结果</p>
          <p className="text-xs text-dark-500">粘贴分享文案后点击「开始解析」，或切换到「语音识别提取」</p>
        </div>
      )}

      {/* ==================== 历史记录（真实数据） ==================== */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icons.History className="w-5 h-5 text-brand-400" />
            <h2 className="text-base font-semibold text-white">提取历史</h2>
          </div>
          {history.length > 0 && <span className="text-xs text-dark-500">共 {history.length} 条</span>}
        </div>

        {history.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-dark-800 flex items-center justify-center mb-3">
              <Icons.FileText className="w-5 h-5 text-dark-500" />
            </div>
            <p className="text-sm text-dark-400 mb-1">暂无提取记录</p>
            <p className="text-xs text-dark-500">完成一次提取后点击「保存文案」，历史会实时出现在这里</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => {
              const expanded = expandedId === item.id
              return (
                <div key={item.id} className="bg-dark-900/50 border border-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={() => setExpandedId(expanded ? null : item.id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="flex items-center gap-2">
                        {expanded ? (
                          <Icons.ChevronUp className="w-4 h-4 text-dark-500 flex-shrink-0" />
                        ) : (
                          <Icons.ChevronDown className="w-4 h-4 text-dark-500 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium text-white truncate">{item.title || '提取文案'}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 ml-6 text-xs text-dark-500">
                        <span>{timeAgo(item.createdAt)}</span>
                        {item.source && (
                          <>
                            <span>·</span>
                            <span>{item.source}</span>
                          </>
                        )}
                      </div>
                    </button>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => doCopy(`${item.title ? item.title + '\n\n' : ''}${item.content}${item.tags ? `\n\n${item.tags}` : ''}`, item.id)}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-dark-300 hover:text-white transition-all"
                        title="复制"
                      >
                        {copiedKey === item.id ? <Icons.Check className="w-4 h-4 text-emerald-400" /> : <Icons.Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteScript(item.id)}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-dark-400 hover:text-rose-400 transition-all"
                        title="删除"
                      >
                        <Icons.Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {expanded && (
                    <div className="mt-3 ml-6 space-y-3 animate-fade-in">
                      <div className="bg-dark-950/60 rounded-xl p-4 border border-white/5 max-h-64 overflow-y-auto">
                        <pre className="text-sm text-dark-300 whitespace-pre-wrap leading-relaxed font-sans">{item.content}</pre>
                      </div>
                      {item.tags && (
                        <div className="flex flex-wrap gap-1.5">
                          {item.tags.split(/\s+/).filter(Boolean).map((tag, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-300 text-xs border border-brand-500/20">
                              {tag.startsWith('#') ? tag : `#${tag}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
