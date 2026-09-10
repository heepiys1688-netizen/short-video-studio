import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Clock,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Mic,
  Film,
  Share2,
} from 'lucide-react'

const SELLING_POINTS = [
  { icon: Sparkles, title: 'AI全流程', desc: '提取·改写·配音·剪辑·发布一站搞定' },
  { icon: Mic, title: '声音克隆', desc: '高精度TTS，不必出镜也有"自己的声音"' },
  { icon: Film, title: '智能混剪', desc: '字幕自动对齐，画中画叠加，一键成片' },
  { icon: Share2, title: '多平台分发', desc: '抖音/小红书/视频号/快手同步发布' },
]

export default function Auth() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // login | register
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // 登录表单
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  // 注册表单
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value })
  }

  const handleRegisterChange = (e) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value })
  }

  const handleLogin = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      navigate('/dashboard')
    }, 800)
  }

  const handleRegister = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      navigate('/dashboard')
    }, 800)
  }

  return (
    <div className="min-h-screen bg-dark-950 relative overflow-hidden flex items-center justify-center px-4 py-8">
      {/* 背景发光装饰 */}
      <div className="hero-glow w-[500px] h-[500px] bg-brand-500 -top-40 -left-40" />
      <div className="hero-glow w-[500px] h-[500px] bg-accent-500 -bottom-40 -right-40" style={{ animationDelay: '2s' }} />
      <div className="hero-glow w-[300px] h-[300px] bg-brand-400 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: '1s' }} />

      {/* 顶部返回首页链接 */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          to="/"
          className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors text-sm group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          返回首页
        </Link>
      </div>

      {/* 居中卡片 */}
      <div className="relative z-10 w-full max-w-5xl">
        <div className="glass-card rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
          {/* 左侧品牌展示区 */}
          <div className="relative bg-gradient-to-br from-brand-950 via-dark-950 to-dark-900 p-10 lg:p-12 flex flex-col justify-between overflow-hidden hidden lg:flex">
            <div className="hero-glow w-[300px] h-[300px] bg-brand-500 -top-20 -right-20" />
            <div className="hero-glow w-[200px] h-[200px] bg-accent-500 bottom-10 -left-10" style={{ animationDelay: '1.5s' }} />

            {/* Logo + 标题 */}
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">时光机</span>
              </div>
              <h2 className="text-3xl font-bold text-white leading-tight mb-3">
                无需出镜，<br />
                <span className="gradient-text">也能做IP</span>
              </h2>
              <p className="text-dark-400 text-sm leading-relaxed">
                时光机智能体混剪工作台，从文案到成片，一个人也能稳定输出短视频IP内容。
              </p>
            </div>

            {/* 核心卖点 */}
            <div className="relative z-10 space-y-4 mt-8">
              {SELLING_POINTS.map((point, idx) => {
                const Icon = point.icon
                return (
                  <div key={idx} className="flex items-start gap-3 group">
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-brand-500/50 transition-colors">
                      <Icon className="w-5 h-5 text-brand-400" />
                    </div>
                    <div>
                      <div className="text-white text-sm font-semibold">{point.title}</div>
                      <div className="text-dark-400 text-xs mt-0.5">{point.desc}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 右侧表单区 */}
          <div className="bg-dark-950/80 backdrop-blur-xl p-8 lg:p-12 flex flex-col justify-center">
            {/* 移动端 Logo */}
            <div className="flex lg:hidden items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">时光机</span>
            </div>

            {/* 切换标签 */}
            <div className="flex gap-1 p-1 bg-dark-900/80 rounded-xl mb-8 border border-white/5">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-lg shadow-brand-500/20'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                登录
              </button>
              <button
                onClick={() => setMode('register')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  mode === 'register'
                    ? 'bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-lg shadow-brand-500/20'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                注册
              </button>
            </div>

            {/* 标题 */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white">
                {mode === 'login' ? '欢迎回来' : '创建账号'}
              </h1>
              <p className="text-dark-400 text-sm mt-1">
                {mode === 'login'
                  ? '登录工作台，继续你的创作'
                  : '注册即可免费体验全部功能'}
              </p>
            </div>

            {/* 登录表单 */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs text-dark-400 mb-2 font-medium">邮箱</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                    <input
                      type="email"
                      name="email"
                      value={loginForm.email}
                      onChange={handleLoginChange}
                      required
                      placeholder="请输入邮箱"
                      className="w-full bg-dark-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-dark-400 mb-2 font-medium">密码</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={loginForm.password}
                      onChange={handleLoginChange}
                      required
                      placeholder="请输入密码"
                      className="w-full bg-dark-900/80 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-dark-400 cursor-pointer">
                    <input type="checkbox" className="custom-checkbox w-3.5 h-3.5 rounded border-white/20 bg-dark-900" />
                    记住我
                  </label>
                  <button type="button" className="text-brand-400 hover:text-brand-300 transition-colors">
                    忘记密码？
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      登录中...
                    </>
                  ) : (
                    <>
                      登录
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-dark-400">
                  还没有账号？
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="ml-1 text-brand-400 hover:text-brand-300 font-medium transition-colors"
                  >
                    立即注册
                  </button>
                </p>
              </form>
            )}

            {/* 注册表单 */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs text-dark-400 mb-2 font-medium">用户名</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                    <input
                      type="text"
                      name="username"
                      value={registerForm.username}
                      onChange={handleRegisterChange}
                      required
                      placeholder="请输入用户名"
                      className="w-full bg-dark-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-dark-400 mb-2 font-medium">邮箱</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                    <input
                      type="email"
                      name="email"
                      value={registerForm.email}
                      onChange={handleRegisterChange}
                      required
                      placeholder="请输入邮箱"
                      className="w-full bg-dark-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-dark-400 mb-2 font-medium">密码</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={registerForm.password}
                      onChange={handleRegisterChange}
                      required
                      placeholder="请输入密码"
                      className="w-full bg-dark-900/80 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-dark-400 mb-2 font-medium">确认密码</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={registerForm.confirmPassword}
                      onChange={handleRegisterChange}
                      required
                      placeholder="请再次输入密码"
                      className="w-full bg-dark-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-dark-400">
                  <input type="checkbox" className="custom-checkbox w-3.5 h-3.5 rounded border-white/20 bg-dark-900" required />
                  <span>
                    我已阅读并同意
                    <button type="button" className="text-brand-400 hover:text-brand-300 ml-1">服务条款</button>
                    和
                    <button type="button" className="text-brand-400 hover:text-brand-300 ml-1">隐私政策</button>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      注册中...
                    </>
                  ) : (
                    <>
                      注册并开始使用
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-dark-400">
                  已有账号？
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="ml-1 text-brand-400 hover:text-brand-300 font-medium transition-colors"
                  >
                    立即登录
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
