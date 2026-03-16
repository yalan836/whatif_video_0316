# 系统架构文档 (ARCHITECTURE)

## 1. 技术栈
- **前端框架**: React 18 + TypeScript + Vite
- **样式方案**: Tailwind CSS
- **状态管理**: Zustand
- **动画库**: Framer Motion (motion/react)
- **AI 交互**: `@google/genai` (Gemini SDK), Fetch API (DeepSeek/Doubao)

## 2. 核心架构设计
系统采用**模块化、单向数据流**的设计，将 UI 组件、状态管理和业务逻辑严格分离。

### 2.1 状态管理 (Zustand)
应用状态被拆分为三个独立的 Store，避免不必要的全局重渲染：
- `gameStore.ts`: 管理核心游戏数据（HP、背包、地图、历史记录、故事板等）。
- `uiStore.ts`: 管理界面交互状态（加载中、当前 Tab、设置步骤、弹窗显示等）。
- `settingsStore.ts`: 管理 API 配置（Provider、API Key、模型参数等）。

### 2.2 业务逻辑层 (Hooks)
- `useGameActions.ts`: 游戏的核心控制器。负责处理玩家的输入（如开始游戏、选择选项），编排 AI 调用流程，并更新 `gameStore`。
  - **防竞态设计**: 内部使用 `AbortController`，在发起新的 AI 请求时自动中止旧请求，防止异步回调导致的状态覆盖。

### 2.3 AI 服务层 (Services)
- `aiService.ts`: 封装了所有与外部 AI 模型的通信逻辑。
  - `callAI`: 调用 LLM 生成 JSON 格式的剧情和状态更新。
  - `generateImage`: 调用图像模型生成场景图。
  - `generateVideo`: 调用视频模型生成动态分镜。
- `gamePrompts.ts`: 集中管理和构建发送给 LLM 的 Prompt 模板，确保输出格式（JSON）和业务规则的严格执行。

## 3. 核心工作流 (AI 生成顺序)
当玩家做出选择或游戏开始时，系统严格按照以下顺序执行：
1. **文本与逻辑生成 (LLM)**: `useGameActions` 调用 `callAI`，LLM 返回包含剧情文本、选项、状态更新以及**双重分镜系统 (visual_sequence)** 的 JSON 数据。`visual_sequence` 包含 `subject_consistency`（视觉锚点）、`action_shot`（动作过程）和 `result_shot`（结果场景）。
2. **场景图像生成 (Text-to-Image)**: 解析 JSON 后，立即使用提取出的 `visual_sequence` 构建提示词，并调用 `generateImage` 生成当前场景的静态图片。如果 API 支持，会将上一帧图片作为参考图传入以保持视觉连贯性。
3. **动态视频生成 (Image-to-Video)**: 图像生成完成后，后台异步调用 `generateVideo`，传入上一帧图像（首帧）、动作描述（过程）和新生成的图像（末帧），生成连贯的动作视频并附加到故事板中。

## 4. 目录结构
```text
src/
├── components/       # React UI 组件 (游戏主界面、设置界面、特效等)
├── hooks/            # 自定义 Hooks (useGameActions)
├── services/         # 外部服务集成 (aiService)
├── store/            # Zustand 状态管理 (gameStore, uiStore, settingsStore)
├── prompts/          # AI Prompt 模板
├── types.ts          # 全局 TypeScript 类型定义
├── constants.ts      # 全局常量 (UI 文本等)
├── App.tsx           # 根组件，负责路由分发
└── main.tsx          # 入口文件
```
