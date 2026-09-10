// Shared constants for the entire app

export const PLATFORMS = [
  { id: 'douyin', name: '抖音', color: '#000000', bg: 'bg-black', icon: '🎵' },
  { id: 'xiaohongshu', name: '小红书', color: '#ff2442', bg: 'bg-red-500', icon: '📕' },
  { id: 'shipinhao', name: '视频号', color: '#07c160', bg: 'bg-green-500', icon: '📺' },
  { id: 'kuaishou', name: '快手', color: '#ff4906', bg: 'bg-orange-500', icon: '⚡' },
]

export const MIX_MODES = [
  {
    id: 'yijianmei',
    name: '一剪媒',
    tag: '矩阵铺号首选',
    desc: '面向矩阵号的批量出片模式，一套素材快速产出大量差异化成片，铺量起号效率拉满。',
    icon: 'Scissors',
    features: ['批量差异化出片', '矩阵号专属优化', '快速铺量起号', '一键批量导出'],
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'suiji',
    name: '随机混剪',
    tag: '一键起量',
    desc: '按规则从素材库随机抽取组合，自动拼接成片，最少操作快速产出大批量短视频。',
    icon: 'Shuffle',
    features: ['随机抽取组合', '最少操作出片', '大批量产出', '自动拼接成片'],
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'fenjing',
    name: '分镜王',
    tag: '结构化精排',
    desc: '分镜级精排，按镜头逐段编排素材与节奏，做结构清晰、可控性强的成片。',
    icon: 'LayoutGrid',
    features: ['分镜级精排', '逐段编排素材', '结构清晰可控', '节奏精细调节'],
    color: 'from-amber-500 to-red-500',
  },
  {
    id: 'jiaoben',
    name: '脚本驱动',
    tag: '表格式分镜',
    desc: 'AI一键出脚本，每行配素材、自动TTS配音，合成精修的单条成片，适合打磨爆款。',
    icon: 'FileText',
    features: ['AI一键出脚本', '每行配素材', '自动TTS配音', '单条精修成片'],
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'koubo',
    name: '口播合成',
    tag: '音频配画面',
    desc: '上传口播音频或文本走TTS，自动按句切分、每句配B-roll，合成带字幕成片。',
    icon: 'Mic',
    features: ['音频/文本输入', '按句自动切分', '每句配B-roll', '自动字幕成片'],
    color: 'from-indigo-500 to-blue-500',
  },
  {
    id: 'moban',
    name: '模板化混剪',
    tag: '验证过的结构',
    desc: '套用"钩子-痛点-卖点-CTA"等验证过的结构，结合产品信息一键产出符合模板的成片。',
    icon: 'LayoutTemplate',
    features: ['钩子-痛点-卖点-CTA', '验证结构模板', '产品信息自动引用', '一键套模板出片'],
    color: 'from-rose-500 to-pink-500',
  },
]

export const CAPABILITIES = [
  {
    id: 'script',
    name: '文案 · 提取改写',
    icon: 'PenLine',
    desc: '对着链接干活，不再手动抄文案。支持原片文案提取、AI改写出新人设新风格，自动生成新标题与话题标签，可手动润色。',
    features: ['原片文案提取', 'AI改写定风格', '自动生成标题话题', '手动润色微调'],
  },
  {
    id: 'audio',
    name: '音频 · 声音克隆',
    icon: 'AudioWaveform',
    desc: '不必出镜也能输出"自己的声音"。基于高精度TTS引擎合成，情绪、语速、停顿精细可调，多音色管理，账号矩阵不串声。',
    features: ['高精度TTS合成', '情绪语速可调', '多音色管理', '矩阵不串声'],
  },
  {
    id: 'digital',
    name: '数字人 · 口播视频',
    icon: 'UserCircle',
    desc: '把"人"这一最贵的成本，变成可复用的资产。多形象可选，口型与音频自动精准对齐，批量输出，多账号矩阵管够。',
    features: ['多形象可选', '口型自动对齐', '批量输出口播', '矩阵多账号'],
  },
  {
    id: 'edit',
    name: '剪辑 · 合成',
    icon: 'Film',
    desc: '从音视频原料，到可投放成片，中间不用切软件。字幕自动对齐、画中画素材叠加、背景音乐混合，一键合成最终成片。',
    features: ['字幕自动对齐', '画中画叠加', 'BGM混合', '一键合成成片'],
  },
  {
    id: 'cover',
    name: '封面 · 模板化生成',
    icon: 'ImagePlus',
    desc: '不再为每一条视频单独做封面图。模板化封面生成，秒级出图，标题文案与视觉自动适配，批量出片不再卡瓶颈。',
    features: ['模板化封面', '秒级出图', '标题视觉适配', '批量封面生成'],
  },
  {
    id: 'publish',
    name: '发布 · 多平台分发',
    icon: 'Share2',
    desc: '从生产到分发，最后一公里也帮你跑完。支持抖音/小红书/视频号/快手，标题、话题、封面自动填充，任务中心可追踪。',
    features: ['四大平台支持', '标题话题自动填充', '封面自动填充', '任务中心追踪'],
  },
]

export const WORKFLOW_STEPS = [
  {
    step: 1,
    title: '提取原片文案',
    desc: '粘贴抖音/小红书视频链接，系统自动识别并完整抽出原片文案，含标题、正文、话题。',
    icon: 'Link2',
  },
  {
    step: 2,
    title: 'AI改写定风格',
    desc: '一键AI改写成你的人设语气，可手动微调，自动生成新标题与话题，避免同质化。',
    icon: 'Sparkles',
  },
  {
    step: 3,
    title: '声音 + 数字人',
    desc: '用克隆音色生成配音，挑选数字人形象生成口播视频，情绪、语速、停顿都能调。',
    icon: 'Mic',
  },
  {
    step: 4,
    title: '剪辑合成出片',
    desc: '字幕自动对齐、画中画素材叠加、背景音乐混合，一键合成可投放的成片。',
    icon: 'Film',
  },
  {
    step: 5,
    title: '一键多平台发布',
    desc: '生成封面，自动填充标题与话题，直接发布或存草稿，四大平台同步分发。',
    icon: 'Share2',
  },
]

export const STATS = [
  { value: '3', unit: '分钟', label: '从想法到一条爆款口播视频' },
  { value: '4', unit: '大平台', label: '抖音 · 小红书 · 视频号 · 快手' },
  { value: '5', unit: '步成片', label: '提取 → 改写 → 配音 → 剪辑 → 发布' },
  { value: '10×', unit: '', label: '短视频生产效率提升' },
]

export const TIMELINE = [
  { year: '2024', title: '品牌创立', desc: '「时光机」智能体团队成立，确立以"AI混剪智能体"为核心的业务方向。' },
  { year: '2025', title: '引擎集成 · 原型验证', desc: '完成核心引擎（语音识别、TTS、数字人、剪辑合成）集成与原型验证，跑通文案到成片的完整链路。' },
  { year: '2026', title: '混剪工作台 · 正式发布', desc: '官网上线，时光机智能体混剪工作台进入公开发布阶段，覆盖抖音/小红书/视频号/快手四大平台。' },
  { year: '未来', title: '能力扩展 · 场景深耕', desc: '在混剪之外，向更多垂直内容场景与企业级智能体延伸，做"能跑通业务"的AI产品。' },
]

export const FAQS = [
  {
    q: '时光机智能体混剪工作台是什么？',
    a: '它是一款浏览器端AI短视频生产工具，覆盖从文案提取、AI改写、语音合成、数字人口播、智能剪辑到多平台一键分发的全流程，目标是让一个人也能稳定输出短视频IP内容。',
  },
  {
    q: '它适合哪些用户使用？',
    a: '主要面向短视频矩阵运营者、个人自媒体创作者、小型工作室和轻量电商内容团队，以及任何希望以更低成本、更稳定节奏输出短视频IP内容的人。不必出镜，也不必懂剪辑。',
  },
  {
    q: '支持发布到哪些短视频平台？',
    a: '目前支持抖音、小红书、视频号、快手四大主流平台。标题与话题自动填充，可直接导出发布包，也可保存为草稿后手动确认；任务中心可追踪每一条视频的发布状态。',
  },
  {
    q: '数据安全和隐私如何保障？',
    a: '每个用户拥有独立的账号空间，文案、素材、配音、成片都沉淀在你的账号下，按用户隔离，企业级团队也可放心使用。',
  },
  {
    q: '需要什么样的设备？',
    a: '只需一台能打开现代浏览器的电脑或手机即可，无需安装任何软件，打开网页即可开始创作。',
  },
  {
    q: '如何开始使用？',
    a: '点击「进入工作台」，注册一个账号即可免费开始使用，所有功能均可实际体验。',
  },
]

export const SIDEBAR_ITEMS = [
  { id: 'home', name: '工作台首页', icon: 'LayoutDashboard', path: '/dashboard' },
  { id: 'extract', name: '文案提取', icon: 'Link2', path: '/dashboard/extract' },
  { id: 'rewrite', name: 'AI改写', icon: 'Sparkles', path: '/dashboard/rewrite' },
  { id: 'voice', name: '声音合成', icon: 'AudioWaveform', path: '/dashboard/voice' },
  { id: 'digital-human', name: '数字人口播', icon: 'UserCircle', path: '/dashboard/digital-human' },
  { id: 'edit', name: '剪辑合成', icon: 'Film', path: '/dashboard/edit' },
  { id: 'mixed-edit', name: '智能混剪', icon: 'Shuffle', path: '/dashboard/mixed-edit' },
  { id: 'publish', name: '多平台发布', icon: 'Share2', path: '/dashboard/publish' },
  { id: 'assets', name: '素材资产库', icon: 'FolderOpen', path: '/dashboard/assets' },
  { id: 'tasks', name: '任务中心', icon: 'ListChecks', path: '/dashboard/tasks' },
]
