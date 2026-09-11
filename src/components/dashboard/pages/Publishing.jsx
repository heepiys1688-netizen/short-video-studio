import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { PLATFORMS } from '../../../data/constants'
import { getWorks, createTask, updateTask, on, timeAgo, formatSize } from '../../../services/store'
import { generateText } from '../../../services/aiApi'
import { downloadVideo } from '../../../services/videoApi'

// 各平台创作者中心地址（新标签打开，前往上传）
const PLATFORM_LINKS = {
  douyin: 'https://creator.douyin.com',
  xiaohongshu: 'https://creator.xiaohongshu.com',
  shipinhao: 'https://channels.weixin.qq.com',
  kuaishou: 'https://cp.kuaishou.com',
}

// 各平台文案风格要求（写入 AI 提示词）
const PLATFORM_STYLE = {
  douyin: '抖音风格：标题短平快有冲击力，口语化、带悬念或冲突感；正文 2-4 行，节奏快；话题标签 3-5 个。',
  xiaohongshu: '小红书风格：标题突出干货/种草感，可带 emoji；正文像朋友真诚分享，可分 2-3 段；话题标签 5-8 个。',
  shipinhao: '视频号风格：标题稳重专业、突出价值点；正文条理清晰、信息密度高；话题标签 3-5 个。',
  kuaishou: '快手风格：标题接地气、老铁口吻；正文直白真诚、不端着；话题标签 3-5 个。',
}

// 推断视频扩展名
const extOfWork = (work) => {
  const fromName = work.name?.includes('.') ? work.name.split('.').pop() : ''
  if (fromName && fromName.length <= 5) return fromName.toLowerCase()
  const mime = work.blob?.type || ''
  if (mime.includes('webm')) return 'webm'
  if (mime.includes('mp4')) return 'mp4'
  return 'mp4'
}

export default function Publishing() {
  const navigate = useNavigate()
  const [works, setWorks] = useState([])
  const [selectedWorkId, setSelectedWorkId] = useState(null)
  const [selectedPlatforms, setSelectedPlatforms] = useState(['douyin'])
  const [copies, setCopies] = useState({}) // { platformId: 文案文本 }
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [recordedPlatforms, setRecordedPlatforms] = useState({}) // { platformId: true }

  // 加载真实成片
  const refresh = useCallback(async () => {
    try {
      const list = await getWorks('video')
      setWorks(list)
      setSelectedWorkId((prev) => (prev && list.some((w) => w.id === prev) ? prev : list[0]?.id || null))
    } catch { /* 忽略读取失败 */ }
  }, [])

  useEffect(() => {
    refresh()
    // 订阅作品变化，实时刷新成片列表
    const off = on('works', refresh)
    return off
  }, [refresh])

  const currentWork = works.find((w) => w.id === selectedWorkId) || null
  const canShare = typeof navigator !== 'undefined' && !!navigator.share

  // 平台多选
  const togglePlatform = (id) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    )
  }

  // AI 生成发布文案（每个选中平台一次真实调用，提示词说明平台风格差异）
  const handleGenerate = async () => {
    if (!currentWork || selectedPlatforms.length === 0 || generating) return
    setGenerating(true)
    setGenError('')
    try {
      const results = await Promise.all(
        selectedPlatforms.map(async (pid) => {
          const platform = PLATFORMS.find((p) => p.id === pid)
          const prompt = [
            `请为一条短视频生成发布到「${platform.name}」的发布文案。`,
            ``,
            `视频名称：${currentWork.name}`,
            currentWork.meta?.prompt ? `视频创作主题：${currentWork.meta.prompt}` : '',
            ``,
            `平台风格要求（务必贴合）：${PLATFORM_STYLE[pid]}`,
            ``,
            `严格按以下格式输出（不要输出任何额外说明）：`,
            `标题：一行标题`,
            `正文：`,
            `正文内容`,
            `话题：#标签1 #标签2 #标签3`,
          ].filter(Boolean).join('\n')
          const text = await generateText(prompt)
          return [pid, text]
        }),
      )
      setCopies((prev) => ({ ...prev, ...Object.fromEntries(results) }))
    } catch (err) {
      setGenError(err.message || 'AI 文案生成失败，请稍后重试')
    } finally {
      setGenerating(false)
    }
  }

  // 复制文案（带打勾反馈）
  const handleCopy = async (pid) => {
    const text = copies[pid]
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(pid)
      setTimeout(() => setCopiedId((prev) => (prev === pid ? null : prev)), 2000)
    } catch {
      setGenError('复制失败，请检查浏览器剪贴板权限')
    }
  }

  // 下载视频
  const handleDownload = () => {
    if (!currentWork) return
    const baseName = currentWork.name?.includes('.') ? currentWork.name.replace(/\.[^.]+$/, '') : currentWork.name
    downloadVideo(currentWork.url, baseName || 'ai-video', extOfWork(currentWork))
  }

  // 打开平台创作者中心（新标签）
  const handleOpenPlatform = (pid) => {
    const url = PLATFORM_LINKS[pid]
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  // 系统分享（浏览器支持时）
  const handleShare = async (pid) => {
    if (!canShare) return
    try {
      await navigator.share({
        title: currentWork?.name || 'AI 生成视频',
        text: copies[pid] || currentWork?.name || '',
      })
    } catch { /* 用户取消分享等情况忽略 */ }
  }

  // 记录发布：写入任务中心并立即标记完成
  const handleRecord = (pid) => {
    if (!currentWork) return
    const platform = PLATFORMS.find((p) => p.id === pid)
    const task = createTask({
      title: `发布「${currentWork.name}」到${platform.name}`,
      type: '发布',
      module: '多平台发布',
    })
    updateTask(task.id, {
      status: 'completed',
      progress: 100,
      finishedAt: Date.now(),
      workId: currentWork.id,
    })
    setRecordedPlatforms((prev) => ({ ...prev, [pid]: true }))
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <Icons.Share2 className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">发布助手</h1>
        </div>
        <p className="text-sm text-dark-400 ml-10">
          下载发布包 → 前往平台上传。AI 为每个平台生成差异化文案，一键复制带走
        </p>
      </div>

      {/* 成片选择（真实作品） */}
      <div>
        <h2 className="text-base font-semibold text-white mb-3">选择要发布的成片</h2>
        {works.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {works.map((work) => (
              <button
                key={work.id}
                onClick={() => setSelectedWorkId(work.id)}
                className={`glass-card rounded-2xl p-4 text-left transition-all ${
                  selectedWorkId === work.id ? 'border-brand-500/40 ring-1 ring-brand-500/20' : 'hover:border-white/15'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-dark-900 flex-shrink-0 relative">
                    <video src={work.url} muted preload="metadata" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white line-clamp-2 mb-1">{work.name}</div>
                    <div className="text-xs text-dark-400">
                      {formatSize(work.size)} · {timeAgo(work.createdAt)}
                    </div>
                    {work.meta?.module && (
                      <div className="text-xs text-dark-500 mt-0.5">来源：{work.meta.module}</div>
                    )}
                  </div>
                  {selectedWorkId === work.id && (
                    <Icons.Check className="w-4 h-4 text-brand-400 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* 空状态：引导去生成 */
          <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-dark-800 flex items-center justify-center mb-3">
              <Icons.Clapperboard className="w-6 h-6 text-dark-500" />
            </div>
            <p className="text-sm text-dark-400 mb-1">还没有可发布的成片</p>
            <p className="text-xs text-dark-500 mb-4">先用「文生视频」或「图生视频」生成一条成片，再回来发布</p>
            <button
              onClick={() => navigate('/dashboard/text-to-video')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-xs font-semibold flex items-center gap-1.5 hover:shadow-lg hover:shadow-brand-500/30 transition-all"
            >
              <Icons.Wand2 className="w-3.5 h-3.5" />
              去生成成片
            </button>
          </div>
        )}
      </div>

      {currentWork && (
        <>
          {/* 平台多选 + AI 生成 */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-base font-semibold text-white">选择发布平台（可多选）</h2>
              <button
                onClick={handleGenerate}
                disabled={generating || selectedPlatforms.length === 0}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-40"
              >
                {generating ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.Sparkles className="w-4 h-4" />}
                {generating ? 'AI 生成中...' : 'AI 生成发布文案'}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PLATFORMS.map((platform) => {
                const selected = selectedPlatforms.includes(platform.id)
                return (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`rounded-xl border p-3 flex items-center gap-2.5 transition-all ${
                      selected
                        ? 'border-brand-500/40 bg-brand-500/10'
                        : 'border-white/5 bg-dark-900/50 hover:border-white/15'
                    }`}
                  >
                    <span className="text-xl">{platform.icon}</span>
                    <span className={`text-sm font-medium flex-1 text-left ${selected ? 'text-white' : 'text-dark-300'}`}>
                      {platform.name}
                    </span>
                    <span className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                      selected ? 'bg-brand-500 border-brand-500' : 'border-dark-600'
                    }`}>
                      {selected && <Icons.Check className="w-3 h-3 text-white" />}
                    </span>
                  </button>
                )
              })}
            </div>
            {genError && (
              <div className="mt-3 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <Icons.AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {genError}
              </div>
            )}
            <p className="text-xs text-dark-500 mt-3">
              说明：平台未开放网页直发接口，流程为「下载视频 + 复制文案 → 打开平台创作者中心上传」，发布结果可一键记录到任务中心。
            </p>
          </div>

          {/* 各平台发布卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedPlatforms.map((pid) => {
              const platform = PLATFORMS.find((p) => p.id === pid)
              const copy = copies[pid] || ''
              const copied = copiedId === pid
              const recorded = !!recordedPlatforms[pid]
              return (
                <div key={pid} className="glass-card rounded-2xl p-5 flex flex-col">
                  {/* 平台头部 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{platform.icon}</span>
                      <span className="text-sm font-semibold text-white">{platform.name}</span>
                    </div>
                    {recorded && (
                      <span className="px-2 py-0.5 rounded-md text-xs border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1">
                        <Icons.CheckCircle2 className="w-3 h-3" />
                        已记录
                      </span>
                    )}
                  </div>

                  {/* 文案编辑区 */}
                  <div className="flex-1 mb-4">
                    <label className="text-xs text-dark-400 mb-1.5 flex items-center gap-1">
                      <Icons.FileText className="w-3 h-3" />
                      发布文案（可编辑）
                    </label>
                    <textarea
                      value={copy}
                      onChange={(e) => setCopies((prev) => ({ ...prev, [pid]: e.target.value }))}
                      placeholder={generating ? 'AI 正在生成文案...' : '点击上方「AI 生成发布文案」，或手动输入标题 / 正文 / 话题标签'}
                      rows={7}
                      className="w-full bg-dark-900/80 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all resize-y leading-relaxed"
                    />
                  </div>

                  {/* 操作按钮组 */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleCopy(pid)}
                      disabled={!copy}
                      className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all disabled:opacity-40 ${
                        copied
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                      }`}
                    >
                      {copied ? <Icons.Check className="w-3.5 h-3.5" /> : <Icons.Copy className="w-3.5 h-3.5" />}
                      {copied ? '已复制' : '复制文案'}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-white/10 transition-all"
                    >
                      <Icons.Download className="w-3.5 h-3.5" />
                      下载视频
                    </button>
                    <button
                      onClick={() => handleOpenPlatform(pid)}
                      className="py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-white/10 transition-all"
                    >
                      <Icons.ExternalLink className="w-3.5 h-3.5" />
                      打开平台
                    </button>
                    {canShare ? (
                      <button
                        onClick={() => handleShare(pid)}
                        className="py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-white/10 transition-all"
                      >
                        <Icons.Share className="w-3.5 h-3.5" />
                        系统分享
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRecord(pid)}
                        disabled={recorded}
                        className="py-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-50"
                      >
                        <Icons.Send className="w-3.5 h-3.5" />
                        {recorded ? '已记录' : '记录发布'}
                      </button>
                    )}
                  </div>
                  {canShare && (
                    <button
                      onClick={() => handleRecord(pid)}
                      disabled={recorded}
                      className="mt-2 w-full py-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-50"
                    >
                      <Icons.Send className="w-3.5 h-3.5" />
                      {recorded ? '已记录到任务中心' : '记录发布'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {selectedPlatforms.length === 0 && (
            <div className="glass-card rounded-2xl p-10 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-xl bg-dark-800 flex items-center justify-center mb-3">
                <Icons.Share2 className="w-5 h-5 text-dark-500" />
              </div>
              <p className="text-sm text-dark-400">请先勾选至少一个发布平台</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
