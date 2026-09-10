import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Icons from 'lucide-react'

const MOTION_EFFECTS = [
  { id: 'slow-zoom', name: '缓慢缩放', desc: '镜头缓慢推近或拉远', icon: 'ZoomIn' },
  { id: 'pan', name: '平移滑动', desc: '画面左右或上下缓慢平移', icon: 'MoveHorizontal' },
  { id: 'orbit', name: '3D环绕', desc: '镜头围绕主体做 3D 环绕运动', icon: 'Orbit' },
  { id: 'parallax', name: '视差深度', desc: '前景与背景产生视差运动', icon: 'Layers' },
  { id: 'breathe', name: '呼吸律动', desc: '画面模拟呼吸般的轻微起伏', icon: 'Activity' },
  { id: 'particle', name: '粒子飘散', desc: '画面中元素产生粒子飘散效果', icon: 'Sparkles' },
  { id: 'liquid', name: '流体变形', desc: '画面产生液体流动般的变形', icon: 'Waves' },
  { id: 'cinematic', name: '电影运镜', desc: '专业电影级别的运镜效果', icon: 'Film' },
]

const RESOLUTIONS = [
  { id: '720p', name: '720p HD', width: 1280, height: 720 },
  { id: '1080p', name: '1080p Full HD', width: 1920, height: 1080 },
  { id: '4k', name: '4K Ultra HD', width: 3840, height: 2160 },
]

const DURATIONS = [5, 10, 15, 20, 25, 30]

const MOCK_HISTORY = [
  { id: 1, imageName: 'product_shot_01.jpg', effect: '缓慢缩放', duration: 10, resolution: '1080p', status: 'completed', createdAt: '1小时前', thumbnail: 'bg-gradient-to-br from-emerald-400 to-teal-600' },
  { id: 2, imageName: 'city_night.jpg', effect: '视差深度', duration: 15, resolution: '1080p', status: 'completed', createdAt: '3小时前', thumbnail: 'bg-gradient-to-br from-indigo-500 to-purple-700' },
  { id: 3, imageName: 'portrait_02.png', effect: '3D环绕', duration: 8, resolution: '1080p', status: 'processing', createdAt: '10分钟前', thumbnail: 'bg-gradient-to-br from-rose-400 to-pink-600' },
]

export default function ImageToVideo() {
  const navigate = useNavigate()
  const [uploadedImage, setUploadedImage] = useState(null)
  const [imageName, setImageName] = useState('')
  const [selectedEffect, setSelectedEffect] = useState('slow-zoom')
  const [motionIntensity, setMotionIntensity] = useState(50)
  const [duration, setDuration] = useState(10)
  const [resolution, setResolution] = useState('1080p')
  const [loop, setLoop] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedVideo, setGeneratedVideo] = useState(null)
  const [history, setHistory] = useState(MOCK_HISTORY)
  const [activeTab, setActiveTab] = useState('create')
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef(null)
  const fileInputRef = useRef(null)
  const progressRef = useRef(null)

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => setUploadedImage(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    setImageName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => setUploadedImage(ev.target.result)
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setUploadedImage(null)
    setImageName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleGenerate = () => {
    if (!uploadedImage) return
    setIsGenerating(true)
    setProgress(0)
    setGeneratedVideo(null)
    setIsPlaying(false)

    let p = 0
    progressRef.current = setInterval(() => {
      p += Math.random() * 6 + 2
      if (p >= 100) {
        p = 100
        clearInterval(progressRef.current)
        setTimeout(() => {
          setIsGenerating(false)
          const effectObj = MOTION_EFFECTS.find(e => e.id === selectedEffect)
          const newVideo = {
            id: Date.now(),
            imageName,
            effect: effectObj?.name || '缓慢缩放',
            duration,
            resolution,
            status: 'completed',
            createdAt: '刚刚',
            thumbnail: uploadedImage,
          }
          // 异步生成模拟视频
          createMockVideoBlob().then(videoUrl => {
            const videoWithUrl = { ...newVideo, videoUrl }
            setGeneratedVideo(videoWithUrl)
            setHistory(prev => [videoWithUrl, ...prev])
          }).catch(() => {
            setGeneratedVideo(newVideo)
            setHistory(prev => [newVideo, ...prev])
          })
        }, 500)
      }
      setProgress(Math.min(p, 100))
    }, 350)
  }

  // 生成模拟视频Blob（用于演示）
  const createMockVideoBlob = () => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 640
      canvas.height = 360
      const ctx = canvas.getContext('2d')

      const img = new Image()
      img.src = uploadedImage

      const effectObj = MOTION_EFFECTS.find(e => e.id === selectedEffect)
      const fps = 10
      const totalFrames = Math.min(duration * fps, 150)

      return new Promise((resolve) => {
        img.onload = () => {
          const recordCanvas = document.createElement('canvas')
          recordCanvas.width = 640
          recordCanvas.height = 360
          const recordCtx = recordCanvas.getContext('2d')
          const recordStream = recordCanvas.captureStream(10)
          const recordRecorder = new MediaRecorder(recordStream, { mimeType: 'video/webm;codecs=vp9' })

          const recordChunks = []
          recordRecorder.ondataavailable = (e) => recordChunks.push(e.data)
          recordRecorder.onstop = () => {
            const blob = new Blob(recordChunks, { type: 'video/webm' })
            resolve(URL.createObjectURL(blob))
          }

          recordRecorder.start()

          let frameIdx = 0
          const drawFrame = () => {
            if (frameIdx >= totalFrames) {
              recordRecorder.stop()
              return
            }

            recordCtx.clearRect(0, 0, recordCanvas.width, recordCanvas.height)

            // 根据效果类型绘制不同动画
            const intensity = motionIntensity / 100
            const cx = recordCanvas.width / 2
            const cy = recordCanvas.height / 2

            if (selectedEffect === 'slow-zoom') {
              const scale = 1 + Math.sin(frameIdx * 0.05) * 0.3 * intensity
              recordCtx.save()
              recordCtx.translate(cx, cy)
              recordCtx.scale(scale, scale)
              recordCtx.translate(-cx, -cy)
              recordCtx.drawImage(img, 0, 0, recordCanvas.width, recordCanvas.height)
              recordCtx.restore()
            } else if (selectedEffect === 'pan') {
              const offset = Math.sin(frameIdx * 0.03) * 50 * intensity
              recordCtx.save()
              recordCtx.translate(offset, 0)
              recordCtx.drawImage(img, -50, 0, recordCanvas.width + 100, recordCanvas.height)
              recordCtx.restore()
            } else if (selectedEffect === 'orbit') {
              const angle = frameIdx * 0.02
              const scale = 1.2
              recordCtx.save()
              recordCtx.translate(cx, cy)
              recordCtx.rotate(angle * 0.1)
              recordCtx.scale(scale, scale)
              recordCtx.translate(-cx, -cy)
              recordCtx.drawImage(img, 0, 0, recordCanvas.width, recordCanvas.height)
              recordCtx.restore()
            } else if (selectedEffect === 'parallax') {
              recordCtx.drawImage(img, 0, 0, recordCanvas.width, recordCanvas.height)
              const offset = Math.sin(frameIdx * 0.04) * 20 * intensity
              recordCtx.fillStyle = 'rgba(0,0,0,0.2)'
              recordCtx.fillRect(offset, 0, 10, recordCanvas.height)
            } else {
              // 默认：呼吸律动
              const scale = 1 + Math.sin(frameIdx * 0.08) * 0.05 * intensity
              recordCtx.save()
              recordCtx.translate(cx, cy)
              recordCtx.scale(scale, scale)
              recordCtx.translate(-cx, -cy)
              recordCtx.drawImage(img, 0, 0, recordCanvas.width, recordCanvas.height)
              recordCtx.restore()
            }

            // 添加效果文字
            recordCtx.fillStyle = 'rgba(255,255,255,0.9)'
            recordCtx.font = 'bold 20px sans-serif'
            recordCtx.textAlign = 'center'
            recordCtx.fillText(`${effectObj?.name || '缓慢缩放'}`, cx, recordCanvas.height - 40)
            recordCtx.font = '14px sans-serif'
            recordCtx.fillText(`${duration}s · ${resolution}`, cx, recordCanvas.height - 15)

            frameIdx++
            setTimeout(drawFrame, 1000 / fps)
          }
          drawFrame()
        }

        img.onerror = () => {
          // 图片加载失败时生成纯色动画
          const recordCanvas = document.createElement('canvas')
          recordCanvas.width = 640
          recordCanvas.height = 360
          const recordCtx = recordCanvas.getContext('2d')
          const recordStream = recordCanvas.captureStream(10)
          const recordRecorder = new MediaRecorder(recordStream, { mimeType: 'video/webm;codecs=vp9' })

          const recordChunks = []
          recordRecorder.ondataavailable = (e) => recordChunks.push(e.data)
          recordRecorder.onstop = () => {
            const blob = new Blob(recordChunks, { type: 'video/webm' })
            resolve(URL.createObjectURL(blob))
          }

          recordRecorder.start()

          let frameIdx = 0
          const drawFrame = () => {
            if (frameIdx >= totalFrames) {
              recordRecorder.stop()
              return
            }
            const hue = (frameIdx * 2 + 200) % 360
            const g = recordCtx.createLinearGradient(0, 0, recordCanvas.width, recordCanvas.height)
            g.addColorStop(0, `hsl(${hue}, 60%, 50%)`)
            g.addColorStop(1, `hsl(${hue + 40}, 60%, 40%)`)
            recordCtx.fillStyle = g
            recordCtx.fillRect(0, 0, recordCanvas.width, recordCanvas.height)

            recordCtx.fillStyle = 'rgba(255,255,255,0.9)'
            recordCtx.font = 'bold 20px sans-serif'
            recordCtx.textAlign = 'center'
            recordCtx.fillText(effectObj?.name || '图生视频', recordCanvas.width / 2, recordCanvas.height / 2)
            recordCtx.font = '14px sans-serif'
            recordCtx.fillText(`${duration}s · ${resolution}`, recordCanvas.width / 2, recordCanvas.height - 30)

            frameIdx++
            setTimeout(drawFrame, 1000 / fps)
          }
          drawFrame()
        }
      })
    } catch (err) {
      console.warn('无法生成模拟视频:', err)
      return null
    }
  }

  useEffect(() => {
    return () => {
      if (progressRef.current) clearInterval(progressRef.current)
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Icons.Image className="w-7 h-7 text-brand-400" />
            图生视频
          </h1>
          <p className="text-dark-400 text-sm mt-1">上传一张图片，AI 自动赋予画面动态效果，生成高质量短视频。支持 1080p 分辨率，最长 30 秒。</p>
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
            {/* 图片上传 */}
            <div className="glass-card rounded-2xl p-6">
              <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Icons.ImagePlus className="w-4 h-4 text-brand-400" />
                上传图片
                <span className="text-red-400 text-xs">*</span>
                <span className="text-dark-500 text-xs font-normal">支持 JPG、PNG、WebP，建议分辨率 1920x1080 以上</span>
              </label>

              {uploadedImage ? (
                <div className="relative inline-block">
                  <img src={uploadedImage} alt="上传的图片" className="w-full max-h-80 object-contain rounded-xl border border-white/10" />
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 rounded-md bg-black/50 backdrop-blur text-white text-xs">{imageName}</span>
                  </div>
                  <button
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <Icons.X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur text-white text-xs flex items-center gap-1.5 hover:bg-black/70 transition-colors"
                  >
                    <Icons.RefreshCw className="w-3 h-3" />
                    更换图片
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  className="w-full h-72 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-brand-500/30 hover:bg-brand-500/5 transition-all"
                >
                  <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center">
                    <Icons.Upload className="w-8 h-8 text-brand-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-white text-sm font-medium">点击或拖拽上传图片</p>
                    <p className="text-dark-500 text-xs mt-1">支持 JPG、PNG、WebP，最大 10MB</p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-1 rounded-md bg-dark-800 text-dark-400 text-[10px] border border-white/5">16:9 横屏</span>
                    <span className="px-2 py-1 rounded-md bg-dark-800 text-dark-400 text-[10px] border border-white/5">9:16 竖屏</span>
                    <span className="px-2 py-1 rounded-md bg-dark-800 text-dark-400 text-[10px] border border-white/5">1:1 方形</span>
                  </div>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>

            {/* 动态效果选择 */}
            <div className="glass-card rounded-2xl p-6">
              <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Icons.Zap className="w-4 h-4 text-brand-400" />
                动态效果
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {MOTION_EFFECTS.map(effect => {
                  const Icon = Icons[effect.icon]
                  return (
                    <button
                      key={effect.id}
                      onClick={() => setSelectedEffect(effect.id)}
                      className={`relative rounded-xl p-4 border text-left transition-all ${
                        selectedEffect === effect.id
                          ? 'border-brand-500 bg-brand-500/10'
                          : 'border-white/5 bg-dark-800/30 hover:border-white/20'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                        selectedEffect === effect.id ? 'bg-brand-500/20 text-brand-400' : 'bg-dark-700 text-dark-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-white text-xs font-medium block">{effect.name}</span>
                      <span className="text-dark-500 text-[10px] block mt-0.5">{effect.desc}</span>
                      {selectedEffect === effect.id && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-brand-500 rounded-full flex items-center justify-center">
                          <Icons.Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 运动幅度 */}
            <div className="glass-card rounded-2xl p-6">
              <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Icons.Gauge className="w-4 h-4 text-brand-400" />
                运动幅度
                <span className="text-brand-400 text-sm font-mono ml-auto">{motionIntensity}%</span>
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={motionIntensity}
                onChange={e => setMotionIntensity(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between mt-1">
                <span className="text-dark-600 text-xs">柔和</span>
                <span className="text-dark-600 text-xs">适中</span>
                <span className="text-dark-600 text-xs">强烈</span>
              </div>
            </div>

            {/* 时长 + 分辨率 + 循环 */}
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

              {/* 循环播放 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icons.Repeat className="w-4 h-4 text-brand-400" />
                  <span className="text-white text-sm font-medium">循环播放</span>
                  <span className="text-dark-500 text-xs">视频首尾无缝衔接，适合作为动态背景</span>
                </div>
                <button
                  onClick={() => setLoop(!loop)}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    loop ? 'bg-brand-500' : 'bg-dark-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                    loop ? 'left-6' : 'left-0.5'
                  }`} />
                </button>
              </div>
            </div>

            {/* 生成按钮 */}
            <button
              onClick={handleGenerate}
              disabled={!uploadedImage || isGenerating}
              className={`w-full py-4 rounded-xl text-white font-semibold text-base flex items-center justify-center gap-2 transition-all ${
                !uploadedImage || isGenerating
                  ? 'bg-dark-700 cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-brand-600 to-accent-600 hover:shadow-lg hover:shadow-brand-500/30 glow-hover'
              }`}
            >
              {isGenerating ? (
                <>
                  <Icons.Loader2 className="w-5 h-5 animate-spin" />
                  生成中... {Math.round(progress)}%
                </>
              ) : (
                <>
                  <Icons.Wand2 className="w-5 h-5" />
                  生成视频
                </>
              )}
            </button>

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
                  <span>正在分析图像结构...</span>
                  {progress > 25 && <span className="text-brand-400">提取深度信息...</span>}
                  {progress > 50 && <span className="text-accent-400">生成动态帧序列...</span>}
                  {progress > 75 && <span className="text-emerald-400">渲染运动效果...</span>}
                  {progress > 90 && <span className="text-cyan-400">合成最终成片...</span>}
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
                  <div className="aspect-video rounded-xl overflow-hidden relative border border-white/10">
                    {generatedVideo.videoUrl ? (
                      <video
                        ref={videoRef}
                        src={generatedVideo.videoUrl}
                        className="w-full h-full object-cover"
                        controls
                        loop={loop}
                        playsInline
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />
                    ) : (
                      <>
                        {generatedVideo.thumbnail && generatedVideo.thumbnail.startsWith('data:') ? (
                          <img src={generatedVideo.thumbnail} alt="生成预览" className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full ${generatedVideo.thumbnail || 'bg-gradient-to-br from-brand-500 to-accent-500'}`} />
                        )}
                        <div className="absolute inset-0 bg-black/30" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                            <Icons.Play className="w-6 h-6 text-white ml-1" />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-1 rounded-md bg-brand-500/10 text-brand-300 text-xs border border-brand-500/20">{generatedVideo.effect}</span>
                      <span className="px-2 py-1 rounded-md bg-dark-800 text-dark-300 text-xs border border-white/5">幅度 {motionIntensity}%</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 text-white text-sm font-medium flex items-center justify-center gap-1.5 hover:shadow-lg transition-all">
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
                  <Icons.ImageIcon className="w-12 h-12 text-dark-600" />
                  <p className="text-dark-500 text-sm">上传图片并生成后将在此预览</p>
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
              <p className="text-dark-500">暂无生成记录</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map(item => (
                <div key={item.id} className="bg-dark-800/30 border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all group">
                  <div className={`aspect-video relative ${typeof item.thumbnail === 'string' && item.thumbnail.startsWith('data:') ? '' : item.thumbnail || 'bg-gradient-to-br from-brand-500 to-accent-500'}`}>
                    {typeof item.thumbnail === 'string' && item.thumbnail.startsWith('data:') ? (
                      <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full ${item.thumbnail || 'bg-gradient-to-br from-brand-500 to-accent-500'}`} />
                    )}
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                        <Icons.Play className="w-5 h-5 text-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        item.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : item.status === 'failed'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {item.status === 'completed' ? '已完成' : item.status === 'failed' ? '失败' : '生成中'}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2 flex gap-1">
                      <span className="text-white text-[10px] bg-black/40 backdrop-blur px-1.5 py-0.5 rounded">{item.duration}s</span>
                      <span className="text-white text-[10px] bg-black/40 backdrop-blur px-1.5 py-0.5 rounded">{item.resolution}</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Icons.FileImage className="w-3.5 h-3.5 text-dark-500" />
                      <span className="text-dark-300 text-xs truncate">{item.imageName || 'uploaded_image.jpg'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-1 rounded-md bg-brand-500/10 text-brand-300 text-xs border border-brand-500/20">{item.effect}</span>
                      <span className="text-dark-500 text-xs">{item.createdAt}</span>
                    </div>
                    <div className="flex gap-1 mt-2 justify-end">
                      <button className="p-1.5 rounded-lg hover:bg-white/5 text-dark-400 hover:text-white transition-colors">
                        <Icons.Download className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-white/5 text-dark-400 hover:text-white transition-colors">
                        <Icons.Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
