import { useState } from 'react'
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { SIDEBAR_ITEMS } from '../../data/constants'

// 导入页面组件
import DashboardHome from './pages/DashboardHome'
import ScriptExtract from './pages/ScriptExtract'
import AIRewrite from './pages/AIRewrite'
import VoiceTTS from './pages/VoiceTTS'
import DigitalHuman from './pages/DigitalHuman'
import Editing from './pages/Editing'
import MixedEdit from './pages/MixedEdit'
import Publishing from './pages/Publishing'
import AssetManager from './pages/AssetManager'
import TaskCenter from './pages/TaskCenter'

// 用户信息
const USER_INFO = {
  name: '创作者',
  avatar: '创',
  plan: '专业版',
}

// 面包屑映射
const BREADCRUMB_MAP = {
  '/dashboard': ['工作台首页'],
  '/dashboard/extract': ['文案提取'],
  '/dashboard/rewrite': ['AI改写'],
  '/dashboard/voice': ['声音合成'],
  '/dashboard/digital-human': ['数字人口播'],
  '/dashboard/edit': ['剪辑合成'],
  '/dashboard/mixed-edit': ['智能混剪'],
  '/dashboard/publish': ['多平台发布'],
  '/dashboard/assets': ['素材资产库'],
  '/dashboard/tasks': ['任务中心'],
}

function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    navigate('/')
  }

  return (
    <aside className="w-64 h-screen bg-dark-950 border-r border-white/5 flex flex-col flex-shrink-0">
      {/* Logo + 标题 */}
      <div className="p-5 border-b border-white/5">
        <NavLink to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Icons.Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-base font-bold text-white">时光机</div>
            <div className="text-xs text-dark-400">智能体混剪工作台</div>
          </div>
        </NavLink>
      </div>

      {/* 导航项 */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = Icons[item.icon] || Icons.Circle
          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-500/15 to-accent-500/15 text-white border border-brand-500/20'
                    : 'text-dark-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : ''}`} />
                  {item.name}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* 底部用户信息区 */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-dark-900/50">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {USER_INFO.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{USER_INFO.name}</div>
            <div className="text-xs text-dark-400">{USER_INFO.plan}</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-white/5 transition-all"
            title="退出登录"
          >
            <Icons.LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)

  const currentPath = location.pathname
  const breadcrumbs = BREADCRUMB_MAP[currentPath] || ['工作台']

  return (
    <header className="h-16 border-b border-white/5 bg-dark-950/80 backdrop-blur-xl flex items-center justify-between px-6 flex-shrink-0">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm">
        <NavLink to="/dashboard" className="text-dark-400 hover:text-white transition-colors">
          工作台
        </NavLink>
        {breadcrumbs.map((crumb, idx) => (
          <span key={idx} className="flex items-center gap-2">
            <Icons.ChevronRight className="w-3.5 h-3.5 text-dark-500" />
            <span className={idx === breadcrumbs.length - 1 ? 'text-white font-medium' : 'text-dark-400'}>
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* 右侧操作区 */}
      <div className="flex items-center gap-3">
        {/* 搜索框 */}
        <div className="relative">
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="搜索功能..."
            className="bg-dark-900/80 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all w-48 lg:w-64"
          />
        </div>

        {/* 通知图标 */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-9 h-9 rounded-lg bg-dark-900/50 border border-white/5 flex items-center justify-center text-dark-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <Icons.Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-500" />
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-dark-900 border border-white/10 rounded-xl shadow-2xl py-2 z-50">
              <div className="px-4 py-2 border-b border-white/5">
                <span className="text-sm font-semibold text-white">通知</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {[
                  { title: '混剪任务完成', desc: '夏季防晒种草口播已生成', time: '5分钟前', icon: Icons.CheckCircle2, color: 'text-emerald-400' },
                  { title: '发布成功', desc: '小红书视频已发布', time: '15分钟前', icon: Icons.Share2, color: 'text-brand-400' },
                  { title: '任务排队', desc: '知识科普短视频排队中', time: '30分钟前', icon: Icons.Clock, color: 'text-amber-400' },
                ].map((notif, idx) => {
                  const NotifIcon = notif.icon
                  return (
                    <div key={idx} className="px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer">
                      <div className="flex items-start gap-3">
                        <NotifIcon className={`w-4 h-4 ${notif.color} mt-0.5 flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white">{notif.title}</div>
                          <div className="text-xs text-dark-400 mt-0.5 truncate">{notif.desc}</div>
                          <div className="text-xs text-dark-500 mt-1">{notif.time}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="px-4 py-2 border-t border-white/5">
                <button
                  onClick={() => navigate('/dashboard/tasks')}
                  className="text-xs text-brand-400 hover:text-brand-300 transition-colors w-full text-center"
                >
                  查看全部任务
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 用户头像 */}
        <button
          onClick={() => navigate('/dashboard')}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-sm font-semibold hover:scale-105 transition-transform"
        >
          {USER_INFO.avatar}
        </button>
      </div>
    </header>
  )
}

export default function DashboardApp() {
  return (
    <div className="flex h-screen bg-dark-950 overflow-hidden">
      {/* 左侧固定 Sidebar */}
      <Sidebar />

      {/* 右侧主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部 TopBar */}
        <TopBar />

        {/* 主内容区 */}
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="extract" element={<ScriptExtract />} />
            <Route path="rewrite" element={<AIRewrite />} />
            <Route path="voice" element={<VoiceTTS />} />
            <Route path="digital-human" element={<DigitalHuman />} />
            <Route path="edit" element={<Editing />} />
            <Route path="mixed-edit" element={<MixedEdit />} />
            <Route path="publish" element={<Publishing />} />
            <Route path="assets" element={<AssetManager />} />
            <Route path="tasks" element={<TaskCenter />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
