import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { generateTextToVideo, generateLocalVideo, downloadVideo, hasApiKey, getApiKey, setApiKey } from '../../../services/videoApi'
import { saveWork, getWorks, deleteWork, createTask, updateTask, on, timeAgo } from '../../../services/store'

const VIDEO_STYLES = [
  { id: 'cinematic', name: '电影感', desc: ' cinematic lighting, film grain, shallow depth of field', color: 'from-amber-500 to-orange-600' },
  { id: 'anime', name: '动漫风', desc: 'anime style, vibrant colors, clean lines', color: 'from-pink-500 to-rose-500' },
  { id: 'realistic', name: '写实风', desc: 'photorealistic, hyper detailed, natural lighting', color: 'from-emerald-500 to-teal-500' },
  { id: '3d', name: '3D动画', desc: '3D render, Pixar style, soft lighting', color: 'from-blue-500 to-indigo-500' },
  { id: 'pixel', name: '像素风', desc: 'pixel art, retro game style, 8-bit', color: 'from-violet-500 to-purple-500' },
  { id: 'cyberpunk', name: '赛博朋克', desc: 'cyberpunk, neon lights, futuristic city', color: 'from-cyan-500 to-blue-600' },
]

const CAMERA_MOTIONS = [
  { id: 'static', name: '静止', icon: 'Square' },
  { id: 'push', name: '缓慢推进', icon: 'MoveRight' },
  { id: 'orbit', name: '环绕', icon: 'RotateCw' },
  { id: 'pan', name: '平移', icon: 'MoveHorizontal' },
  { id: 'zoom', name: '缩放', icon: 'Maximize2' },
  { id: 'drone', name: '航拍', icon: 'Plane' },
]

const RESOLUTIONS = [
  { id: '720p', name: '720p HD', width: 1280, height: 720 },
  { id: '1080p', name: '1080p Full HD', width: 1920, height: 1080 },
  { id: '4k', name: '4K Ultra HD', width: 3840, height: 2160 },
]

const DURATIONS = [5, 10, 15, 20, 25, 30]

export default function TextToVideo() {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('cinematic')
  const [selectedMotion, setSelectedMotion] = useState('push')
  const [duration, setDuration] = useState(10)
  const [resolution, setResolution] = useState('1080p')
  const [seed, setSeed] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedVideo, setGeneratedVideo] = useState(null)
  const [history, setHistory] = useState([])
  const [activeTab, setActiveTab] = useState('create')
  const fileInputRef = useRef(null)
  const [referenceImage, setReferenceImage] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef(null)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState(getApiKey())
  const [notice, setNotice] = useState('')

  const progressRef = useRef(null)

  // 加载真实生成历史
  const loadHistory = async () => {
    try {
      const works = await getWorks('video')
      setHistory(works.filter((w) => w.meta?.module === 'text-to-video'))
    } catch { /* ignore */ }
  }

  useEffect(() => { loadHistory() }, [])

  useEffect(() => on('works', loadHistory), [])

  // AI 请求期间进度条动画（真实请求，非假进度）
  const simulateProgress = () => {
    if (progressRef.current) clearInterval(progressRef.current)
    progressRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 92) return p
        return p + (p < 30 ? 2.5 : p < 60 ? 1.2 : p < 80 ? 0.5 : 0.15)
      })
    }, 400)
  }
  const stopSimulate = () => {
    if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    setProgress(0)
    setGeneratedVideo(null)
    setIsPlaying(false)
    setNotice('')

    // 构建完整提示词（包含风格和镜头运动）
    const styleObj = VIDEO_STYLES.find(s => s.id === selectedStyle)
    const motionObj = CAMERA_MOTIONS.find(m => m.id === selectedMotion)
    const fullPrompt = prompt + (styleObj?.desc || '') + (motionObj && motionObj.id !== 'static' ? `, ${motionObj.name} shot` : '')

    // 登记真实任务
    const task = createTask({ title: prompt.slice(0, 20), type: '文生视频', module: 'text-to-video' })
    const reportProgress = (p) => {
      setProgress(p)
      updateTask(task.id, { progress: p })
    }

    let result = null

    // 优先真实 AI（已配置 Pollinations Key）
    if (hasApiKey()) {
      simulateProgress()
      try {
        result = await generateTextToVideo({
          prompt: fullPrompt,
          negativePrompt,
          duration,
          aspectRatio: '16:9',
          resolution,
          seed: seed || undefined,
          referenceImage,
        })
      } catch (err) {
        console.warn('AI 生成失败，自动切换本地渲染:', err)
        setNotice(`AI 生成失败（${err.message}），已自动切换为本地渲染`)
      }
      stopSimulate()
    }

    // 本地渲染保底（无需 Key，必定出片）
    if (!result) {
      setProgress(0)
      try {
        result = await generateLocalVideo({
          mode: 'text',
          prompt,
          style: selectedStyle,
          motion: selectedMotion,
          duration,
          resolution,
          onProgress: reportProgress,
        })
      } catch (err) {
        console.error('生成失败:', err)
        updateTask(task.id, { status: 'failed', error: err.message, finishedAt: Date.now() })
        setIsGenerating(false)
        alert(`视频生成失败: ${err.message}`)
        return
      }
    }

    // 持久化到作品库
    let newVideo
    try {
      const work = await saveWork({
        type: 'video',
        name: `文生视频_${Date.now()}`,
        blob: result.blob,
        meta: {
          module: 'text-to-video',
          prompt,
          style: styleObj?.name || '电影感',
          duration: result.duration || duration,
          resolution,
          engine: result.engine,
          model: result.model,
          ext: result.ext || 'mp4',
        },
      })
      newVideo = {
        id: work.id,
        prompt,
        style: styleObj?.name || '电影感',
        duration: result.duration || duration,
        resolution,
        engine: result.engine,
        model: result.model,
        ext: result.ext || 'mp4',
        videoUrl: work.url,
      }
      updateTask(task.id, { status: 'completed', progress: 100, workId: work.id, finishedAt: Date.now() })
    } catch (err) {
      console.error('保存作品失败:', err)
      updateTask(task.id, { status: 'failed', error: `生成成功但保存失败: ${err.message}`, finishedAt: Date.now() })
      newVideo = {
        id: Date.now(),
        prompt,
        style: styleObj?.name || '电影感',
        duration: result.duration || duration,
        resolution,
        engine: result.engine,
        model: result.model,
        ext: result.ext || 'mp4',
        videoUrl: result.videoUrl,
      }
    }

    setProgress(100)
    setGeneratedVideo(newVideo)
    setIsGenerating(false)
  }

  const saveApiKey = () => {
    setApiKey(apiKeyInput.trim())
    setShowApiKeyModal(false)
  }

  useEffect(() => {
    return () => {
      if (progressRef.current) clearInterval(progressRef.current)
    }
  }, [])

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setReferenceImage(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (ev) => setReferenceImage(ev.target.result)
    reader.readAsDataURL(file)
  }

  const removeReferenceImage = () => {
    setReferenceImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Icons.Type className="w-7 h-7 text-brand-400" />
            文生视频
          </h1>
          <p className="text-dark-400 text-sm mt-1">输入文字描述，AI 自动生成高质量短视频。支持 1080p 分辨率，最长 30 秒。</p>
        </div>
        <div className="flex bg-dark-800 rounded-lg p-1">
          {[
            { id: 'create', name: '创作', icon: 'Sparkles' },
            { id: 'history', name: '历史记录', icon: 'History' },
          ].map(tab => {
            const Icon = Icons[tab.icon]
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-brand-600 text-white'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            )
          })}
        </div>
      </div>

      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：输入区 */}
          <div className="lg:col-span-2 space-y-5">
            {/* 提示词输入 */}
            <div className="glass-card rounded-2xl p-6">
              <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <Icons.PenLine className="w-4 h-4 text-brand-400" />
                视频描述提示词
                <span className="text-red-400 text-xs">*</span>
              </label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="描述你想要生成的视频画面，例如：一只橘猫在樱花树下打盹，花瓣随风飘落，阳光透过树叶洒下斑驳光影..."
                className="w-full h-32 bg-dark-800/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-dark-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 resize-none transition-all"
              />
              <div className="flex justify-between mt-2">
                <span className="text-dark-500 text-xs">越详细的描述，生成效果越好</span>
                <span className="text-dark-500 text-xs">{prompt.length} 字</span>
              </div>
            </div>

            {/* 负面提示词 */}
            <div className="glass-card rounded-2xl p-6">
              <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <Icons.Ban className="w-4 h-4 text-red-400" />
                负面提示词（可选）
              </label>
              <input
                type="text"
                value={negativePrompt}
                onChange={e => setNegativePrompt(e.target.value)}
                placeholder="描述你不希望在视频中出现的元素，如：模糊、变形、低质量..."
                className="w-full bg-dark-800/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-dark-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all"
              />
            </div>

            {/* 参考图上传 */}
            <div className="glass-card rounded-2xl p-6">
              <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Icons.ImagePlus className="w-4 h-4 text-accent-400" />
                参考图（可选）
                <span className="text-dark-500 text-xs font-normal">上传参考图可提升生成一致性</span>
              </label>
              {referenceImage ? (
                <div className="relative inline-block">
                  <img src={referenceImage} alt="参考图" className="w-48 h-48 object-cover rounded-xl border border-white/10" />
                  <button
                    onClick={removeReferenceImage}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                  >
                    <Icons.X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  className="w-full h-40 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-brand-500/30 hover:bg-brand-500/5 transition-all"
                >
                  <Icons.Upload className="w-8 h-8 text-dark-500" />
                  <span className="text-dark-400 text-sm">点击或拖拽上传参考图</span>
                  <span className="text-dark-600 text-xs">支持 JPG、PNG，最大 5MB</span>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>

            {/* 风格选择 */}
            <div className="glass-card rounded-2xl p-6">
              <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Icons.Palette className="w-4 h-4 text-brand-400" />
                视频风格
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {VIDEO_STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`relative rounded-xl p-3 border transition-all text-left ${
                      selectedStyle === style.id
                        ? 'border-brand-500 bg-brand-500/10'
                        : 'border-white/5 bg-dark-800/30 hover:border-white/20'
                    }`}
                  >
                    <div className={`w-full h-12 rounded-lg bg-gradient-to-br ${style.color} mb-2`} />
                    <span className="text-white text-xs font-medium block">{style.name}</span>
                    {selectedStyle === style.id && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-brand-500 rounded-full flex items-center justify-center">
                        <Icons.Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 镜头运动 */}
            <div className="glass-card rounded-2xl p-6">
              <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Icons.Video className="w-4 h-4 text-brand-400" />
                镜头运动
              </label>
              <div className="flex flex-wrap gap-2">
                {CAMERA_MOTIONS.map(motion => {
                  const Icon = Icons[motion.icon]
                  return (
                    <button
                      key={motion.id}
                      onClick={() => setSelectedMotion(motion.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        selectedMotion === motion.id
                          ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                          : 'border-white/5 bg-dark-800/30 text-dark-300 hover:border-white/20'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {motion.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 时长 + 分辨率 + Seed */}
            <div className="glass-card rounded-2xl p-6 space-y-5">
              {/* 时长 */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Icons.Clock className="w-4 h-4 text-brand-400" />
                  视频时长
                </label>
                <div className="flex gap-2">
                  {DURATIONS.map(d => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        duration === d
                          ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                          : 'border-white/5 bg-dark-800/30 text-dark-300 hover:border-white/20'
                      }`}
                    >
                      {d}s
                    </button>
                  ))}
                </div>
              </div>

              {/* 分辨率 */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Icons.Monitor className="w-4 h-4 text-brand-400" />
                  分辨率
                </label>
                <div className="flex gap-2">
                  {RESOLUTIONS.map(res => (
                    <button
                      key={res.id}
                      onClick={() => setResolution(res.id)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        resolution === res.id
                          ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                          : 'border-white/5 bg-dark-800/30 text-dark-300 hover:border-white/20'
                      }`}
                    >
                      {res.name}
                      {res.id === '1080p' && (
                        <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300">推荐</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seed */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <Icons.Hash className="w-4 h-4 text-brand-400" />
                  随机种子（可选）
                </label>
                <input
                  type="text"
                  value={seed}
                  onChange={e => setSeed(e.target.value.replace(/\D/g, ''))}
                  placeholder="输入数字可复现相同结果"
                  className="w-full bg-dark-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-dark-500 focus:outline-none focus:border-brand-500/50 transition-all"
                />
              </div>
            </div>

            {/* 生成按钮 */}
            <div className="space-y-3">
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className={`w-full py-4 rounded-xl text-white font-semibold text-base flex items-center justify-center gap-2 transition-all ${
                  !prompt.trim() || isGenerating
                    ? 'bg-dark-700 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-brand-600 to-accent-600 hover:shadow-lg hover:shadow-brand-500/30 glow-hover'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Icons.Loader2 className="w-5 h-5 animate-spin" />
                    {hasApiKey() ? 'AI 生成中（约 1-3 分钟）...' : '本地渲染中（实时录制）...'} {Math.round(progress)}%
                  </>
                ) : (
                  <>
                    <Icons.Wand2 className="w-5 h-5" />
                    {hasApiKey() ? 'AI 生成视频' : '本地渲染生成视频'}
                  </>
                )}
              </button>

              {/* API Key 状态 */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  {hasApiKey() ? (
                    <>
                      <Icons.CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">已接入 Pollinations 真实 AI（Seedance / Wan / Veo），失败自动降级本地渲染</span>
                    </>
                  ) : (
                    <>
                      <Icons.AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-amber-400">未配置 Key：当前为本地渲染（免费无限出片）；配置 Pollinations Key 解锁真实 AI</span>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setShowApiKeyModal(true)}
                  className="text-brand-400 hover:text-brand-300 transition-colors"
                >
                  {hasApiKey() ? '更换 API Key' : '配置 API Key'}
                </button>
              </div>

              {/* 降级提示 */}
              {notice && (
                <div className="flex items-start gap-2 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl px-4 py-3">
                  <Icons.AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{notice}</span>
                </div>
              )}
            </div>

            {/* 生成进度 */}
            {isGenerating && (
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-medium">正在生成视频</span>
                  <span className="text-brand-400 text-sm font-mono">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-dark-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center gap-2 mt-3 text-dark-400 text-xs">
                  <Icons.Cpu className="w-3.5 h-3.5" />
                  <span>正在分析提示词...</span>
                  {progress > 30 && <span className="text-brand-400">生成关键帧...</span>}
                  {progress > 60 && <span className="text-accent-400">渲染视频序列...</span>}
                  {progress > 85 && <span className="text-emerald-400">合成最终成片...</span>}
                </div>
              </div>
            )}
          </div>

          {/* 右侧：预览区 */}
          <div className="space-y-5">
            <div className="glass-card rounded-2xl p-6 sticky top-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Icons.PlayCircle className="w-4 h-4 text-brand-400" />
                视频预览
              </h3>

              {generatedVideo ? (
                <div className="space-y-4">
                  <div className={`aspect-video rounded-xl overflow-hidden relative border border-white/10`}>
                    {generatedVideo.videoUrl ? (
                      <video
                        ref={videoRef}
                        src={generatedVideo.videoUrl}
                        className="w-full h-full object-cover"
                        controls
                        loop
                        playsInline
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />
                    ) : (
                      <div className={`w-full h-full ${generatedVideo.thumbnail} flex items-center justify-center`}>
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="relative z-10 w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                          <Icons.Play className="w-6 h-6 text-white ml-1" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-white text-sm line-clamp-2">{generatedVideo.prompt}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-1 rounded-md bg-brand-500/10 text-brand-300 text-xs border border-brand-500/20">{generatedVideo.style}</span>
                      <span className="px-2 py-1 rounded-md bg-dark-800 text-dark-300 text-xs border border-white/5">{CAMERA_MOTIONS.find(m => m.id === selectedMotion)?.name}</span>
                      <span className={`px-2 py-1 rounded-md text-xs border ${generatedVideo.engine === 'api' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border-amber-500/20'}`}>
                        {generatedVideo.engine === 'api' ? `真实 AI · ${generatedVideo.model}` : '本地渲染'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => generatedVideo.videoUrl && downloadVideo(generatedVideo.videoUrl, `text2video_${generatedVideo.id}`, generatedVideo.ext)}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 text-white text-sm font-medium flex items-center justify-center gap-1.5 hover:shadow-lg transition-all"
                    >
                      <Icons.Download className="w-4 h-4" />
                      下载视频
                    </button>
                    <button
                      onClick={() => navigate('/dashboard/edit')}
                      className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-white/10 transition-all"
                    >
                      <Icons.Film className="w-4 h-4" />
                      去剪辑
                    </button>
                  </div>
                </div>
              ) : (
                <div className="aspect-video rounded-xl bg-dark-800/50 border border-white/5 flex flex-col items-center justify-center gap-3">
                  <Icons.Clapperboard className="w-12 h-12 text-dark-600" />
                  <p className="text-dark-500 text-sm">视频生成后将在此预览</p>
                  <p className="text-dark-600 text-xs">支持 720p / 1080p / 4K 分辨率</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 历史记录 */}
      {activeTab === 'history' && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Icons.History className="w-5 h-5 text-brand-400" />
            生成历史
          </h3>
          {history.length === 0 ? (
            <div className="text-center py-12">
              <Icons.Clock className="w-12 h-12 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-500">暂无生成记录，去「创作」页生成第一个视频吧</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map(item => (
                <div key={item.id} className="bg-dark-800/30 border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all group">
                  <div className="aspect-video bg-black relative">
                    {item.url ? (
                      <video src={item.url} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icons.Clapperboard className="w-8 h-8 text-dark-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                        <Icons.Play className="w-5 h-5 text-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute top-2 left-2 flex gap-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${item.meta?.engine === 'api' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                        {item.meta?.engine === 'api' ? `真实AI${item.meta?.model ? ' · ' + item.meta.model : ''}` : '本地渲染'}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2 flex gap-1">
                      <span className="text-white text-[10px] bg-black/40 backdrop-blur px-1.5 py-0.5 rounded">{item.meta?.duration || '?'}s</span>
                      <span className="text-white text-[10px] bg-black/40 backdrop-blur px-1.5 py-0.5 rounded">{item.meta?.resolution || ''}</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-white text-sm line-clamp-2 mb-2">{item.meta?.prompt || '（无提示词）'}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-dark-500 text-xs">{timeAgo(item.createdAt)}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => item.url && downloadVideo(item.url, `text2video_${item.id}`, item.meta?.ext || 'mp4')}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-dark-400 hover:text-white transition-colors"
                          title="下载"
                        >
                          <Icons.Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => { await deleteWork(item.id) }}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-dark-400 hover:text-red-400 transition-colors"
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
      )}

      {/* API Key 配置弹窗 */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">配置视频生成 API Key</h3>
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-dark-400 hover:text-white transition-colors"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Pollinations API Key（免费）
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  placeholder="sk_xxxxxxxxxxxxxxxx"
                  className="w-full bg-dark-800/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-dark-500 focus:outline-none focus:border-brand-500/50 transition-all"
                />
                <p className="text-dark-500 text-xs mt-2">
                  在 <a href="https://enter.pollinations.ai" target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">enter.pollinations.ai</a> 注册登录后，进入 Keys 页面创建 <span className="text-dark-300">Secret Key（sk_ 开头）</span>。视频生成必须用 sk_（裸 pk_ 会被限流、无法出片），账户有免费额度可用。留空则仅用本地渲染。
                </p>
              </div>

              <div className="bg-dark-800/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-dark-300">
                  <Icons.Info className="w-4 h-4 text-brand-400" />
                  <span className="font-medium">生成引擎说明</span>
                </div>
                <div className="text-xs text-dark-400 space-y-1">
                  <p>• <span className="text-emerald-300">真实 AI（配置 Key 后启用）</span>：Seedance / Wan / Veo 等模型，输出 1080p MP4</p>
                  <p>• <span className="text-amber-300">本地渲染（默认，无需 Key）</span>：浏览器内实时渲染风格化动态样片，免费无限次，必定出片</p>
                  <p>• AI 生成失败时会自动降级为本地渲染，不会中断使用</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowApiKeyModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-dark-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={saveApiKey}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 text-white font-medium hover:shadow-lg hover:shadow-brand-500/30 transition-all"
                >
                  保存配置
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
