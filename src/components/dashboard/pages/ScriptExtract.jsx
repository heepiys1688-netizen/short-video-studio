import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link2, Sparkles, Hash, Copy, Check, FileText, Loader2, ArrowRight } from 'lucide-react'
import { PLATFORMS } from '../../../data/constants'

// 模拟提取结果
const MOCK_RESULT = {
  title: '夏天防晒别只知道涂脸！这3个部位漏了等于白涂',
  body: `姐妹们听我说，夏天防晒真的不只是涂脸就够了！
很多人涂防晒只涂脸，结果脖子、手背、耳朵后面全晒黑了，真的太亏了！
今天给大家总结了防晒最容易被忽略的3个关键部位：

第一：耳后。这个地方超容易被忽略，但紫外线直射特别严重。
第二：手背。手背皮肤薄，晒老了长斑很难逆转。
第三：脚背。穿凉鞋一定要涂，不然黑白分明太尴尬了。

另外防晒量一定要够，脸至少一元硬币大小，出门前20分钟涂好，每2小时补涂一次。
防晒不是选最贵的，是选最适合自己肤质的，油皮选清爽型，干皮选滋润型。
做好这些，整个夏天白到发光！`,
  hashtags: ['#防晒', '#夏日护肤', '#美白', '#防晒误区', '#护肤干货', '#变美日记'],
  author: '护肤小课堂',
  platform: 'xiaohongshu',
  duration: '00:45',
}

export default function ScriptExtract() {
  const navigate = useNavigate()
  const [link, setLink] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [extracting, setExtracting] = useState(false)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleExtract = () => {
    if (!link.trim()) return
    setExtracting(true)
    setResult(null)
    // 模拟提取过程
    setTimeout(() => {
      setResult(MOCK_RESULT)
      setExtracting(false)
    }, 1500)
  }

  const handleCopy = () => {
    if (!result) return
    const fullText = `${result.title}\n\n${result.body}\n\n${result.hashtags.join(' ')}`
    navigator.clipboard?.writeText(fullText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleNext = () => {
    navigate('/dashboard/rewrite')
  }

  const handlePlatformClick = (platformId) => {
    setSelectedPlatform(platformId)
    // 自动填充示例链接
    const sampleLinks = {
      douyin: 'https://www.douyin.com/video/7345678901234567890',
      xiaohongshu: 'https://www.xiaohongshu.com/explore/6789abcdef0123456789',
      shipinhao: 'https://channels.weixin.qq.com/share/video/1234567890',
      kuaishou: 'https://www.kuaishou.com/short-video/3xw8yz0abcdefg',
    }
    setLink(sampleLinks[platformId] || '')
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <Link2 className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">提取原片文案</h1>
        </div>
        <p className="text-sm text-dark-400 ml-10">
          粘贴抖音/小红书/视频号/快手视频链接，系统自动识别并完整抽出原片文案
        </p>
      </div>

      {/* 输入区 */}
      <div className="glass-card rounded-2xl p-6 space-y-5">
        {/* 平台选择标签 */}
        <div>
          <label className="block text-xs text-dark-400 mb-3 font-medium">选择平台</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handlePlatformClick(platform.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all flex items-center gap-2 ${
                  selectedPlatform === platform.id
                    ? 'bg-white/10 border-brand-500/50 text-white'
                    : 'bg-dark-900/50 border-white/5 text-dark-400 hover:text-white hover:border-white/10'
                }`}
              >
                <span className="text-base">{platform.icon}</span>
                {platform.name}
              </button>
            ))}
          </div>
        </div>

        {/* 链接输入框 */}
        <div>
          <label className="block text-xs text-dark-400 mb-3 font-medium">视频链接</label>
          <textarea
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="在此粘贴视频链接，例如：https://www.douyin.com/video/..."
            rows={3}
            className="w-full bg-dark-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all resize-none"
          />
        </div>

        {/* 提取按钮 */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExtract}
            disabled={!link.trim() || extracting}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {extracting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                正在提取...
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                开始提取
              </>
            )}
          </button>
          {link.trim() && !extracting && (
            <button
              onClick={() => { setLink(''); setResult(null); setSelectedPlatform(null) }}
              className="px-4 py-3 rounded-xl bg-dark-900/50 border border-white/10 text-dark-400 text-sm hover:text-white transition-all"
            >
              清空
            </button>
          )}
        </div>
      </div>

      {/* 提取结果区 */}
      {extracting && (
        <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-brand-400 animate-spin mb-4" />
          <p className="text-sm text-dark-400">正在解析视频并提取文案...</p>
        </div>
      )}

      {result && !extracting && (
        <div className="glass-card rounded-2xl p-6 space-y-5 animate-fade-in">
          {/* 结果头部 */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-400" />
              <h2 className="text-base font-semibold text-white">提取结果</h2>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">
                提取成功
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-dark-300 hover:text-white hover:bg-white/10 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? '已复制' : '复制全部'}
            </button>
          </div>

          {/* 标题 */}
          <div>
            <div className="text-xs text-dark-400 mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              标题
            </div>
            <p className="text-base font-semibold text-white leading-relaxed">{result.title}</p>
          </div>

          {/* 正文 */}
          <div>
            <div className="text-xs text-dark-400 mb-2">正文内容</div>
            <div className="bg-dark-950/60 rounded-xl p-4 border border-white/5">
              <pre className="text-sm text-dark-200 whitespace-pre-wrap leading-relaxed font-sans">
                {result.body}
              </pre>
            </div>
          </div>

          {/* 话题标签 */}
          <div>
            <div className="text-xs text-dark-400 mb-2 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5" />
              话题标签
            </div>
            <div className="flex flex-wrap gap-2">
              {result.hashtags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg bg-brand-500/10 text-brand-300 text-xs border border-brand-500/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* 元信息 */}
          <div className="flex items-center gap-4 text-xs text-dark-400 border-t border-white/5 pt-4">
            <span>作者：{result.author}</span>
            <span>·</span>
            <span>时长：{result.duration}</span>
            <span>·</span>
            <span>来源：{PLATFORMS.find((p) => p.id === result.platform)?.name}</span>
          </div>

          {/* 下一步按钮 */}
          <div className="flex items-center justify-end pt-2">
            <button
              onClick={handleNext}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-brand-500/30 transition-all"
            >
              进入下一步：AI改写
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 空状态提示 */}
      {!result && !extracting && (
        <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-dark-800 flex items-center justify-center mb-4">
            <Link2 className="w-7 h-7 text-dark-500" />
          </div>
          <p className="text-sm text-dark-400 mb-1">还没有提取结果</p>
          <p className="text-xs text-dark-500">粘贴视频链接后点击「开始提取」</p>
        </div>
      )}
    </div>
  )
}
