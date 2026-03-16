import { create } from 'zustand';

interface Notification {
  id: string;
  message: string;
  type: 'item' | 'location' | 'system';
}

interface UIStoreState {
  input: string;
  isLoading: boolean;
  showWarning: boolean;
  activeTab: 'inventory' | 'status' | 'map' | 'rules' | 'settings' | 'chapters';
  setupStep: 'language' | 'api' | 'world' | 'character' | 'chapters' | 'ready' | 'playing';
  isGlitching: boolean;
  isConducting: boolean;
  showReview: boolean;
  showVideo: boolean;
  videoProgress: number;
  videoUrl: string | null;
  isVideoReady: boolean;
  isTyping: boolean;
  isGeneratingImage: boolean;
  notifications: Notification[];
  
  setInput: (input: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setShowWarning: (showWarning: boolean) => void;
  setActiveTab: (activeTab: 'inventory' | 'status' | 'map' | 'rules' | 'settings' | 'chapters') => void;
  setSetupStep: (setupStep: 'language' | 'api' | 'world' | 'character' | 'chapters' | 'ready' | 'playing') => void;
  setIsGlitching: (isGlitching: boolean) => void;
  setIsConducting: (isConducting: boolean) => void;
  setShowReview: (showReview: boolean) => void;
  setShowVideo: (showVideo: boolean) => void;
  setVideoProgress: (videoProgress: number) => void;
  setVideoUrl: (videoUrl: string | null) => void;
  setIsVideoReady: (isVideoReady: boolean) => void;
  setIsTyping: (isTyping: boolean) => void;
  setIsGeneratingImage: (isGeneratingImage: boolean) => void;
  addNotification: (message: string, type: 'item' | 'location' | 'system') => void;
  removeNotification: (id: string) => void;
  resetUI: () => void;
}

export const useUIStore = create<UIStoreState>((set) => ({
  input: '',
  isLoading: false,
  showWarning: false,
  activeTab: 'status',
  setupStep: 'language',
  isGlitching: false,
  isConducting: false,
  showReview: false,
  showVideo: false,
  videoProgress: 0,
  videoUrl: null,
  isVideoReady: false,
  isTyping: false,
  isGeneratingImage: false,
  notifications: [],

  setInput: (input) => set({ input }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setShowWarning: (showWarning) => set({ showWarning }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSetupStep: (setupStep) => set({ setupStep }),
  setIsGlitching: (isGlitching) => set({ isGlitching }),
  setIsConducting: (isConducting) => set({ isConducting }),
  setShowReview: (showReview) => set({ showReview }),
  setShowVideo: (showVideo) => set({ showVideo }),
  setVideoProgress: (videoProgress) => set({ videoProgress }),
  setVideoUrl: (videoUrl) => set({ videoUrl }),
  setIsVideoReady: (isVideoReady) => set({ isVideoReady }),
  setIsTyping: (isTyping) => set({ isTyping }),
  setIsGeneratingImage: (isGeneratingImage) => set({ isGeneratingImage }),
  addNotification: (message, type) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }]
    }));
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      }));
    }, 4000);
  },
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
  resetUI: () => set({
    input: '',
    isLoading: false,
    showWarning: false,
    activeTab: 'status',
    setupStep: 'language',
    isGlitching: false,
    isConducting: false,
    showReview: false,
    showVideo: false,
    videoProgress: 0,
    videoUrl: null,
    isVideoReady: false,
    isTyping: false,
    isGeneratingImage: false,
    notifications: []
  })
}));
