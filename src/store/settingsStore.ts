import { create } from 'zustand';
import { ApiSettings } from '../types';

interface SettingsStoreState {
  apiSettings: ApiSettings;
  setApiSettings: (updater: ApiSettings | ((prev: ApiSettings) => ApiSettings)) => void;
}

export const useSettingsStore = create<SettingsStoreState>((set) => ({
  apiSettings: {
    provider: 'gemini',
    apiKey: '',
    imageProvider: 'gemini',
    imageApiKey: '',
    imageModel: 'gemini-2.5-flash-image',
    imageApiUrl: '',
    videoApiKey: '',
    model: 'gemini-3-flash-preview',
    contextLimit: 15,
    ragLimit: 5
  },
  setApiSettings: (updater) => set((state) => ({
    apiSettings: typeof updater === 'function' ? updater(state.apiSettings) : updater
  }))
}));
