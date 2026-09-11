import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { generateSpeechCloud, getLocalVoices, speakLocal, CLOUD_VOICES } from '../../../services/aiApi'
import { saveWork, getWorks, deleteWork, createTask, updateTask, on, timeAgo } from '../../../services/store'
import { downloadVideo } from '../../../services/videoApi'

// 音色卡片
function VoiceItem({ voice, group, selected, onSelect }) {
  const isActive = selected?.group === group && selected?.id === voice.id
  return (
    <button
      onClick={() => onSelect({ group, id: voice.id })}
      className={`w-full text-left p-3 rounded-xl border transition-all ${
        isActive ? 'bg-brand-500/10 border-brand-500/40' : 'bg-dark-900/50 border-white/5 hover:border-white/10'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isActive ? 'bg-gradient-to-br from-brand-500 to-accent-500' : 'bg-dark-800'
          }`}
        >
          {group === 'cloud' ? (
            <Icons.Cloud className="w-4 h-4 text-white" />
          ) : (
            <Icons.MonitorSpeaker className="w-4 h-4 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{voice.name}</div>
          <div className="text-xs text-dark-400 truncate">{voice.desc}</div>
        </div>
        {isActive && <Icons.Check className="w-4 h-4 text-brand-400 flex-shrink-0" />}
      </div>
    </button>
  )
}

export default function VoiceTTS() {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [voiceTab, setVoiceTab] = useState('cloud') // 'cloud' | 'local'
  const [localVoices, setLocalVoices] = useState([])
  const [selected, setSelected] = useState(null) // { group: 'cloud'|'local', id }
  const [speed, setSpeed] = useState(1.0)
  const [pitch, setPitch] = useState(0) // -5 ~ 5，本地播放时映射为 0.5 ~ 1.5
  const [synthesizing, setSynthesizing] = useState(false)
  const [cloudResult, setCloudResult] = useState(null) // { url, voiceName, engine }
  const [error, setError] = useState('')
  const [playingLocal, setPlayingLocal] = useState(false)
  const [history, setHistory] = useState([])
  const speakRef = useRef(null)

  /* ---------- 本地真实音色加载（含 voiceschanged 异步刷新） ---------- */
  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const load = () => setLocalVoices(getLocalVoices())
    load()
    window.speechSynthesis.addEventListener?.('voiceschanged', load)
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', load)
      try { window.speechSynthesis.cancel() } catch { /* ignore */ }
    }
  }, [])

  // 默认选中第一个可用音色
  useEffect(() => {
    if (selected) return
    if (CLOUD_VOICES.length > 0) {
      setSelected({ group: 'cloud', id: CLOUD_VOICES[0].id })
    } else if (localVoices.length > 0) {
      setSelected({ group: 'local', id: localVoices[0].id })
    }
  }, [selected, localVoices])

  /* ---------- 真实历史作品（配音音频） ---------- */
  const loadHistory = useCallback(async () => {
    try {
      const works = await getWorks('audio')
      setHistory(works.filter((w) => w.meta?.module === 'voice'))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    loadHistory()
    const off = on('works', loadHistory)
    return () => off()
  }, [loadHistory])

  const selectedVoiceName = selected
    ? selected.group === 'cloud'
      ? CLOUD_VOICES.find((v) => v.id === selected.id)?.name || selected.id
      : localVoices.find((v) => v.id === selected.id)?.name || selected.id
    : ''

  const stopLocalPlayback = () => {
    try { speakRef.current?.stop() } catch { /* ignore */ }
    speakRef.current = null
    setPlayingLocal(false)
  }

  /* ---------- 立即合成（真实调用） ---------- */
  const handleSynthesize = async () => {
    const content = text.trim()
    if (!content || synthesizing || playingLocal) return
    if (!selected) {
      setError('请先选择一个音色')
      return
    }
    setError('')

    // 本地音色：Web Speech API 真实播放
    if (selected.group === 'local') {
      const voice = localVoices.find((v) => v.id === selected.id)
      const task = createTask({
        title: `本地配音：${content.slice(0, 20)}${content.length > 20 ? '…' : ''}`,
        type: '配音',
        module: 'voice',
      })
      try {
        const localPitch = Math.min(2, Math.max(0.5, 1 + pitch / 10))
        const inst = speakLocal(content, { voiceURI: voice?.id, rate: speed, pitch: localPitch })
        speakRef.current = inst
        setPlayingLocal(true)
        try {
          await inst.promise
          updateTask(task.id, { status: 'completed', progress: 100, finishedAt: Date.now() })
        } catch (err) {
          updateTask(task.id, { status: 'failed', progress: 0, error: err.message, finishedAt: Date.now() })
          setError(err.message || '本地语音播放失败')
        } finally {
          setPlayingLocal(false)
          speakRef.current = null
        }
      } catch (err) {
        updateTask(task.id, { status: 'failed', progress: 0, error: err.message, finishedAt: Date.now() })
        setError(err.message || '当前浏览器不支持本地语音合成')
      }
      return
    }

    // 云端音色：真实生成 MP3
    const voice = CLOUD_VOICES.find((v) => v.id === selected.id)
    const task = createTask({
      title: `云端配音：${content.slice(0, 20)}${content.length > 20 ? '…' : ''}`,
      type: '配音',
      module: 'voice',
    })
    setSynthesizing(true)
    setCloudResult(null)
    try {
      const res = await generateSpeechCloud(content, { voice: selected.id })
      setCloudResult({ url: res.url, voiceName: voice?.name || selected.id, engine: res.engine })
      // 自动保存到作品库（IndexedDB，真实二进制）
      try {
        const record = await saveWork({
          type: 'audio',
          name: `配音_${voice?.name || selected.id}_${Date.now()}`,
          blob: res.blob,
          meta: { module: 'voice', voice: voice?.name || selected.id, text: content.slice(0, 30) },
        })
        updateTask(task.id, { status: 'completed', progress: 100, workId: record.id, finishedAt: Date.now() })
      } catch {
        updateTask(task.id, { status: 'completed', progress: 100, finishedAt: Date.now() })
      }
    } catch (err) {
      setError(`${err.message || '云端合成失败'}。可改用「本地音色」立即配音，或稍后重试。`)
      updateTask(task.id, { status: 'failed', progress: 0, error: err.message, finishedAt: Date.now() })
    } finally {
      setSynthesizing(false)
    }
  }

  const isLocalSelected = selected?.group === 'local'

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <Icons.AudioWaveform className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">声音合成</h1>
        </div>
        <p className="text-sm text-dark-400 ml-10">
          云端高清音色生成可下载 MP3，本地音色即点即播，语速音调实时生效
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：真实音色库 */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">音色库</h2>
            <span className="text-xs text-dark-500">
              {voiceTab === 'cloud' ? `${CLOUD_VOICES.length} 个云端音色` : `${localVoices.length} 个本地音色`}
            </span>
          </div>

          {/* 音色分组 Tab */}
          <div className="glass-card rounded-xl p-1 flex gap-1 mb-3">
            <button
              onClick={() => setVoiceTab('cloud')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                voiceTab === 'cloud' ? 'bg-gradient-to-r from-brand-500 to-accent-500 text-white' : 'text-dark-400 hover:text-white'
              }`}
            >
              <Icons.Cloud className="w-3.5 h-3.5" />
              云端高清
            </button>
            <button
              onClick={() => setVoiceTab('local')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                voiceTab === 'local' ? 'bg-gradient-to-r from-brand-500 to-accent-500 text-white' : 'text-dark-400 hover:text-white'
              }`}
            >
              <Icons.MonitorSpeaker className="w-3.5 h-3.5" />
              本地音色
            </button>
          </div>

          <div className="glass-card rounded-2xl p-4 space-y-2 max-h-[480px] overflow-y-auto">
            {voiceTab === 'cloud' ? (
              <>
                {CLOUD_VOICES.map((v) => (
                  <VoiceItem key={v.id} voice={v} group="cloud" selected={selected} onSelect={setSelected} />
                ))}
                <p className="text-xs text-dark-500 leading-relaxed px-1 pt-1">
                  云端音色合成后生成真实 MP3，自动存入作品库，可下载复用；语速/音调滑块仅对本地音色生效。
                </p>
              </>
            ) : localVoices.length === 0 ? (
              <div className="py-10 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-dark-800 flex items-center justify-center mb-3">
                  <Icons.MonitorSpeaker className="w-5 h-5 text-dark-500" />
                </div>
                <p className="text-sm text-dark-400 mb-1">未检测到本地音色</p>
                <p className="text-xs text-dark-500 max-w-[220px]">
                  本地音色来自浏览器的 Web Speech API，请使用 Chrome / Edge 并确保系统已安装语音包
                </p>
              </div>
            ) : (
              <>
                {localVoices.map((v) => (
                  <VoiceItem key={v.id} voice={v} group="local" selected={selected} onSelect={setSelected} />
                ))}
                <p className="text-xs text-dark-500 leading-relaxed px-1 pt-1">
                  本地音色由浏览器直接朗读，零延迟、可离线，但暂不支持导出音频文件。
                </p>
              </>
            )}
          </div>
        </div>

        {/* 右侧：合成区 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 文本输入 */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">配音文本</h2>
              <span className="text-xs text-dark-400">{text.length} 字 · 约 {Math.max(1, Math.ceil(text.length / 4))}秒</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="输入或粘贴需要配音的文案（可从「AI改写」页面复制改写结果）..."
              className="w-full bg-dark-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all resize-none leading-relaxed"
            />
            <div className="flex items-center gap-3 mt-4">
              {playingLocal ? (
                <button
                  onClick={stopLocalPlayback}
                  className="px-6 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-sm font-semibold flex items-center gap-2 hover:bg-rose-500/25 transition-all"
                >
                  <Icons.Square className="w-4 h-4" />
                  停止播放
                </button>
              ) : (
                <button
                  onClick={handleSynthesize}
                  disabled={!text.trim() || synthesizing || !selected}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {synthesizing ? (
                    <>
                      <Icons.Loader2 className="w-4 h-4 animate-spin" />
                      云端合成中...
                    </>
                  ) : (
                    <>
                      <Icons.AudioWaveform className="w-4 h-4" />
                      立即合成
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => { setText(''); setCloudResult(null); setError('') }}
                className="px-4 py-2.5 rounded-xl bg-dark-900/50 border border-white/10 text-dark-400 text-sm hover:text-white transition-all"
              >
                清空
              </button>
              {selected && (
                <span className="text-xs text-dark-500 ml-auto">
                  当前音色：<span className="text-dark-300">{selectedVoiceName}</span>
                  {isLocalSelected ? '（本地即时播放）' : '（云端 MP3）'}
                </span>
              )}
            </div>
          </div>

          {/* 参数调节（真实作用于本地播放） */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-5">参数调节</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 语速 */}
              <div>
                <label className="flex items-center gap-1.5 text-xs text-dark-400 mb-3">
                  <Icons.Gauge className="w-3.5 h-3.5" />
                  语速 <span className="text-brand-400 ml-auto">{speed.toFixed(1)}x</span>
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
                  <span>0.5x 慢</span>
                  <span>2.0x 快</span>
                </div>
              </div>

              {/* 音调 */}
              <div>
                <label className="flex items-center gap-1.5 text-xs text-dark-400 mb-3">
                  <Icons.Volume2 className="w-3.5 h-3.5" />
                  音调 <span className="text-brand-400 ml-auto">{pitch > 0 ? `+${pitch}` : pitch}</span>
                </label>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="1"
                  value={pitch}
                  onChange={(e) => setPitch(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-dark-500 mt-1">
                  <span>低沉</span>
                  <span>高亢</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-dark-500 mt-4">
              语速与音调在本地音色播放时实时生效；云端音色由云端引擎以自然语速生成高清 MP3。
            </p>
          </div>

          {/* 云端合成中（真实请求状态） */}
          {synthesizing && (
            <div className="glass-card rounded-2xl p-10 flex flex-col items-center justify-center">
              <Icons.Loader2 className="w-8 h-8 text-brand-400 animate-spin mb-3" />
              <p className="text-sm text-dark-400">正在向云端语音引擎请求合成...</p>
              <p className="text-xs text-dark-500 mt-1">{selectedVoiceName} · {text.length} 字</p>
            </div>
          )}

          {/* 本地播放中状态 */}
          {playingLocal && (
            <div className="glass-card rounded-2xl p-6 animate-fade-in">
              <div className="flex items-center gap-4">
                <button
                  onClick={stopLocalPlayback}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/30 flex-shrink-0"
                >
                  <Icons.Square className="w-5 h-5 text-white" />
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sm text-white">正在本地播放...</span>
                  </div>
                  <p className="text-xs text-dark-400">
                    {selectedVoiceName} · {speed.toFixed(1)}x 语速 · 音调 {pitch > 0 ? `+${pitch}` : pitch}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 云端合成结果 */}
          {cloudResult && !synthesizing && (
            <div className="glass-card rounded-2xl p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">
                    合成完成
                  </span>
                  <span className="text-xs text-dark-400">
                    {cloudResult.voiceName} · 已自动保存到作品库
                  </span>
                </div>
                <button
                  onClick={() => downloadVideo(cloudResult.url, `配音_${Date.now()}`, 'mp3')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-dark-300 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Icons.Download className="w-3.5 h-3.5" />
                  下载 MP3
                </button>
              </div>
              <audio controls src={cloudResult.url} className="w-full" />
            </div>
          )}

          {/* 错误提示（云端失败建议改用本地音色） */}
          {error && (
            <div className="glass-card rounded-2xl p-5 flex items-start gap-3 border-rose-500/20">
              <Icons.AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-rose-300 mb-1">合成失败</p>
                <p className="text-xs text-dark-400 leading-relaxed">{error}</p>
              </div>
              <button
                onClick={() => setVoiceTab('local')}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-dark-300 hover:text-white transition-all flex-shrink-0"
              >
                改用本地音色
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 配音历史（真实音频作品） */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icons.History className="w-5 h-5 text-brand-400" />
            <h2 className="text-base font-semibold text-white">配音历史</h2>
          </div>
          {history.length > 0 && <span className="text-xs text-dark-500">共 {history.length} 条</span>}
        </div>

        {history.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-dark-800 flex items-center justify-center mb-3">
              <Icons.AudioLines className="w-5 h-5 text-dark-500" />
            </div>
            <p className="text-sm text-dark-400 mb-1">暂无配音作品</p>
            <p className="text-xs text-dark-500">使用「云端高清」音色合成后，音频会自动保存到这里，可随时播放与下载</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((w) => (
              <div key={w.id} className="bg-dark-900/50 border border-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icons.Music className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-white truncate">{w.name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => downloadVideo(w.url, w.name, 'mp3')}
                      className="p-2 rounded-lg bg-white/5 border border-white/10 text-dark-300 hover:text-white transition-all"
                      title="下载 MP3"
                    >
                      <Icons.Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteWork(w.id)}
                      className="p-2 rounded-lg bg-white/5 border border-white/10 text-dark-400 hover:text-rose-400 transition-all"
                      title="删除"
                    >
                      <Icons.Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <audio controls src={w.url} className="w-full" />
                <div className="flex items-center gap-2 mt-3 text-xs text-dark-500">
                  <span>{timeAgo(w.createdAt)}</span>
                  {w.meta?.voice && (
                    <>
                      <span>·</span>
                      <span>{w.meta.voice}</span>
                    </>
                  )}
                  {w.meta?.text && (
                    <>
                      <span>·</span>
                      <span className="truncate">{w.meta.text}{w.meta.text.length >= 30 ? '…' : ''}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 下一步 */}
      {cloudResult && (
        <div className="flex items-center justify-end">
          <button
            onClick={() => navigate('/dashboard/digital-human')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-brand-500/30 transition-all"
          >
            进入下一步：数字人
            <Icons.ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
