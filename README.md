# AI 驱动的文字冒险游戏 (Whatif)

这是一个完全由 AI 实时驱动的沉浸式文字冒险游戏。游戏的每一次开局、每一个场景、每一段剧情以及对应的视觉画面，都由大语言模型和多模态生成模型实时演算生成。
- **What-If 视频生成框架** 是一个旨在解决复杂“假设性场景 (What-If scenarios)”可视化的自动化工具。传统的文本到视频模型往往缺乏物理逻辑和空间连贯性。本框架通过引入 
- **仿真模拟引擎 (Emulative Simulation)** 和 **对象状态改变 (OSC) 验收标准**，能够在调用底层渲染模型之前，先一步完成严谨的空间推理。

## ✨ 核心特性

- **无限可能的动态叙事**: 基于大语言模型 (Gemini/DeepSeek) 实时生成剧情、选项和世界规则。
- **实时视觉生成**: 根据当前剧情的上下文，自动生成分镜提示词，并实时渲染场景图像 (Gemini/Doubao)。
- **动态视频分镜**: 在后台将生成的静态场景图转化为动态视频。通关后可自动将所有片段拼接成完整的通关大片，供玩家回顾。
- **硬核生存机制**: 包含 HP 管理、规则违背惩罚、时间流逝侵蚀、天气系统和动态地图探索。
- **现代化 UI/UX**: 采用 React + Tailwind CSS 构建，结合 Framer Motion 实现流畅的交互动画和故障艺术 (Glitch) 特效。

## 🚀 快速开始

### 前置要求
- Node.js (v18+ 推荐)
- npm 或 pnpm
- **FFmpeg** (后端视频合并依赖，已通过 `@ffmpeg-installer/ffmpeg` 自动安装，无需手动配置)

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

## 📂 项目结构导览 (Directory Structure)

为了降低代码阅读门槛，以下是本框架的核心目录结构及其功能说明：
```text
whatif_video_0316/
├── public/                 # 静态资源
├── src/
│   ├── components/         # 表现层 (Presentation Layer): React UI 组件
│   │   ├── ChatInterface/  # 自然语言输入与对话面板
│   │   └── Storyboard/     # 分镜时间轴与视频预览区
│   ├── fsm/                # 应用逻辑层: 有限状态机引擎 (核心控制流)
│   ├── store/              # 应用逻辑层: 全局状态管理 (Global Context)
│   ├── orchestrator/       # AI 编排层: 包含 TPM (提示词管理) 与模型路由
│   ├── validator/          # OSC 状态校验器: 验证物理规则与逻辑连贯性
│   └── utils/              # 基础设施层: 安全代理请求、指标收集与工具函数
├── .env.example            # 环境变量配置模板
├── ARCHITECTURE.md         # 详细架构设计文档
├── PRD.md                  # 产品需求与核心逻辑说明
└── README.md               # 项目主页文档
```
> **开发者指北**：如果您想了解系统是如何判断物理逻辑是否合理的，请重点查看 `src/validator/` 目录；如果您想修改接入的 AI 模型，请查看 `src/orchestrator/` 目录。

-----

## ❓ 常见问题 (FAQ)
**Q1: 系统一直卡在 "OSC\_VALIDATION" (OSC校验) 状态怎么办？**
> **A**: 这通常意味着 AI 推理出的物理状态存在严重逻辑冲突，未通过 OSC 验收标准。您可以尝试在对话框中提供更明确的物理限制（例如：“不仅失去重力，且所有物品质量极轻”），帮助系统跳出推演死循环。

**Q2: 提示 "Model Routing Failed" 错误？**
> **A**: 请检查您的 `.env` 文件中的 API Key 是否正确且未欠费。同时检查 `src/orchestrator/Router.js` 中的网络代理设置，确保您的开发环境能够正常访问对应的 AI 服务。

**Q3: 如何将生成的推演分镜导出？**
> **A**: 目前系统支持在预览区右上角点击“Export”，将当前的时间轴序列导出为 JSON 格式的坐标点数据或基础的分镜草图合集，方便导入其他视频剪辑软件。

-----

## 📄 许可证 (License)
本项目采用 [MIT License](https://www.google.com/search?q=LICENSE) 开源许可证。
