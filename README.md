# 时光机智能体混剪工作台

> 无需出镜，也能做IP。AI短视频生产工具，文案提取、AI改写、声音合成、数字人口播、智能剪辑、多平台发布，一条流水线全搞定。

## 技术栈

- **前端框架**: React 18
- **构建工具**: Vite 5
- **样式方案**: Tailwind CSS 3
- **路由方案**: React Router v6 (HashRouter)
- **图标库**: Lucide React
- **部署配置**: Vercel / Netlify

## 功能模块

### 营销落地页
- Hero区域 + 数据统计 + 产品矩阵
- 五步工作流展示
- 六项核心能力
- 六种混剪模式
- 创作资产库 + AI工具
- 关于我们 + 发展历程时间线
- 常见问题（可折叠）
- CTA + 页脚

### 工作台 Dashboard
| 模块 | 路由 | 功能 |
|------|------|------|
| 工作台首页 | /dashboard | 数据概览、快捷入口、最近任务、平台状态 |
| 文案提取 | /dashboard/extract | 链接粘贴、平台选择、文案提取结果 |
| AI改写 | /dashboard/rewrite | 人设风格、改写力度、语气选择、AI改写 |
| 声音合成 | /dashboard/voice | 音色选择、语速音调、情绪控制、波形预览 |
| 数字人口播 | /dashboard/digital-human | 形象选择、背景配置、口型对齐、视频生成 |
| 剪辑合成 | /dashboard/edit | 多轨时间线、字幕/画中画/BGM、一键合成 |
| 智能混剪 | /dashboard/mixed-edit | 六种混剪模式、批量出片、矩阵分发 |
| 多平台发布 | /dashboard/publish | 四大平台、封面生成、标题话题、定时发布 |
| 素材资产库 | /dashboard/assets | 视频/图片/音频/声音/BGM/模板管理 |
| 任务中心 | /dashboard/tasks | 任务列表、状态筛选、进度追踪 |

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 部署指南

### 方式一: Vercel 部署（推荐）

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 部署到生产环境
vercel --prod
```

或直接在 [vercel.com](https://vercel.com) 导入 GitHub 仓库，自动识别 Vite 项目。

### 方式二: Netlify 部署

```bash
# 1. 安装 Netlify CLI
npm i -g netlify-cli

# 2. 登录
netlify login

# 3. 部署
netlify deploy --dir=dist --prod
```

或直接在 [app.netlify.com](https://app.netlify.com) 拖拽 `dist` 文件夹。

### 方式三: GitHub Pages 部署

```bash
# 1. 创建 GitHub 仓库并推送代码
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main

# 2. 安装 gh-pages
npm i -D gh-pages

# 3. 在 package.json 中添加部署脚本
# "deploy": "gh-pages -d dist"

# 4. 构建并部署
npm run build && npm run deploy
```

### 方式四: Cloudflare Pages 部署

```bash
# 1. 安装 Wrangler
npm i -g wrangler

# 2. 登录
wrangler login

# 3. 部署
wrangler pages deploy dist --project-name=shiguangji
```

## 项目结构

```
├── src/
│   ├── components/
│   │   ├── landing/        # 落地页组件
│   │   ├── auth/           # 认证页面
│   │   └── dashboard/     # 工作台组件
│   │       └── pages/     # 各功能页面
│   ├── data/
│   │   └── constants.js   # 共享数据常量
│   ├── App.jsx             # 主路由
│   ├── main.jsx            # 入口文件
│   └── index.css           # 全局样式
├── public/
│   └── favicon.svg
├── index.html
├── vite.config.js
├── tailwind.config.js
├── netlify.toml            # Netlify 部署配置
├── vercel.json             # Vercel 部署配置
└── package.json
```

## 环境要求

- Node.js >= 18
- npm >= 8

## License

MIT
