import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { generateText } from '../../../services/aiApi'
import { saveScript, getScripts, deleteScript, createTask, updateTask, on, timeAgo } from '../../../services/store'

// 改写风格（每个风格对应一段真实的 AI system 指令）
const REWRITE_STYLES = [
  {
    id: 'seeding',
    name: '爆款种草',
    desc: '情绪饱满、安利感强',
    system: '你是小红书/抖音顶级种草博主，擅长情绪饱满、感染力强的爆款种草文案。改写要求：用"姐妹们/宝子们"式亲昵口吻，多用感叹号和口语短句，突出痛点与使用效果，制造"不买就亏"的紧迫感，结尾带行动号召。',
  },
  {
    id: 'pro',
    name: '专业科普',
    desc: '逻辑清晰、数据说话',
    system: '你是严谨的专业科普创作者。改写要求：逻辑清晰、分点论述，用专业术语和数据说话，但保持通俗易懂，去掉夸张营销语气，让内容可信、有据可查。',
  },
  {
    id: 'emotion',
    name: '情感共鸣',
    desc: '以情动人、引发共鸣',
    system: '你是情感类短视频文案高手。改写要求：以真实故事和细腻感受切入，用第一人称讲述，制造强烈情绪共鸣，语言真诚克制、不煽情过度，结尾留有余味。',
  },
  {
    id: 'funny',
    name: '搞笑玩梗',
    desc: '幽默梗多、节奏欢快',
    system: '你是搞笑短视频编剧，网感极强。改写要求：节奏欢快、梗点密集，用夸张、反转、自嘲等喜剧手法重新演绎内容，口语化表达，让观众笑着看完，但不偏离原文核心信息。',
  },
  {
    id: 'minimal',
    name: '极简干货',
    desc: '短平快、信息密度高',
    system: '你是干货类内容编辑。改写要求：删除一切废话和情绪铺垫，用清单式短句输出核心信息，每一条都可直接执行，信息密度最大化，适合快节奏口播。',
  },
]

// 改写力度
const STRENGTH_OPTIONS = [
  { id: 'light', name: '轻度', desc: '保留原文结构，微调表述', instruction: '轻度改写：保留原文的整体结构和段落顺序，只调整用词和句式，让表达焕然一新。' },
  { id: 'medium', name: '中度', desc: '重组句式，调整节奏', instruction: '中度改写：重新组织句式和叙事节奏，可以调整段落顺序，但保留原文的全部关键信息。' },
  { id: 'heavy', name: '重度', desc: '完全重写，仅保留核心信息', instruction: '重度改写：完全推倒重写，只保留核心信息点，用全新的结构、视角和表达方式呈现。' },
]

// 语气选项
const TONE_OPTIONS = [
  { id: 'warm', name: '温暖亲切', instruction: '语气温暖亲切，像和老朋友聊天。' },
  { id: 'pro', name: '专业权威', instruction: '语气专业权威，沉稳可信。' },
  { id: 'passion', name: '激情有力', instruction: '语气激情有力，富有感染力。' },
  { id: 'calm', name: '平和舒缓', instruction: '语气平和舒缓，娓娓道来。' },
  { id: 'fun', name: '活泼有趣', instruction: '语气活泼有趣，轻松幽默。' },
]

// 解析 AI 返回（约定【标题候选】【改写正文】【话题标签】分隔符），失败返回 null 由调用方整体展示
const parseRewriteResult = (text) => {
  if (!text) return null
  const clean = text.replace(/```[a-zA-Z]*\n?/g, '').replace(/```/g, '').trim()
  const titlesMatch = clean.match(/【标题候选】([\s\S]*?)(?=【改写正文】)/)
  const bodyMatch = clean.match(/【改写正文】([\s\S]*?)(?=【话题标签】|$)/)
  const tagsMatch = clean.match(/【话题标签】([\s\S]*)$/)
  if (!titlesMatch && !bodyMatch) return null

  const titles = titlesMatch
    ? titlesMatch[1]
        .split('\n')
        .map((l) => l.replace(/^\s*(?:[-*·•]|\d+[.、)）])\s*/, '').trim())
        .filter(Boolean)
        .slice(0, 3)
    : []
  const body = bodyMatch ? bodyMatch[1].trim() : ''
  const tags = tagsMatch
    ? (tagsMatch[1].match(/#[^\s#，,。]+/g) || []).map((t) => t.trim()).slice(0, 8)
    : []
  if (!body && !titles.length) return null
  return { titles, body, tags, raw: clean }
}

export default function AIRewrite() {
  const navigate = useNavigate()
  const [sourceText, setSourceText] = useState('')
  const [styleId, setStyleId] = useState('seeding')
  const [strength, setStrength] = useState('medium')
  const [tone, setTone] = useState('warm')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [rewriting, setRewriting] = useState(false)
  const [error, setError] = useState('')
  // result: { parsed, titles, selTitle, body, tagsText, raw }
  const [result, setResult] = useState(null)
  const [copiedKey, setCopiedKey] = useState('')
  const [saveState, setSaveState] = useState('idle') // idle | saved
  const [history, setHistory] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const copyTimerRef = useRef(null)

  // 真实历史记录：kind = '改写' 的文案，订阅实时刷新
  useEffect(() => {
    const load = () => setHistory(getScripts().filter((s) => s.kind === '改写'))
    load()
    const off = on('scripts', load)
    return () => {
      off()
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    }
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
      setError('复制失败，请检查浏览器剪贴板权限')
    }
  }

  const buildFullText = () => {
    if (!result) return ''
    if (!result.parsed) return result.raw
    const tagLine = result.tagsText.trim()
    return `${result.selTitle ? result.selTitle + '\n\n' : ''}${result.body}${tagLine ? `\n\n${tagLine}` : ''}`
  }

  const handleRewrite = async () => {
    const text = sourceText.trim()
    if (!text || rewriting) return
    setRewriting(true)
    setError('')
    setResult(null)
    setSaveState('idle')

    const style = REWRITE_STYLES.find((s) => s.id === styleId)
    const strengthOpt = STRENGTH_OPTIONS.find((s) => s.id === strength)
    const toneOpt = TONE_OPTIONS.find((t) => t.id === tone)
    const task = createTask({ title: `AI改写：${text.slice(0, 20)}${text.length > 20 ? '…' : ''}`, type: 'AI改写', module: 'rewrite' })

    try {
      const system = `${style.system}\n${toneOpt.instruction}\n${strengthOpt.instruction}`
      const prompt = `请把下面的短视频文案按系统设定的人设风格改写，并严格按以下格式输出（不要输出任何额外说明，不要使用代码块）：
【标题候选】
1. （改写后的标题一）
2. （改写后的标题二）
3. （改写后的标题三）
【改写正文】
（改写后的正文全文）
【话题标签】
（5-8 个 #话题 标签，空格分隔）

原文如下：
${text}`

      const raw = await generateText(prompt, { system })
      const parsed = parseRewriteResult(raw)
      if (parsed) {
        setResult({
          parsed: true,
          titles: parsed.titles,
          selTitle: parsed.titles[0] || '',
          body: parsed.body,
          tagsText: parsed.tags.join(' '),
          raw: parsed.raw,
        })
      } else {
        // 解析失败：整体展示 AI 原文
        setResult({ parsed: false, titles: [], selTitle: '', body: raw, tagsText: '', raw })
      }
      updateTask(task.id, { status: 'completed', progress: 100, finishedAt: Date.now() })
    } catch (err) {
      setError(err.message || 'AI 改写失败，请稍后重试')
      updateTask(task.id, { status: 'failed', progress: 0, error: err.message || '改写失败', finishedAt: Date.now() })
    } finally {
      setRewriting(false)
    }
  }

  const handleSave = () => {
    if (!result || saveState === 'saved') return
    const content = buildFullText().trim()
    if (!content) return
    const title =
      (result.parsed && result.selTitle.trim()) ||
      content.split('\n').find((l) => l.trim())?.trim().slice(0, 40) ||
      '改写文案'
    saveScript({
      title,
      content,
      tags: result.parsed ? result.tagsText.trim() : '',
      source: `AI改写 · ${REWRITE_STYLES.find((s) => s.id === styleId)?.name || ''}`,
      kind: '改写',
    })
    setSaveState('saved')
  }

  const currentStyle = REWRITE_STYLES.find((s) => s.id === styleId)
  const currentStrength = STRENGTH_OPTIONS.find((s) => s.id === strength)
  const currentTone = TONE_OPTIONS.find((t) => t.id === tone)

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <Icons.Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">AI改写定风格</h1>
        </div>
        <p className="text-sm text-dark-400 ml-10">
          输入原文，AI 实时改写成你的人设语气，自动生成新标题与话题，避免同质化
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：原文输入区 */}
        <div className="glass-card rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icons.FileText className="w-5 h-5 text-dark-400" />
              <h2 className="text-base font-semibold text-white">原文</h2>
            </div>
            <span className="text-xs text-dark-500">{sourceText.length} 字</span>
          </div>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            rows={14}
            placeholder="粘贴或输入需要改写的短视频文案（可从「文案提取」页面提取后复制过来）..."
            className="flex-1 w-full bg-dark-950/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all resize-none leading-relaxed"
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-dark-500">原文越完整，改写效果越好</p>
            {sourceText && (
              <button
                onClick={() => setSourceText('')}
                className="text-xs text-dark-400 hover:text-white transition-colors"
              >
                清空
              </button>
            )}
          </div>
        </div>

        {/* 右侧：改写结果区 */}
        <div className="glass-card rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icons.Wand2 className="w-5 h-5 text-brand-400" />
              <h2 className="text-base font-semibold text-white">改写结果</h2>
            </div>
            {result && !rewriting && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => doCopy(buildFullText(), 'result')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-dark-300 hover:text-white hover:bg-white/10 transition-all"
                >
                  {copiedKey === 'result' ? <Icons.Check className="w-3.5 h-3.5 text-emerald-400" /> : <Icons.Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'result' ? '已复制' : '复制'}
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
            )}
          </div>

          {/* 真实请求中状态 */}
          {rewriting && (
            <div className="flex-1 flex flex-col items-center justify-center py-16">
              <Icons.Loader2 className="w-8 h-8 text-brand-400 animate-spin mb-3" />
              <p className="text-sm text-dark-400">AI 正在改写中...</p>
              <p className="text-xs text-dark-500 mt-1">
                {currentStyle?.name} · {currentStrength?.name}改写 · {currentTone?.name}
              </p>
            </div>
          )}

          {/* 错误提示 */}
          {!rewriting && error && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-3">
                <Icons.AlertCircle className="w-6 h-6 text-rose-400" />
              </div>
              <p className="text-sm text-rose-300 mb-1">改写失败</p>
              <p className="text-xs text-dark-500 max-w-xs">{error}</p>
              <button
                onClick={handleRewrite}
                className="mt-4 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-dark-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5"
              >
                <Icons.RefreshCw className="w-3.5 h-3.5" />
                重试
              </button>
            </div>
          )}

          {/* 结果（可编辑） */}
          {!rewriting && !error && result && (
            <div className="space-y-4 flex-1 animate-fade-in">
              {result.parsed ? (
                <>
                  <div>
                    <div className="text-xs text-brand-400 mb-1.5 flex items-center gap-1">
                      <Icons.Sparkles className="w-3.5 h-3.5" />
                      新标题（点击候选可切换，可直接编辑）
                    </div>
                    <input
                      value={result.selTitle}
                      onChange={(e) => setResult({ ...result, selTitle: e.target.value })}
                      placeholder="标题"
                      className="w-full bg-dark-900/80 border border-white/10 rounded-xl px-3 py-2.5 text-sm font-semibold text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 transition-all"
                    />
                    {result.titles.length > 0 && (
                      <div className="flex flex-col gap-1.5 mt-2">
                        {result.titles.map((t, idx) => (
                          <button
                            key={idx}
                            onClick={() => setResult({ ...result, selTitle: t })}
                            className={`text-left px-3 py-2 rounded-lg text-xs border transition-all ${
                              result.selTitle === t
                                ? 'bg-brand-500/10 border-brand-500/40 text-brand-300'
                                : 'bg-dark-900/50 border-white/5 text-dark-400 hover:text-white'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-dark-400 mb-1.5">新正文（可直接编辑）</div>
                    <textarea
                      value={result.body}
                      onChange={(e) => setResult({ ...result, body: e.target.value })}
                      rows={9}
                      className="w-full bg-dark-950/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-dark-200 focus:outline-none focus:border-brand-500 transition-all resize-none leading-relaxed"
                    />
                  </div>
                  <div>
                    <div className="text-xs text-dark-400 mb-1.5 flex items-center gap-1">
                      <Icons.Hash className="w-3.5 h-3.5" />
                      新话题标签（空格分隔，可直接编辑）
                    </div>
                    <input
                      value={result.tagsText}
                      onChange={(e) => setResult({ ...result, tagsText: e.target.value })}
                      placeholder="#话题1 #话题2"
                      className="w-full bg-dark-900/80 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-brand-300 placeholder-dark-500 focus:outline-none focus:border-brand-500 transition-all"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <div className="text-xs text-amber-400 mb-1.5 flex items-center gap-1">
                    <Icons.AlertCircle className="w-3.5 h-3.5" />
                    AI 未按约定格式返回，已整体展示（可直接编辑）
                  </div>
                  <textarea
                    value={result.raw}
                    onChange={(e) => setResult({ ...result, raw: e.target.value })}
                    rows={16}
                    className="w-full bg-dark-950/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-dark-200 focus:outline-none focus:border-brand-500 transition-all resize-none leading-relaxed"
                  />
                </div>
              )}
            </div>
          )}

          {/* 空状态 */}
          {!rewriting && !error && !result && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-dark-800 flex items-center justify-center mb-3">
                <Icons.Wand2 className="w-6 h-6 text-dark-500" />
              </div>
              <p className="text-sm text-dark-400 mb-1">还没有改写结果</p>
              <p className="text-xs text-dark-500">输入原文、选择风格后点击「一键AI改写」</p>
            </div>
          )}
        </div>
      </div>

      {/* 中间控制区 */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Icons.Sliders className="w-5 h-5 text-brand-400" />
          <h2 className="text-base font-semibold text-white">改写控制台</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 人设风格选择 */}
          <div>
            <label className="block text-xs text-dark-400 mb-2 font-medium">改写风格</label>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full bg-dark-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white flex items-center justify-between hover:border-brand-500/40 transition-all"
              >
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-xs">
                    {currentStyle?.name[0]}
                  </span>
                  <span>{currentStyle?.name}</span>
                </span>
                <Icons.ChevronDown className={`w-4 h-4 text-dark-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {dropdownOpen && (
                <div className="absolute z-20 top-full mt-1.5 w-full bg-dark-900 border border-white/10 rounded-xl py-1 shadow-2xl max-h-60 overflow-y-auto">
                  {REWRITE_STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setStyleId(s.id); setDropdownOpen(false) }}
                      className={`w-full px-4 py-2.5 text-left hover:bg-white/5 transition-colors flex items-center justify-between ${
                        styleId === s.id ? 'bg-brand-500/10' : ''
                      }`}
                    >
                      <div>
                        <div className="text-sm text-white">{s.name}</div>
                        <div className="text-xs text-dark-500">{s.desc}</div>
                      </div>
                      {styleId === s.id && <Icons.Check className="w-4 h-4 text-brand-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 改写力度滑块 */}
          <div>
            <label className="block text-xs text-dark-400 mb-2 font-medium">
              改写力度：<span className="text-brand-400">{currentStrength?.name}</span>
            </label>
            <div className="bg-dark-900/80 border border-white/10 rounded-xl px-4 py-3.5">
              <input
                type="range"
                min="0"
                max="2"
                step="1"
                value={STRENGTH_OPTIONS.findIndex((s) => s.id === strength)}
                onChange={(e) => setStrength(STRENGTH_OPTIONS[parseInt(e.target.value)].id)}
                className="w-full"
              />
              <div className="flex justify-between mt-2">
                {STRENGTH_OPTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStrength(s.id)}
                    className={`text-xs transition-colors ${strength === s.id ? 'text-brand-400 font-medium' : 'text-dark-500'}`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
              <div className="text-xs text-dark-500 mt-1">{currentStrength?.desc}</div>
            </div>
          </div>

          {/* 语气选择 */}
          <div>
            <label className="block text-xs text-dark-400 mb-2 font-medium">语气</label>
            <div className="flex flex-wrap gap-1.5">
              {TONE_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                    tone === t.id
                      ? 'bg-brand-500/15 border-brand-500/40 text-brand-300'
                      : 'bg-dark-900/50 border-white/5 text-dark-400 hover:text-white'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-between mt-6 pt-5 border-t border-white/5">
          <div className="text-xs text-dark-400">
            当前配置：<span className="text-dark-200">{currentStyle?.name}</span> · <span className="text-dark-200">{currentStrength?.name}</span>改写 · <span className="text-dark-200">{currentTone?.name}</span>
          </div>
          <div className="flex items-center gap-3">
            {result && !rewriting && (
              <button
                onClick={handleRewrite}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-dark-300 text-sm hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <Icons.RefreshCw className="w-4 h-4" />
                重新改写
              </button>
            )}
            <button
              onClick={handleRewrite}
              disabled={rewriting || !sourceText.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {rewriting ? (
                <>
                  <Icons.Loader2 className="w-4 h-4 animate-spin" />
                  改写中...
                </>
              ) : (
                <>
                  <Icons.Wand2 className="w-4 h-4" />
                  一键AI改写
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 下一步按钮 */}
      {result && !rewriting && (
        <div className="flex items-center justify-end">
          <button
            onClick={() => navigate('/dashboard/voice')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-brand-500/30 transition-all"
          >
            进入下一步：声音合成
            <Icons.ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 历史记录（真实数据） */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icons.History className="w-5 h-5 text-brand-400" />
            <h2 className="text-base font-semibold text-white">改写历史</h2>
          </div>
          {history.length > 0 && <span className="text-xs text-dark-500">共 {history.length} 条</span>}
        </div>

        {history.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-dark-800 flex items-center justify-center mb-3">
              <Icons.FileText className="w-5 h-5 text-dark-500" />
            </div>
            <p className="text-sm text-dark-400 mb-1">暂无改写记录</p>
            <p className="text-xs text-dark-500">生成结果后点击「保存文案」，即可在这里随时查看和复用</p>
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
                        <span className="text-sm font-medium text-white truncate">{item.title || '改写文案'}</span>
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
