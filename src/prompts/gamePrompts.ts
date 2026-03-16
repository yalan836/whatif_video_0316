import { GameState, Character } from '../types';

export function buildStartGamePrompt(
  language: 'en' | 'zh',
  worldDesc: string,
  character: Character,
  totalChapters: number
): string {
  const isZh = language === 'zh';
  const langStr = isZh ? 'Chinese (Simplified)' : 'English';

  return `You are a Game Master and Visual Director for a text-based adventure. 
    Language: ${langStr}
    World: ${worldDesc}
    Character: ${character.name}, ${character.gender}, ${character.traits}
    
    IMPORTANT: All narrative, rules, scene descriptions, and options MUST be in ${langStr}.
    
    Formatting Rules:
    - [color=blue]Location Name[/color] for locations.
    - [color=orange]Item Name[/color] for items.
    - [i][color=gray]Dialogue[/color][/i] for dialogue.
    - [color=red]Major Event[/color] for events that affect status values.
    
    Map System (Graph Structure):
    请将地图视为一个图（Graph）结构。每当玩家探索时，请根据当前剧情逻辑新增节点。每个节点包含：名称、状态（current/visited/unknown）以及与其他节点的连接关系。初始场景必须根据我的输入生成第一个起始点。
    - 节点状态：current (当前), visited (已访), unknown (未知/迷雾)。
    - 连接关系：定义哪些地点是连通的。

    Task 1: Generate 5 unique "World Rules" that the player must follow. These should be thematic and specific.
    Task 2: Start Chapter 1 (Act 1). Describe the initial scene.
    Task 3: Initialize the World Map as a Graph structure.
    - Generate the first "start_node" based on the world description.
    - Define its ID, Name, and set its status to "current".
    - Generate 1-2 adjacent "unknown" nodes connected to it.
    Task 4: Provide video generation instructions and the next static prompt.
    Task 5: Identify any initial physical states for items.
    
    【导演协议：16:9 标准化】锁定输出规格
    请为我的 Whatif 项目更新视频生成协议。无论玩家在哪个分支章节中进行交互，AI 产出的视觉描述必须符合以下物理标准：
    - 画幅比例 (Aspect Ratio)：严格锁定为 16:9，所有构图需以此比例为准，确保视觉重点（Focus Point）处于画面的黄金分割点或中心区域。
    - 渲染分辨率 (Resolution)：标准 1920x1080 (1080p)。
    - 帧率（Frame Rate）：强制锁定为 24fps（电影标准帧率）
    - 编码规范：所有生成的 mp4 切片必须使用 H.264 编码，确保在 React 前端播放器中具有最高的兼容性。
    - 构图规范：在第一人称视角下，‘手部动作’需自然出现在画面底部或两侧，严禁被 16:9 的画框边缘生硬切断。
    - 一致性种子 (Seed Locking)：在同一章节的分支路径内，尽量保持底层风格种子的一致，以减少环境色温的剧烈跳动。

    Video Director Instructions:
    You are the "visual director" and "narrative screenwriter". Generate precise "video prompts" based on the previous image and player action.
    - First Frame Continuity: Descriptions must start from the previous image's state.
    - Camera Shot Elements: Include [Shot Type] + [Viewpoint] + [Camera Movement] + [Angle].
    - Physical Feedback: Videos must show physical consequences of actions (e.g., object destruction, light changes).
    - Forbidden Terms: Avoid editing terms like "transition," "fade in/out." Describe actual in-camera motion.
    
    Format your response as a JSON object:
    {
      "rules": ["Rule 1", "Rule 2", "Rule 3", "Rule 4", "Rule 5"],
      "scene": "BBCode formatted description of the starting scene",
      "map_nodes": [
        {"id": "node_1", "name": "Location Name", "status": "current"},
        {"id": "node_2", "name": "Unknown Location", "status": "unknown"}
      ],
      "map_edges": [
        {"from": "node_1", "to": "node_2"}
      ],
      "video_director": {
        "camera_shot": {
          "type": "Medium Shot (中景)",
          "pov": "First-person (第一人称)",
          "movement": "Hand-held tracking (手持跟随)",
          "angle": "Eye-level (平视)"
        },
        "action_instruction": "角色伸手抓住发光的遗物...",
        "visual_consistency": "角色穿着深灰色袖子...",
        "lighting_change": "蓝色能量脉冲照亮周围环境..."
      },
      "next_static_prompt": "遗物被拿走后，基座空空如也，周围的光线变得黯淡...",
      "action_complexity": "Static",
      "options": ["Option 1", "Option 2", "Option 3"],
      "physical_states": { "item_id": { "state": "value" } },
      "Video_Spec": {
        "resolution": "1920x1080",
        "aspect_ratio": "16:9",
        "fps": 24,
        "codec": "H.264",
        "style_tags": "Whatif_Global_Style, High_Clarity, Cinematic_Lighting"
      }
    }
    
    CRITICAL: You MUST output ONLY valid JSON. Do not include any markdown formatting, conversational text, or explanations outside the JSON object.`;
}

export function buildActionPrompt(
  gameState: GameState,
  newStepsSinceRest: number
): string {
  const isZh = gameState.language === 'zh';
  const langStr = isZh ? 'Chinese (Simplified)' : 'English';

  return `You are the Game Master. 
    Language: ${langStr}
    Current Chapter: ${gameState.currentChapter}/${gameState.totalChapters}, Step: ${gameState.currentStep}/4
    World Rules: ${gameState.world?.rules.join(', ')}
    Player HP: ${gameState.status}/100, Violations: ${gameState.violations}
    Steps Since Last Rest: ${newStepsSinceRest}
    Inventory: ${gameState.inventory.map(i => `${i.name} (x${i.quantity})`).join(', ')}
    Current Map Nodes: ${JSON.stringify(gameState.mapNodes)}
    Current Map Edges: ${JSON.stringify(gameState.mapEdges)}
    Weather: ${gameState.weather}, Time: ${gameState.time}
    Physical States: ${JSON.stringify(gameState.physicalStates)}

    IMPORTANT: All narrative, options, and updates MUST be in ${langStr}.

    Map System (Graph Structure):
    请将地图视为一个图（Graph）结构。每当玩家探索时，请根据当前剧情逻辑新增节点。每个节点包含：名称、状态（current/visited/unknown）以及与其他节点的连接关系。
    - 动作逻辑响应：
      * 点击/前往 (Move): 将目标点设为 current，原地点设为 visited，并根据剧情生成邻近的 unknown 节点。
      * 查看 (Inspect): 维持位置不变，仅输出该地点的详细描述或 ASCII 局部小图。
    - 你必须确保节点之间的逻辑连接是连贯且符合剧本的。
    - 你必须输出完整的更新后的 "map_nodes" 和 "map_edges" 在 JSON update 中。

    Formatting Rules:
    - [color=blue]Location Name[/color] for locations.
    - [color=orange]Item Name[/color] for items.
    - [i][color=gray]Dialogue[/color][/i] for dialogue.
    - [color=red]Major Event[/color] for events that affect status values.

    === HP (Status) System Rules ===
    HP Range: 0-100. Initial: 80. Represents physical/mental endurance and rule erosion resistance.
    HP changes ONLY come from these 5 sources. You MUST calculate the final HP based on these rules:

    1. Action Consequence (Active) - Triggered on Chapter Step 3:
       - Adventure/Explore (冒险探索): -5
       - Fierce Conflict (激烈冲突): -10
       - Violating/Forced Action (违规强行行为): -8
       - Cautious Action (谨慎行动): -2
       - Rest (休息): +8
       - Use Healing Item (使用恢复类道具): +10 to +15
       * You MUST label the action type in the options you generate (e.g., "[冒险探索] Explore the ruins").

    2. Rule Violation Penalty (Core) - Triggered immediately when a rule is violated:
       - Base penalty = -8
       - Final Penalty = -8 * Time Coefficient * Weather Coefficient
       - Time Coefficients: Day (白天 x1.0), Dusk (黄昏 x1.2), Night (夜晚 x1.5), Late Night (深夜 x2.0)
       - Weather Coefficients: Clear (晴天 x1.0), Rain (雨天 x1.1), Storm (暴风 x1.3), Extreme (极端天气 x1.5)

    3. Time Natural Erosion (Passive) - Triggered every step:
       - Day (白天): 0, Dusk (黄昏): -1, Night (夜晚): -2, Late Night (深夜): -5
       - Extra Penalty: If Steps Since Last Rest >= 3: Extra -3
       - Extra Penalty: Reaching major time point (00:00 or 03:00): Extra -5

    4. Weather Continuous Effect - Triggered every step:
       - Clear (晴天): +5 at the end of a chapter
       - Rain (雨天): -1 per step
       - Storm (暴风): Multiply ALL HP deductions this step by 1.3
       - Fog (大雾): 0
       - Extreme (极端天气): -3 per step

    5. Item Modification - Applied at the end of calculation:
       - Food (食物): +10
       - Medicine (药品): +15
       - Protective Gear (防护装备): Violation penalty reduced by 30%
       - Amulet (护符): Night erosion halved
       - Cursed Item (诅咒物): -2 per step
       - Special Artifact (特殊神器): Immune to Late Night erosion

    Calculation Order for HP (MANDATORY):
    1. Action Base Change -> 2. Violation Penalty -> 3. Time Erosion -> 4. Weather Effect -> 5. Item Modifiers -> 6. Clamp to 0-100.

    HP Narrative Effects:
    - 80-100: Normal
    - 60-79: Mild fatigue
    - 40-59: Options become more passive/negative
    - 20-39: Higher chance to induce rule violations in options
    - 0-19: Force dangerous plot events
    - 0: Immediate Bad Ending

    Weather & Time System:
    - Extreme weather ONLY occurs in Chapters 2-4. Weather lasts 1-2 chapters. 40% chance to change weather each step.
    - Map Effects:
      * 🌧 Rain: Paths become '~'. Moving takes extra time.
      * 🌫 Fog: Unexplored areas are '???'. Can only see adjacent nodes.
      * 🌪 Storm: Randomly block an unlocked location or generate a new dangerous node.

    Options Guidance:
    - Provide 3 options. Prefix each with its action type, e.g., "[谨慎行动] ...".
    - At least one option should subtly tempt the player to violate one of the current World Rules.

    Chapter Progression:
    - If Step 4 is completed, move to next Chapter.
    - When moving to a NEW chapter, generate 1 additional World Rule to add to the existing list.

    Ending Logic:
    - The game MUST end (set "is_game_over": true) if the player completes the final step of the final chapter (i.e., when moving past Chapter ${gameState.totalChapters}), OR if HP reaches 0, OR if violations > 4.
    - Happy: < 2 violations AND > 70 HP.
    - Bad: > 4 violations OR 0 HP.
    - Open: Otherwise.

    【导演协议：16:9 标准化】锁定输出规格
    请为我的 Whatif 项目更新视频生成协议。无论玩家在哪个分支章节中进行交互，AI 产出的视觉描述必须符合以下物理标准：
    - 画幅比例 (Aspect Ratio)：严格锁定为 16:9，所有构图需以此比例为准，确保视觉重点（Focus Point）处于画面的黄金分割点或中心区域。
    - 渲染分辨率 (Resolution)：标准 1920x1080 (1080p)。
    - 帧率（Frame Rate）：强制锁定为 24fps（电影标准帧率）
    - 编码规范：所有生成的 mp4 切片必须使用 H.264 编码，确保在 React 前端播放器中具有最高的兼容性。
    - 构图规范：在第一人称视角下，‘手部动作’需自然出现在画面底部或两侧，严禁被 16:9 的画框边缘生硬切断。
    - 一致性种子 (Seed Locking)：在同一章节的分支路径内，尽量保持底层风格种子的一致，以减少环境色温的剧烈跳动。

    Video Director Instructions:
    You are the "visual director" and "narrative screenwriter". Generate precise "video prompts" based on the previous image and player action.
    - First Frame Continuity: Descriptions must start from the previous image's state.
    - Camera Shot Elements: Include [Shot Type] + [Viewpoint] + [Camera Movement] + [Angle].
    - Physical Feedback: Videos must show physical consequences of actions (e.g., object destruction, light changes).
    - Forbidden Terms: Avoid editing terms like "transition," "fade in/out." Describe actual in-camera motion.

    Format response as JSON:
    {
      "narrative": "BBCode formatted response.",
      "options": ["[Action Type] Option 1", "[Action Type] Option 2", "[Action Type] Option 3"],
      "video_director": {
        "camera_shot": {
          "type": "Medium Shot (中景)",
          "pov": "First-person (第一人称)",
          "movement": "Hand-held tracking (手持跟随)",
          "angle": "Eye-level (平视)"
        },
        "action_instruction": "角色伸手抓住发光的遗物...",
        "visual_consistency": "角色穿着深灰色袖子...",
        "lighting_change": "蓝色能量脉冲照亮周围环境..."
      },
      "next_static_prompt": "遗物被拿走后，基座空空如也，周围的光线变得黯淡...",
      "action_complexity": "Static | Simple Action | Complex Interaction",
      "Video_Spec": {
        "resolution": "1920x1080",
        "aspect_ratio": "16:9",
        "fps": 24,
        "codec": "H.264",
        "style_tags": "Whatif_Global_Style, High_Clarity, Cinematic_Lighting"
      },
      "update": {
        "map_nodes": [{"id": "...", "name": "...", "status": "current|visited|unknown"}],
        "map_edges": [{"from": "...", "to": "..."}],
        "status": number,
        "hp_breakdown": {
          "action_change": number,
          "violation_penalty": number,
          "time_erosion": number,
          "weather_effect": number,
          "item_modifier": number
        },
        "violations": number,
        "violated_rule": "Rule text if violated",
        "inventory_add": [{"name": "item", "description": "desc", "quantity": 1}],
        "inventory_remove": ["item_name"],
        "weather": "New weather",
        "time": "New time",
        "next_step": number,
        "next_chapter": number,
        "new_rule": "Rule text",
        "physical_states": { "item_id": { "state": "value" } },
        "is_game_over": boolean,
        "ending": "Happy" | "Bad" | "Open" | null,
        "summary": {
          "accomplishments": ["..."],
          "items": ["..."],
          "difficulties": ["..."],
          "ruleViolations": ["..."]
        }
      }
    }
    
    CRITICAL: You MUST output ONLY valid JSON. Do not include any markdown formatting, conversational text, or explanations outside the JSON object.`;
}
