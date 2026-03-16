import { create } from 'zustand';
import { GameState, Character, LocationNode, StoryboardItem, Message } from '../types';

interface GameStoreState {
  gameState: GameState;
  options: string[];
  setGameState: (updater: GameState | ((prev: GameState) => GameState)) => void;
  setOptions: (options: string[]) => void;
  resetGame: () => void;
  reweaveGame: () => void;
}

const initialGameState: GameState = {
  character: null,
  world: null,
  inventory: [],
  status: 80,
  violations: 0,
  currentChapter: 1,
  totalChapters: 5,
  currentStep: 1,
  history: [],
  map: "      [?]      \n       |       \n       @       ",
  mapNodes: [{ id: 'start', name: 'Starting Point', status: 'current' }],
  mapEdges: [],
  currentLocationId: 'start',
  weather: "Clear",
  time: "08:00 AM",
  unlockedChapters: [1],
  isGameOver: false,
  showGuide: false,
  ending: null,
  summary: {
    accomplishments: [],
    items: [],
    difficulties: [],
    ruleViolations: []
  },
  physicalStates: {},
  language: 'zh',
  stepsSinceRest: 0,
  storyboard: []
};

export const useGameStore = create<GameStoreState>((set) => ({
  gameState: initialGameState,
  options: [],
  setGameState: (updater) => set((state) => ({
    gameState: typeof updater === 'function' ? updater(state.gameState) : updater
  })),
  setOptions: (options) => set({ options }),
  resetGame: () => set((state) => ({
    gameState: { ...initialGameState, language: state.gameState.language },
    options: []
  })),
  reweaveGame: () => set((state) => ({
    gameState: {
      ...state.gameState,
      inventory: [],
      status: 80,
      violations: 0,
      currentChapter: 1,
      currentStep: 1,
      history: [],
      map: "      [?]      \n       |       \n       @       ",
      mapNodes: [{ id: 'start', name: 'Starting Point', status: 'current' }],
      mapEdges: [],
      currentLocationId: 'start',
      weather: "Clear",
      time: "08:00 AM",
      unlockedChapters: [1],
      isGameOver: false,
      showGuide: false,
      ending: null,
      summary: {
        accomplishments: [],
        items: [],
        difficulties: [],
        ruleViolations: []
      },
      physicalStates: {},
      stepsSinceRest: 0,
      currentImage: undefined
    },
    options: []
  }))
}));
