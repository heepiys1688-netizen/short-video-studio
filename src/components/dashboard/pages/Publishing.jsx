import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Share2,
  Hash,
  Image as ImageIcon,
  Check,
  Loader2,
  Clock,
  Send,
  FileEdit,
  Calendar,
} from 'lucide-react'
import { PLATFORMS } from '../../../data/constants'

// 模拟发布数据
const PUBLISH_ITEMS = [
  {
    id: 1,
    title: '我踩了3年防晒坑才发现！这3个地方没涂等于白防晒了',
    video: '混剪成片 #1',
    duration: '32s',
    status: 'ready',
  },
  {
    id: 2,
    title: '防晒科普｜90%的人涂防晒都漏了这3个部位',
    video: '混剪成片 #2',
    duration: '28s',
    status: 'ready',
  },
  {
    id: 3,
    title: '防晒只涂脸？你脖子以下不配拥有姓名吗！',
    video: '混剪成片 #3',
    duration: '35s',
    status: 'ready',
  },
]

const STATUS_MAP = {
  ready: { text: '待发布', style: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  publishing: { text: '发布中', style: 'bg-brand-500/10 text-brand-400 border-brand-500/20' },
  published: { text: '已发布', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  draft: { text: '已存草稿', style: 'bg-dark-500/10 text-dark-400 border-dark-500/20' },
  scheduled: { text: '已定时', style: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
}

const HASHTAG_SUGGESTIONS = ['#防晒', '#夏日护肤', '#美白', '#护肤干货', '#变美日记', '#防晒误区', '#护肤分享']

export default function Publishing() {
  const navigate = useNavigate()
  const [selectedItemId, setSelectedItemId] = useState(1)
  const [platformStatus, setPlatformStatus] = useState({
    douyin: 'ready',
    xiaohongshu: 'ready',
    shipinhao: 'ready',
    kuaishou: 'ready',
  })
  const [titles, setTitles] = useState({
    douyin: PUBLISH_ITEMS[0].title,
    xiaohongshu: PUBLISH_ITEMS[0].title,
    shipinhao: PUBLISH_ITEMS[0].title,
    kuaishou: PUBLISH_ITEMS[0].title,
  })
  const [hashtags, setHashtags] = useState({
    douyin: HASHTAG_SUGGESTIONS.slice(0, 4),
    xiaohongshu: HASHTAG_SUGGESTIONS.slice(1, 5),
    shipinhao: HASHTAG_SUGGESTIONS.slice(0, 3),
    kuaishou: HASHTAG_SUGGESTIONS.slice(2, 6),
  })
  const [publishing, setPublishing] = useState(false)
  const [scheduleMode, setScheduleMode] = useState('now')

  const currentItem = PUBLISH_ITEMS.find((item) => item.id === selectedItemId)

  const handlePublish = (platformId) => {
    setPublishing(true)
    setPlatformStatus((prev) => ({ ...prev, [platformId]: 'publishing' }))
    setTimeout(() => {
      setPlatformStatus((prev) => ({ ...prev, [platformId]: scheduleMode === 'now' ? 'published' : 'scheduled' }))
      setPublishing(false)
    }, 1500)
  }

  const handlePublishAll = () => {
    setPublishing(true)
    PLATFORMS.forEach((p) => {
      setPlatformStatus((prev) => ({ ...prev, [p.id]: 'publishing' }))
    })
    setTimeout(() => {
      const newStatus = scheduleMode === 'now' ? 'published' : 'scheduled'
      const newStatuses = {}
      PLATFORMS.forEach((p) => { newStatuses[p.id] = newStatus })
      setPlatformStatus(newStatuses)
      setPublishing(false)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <Share2 className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">多平台发布</h1>
        </div>
        <p className="text-sm text-dark-400 ml-10">
          自动填充标题与话题，直接发布或存草稿，四大平台同步分发
        </p>
      </div>

      {/* 成片选择 */}
      <div>
        <h2 className="text-base font-semibold text-white mb-3">选择要发布的成片</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PUBLISH_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedItemId(item.id)}
              className={`glass-card rounded-2xl p-4 text-left transition-all ${
                selectedItemId === item.id ? 'border-brand-500/40 ring-1 ring-brand-500/20' : 'hover:border-white/15'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-brand-950 to-dark-900 flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-5 h-5 text-dark-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white line-clamp-2 mb-1">{item.title}</div>
                  <div className="text-xs text-dark-400">{item.video} · {item.duration}</div>
                </div>
                {selectedItemId === item.id && (
                  <Check className="w-4 h-4 text-brand-400 flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 发布模式 */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex gap-2">
          <button
            onClick={() => setScheduleMode('now')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all flex items-center justify-center gap-2 ${
              scheduleMode === 'now'
                ? 'bg-brand-500/15 border-brand-500/40 text-brand-300'
                : 'bg-dark-900/50 border-white/5 text-dark-400 hover:text-white'
            }`}
          >
            <Send className="w-4 h-4" />
            立即发布
          </button>
          <button
            onClick={() => setScheduleMode('draft')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all flex items-center justify-center gap-2 ${
              scheduleMode === 'draft'
                ? 'bg-brand-500/15 border-brand-500/40 text-brand-300'
                : 'bg-dark-900/50 border-white/5 text-dark-400 hover:text-white'
            }`}
          >
            <FileEdit className="w-4 h-4" />
            存为草稿
          </button>
          <button
            onClick={() => setScheduleMode('schedule')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all flex items-center justify-center gap-2 ${
              scheduleMode === 'schedule'
                ? 'bg-brand-500/15 border-brand-500/40 text-brand-300'
                : 'bg-dark-900/50 border-white/5 text-dark-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            定时发布
          </button>
        </div>
      </div>

      {/* 各平台配置 */}
      <div>
        <h2 className="text-base font-semibold text-white mb-3">各平台发布配置</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLATFORMS.map((platform) => {
            const status = platformStatus[platform.id]
            return (
              <div key={platform.id} className="glass-card rounded-2xl p-5">
                {/* 平台头部 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{platform.icon}</span>
                    <span className="text-sm font-semibold text-white">{platform.name}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-xs border ${STATUS_MAP[status]?.style}`}>
                    {STATUS_MAP[status]?.text}
                  </span>
                </div>

                {/* 标题编辑 */}
                <div className="mb-3">
                  <label className="block text-xs text-dark-400 mb-1.5">标题</label>
                  <input
                    type="text"
                    value={titles[platform.id]}
                    onChange={(e) => setTitles({ ...titles, [platform.id]: e.target.value })}
                    className="w-full bg-dark-900/80 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all"
                  />
                </div>

                {/* 话题标签 */}
                <div className="mb-3">
                  <label className="block text-xs text-dark-400 mb-1.5 flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    话题标签
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {hashtags[platform.id].map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 text-xs border border-brand-500/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 封面 */}
                <div className="mb-4">
                  <label className="block text-xs text-dark-400 mb-1.5">封面</label>
                  <div className="w-full aspect-video rounded-lg bg-gradient-to-br from-brand-950 to-dark-900 flex items-center justify-center border border-white/5">
                    <ImageIcon className="w-5 h-5 text-dark-500" />
                  </div>
                </div>

                {/* 发布按钮 */}
                <button
                  onClick={() => handlePublish(platform.id)}
                  disabled={status === 'publishing' || status === 'published' || status === 'scheduled'}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-40"
                >
                  {status === 'publishing' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      发布中...
                    </>
                  ) : status === 'published' ? (
                    <>
                      <Check className="w-4 h-4" />
                      已发布
                    </>
                  ) : status === 'scheduled' ? (
                    <>
                      <Clock className="w-4 h-4" />
                      已定时
                    </>
                  ) : scheduleMode === 'draft' ? (
                    <>
                      <FileEdit className="w-4 h-4" />
                      存草稿
                    </>
                  ) : scheduleMode === 'schedule' ? (
                    <>
                      <Calendar className="w-4 h-4" />
                      定时发布
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      立即发布
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* 一键发布全部 */}
      <div className="flex items-center justify-between glass-card rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {PLATFORMS.map((p) => (
              <div
                key={p.id}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 border-dark-900"
                style={{ backgroundColor: p.color }}
              >
                {p.icon}
              </div>
            ))}
          </div>
          <span className="text-sm text-dark-400">同时发布到4个平台</span>
        </div>
        <button
          onClick={handlePublishAll}
          disabled={publishing}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-50"
        >
          {publishing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              发布中...
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              一键全部发布
            </>
          )}
        </button>
      </div>
    </div>
  )
}
