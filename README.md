# AI 驱动的文字冒险游戏 (Whatif)

这是一个完全由 AI 实时驱动的沉浸式文字冒险游戏。游戏的每一次开局、每一个场景、每一段剧情以及对应的视觉画面，都由大语言模型和多模态生成模型实时演算生成。

## ✨ 核心特性

- **无限可能的动态叙事**: 基于大语言模型 (Gemini/DeepSeek) 实时生成剧情、选项和世界规则。
- **实时视觉生成**: 根据当前剧情的上下文，自动生成分镜提示词，并实时渲染场景图像 (Gemini/Doubao)。
- **动态视频分镜**: 在后台将生成的静态场景图转化为动态视频，可在通关后的“故事板”中回顾。
- **硬核生存机制**: 包含 HP 管理、规则违背惩罚、时间流逝侵蚀、天气系统和动态地图探索。
- **现代化 UI/UX**: 采用 React + Tailwind CSS 构建，结合 Framer Motion 实现流畅的交互动画和故障艺术 (Glitch) 特效。

## 🚀 快速开始

### 前置要求
- Node.js (v18+ 推荐)
- npm 或 pnpm

### 安装与运行
1. 安装依赖：
   ```bash
   npm install
   ```
2. 启动开发服务器：
   ```bash
   npm run dev
   ```
3. 在浏览器中打开 `http://localhost:3000`。

### API 配置
游戏在首次启动时会在界面中引导您配置 API Key。您需要准备：
- **LLM API Key**: Gemini API Key 或 DeepSeek API Key。
- **图像/视频 API Key**: Gemini API Key 或火山引擎 (Doubao) API Key。

## 🛠 技术栈
- **前端**: React 18, TypeScript, Vite
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **动画**: Framer Motion
- **AI 集成**: `@google/genai`
