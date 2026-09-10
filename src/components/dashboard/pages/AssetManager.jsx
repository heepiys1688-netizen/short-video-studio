import { useState } from 'react'
import {
  FolderOpen,
  Search,
  Upload,
  Video,
  Image as ImageIcon,
  Music,
  Mic,
  LayoutTemplate,
  Play,
  Download,
  Trash2,
  Folder,
  FolderTree,
  MoreVertical,
  FileVideo,
  FileImage,
  FileAudio,
  Filter,
} from 'lucide-react'

// 顶部标签页
const TABS = [
  { id: 'video', name: '视频素材', icon: Video },
  { id: 'image', name: '图片素材', icon: ImageIcon },
  { id: 'audio', name: '音频素材', icon: Music },
  { id: 'voice', name: '声音管理', icon: Mic },
  { id: 'bgm', name: 'BGM市场', icon: Music },
  { id: 'template', name: '模板市场', icon: LayoutTemplate },
]

// 文件夹树
const FOLDERS = [
  { id: 'all', name: '我的素材', icon: Folder, count: 48 },
  { id: 'background', name: '背景素材', icon: Folder, count: 12 },
  { id: 'product', name: '产品素材', icon: Folder, count: 18 },
  { id: 'voiceover', name: '口播音频', icon: Folder, count: 8 },
  { id: 'bgm', name: 'BGM库', icon: Folder, count: 24 },
]

// 筛选器选项
const FILTERS = ['全部', '今日新增', '本周新增', '收藏']

// 模拟素材数据（不同标签页对应不同素材）
const ASSET_DATA = {
  video: [
    { id: 'v1', name: '产品展示片段A.mp4', meta: '00:15 · 12.5MB', type: 'video', color: 'from-brand-500/30 to-accent-500/30' },
    { id: 'v2', name: '使用场景片段B.mp4', meta: '00:20 · 18.3MB', type: 'video', color: 'from-emerald-500/30 to-teal-500/30' },
    { id: 'v3', name: '口播讲解片段.mp4', meta: '00:30 · 25.1MB', type: 'video', color: 'from-amber-500/30 to-orange-500/30' },
    { id: 'v4', name: '产品特写镜头.mp4', meta: '00:10 · 8.7MB', type: 'video', color: 'from-rose-500/30 to-pink-500/30' },
    { id: 'v5', name: '用户反馈片段.mp4', meta: '00:18 · 15.2MB', type: 'video', color: 'from-indigo-500/30 to-blue-500/30' },
    { id: 'v6', name: '背景空镜素材.mp4', meta: '00:25 · 20.4MB', type: 'video', color: 'from-purple-500/30 to-fuchsia-500/30' },
    { id: 'v7', name: '品牌宣传片.mp4', meta: '01:00 · 48.6MB', type: 'video', color: 'from-cyan-500/30 to-sky-500/30' },
    { id: 'v8', name: '结尾引导片段.mp4', meta: '00:08 · 6.3MB', type: 'video', color: 'from-lime-500/30 to-green-500/30' },
  ],
  image: [
    { id: 'i1', name: '产品主图.png', meta: '1920x1080 · 2.4MB', type: 'image', color: 'from-brand-500/30 to-accent-500/30' },
    { id: 'i2', name: '产品包装图.jpg', meta: '1080x1080 · 1.8MB', type: 'image', color: 'from-emerald-500/30 to-teal-500/30' },
    { id: 'i3', name: '品牌Logo.png', meta: '512x512 · 280KB', type: 'image', color: 'from-amber-500/30 to-orange-500/30' },
    { id: 'i4', name: '场景背景图.jpg', meta: '1920x1080 · 3.1MB', type: 'image', color: 'from-rose-500/30 to-pink-500/30' },
    { id: 'i5', name: '用户案例图.png', meta: '1080x1920 · 2.2MB', type: 'image', color: 'from-indigo-500/30 to-blue-500/30' },
    { id: 'i6', name: '对比效果图.jpg', meta: '1920x1080 · 2.8MB', type: 'image', color: 'from-purple-500/30 to-fuchsia-500/30' },
  ],
  audio: [
    { id: 'a1', name: '口播配音_01.wav', meta: '00:30 · 5.2MB', type: 'audio', color: 'from-emerald-500/30 to-teal-500/30' },
    { id: 'a2', name: '口播配音_02.wav', meta: '00:45 · 7.8MB', type: 'audio', color: 'from-amber-500/30 to-orange-500/30' },
    { id: 'a3', name: '背景音效_01.mp3', meta: '00:10 · 850KB', type: 'audio', color: 'from-rose-500/30 to-pink-500/30' },
    { id: 'a4', name: '转场音效.mp3', meta: '00:03 · 320KB', type: 'audio', color: 'from-indigo-500/30 to-blue-500/30' },
    { id: 'a5', name: '解说旁白.wav', meta: '01:20 · 14.2MB', type: 'audio', color: 'from-purple-500/30 to-fuchsia-500/30' },
  ],
  voice: [
    { id: 'vc1', name: '知性女主播', meta: '女声 · 知性温柔', type: 'voice', color: 'from-pink-500/30 to-rose-500/30' },
    { id: 'vc2', name: '磁性男低音', meta: '男声 · 磁性浑厚', type: 'voice', color: 'from-blue-500/30 to-indigo-500/30' },
    { id: 'vc3', name: '元气少女音', meta: '女声 · 活泼元气', type: 'voice', color: 'from-amber-500/30 to-orange-500/30' },
    { id: 'vc4', name: '沉稳男中音', meta: '男声 · 专业沉稳', type: 'voice', color: 'from-emerald-500/30 to-teal-500/30' },
  ],
  bgm: [
    { id: 'b1', name: '轻快节奏 - Sunny Day', meta: '02:15 · 流行', type: 'bgm', color: 'from-cyan-500/30 to-sky-500/30' },
    { id: 'b2', name: '温馨治愈 - Warm Light', meta: '03:20 · 治愈', type: 'bgm', color: 'from-lime-500/30 to-green-500/30' },
    { id: 'b3', name: '动感电子 - Electric Pulse', meta: '02:48 · 电子', type: 'bgm', color: 'from-fuchsia-500/30 to-purple-500/30' },
    { id: 'b4', name: '商务专业 - Corporate', meta: '03:05 · 商务', type: 'bgm', color: 'from-slate-500/30 to-gray-500/30' },
    { id: 'b5', name: '古风悠扬 - Ancient Wind', meta: '04:10 · 古风', type: 'bgm', color: 'from-red-500/30 to-rose-500/30' },
    { id: 'b6', name: '励志激昂 - Rise Up', meta: '03:30 · 励志', type: 'bgm', color: 'from-orange-500/30 to-amber-500/30' },
  ],
  template: [
    { id: 't1', name: '爆款带货模板', meta: '钩子-痛点-卖点-CTA', type: 'template', color: 'from-brand-500/30 to-accent-500/30' },
    { id: 't2', name: '口播种草模板', meta: '问题-方案-效果', type: 'template', color: 'from-emerald-500/30 to-teal-500/30' },
    { id: 't3', name: '知识科普模板', meta: '引入-讲解-总结', type: 'template', color: 'from-amber-500/30 to-orange-500/30' },
    { id: 't4', name: '励志故事模板', meta: '困境-转折-成就', type: 'template', color: 'from-rose-500/30 to-pink-500/30' },
  ],
}

// 类型图标映射
const TYPE_ICON = {
  video: FileVideo,
  image: FileImage,
  audio: FileAudio,
  voice: Mic,
  bgm: Music,
  template: LayoutTemplate,
}

export default function AssetManager() {
  const [activeTab, setActiveTab] = useState('video')
  const [activeFolder, setActiveFolder] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('全部')

  // 当前素材列表
  const currentAssets = ASSET_DATA[activeTab] || []

  // 过滤搜索
  const filteredAssets = currentAssets.filter((asset) =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-dark-950 text-dark-100">
      {/* 顶部标题区 */}
      <div className="border-b border-white/5 bg-dark-900/50">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-lg shadow-brand-500/20">
                <FolderOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">素材资产库</h1>
                <p className="mt-1 text-sm text-dark-400">统一管理视频、图片、音频、声音与模板素材</p>
              </div>
            </div>
            {/* 上传按钮 */}
            <button className="glow-hover flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-4 py-2.5 text-sm font-semibold text-white transition">
              <Upload className="h-4 w-4" />
              上传素材
            </button>
          </div>
        </div>
      </div>

      {/* 标签页 */}
      <div className="border-b border-white/5 bg-dark-900/30 px-6">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'border-brand-500 text-white'
                    : 'border-transparent text-dark-400 hover:text-dark-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-12">
        {/* 左侧文件夹树形导航 */}
        <div className="lg:col-span-3">
          <div className="glass-card rounded-xl p-4">
            <div className="mb-3 flex items-center gap-2 px-2 text-sm font-semibold text-dark-200">
              <FolderTree className="h-4 w-4 text-brand-400" />
              文件夹
            </div>
            <div className="space-y-1">
              {FOLDERS.map((folder) => {
                const Icon = folder.icon
                const isActive = activeFolder === folder.id
                return (
                  <button
                    key={folder.id}
                    onClick={() => setActiveFolder(folder.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                      isActive
                        ? 'bg-brand-500/10 text-white'
                        : 'text-dark-300 hover:bg-dark-800/40 hover:text-dark-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-brand-400' : 'text-dark-400'}`} />
                      <span>{folder.name}</span>
                    </div>
                    <span className="text-xs text-dark-500">{folder.count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 右侧主区域 */}
        <div className="lg:col-span-9">
          {/* 搜索 + 筛选 */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索素材..."
                className="w-full rounded-lg border border-white/5 bg-dark-800/80 py-2 pl-9 pr-3 text-sm text-dark-100 placeholder-dark-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-dark-400" />
              <div className="flex gap-1">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                      activeFilter === f
                        ? 'bg-brand-500/20 text-brand-300'
                        : 'bg-dark-800/40 text-dark-400 hover:bg-dark-700/40'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 素材网格 */}
          {filteredAssets.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filteredAssets.map((asset) => {
                const Icon = TYPE_ICON[asset.type] || FileVideo
                return (
                  <div
                    key={asset.id}
                    className="group overflow-hidden rounded-xl border border-white/5 bg-dark-800/40 transition hover:border-white/10 hover:shadow-lg"
                  >
                    {/* 缩略图 */}
                    <div className={`relative aspect-video overflow-hidden bg-gradient-to-br ${asset.color}`}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon className="h-8 w-8 text-white/40" />
                      </div>
                      {/* 悬浮播放/操作 */}
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition group-hover:opacity-100">
                        {(asset.type === 'video' || asset.type === 'audio' || asset.type === 'bgm' || asset.type === 'voice') ? (
                          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-lg transition hover:scale-110">
                            <Play className="h-4 w-4 translate-x-0.5 text-dark-900" />
                          </button>
                        ) : null}
                        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-lg transition hover:scale-110">
                          <Download className="h-4 w-4 text-dark-900" />
                        </button>
                      </div>
                    </div>
                    {/* 信息 */}
                    <div className="p-3">
                      <div className="truncate text-sm font-medium text-dark-100" title={asset.name}>
                        {asset.name}
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs text-dark-400">{asset.meta}</span>
                        <button className="text-dark-500 hover:text-white">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/5 text-dark-400">
              <FolderOpen className="h-10 w-10 text-dark-600" />
              <p className="text-sm">没有找到匹配的素材</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
