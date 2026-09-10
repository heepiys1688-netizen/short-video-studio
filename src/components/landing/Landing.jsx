import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock, ArrowRight, Play, Sparkles, ChevronDown, Menu, X,
  Link2, Mic, Film, Share2, LayoutGrid, FileText, Scissors,
  Shuffle, LayoutTemplate, PenLine, AudioWaveform, UserCircle,
  ImagePlus, MapPin, Target, Layers, Zap, Cloud, ShieldCheck,
  RefreshCw, CheckCircle2, TrendingUp, Globe, Cpu, Database,
  Lock, Monitor, PlayCircle, ArrowUpRight, Rocket, BarChart3,
  Server, Workflow as WorkflowIcon, Wand2,
} from 'lucide-react'
import {
  STATS, WORKFLOW_STEPS, CAPABILITIES, MIX_MODES, TIMELINE, FAQS,
} from '../../data/constants'

// ---------------------------------------------------------------------------
// Icon map - maps string names from constants to actual lucide components
// ---------------------------------------------------------------------------
const iconMap = {
  Link2, Sparkles, Mic, Film, Share2,
  PenLine, AudioWaveform, UserCircle, ImagePlus,
  Scissors, Shuffle, LayoutGrid, FileText, LayoutTemplate,
}

const getIcon = (name) => iconMap[name] || Sparkles

// ---------------------------------------------------------------------------
// Shared data (inline content for sections not covered by constants)
// ---------------------------------------------------------------------------
const PRODUCT_MATRIX = [
  {
    title: '数字人口播 · 单条精做',
    subtitle: '适合精品口播视频，精修打磨打造爆款',
    icon: 'UserCircle',
    gradient: 'from-indigo-500 to-purple-600',
    accent: 'text-indigo-400',
    features: [
      '文案 → 配音 → 数字人 → 合成，一站式单条精做',
      '口型精准对齐，情绪语速精细可调，成片即投即用',
      '统一人设与音色，一条条打磨爆款口播',
      '数字人资产可复用，把"人"这一最贵成本变资产',
    ],
  },
  {
    title: '智能混剪 · 矩阵铺量',
    subtitle: '适合矩阵号批量铺量，一套素材大量出片',
    icon: 'Shuffle',
    gradient: 'from-pink-500 to-fuchsia-600',
    accent: 'text-pink-400',
    features: [
      '一套素材快速产出大量差异化成片，铺量起号',
      '六种混剪模式按需切换，随机 / 分镜 / 脚本 / 模板',
      '批量导出，矩阵多号运营不串内容',
      '从"做一条"到"做一批"，效率提升10×',
    ],
  },
]

const WHY_CHOOSE = [
  {
    icon: 'Zap',
    title: '默认能用少填参数',
    desc: '系统预置合理默认值，最少填几个参数就能出片。不用从零开始配置，打开即用，把"设置"这件麻烦事降到最低，让创作回归创作本身。',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: 'Cloud',
    title: '云端运行数据自主',
    desc: '全流程云端运行，不占本地算力，打开浏览器就能干活。每个账号独立空间，文案、素材、配音、成片都沉淀在自己账号下，按用户隔离，数据自主可控。',
    gradient: 'from-sky-500 to-blue-500',
  },
  {
    icon: 'ShieldCheck',
    title: '工程化稳定可靠',
    desc: '以工程化标准打磨每一环，引擎稳定、链路顺畅、结果可复现。这不是玩具 Demo，而是能长期跑业务的生产级工具，扛得住高频使用与批量任务。',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: 'RefreshCw',
    title: '陪你迭代到能赚钱',
    desc: '不止给你工具，更陪你跑通"内容-流量-变现"闭环。持续迭代能力、更新玩法，和你的账号一起成长，直到真正能稳定产出、持续赚钱。',
    gradient: 'from-fuchsia-500 to-pink-500',
  },
]

const ABOUT_INFO = [
  { icon: 'MapPin', label: '总部位置', value: '中国' },
  { icon: 'Target', label: '核心方向', value: 'AI智能体' },
  { icon: 'Layers', label: '产品形态', value: '混剪矩阵' },
]

const NAV_ITEMS = [
  { label: '首页', href: '#top' },
  { label: '能力', href: '#capabilities' },
  { label: '混剪模式', href: '#mix-modes' },
  { label: '常见问题', href: '#faq' },
]

// ---------------------------------------------------------------------------
// Section 1: Navigation Bar
// ---------------------------------------------------------------------------
function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const goAuth = () => {
    setMenuOpen(false)
    navigate('/auth')
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass-card backdrop-blur-xl bg-dark-950/70 border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#top" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center glow">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="text-lg font-bold text-white">时光机</span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm text-dark-300 hover:text-white transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* CTA button + mobile menu */}
          <div className="flex items-center gap-3">
            <button
              onClick={goAuth}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-brand-500 to-accent-500 hover:opacity-90 transition-opacity glow"
            >
              进入工作台
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-white p-1"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden glass-card border-t border-white/5 px-4 py-4 space-y-3">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="block text-sm text-dark-300 hover:text-white transition-colors py-1"
            >
              {item.label}
            </a>
          ))}
          <button
            onClick={goAuth}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-brand-500 to-accent-500"
          >
            进入工作台
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </nav>
  )
}

// ---------------------------------------------------------------------------
// Section 2: Hero
// ---------------------------------------------------------------------------
function Hero() {
  const navigate = useNavigate()

  const pipelineSteps = [
    { icon: Link2, label: '提取文案' },
    { icon: Sparkles, label: 'AI改写' },
    { icon: Mic, label: '配音' },
    { icon: Film, label: '剪辑' },
    { icon: Share2, label: '发布' },
  ]

  return (
    <section id="top" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background glows */}
      <div className="hero-glow w-[500px] h-[500px] bg-brand-500 -top-20 -left-20" />
      <div className="hero-glow w-[400px] h-[400px] bg-accent-500 top-1/3 -right-20" style={{ animationDelay: '1s' }} />
      <div className="hero-glow w-[300px] h-[300px] bg-purple-600 bottom-0 left-1/3" style={{ animationDelay: '2s' }} />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-dark-300">AI智能体混剪工作台 · 正式发布</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight mb-6 animate-slide-up">
          无需出镜，<span className="gradient-text">也能做IP</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg lg:text-xl text-dark-400 max-w-3xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
          像驾驭时光一样驾驭AI，把创作时间折叠。文案提取、AI改写、声音合成、数字人口播、智能剪辑、多平台发布，一条流水线全搞定。
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => navigate('/auth')}
            className="group flex items-center gap-2 px-7 py-3.5 rounded-2xl text-base font-medium text-white bg-gradient-to-r from-brand-500 to-accent-500 hover:opacity-90 transition-all glow-hover"
          >
            进入工作台
            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <a
            href="#capabilities"
            className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-base font-medium text-white glass-card hover:bg-white/5 transition-colors"
          >
            <Play className="w-4 h-4" />
            看看它能做什么
          </a>
        </div>

        {/* Animated pipeline visualization */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-dark-400 font-medium">一条流水线全搞定</span>
            <span className="text-xs text-brand-400 font-mono">flow.shiguangji.ai</span>
          </div>
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            {pipelineSteps.map((step, idx) => {
              const Icon = step.icon
              return (
                <div key={step.label} className="flex items-center gap-1 sm:gap-2 flex-1">
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 border border-brand-500/30 flex items-center justify-center">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-brand-300" />
                    </div>
                    <span className="text-[10px] sm:text-xs text-dark-300">{step.label}</span>
                  </div>
                  {idx < pipelineSteps.length - 1 && (
                    <div className="hidden sm:block w-6 h-px bg-gradient-to-r from-brand-500/50 to-accent-500/50" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Section 3: Stats
// ---------------------------------------------------------------------------
function Stats() {
  return (
    <section className="relative py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {STATS.map((stat, idx) => (
            <div
              key={idx}
              className="glass-card rounded-2xl p-6 text-center hover:glow-hover transition-all"
            >
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-bold gradient-text">
                  {stat.value}
                </span>
                {stat.unit && (
                  <span className="text-lg sm:text-xl font-semibold text-white">
                    {stat.unit}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-dark-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Section 4: Product Matrix
// ---------------------------------------------------------------------------
function ProductMatrix() {
  return (
    <section className="relative py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium text-brand-300 bg-brand-500/10 mb-4">
            产品矩阵
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            两条产品线，<span className="gradient-text">覆盖从精做到铺量</span>
          </h2>
          <p className="text-base text-dark-400 max-w-2xl mx-auto">
            单条精做打磨爆款，矩阵铺量批量起号。根据你的运营阶段，选最合适的生产方式。
          </p>
        </div>

        {/* Two big cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {PRODUCT_MATRIX.map((card) => {
            const Icon = getIcon(card.icon)
            return (
              <div
                key={card.title}
                className="glass-card rounded-3xl p-8 hover:glow-hover transition-all group relative overflow-hidden"
              >
                {/* Decorative gradient */}
                <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full bg-gradient-to-br ${card.gradient} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity`} />

                <div className="relative">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center glow`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white">{card.title}</h3>
                      <p className={`text-sm ${card.accent}`}>{card.subtitle}</p>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {card.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 ${card.accent}`} />
                        <span className="text-sm text-dark-300 leading-relaxed">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Section 5: Workflow
// ---------------------------------------------------------------------------
function Workflow() {
  return (
    <section className="relative py-16 sm:py-24">
      {/* Background glow */}
      <div className="hero-glow w-[400px] h-[400px] bg-brand-500 top-1/2 left-1/4 opacity-10" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium text-accent-300 bg-accent-500/10 mb-4">
            工作流
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            五步，<span className="gradient-text">从一个链接到一条发布的视频</span>
          </h2>
          <p className="text-base text-dark-400 max-w-2xl mx-auto">
            从粘贴链接到一键发布，全流程不用切软件，一条流水线跑完。
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {WORKFLOW_STEPS.map((step, idx) => {
            const Icon = getIcon(step.icon)
            const isLast = idx === WORKFLOW_STEPS.length - 1
            return (
              <div key={step.step} className="relative">
                <div className="glass-card rounded-2xl p-6 h-full hover:glow-hover transition-all relative">
                  {/* Step number */}
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold glow">
                    {step.step}
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 border border-brand-500/30 flex items-center justify-center mb-4 mt-2">
                    <Icon className="w-6 h-6 text-brand-300" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-xs text-dark-400 leading-relaxed">{step.desc}</p>
                </div>

                {/* Connector line - desktop */}
                {!isLast && (
                  <div className="hidden lg:flex absolute top-1/2 -right-6 items-center">
                    <div className="w-12 h-px bg-gradient-to-r from-brand-500/50 to-accent-500/50" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Section 6: Capabilities
// ---------------------------------------------------------------------------
function Capabilities() {
  return (
    <section id="capabilities" className="relative py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium text-brand-300 bg-brand-500/10 mb-4">
            核心能力
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            六项核心能力，<span className="gradient-text">覆盖短视频生产全链路</span>
          </h2>
          <p className="text-base text-dark-400 max-w-2xl mx-auto">
            从文案到发布，每一环都有专业能力支撑，一条流水线覆盖短视频生产全链路。
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CAPABILITIES.map((cap) => {
            const Icon = getIcon(cap.icon)
            return (
              <div
                key={cap.id}
                className="glass-card rounded-2xl p-6 hover:glow-hover transition-all group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 border border-brand-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5 text-brand-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{cap.name}</h3>
                </div>
                <p className="text-sm text-dark-400 leading-relaxed mb-4">{cap.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {cap.features.map((feat, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-dark-300 border border-white/5"
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Section 7: Mixed Modes
// ---------------------------------------------------------------------------
function MixedModes() {
  return (
    <section id="mix-modes" className="relative py-16 sm:py-24">
      {/* Background glow */}
      <div className="hero-glow w-[400px] h-[400px] bg-accent-500 top-1/3 right-0 opacity-10" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium text-accent-300 bg-accent-500/10 mb-4">
            混剪模式
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            六种混剪模式，<span className="gradient-text">按需量产</span>
          </h2>
          <p className="text-base text-dark-400 max-w-2xl mx-auto">
            从随机铺量到脚本精修，六种模式覆盖不同场景，按需切换、灵活量产。
          </p>
        </div>

        {/* Sub-section: 创作资产·即取即用 + AI工具·智能省心 */}
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
              <ImagePlus className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">创作资产 · 即取即用</h3>
              <p className="text-xs text-dark-400">数字人形象、克隆音色、B-roll素材库，沉淀在账号下随时调用。</p>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
              <Wand2 className="w-5 h-5 text-brand-300" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">AI工具 · 智能省心</h3>
              <p className="text-xs text-dark-400">文案改写、脚本生成、自动配音、智能剪辑，AI帮你把活干完。</p>
            </div>
          </div>
        </div>

        {/* Six mode cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MIX_MODES.map((mode) => {
            const Icon = getIcon(mode.icon)
            return (
              <div
                key={mode.id}
                className="glass-card rounded-2xl p-6 hover:glow-hover transition-all group relative overflow-hidden"
              >
                <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br ${mode.color} opacity-5 blur-2xl group-hover:opacity-15 transition-opacity`} />

                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-lg bg-gradient-to-r ${mode.color} bg-clip-text text-transparent font-medium border border-white/10`}>
                      {mode.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{mode.name}</h3>
                  <p className="text-sm text-dark-400 leading-relaxed mb-4">{mode.desc}</p>
                  <ul className="space-y-2">
                    {mode.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-dark-300">
                        <span className={`w-1 h-1 rounded-full bg-gradient-to-r ${mode.color}`} />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Section 8: Why Choose
// ---------------------------------------------------------------------------
function WhyChoose() {
  const iconMapLocal = {
    Zap, Cloud, ShieldCheck, RefreshCw,
  }

  return (
    <section className="relative py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium text-brand-300 bg-brand-500/10 mb-4">
            为什么选择我们
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            为什么选择<span className="gradient-text">时光机</span>
          </h2>
          <p className="text-base text-dark-400 max-w-2xl mx-auto">
            不只是工具，而是能长期陪你跑业务的AI生产伙伴。
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {WHY_CHOOSE.map((item, idx) => {
            const Icon = iconMapLocal[item.icon] || Sparkles
            return (
              <div
                key={idx}
                className="glass-card rounded-2xl p-7 hover:glow-hover transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform glow`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-dark-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Section 9: About
// ---------------------------------------------------------------------------
function About() {
  const iconMapLocal = {
    MapPin, Target, Layers,
  }

  return (
    <section className="relative py-16 sm:py-24">
      {/* Background glow */}
      <div className="hero-glow w-[400px] h-[400px] bg-purple-600 bottom-0 right-1/4 opacity-10" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium text-accent-300 bg-accent-500/10 mb-4">
            关于我们
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            关于<span className="gradient-text">时光机</span>
          </h2>
          <p className="text-base text-dark-400 max-w-2xl mx-auto">
            以"AI混剪智能体"为核心方向，做能跑通业务的AI产品。
          </p>
        </div>

        {/* Company info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
          {ABOUT_INFO.map((info, idx) => {
            const Icon = iconMapLocal[info.icon] || Sparkles
            return (
              <div
                key={idx}
                className="glass-card rounded-2xl p-6 text-center hover:glow-hover transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 border border-brand-500/30 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6 text-brand-300" />
                </div>
                <p className="text-xs text-dark-400 mb-1">{info.label}</p>
                <p className="text-lg font-semibold text-white">{info.value}</p>
              </div>
            )
          })}
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-brand-500/50 via-accent-500/50 to-transparent sm:-translate-x-px" />

          <div className="space-y-8">
            {TIMELINE.map((item, idx) => {
              const isLeft = idx % 2 === 0
              return (
                <div
                  key={idx}
                  className={`relative flex items-start sm:items-center gap-6 ${
                    isLeft ? 'sm:flex-row' : 'sm:flex-row-reverse'
                  }`}
                >
                  {/* Dot */}
                  <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 z-10">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 border-4 border-dark-950 glow" />
                  </div>

                  {/* Card */}
                  <div className={`w-full sm:w-1/2 pl-12 sm:pl-0 ${isLeft ? 'sm:pr-12' : 'sm:pl-12'}`}>
                    <div className="glass-card rounded-2xl p-6 hover:glow-hover transition-all">
                      <span className="text-sm font-bold gradient-text">{item.year}</span>
                      <h3 className="text-lg font-semibold text-white mt-1 mb-2">{item.title}</h3>
                      <p className="text-sm text-dark-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>

                  {/* Spacer for the other half */}
                  <div className="hidden sm:block w-1/2" />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Section 10: FAQ
// ---------------------------------------------------------------------------
function FAQ() {
  const [openIndex, setOpenIndex] = useState(0)

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx)
  }

  return (
    <section id="faq" className="relative py-16 sm:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium text-brand-300 bg-brand-500/10 mb-4">
            常见问题
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            常见<span className="gradient-text">问题</span>
          </h2>
          <p className="text-base text-dark-400 max-w-2xl mx-auto">
            关于产品、使用方式与数据安全的常见疑问，先在这里找答案。
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx
            return (
              <div
                key={idx}
                className="glass-card rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="text-sm sm:text-base font-medium text-white flex items-center gap-3">
                    <span className="text-brand-400 font-mono text-xs flex-shrink-0">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-dark-400 flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 pl-12 text-sm text-dark-400 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Section 11: CTA
// ---------------------------------------------------------------------------
function CTASection() {
  const navigate = useNavigate()

  return (
    <section className="relative py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative glass-card rounded-3xl p-8 sm:p-12 lg:p-16 text-center overflow-hidden">
          {/* Background glows */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-accent-500/10" />
          <div className="hero-glow w-[300px] h-[300px] bg-brand-500 -top-10 -left-10 opacity-20" />
          <div className="hero-glow w-[300px] h-[300px] bg-accent-500 -bottom-10 -right-10 opacity-20" style={{ animationDelay: '1s' }} />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card mb-6">
              <Rocket className="w-4 h-4 text-brand-300" />
              <span className="text-xs text-dark-300">免费开始 · 所有功能可体验</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              把你的短视频IP，<br className="hidden sm:block" />
              交给<span className="gradient-text">时光机跑流水线</span>
            </h2>
            <p className="text-base sm:text-lg text-dark-400 mb-8 max-w-2xl mx-auto">
              注册即可免费开始，所有功能均可实际体验。
            </p>

            <button
              onClick={() => navigate('/auth')}
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-medium text-white bg-gradient-to-r from-brand-500 to-accent-500 hover:opacity-90 transition-all glow"
            >
              进入工作台
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Section 12: Footer
// ---------------------------------------------------------------------------
function Footer() {
  return (
    <footer className="relative border-t border-white/5 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-white">时光机</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-dark-400">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="hover:text-white transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-xs text-dark-500">
            © {new Date().getFullYear()} 时光机 · AI智能体混剪工作台
          </p>
        </div>
      </div>
    </footer>
  )
}

// ---------------------------------------------------------------------------
// Main Landing Component
// ---------------------------------------------------------------------------
export default function Landing() {
  return (
    <div className="relative min-h-screen bg-dark-950 text-white overflow-x-hidden">
      {/* Global background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand-500/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <LandingNav />
        <Hero />
        <Stats />
        <ProductMatrix />
        <Workflow />
        <Capabilities />
        <MixedModes />
        <WhyChoose />
        <About />
        <FAQ />
        <CTASection />
        <Footer />
      </div>
    </div>
  )
}
