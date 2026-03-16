export type Gender = 'Male' | 'Female' | 'Non-binary' | 'Other';

export interface Character {
  name: string;
  gender: Gender;
  traits: string;
}

export interface WorldInfo {
  description: string;
  rules: string[];
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
}

export interface LocationNode {
  id: string;
  name: string;
  status: 'current' | 'visited' | 'unknown';
}

export interface MapEdge {
  from: string;
  to: string;
}

export interface VideoSpec {
  resolution: string;
  aspect_ratio: string;
  fps: number;
  codec: string;
  style_tags: string;
}

export interface VideoDirector {
  camera_shot: {
    type: string;
    pov: string;
    movement: string;
    angle: string;
  };
  action_instruction: string;
  visual_consistency: string;
  lighting_change: string;
}

export interface StoryboardItem {
  chapter: number;
  step: number;
  imageUrl: string;
  text: string;
  actionText?: string;
  actionComplexity?: 'Static' | 'Simple Action' | 'Complex Interaction';
  videoUrl?: string;
  videoSpec?: VideoSpec;
  videoDirector?: VideoDirector;
  nextStaticPrompt?: string;
}

export interface GameState {
  character: Character | null;
  world: WorldInfo | null;
  inventory: InventoryItem[];
  status: number; // 0-100
  violations: number;
  currentChapter: number; // 1-totalChapters
  totalChapters: number;
  currentStep: number; // 1-4
  history: Message[];
  map: string; // ASCII representation
  mapNodes: LocationNode[];
  mapEdges: MapEdge[];
  currentLocationId: string;
  currentImage?: string;
  currentVideo?: string;
  weather: string;
  time: string;
  unlockedChapters: number[];
  isGameOver: boolean;
  showGuide: boolean;
  ending: 'Happy' | 'Bad' | 'Open' | null;
  summary: {
    accomplishments: string[];
    items: string[];
    difficulties: string[];
    ruleViolations: string[];
  };
  physicalStates: Record<string, any>;
  language: 'en' | 'zh';
  stepsSinceRest: number;
  storyboard: StoryboardItem[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  hpBreakdown?: {
    action_change: number;
    violation_penalty: number;
    time_erosion: number;
    weather_effect: number;
    item_modifier: number;
  };
}

export interface ApiSettings {
  provider: 'gemini' | 'deepseek';
  apiKey: string;
  imageProvider: 'gemini' | 'doubao';
  imageApiKey: string;
  imageModel: string;
  imageApiUrl?: string;
  videoApiKey?: string;
  model: string;
  contextLimit: number; // Default 15
  ragLimit: number; // Default 5
}
