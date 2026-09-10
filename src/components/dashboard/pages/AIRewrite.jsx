import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Wand2,
  ChevronDown,
  Hash,
  FileText,
  ArrowRight,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  Sliders,
} from 'lucide-react'

// 人设风格选项
const PERSONA_STYLES = [
  { id: 'lecturer', name: '专业讲师', desc: '逻辑清晰、数据说话' },
  { id: 'lifestyle', name: '生活博主', desc: '亲切自然、生活感强' },
  { id: 'funny', name: '搞笑达人', desc: '幽默梗多、节奏欢快' },
  { id: 'knowledge', name: '知识科普', desc: '通俗易懂、干货满满' },
  { id: 'seeding', name: '种草达人', desc: '情绪饱满、安利感强' },
]

// 语气选项
const TONE_OPTIONS = [
  { id: 'warm', name: '温暖亲切' },
  { id: 'pro', name: '专业权威' },
  { id: 'passion', name: '激情有力' },
  { id: 'calm', name: '平和舒缓' },
  { id: 'fun', name: '活泼有趣' },
]

// 改写力度
const STRENGTH_OPTIONS = [
  { id: 'light', name: '轻度', desc: '保留原文结构，微调表述', value: 30 },
  { id: 'medium', name: '中度', desc: '重组句式，调整节奏', value: 60 },
  { id: 'heavy', name: '重度', desc: '完全重写，仅保留核心信息', value: 100 },
]

// 原文（模拟提取结果）
const ORIGINAL_TEXT = {
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
  hashtags: ['#防晒', '#夏日护肤', '#美白', '#防晒误区', '#护肤干货'],
}

// 模拟改写结果
const generateRewriteResult = (persona, strength, tone) => {
  const personaName = PERSONA_STYLES.find((p) => p.id === persona)?.name || ''
  const results = {
    lecturer: {
      title: '防晒科普｜90%的人涂防晒都漏了这3个部位，皮肤科医生告诉你为什么',
      body: `从皮肤科学角度来说，面部防晒覆盖率仅占人体暴露皮肤的不足30%。
临床数据表明，耳后、手背、脚背这三个部位的紫外线暴露量，是面部的1.5到3倍。

第一，耳后区域：该部位皮肤薄、皮脂腺少，UVB穿透率更高，是日光性皮炎高发区。
第二，手背：真皮层较薄，长期暴露易出现光老化性色素沉着，且难以逆转。
第三，脚背：夏季穿凉鞋时完全暴露，UV指数高时30分钟即可造成明显分界线。

补充用量标准：面部需2mg/cm²，约一元硬币大小；SPF需在出门前20分钟形成有效膜；户外每2小时补涂。
选择原则：油性肌肤选化学防晒（清爽型），干性肌肤选物理防晒（滋润型）。
遵循以上规范，可显著降低光老化风险。`,
      hashtags: ['#防晒科普', '#皮肤科学', '#光老化', '#防晒指南', '#护肤知识', '#健康科普'],
    },
    lifestyle: {
      title: '我踩了3年防晒坑才发现！这3个地方没涂等于白防晒了',
      body: `宝子们，我真的后悔没早点知道这个！
之前每年夏天脸涂得白白的，结果脖子以下黑了两个度，绝了！
今天必须把防晒最容易漏的3个地方告诉你们：

第一个就是耳后！平时真的完全想不起来，但每次照镜子发现耳后那条线超明显。
第二个手背，手是第二张脸啊姐妹们，手背长斑真的显老十岁。
第三个脚背，穿凉鞋不涂，脚上那个黑白印子，拍照片都尴尬。

还有涂防晒的量一定要够！脸要涂一元硬币那么大，出门前20分钟涂，每2小时补一次。
我之前就是因为舍不得涂，效果一直不好。油皮姐妹选清爽的，干皮选滋润的就行啦～
做好这些，今年夏天一起白到发光！`,
      hashtags: ['#防晒', '#夏日护肤', '#变美日记', '#美白日常', '#防晒干货', '#护肤分享'],
    },
    funny: {
      title: '防晒只涂脸？你脖子以下不配拥有姓名吗！',
      body: `家人们谁懂啊！涂防晒只涂脸是什么操作？
脖子以下全是黑皮，脸白得跟灯泡似的，走在路上像个人形反差色卡！

来来来，记住防晒必须涂的3个"隐形死角"：

耳朵后面：对，就是那个你从来想不起来的地方，结果晒完一条线明明白白。
手背：你的手也是要面子的人好吗！手背一长斑，年龄直接+10岁起步。
脚背：穿凉鞋不涂防晒，脚上黑白分明，拍张照一看，好家伙，脚趾头有自己的肤色分区。

防晒量！要！够！脸上一元硬币大小起步，别抠搜的。
出门前20分钟涂好，户外每2小时补一次，油皮选清爽干皮选滋润。
听话，涂全了，今年夏天你就是整条街最白的崽！`,
      hashtags: ['#防晒', '#夏日必看', '#搞笑护肤', '#防晒误区', '#变白攻略', '#护肤吐槽'],
    },
    knowledge: {
      title: '【硬核科普】防晒不止涂脸！3个常被忽略的关键部位及科学用量',
      body: `防晒的核心目标，是阻挡紫外线（UVA+UVB）对皮肤的光损伤。
大多数人只涂面部，却忽略了3个紫外线暴露量极高的部位：

1. 耳后：皮肤薄、皮脂腺少，紫外线穿透率高，是光损伤的高发区。
2. 手背：真皮层薄，长期暴露易产生不可逆的光老化色斑。
3. 脚背：穿凉鞋时完全暴露，短时间即可形成明显色差分界线。

科学用量：面部需2mg/cm²（约一元硬币大小），全身约30g。
使用时间：出门前20分钟涂抹成膜，户外每2小时补涂一次。
选品原则：油性肌肤→化学防晒（清爽型）；干性肌肤→物理防晒（滋润型）。

科学防晒，从全覆盖开始。`,
      hashtags: ['#防晒科普', '#光防护', '#护肤科学', '#防晒知识', '#健康护肤', '#紫外线防护'],
    },
    seeding: {
      title: '天哪！涂了这么多年防晒竟然白涂了？这3个地方你一定没涂！',
      body: `姐妹们！！我真的要尖叫了！！
之前一直觉得脸涂白就够了，结果照镜子一看，脖子以下黑了两个度！
今天必须给你们安利防晒最容易忽略的3个宝藏部位！涂全了真的白到发光！

第一个：耳后！天哪这个位置平时根本想不起来，但晒完一条线超级明显！
第二个：手背！手是第二张脸，手背一长斑瞬间显老，姐妹们一定要重视！
第三个：脚背！穿凉鞋不涂，脚上黑白分明拍照超尴尬！

还有用量超级重要！脸要涂一元硬币大小，别省！
出门前20分钟涂，每2小时补涂一次，油皮选清爽干皮选滋润。
按我说的来，今年夏天白到发光不是梦！冲冲冲！`,
      hashtags: ['#防晒安利', '#夏日必买', '#美白神器', '#防晒必看', '#护肤好物', '#变白攻略'],
    },
  }

  return results[persona] || results.lecturer
}

export default function AIRewrite() {
  const navigate = useNavigate()
  const [persona, setPersona] = useState('lifestyle')
  const [strength, setStrength] = useState('medium')
  const [tone, setTone] = useState('warm')
  const [rewriting, setRewriting] = useState(false)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleRewrite = () => {
    setRewriting(true)
    setResult(null)
    setTimeout(() => {
      const rewriteResult = generateRewriteResult(persona, strength, tone)
      setResult(rewriteResult)
      setRewriting(false)
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
    navigate('/dashboard/voice')
  }

  const currentPersona = PERSONA_STYLES.find((p) => p.id === persona)
  const currentStrength = STRENGTH_OPTIONS.find((s) => s.id === strength)

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">AI改写定风格</h1>
        </div>
        <p className="text-sm text-dark-400 ml-10">
          一键AI改写成你的人设语气，自动生成新标题与话题，避免同质化
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：原文显示区 */}
        <div className="glass-card rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-dark-400" />
              <h2 className="text-base font-semibold text-white">原片文案</h2>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-dark-800 text-dark-400 text-xs">原文</span>
          </div>

          <div className="space-y-4 flex-1">
            <div>
              <div className="text-xs text-dark-400 mb-1.5">原标题</div>
              <p className="text-sm font-medium text-dark-200 leading-relaxed">{ORIGINAL_TEXT.title}</p>
            </div>
            <div>
              <div className="text-xs text-dark-400 mb-1.5">原正文</div>
              <div className="bg-dark-950/60 rounded-xl p-4 border border-white/5 max-h-[320px] overflow-y-auto">
                <pre className="text-sm text-dark-300 whitespace-pre-wrap leading-relaxed font-sans">
                  {ORIGINAL_TEXT.body}
                </pre>
              </div>
            </div>
            <div>
              <div className="text-xs text-dark-400 mb-1.5">原话题标签</div>
              <div className="flex flex-wrap gap-1.5">
                {ORIGINAL_TEXT.hashtags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-dark-800 text-dark-400 text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：改写结果区 */}
        <div className="glass-card rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-brand-400" />
              <h2 className="text-base font-semibold text-white">改写结果</h2>
            </div>
            {result && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-dark-300 hover:text-white hover:bg-white/10 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '已复制' : '复制'}
              </button>
            )}
          </div>

          {rewriting && (
            <div className="flex-1 flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-brand-400 animate-spin mb-3" />
              <p className="text-sm text-dark-400">AI正在改写中...</p>
              <p className="text-xs text-dark-500 mt-1">
                {currentPersona?.name} · {currentStrength?.name}改写 · {TONE_OPTIONS.find((t) => t.id === tone)?.name}
              </p>
            </div>
          )}

          {!rewriting && result && (
            <div className="space-y-4 flex-1 animate-fade-in">
              <div>
                <div className="text-xs text-brand-400 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  新标题
                </div>
                <p className="text-sm font-semibold text-white leading-relaxed">{result.title}</p>
              </div>
              <div>
                <div className="text-xs text-dark-400 mb-1.5">新正文</div>
                <div className="bg-dark-950/60 rounded-xl p-4 border border-white/5 max-h-[280px] overflow-y-auto">
                  <pre className="text-sm text-dark-200 whitespace-pre-wrap leading-relaxed font-sans">
                    {result.body}
                  </pre>
                </div>
              </div>
              <div>
                <div className="text-xs text-dark-400 mb-1.5 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5" />
                  新话题标签
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.hashtags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-300 text-xs border border-brand-500/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!rewriting && !result && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-dark-800 flex items-center justify-center mb-3">
                <Wand2 className="w-6 h-6 text-dark-500" />
              </div>
              <p className="text-sm text-dark-400 mb-1">还没有改写结果</p>
              <p className="text-xs text-dark-500">选择人设风格后点击「一键AI改写」</p>
            </div>
          )}
        </div>
      </div>

      {/* 中间控制区 */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Sliders className="w-5 h-5 text-brand-400" />
          <h2 className="text-base font-semibold text-white">改写控制台</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 人设风格选择 */}
          <div>
            <label className="block text-xs text-dark-400 mb-2 font-medium">人设风格</label>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full bg-dark-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white flex items-center justify-between hover:border-brand-500/40 transition-all"
              >
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-xs">
                    {currentPersona?.name[0]}
                  </span>
                  <span>{currentPersona?.name}</span>
                </span>
                <ChevronDown className={`w-4 h-4 text-dark-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {dropdownOpen && (
                <div className="absolute z-20 top-full mt-1.5 w-full bg-dark-900 border border-white/10 rounded-xl py-1 shadow-2xl max-h-60 overflow-y-auto">
                  {PERSONA_STYLES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setPersona(p.id); setDropdownOpen(false) }}
                      className={`w-full px-4 py-2.5 text-left hover:bg-white/5 transition-colors flex items-center justify-between ${
                        persona === p.id ? 'bg-brand-500/10' : ''
                      }`}
                    >
                      <div>
                        <div className="text-sm text-white">{p.name}</div>
                        <div className="text-xs text-dark-500">{p.desc}</div>
                      </div>
                      {persona === p.id && <Check className="w-4 h-4 text-brand-400" />}
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
                {STRENGTH_OPTIONS.map((s, idx) => (
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
            当前配置：<span className="text-dark-200">{currentPersona?.name}</span> · <span className="text-dark-200">{currentStrength?.name}</span>改写 · <span className="text-dark-200">{TONE_OPTIONS.find((t) => t.id === tone)?.name}</span>
          </div>
          <div className="flex items-center gap-3">
            {result && (
              <button
                onClick={handleRewrite}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-dark-300 text-sm hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                重新改写
              </button>
            )}
            <button
              onClick={handleRewrite}
              disabled={rewriting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-50"
            >
              {rewriting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  改写中...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  一键AI改写
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 下一步按钮 */}
      {result && (
        <div className="flex items-center justify-end">
          <button
            onClick={handleNext}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-brand-500/30 transition-all"
          >
            进入下一步：声音合成
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
