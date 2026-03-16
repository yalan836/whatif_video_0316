import React from 'react';
import { motion } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { BackgroundEffects, Constellations, RotatingSphereMesh } from '../BackgroundEffects';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import { testConnection } from '../../services/aiService';

export function ApiSetup() {
  const gameState = useGameStore(state => state.gameState);
  const { apiSettings, setApiSettings } = useSettingsStore();
  const { isLoading, setIsLoading, setSetupStep, isTyping, isGlitching } = useUIStore();

  return (
    <div className={`min-h-screen bg-[#1a0f0a] text-[#d4b595] p-6 flex flex-col items-center justify-center font-serif relative overflow-hidden ${isGlitching ? 'glitch-effect' : ''}`}>
      <BackgroundEffects isTyping={isTyping} />
      <RotatingSphereMesh isTyping={isTyping} />
      <Constellations isTyping={isTyping} />
      <div className="celestial-pattern-edge" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')" }} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full frosted-glass dynamic-border rounded-2xl p-8 shadow-2xl z-10 space-y-6"
      >
        <h2 className="text-2xl font-bold text-center text-[#f5e6d3] mb-6">
          {gameState.language === 'zh' ? 'AI 模型配置' : 'AI Model Configuration'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#d4b595]/60 mb-2 font-bold">
              {gameState.language === 'zh' ? '语言模型 (LLM)' : 'Language Model (LLM)'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setApiSettings(prev => ({ ...prev, provider: 'gemini', model: 'gemini-3-flash-preview' }))}
                className={`py-2 rounded-lg border transition-all ${apiSettings.provider === 'gemini' ? 'bg-[#d4b595]/20 border-[#f5e6d3] text-[#f5e6d3]' : 'bg-black/40 border-[#d4b595]/20 text-[#d4b595]/60'}`}
              >
                Gemini
              </button>
              <button 
                onClick={() => setApiSettings(prev => ({ ...prev, provider: 'deepseek', model: 'deepseek-chat' }))}
                className={`py-2 rounded-lg border transition-all ${apiSettings.provider === 'deepseek' ? 'bg-[#d4b595]/20 border-[#f5e6d3] text-[#f5e6d3]' : 'bg-black/40 border-[#d4b595]/20 text-[#d4b595]/60'}`}
              >
                DeepSeek
              </button>
            </div>
            {apiSettings.provider === 'deepseek' && (
              <input 
                type="password"
                value={apiSettings.apiKey}
                onChange={(e) => setApiSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                className="w-full mt-2 bg-black/40 border border-[#d4b595]/30 rounded-lg px-4 py-2 focus:outline-none focus:border-[#f5e6d3] transition-all text-sm"
                placeholder={gameState.language === 'zh' ? '输入 DeepSeek API Key' : 'Enter DeepSeek API Key'}
              />
            )}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-[#d4b595]/60 mb-2 font-bold">
              {gameState.language === 'zh' ? '图片模型 (Image)' : 'Image Model'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setApiSettings(prev => ({ ...prev, imageProvider: 'gemini' }))}
                className={`py-2 rounded-lg border transition-all ${apiSettings.imageProvider === 'gemini' ? 'bg-[#d4b595]/20 border-[#f5e6d3] text-[#f5e6d3]' : 'bg-black/40 border-[#d4b595]/20 text-[#d4b595]/60'}`}
              >
                Gemini
              </button>
              <button 
                onClick={() => setApiSettings(prev => ({ ...prev, imageProvider: 'doubao', imageModel: '' }))}
                className={`py-2 rounded-lg border transition-all ${apiSettings.imageProvider === 'doubao' ? 'bg-[#d4b595]/20 border-[#f5e6d3] text-[#f5e6d3]' : 'bg-black/40 border-[#d4b595]/20 text-[#d4b595]/60'}`}
              >
                豆包 (Doubao)
              </button>
            </div>
            {apiSettings.imageProvider === 'doubao' && (
              <div className="space-y-2 mt-2">
                <input 
                  type="password"
                  value={apiSettings.imageApiKey}
                  onChange={(e) => setApiSettings(prev => ({ ...prev, imageApiKey: e.target.value }))}
                  className="w-full bg-black/40 border border-[#d4b595]/30 rounded-lg px-4 py-2 focus:outline-none focus:border-[#f5e6d3] transition-all text-sm"
                  placeholder={gameState.language === 'zh' ? '输入 豆包 API Key (如: 12345678-abcd-...)' : 'Enter Doubao API Key (e.g. 12345678-abcd-...)'}
                />
                <input 
                  type="text"
                  value={apiSettings.imageModel}
                  onChange={(e) => setApiSettings(prev => ({ ...prev, imageModel: e.target.value }))}
                  className="w-full bg-black/40 border border-[#d4b595]/30 rounded-lg px-4 py-2 focus:outline-none focus:border-[#f5e6d3] transition-all text-sm"
                  placeholder={gameState.language === 'zh' ? '输入 接入点 ID (如: ep-2024...)' : 'Enter Endpoint ID (e.g. ep-2024...)'}
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#d4b595]/60 mb-2 font-bold">
              {gameState.language === 'zh' ? '视频模型 (Video)' : 'Video Model'}
            </label>
            <div className="space-y-2">
              <div className="text-sm text-[#d4b595]/80">Doubao Seedance</div>
              <input 
                type="password"
                value={apiSettings.videoApiKey || ''}
                onChange={(e) => setApiSettings(prev => ({ ...prev, videoApiKey: e.target.value }))}
                className="w-full bg-black/40 border border-[#d4b595]/30 rounded-lg px-4 py-2 focus:outline-none focus:border-[#f5e6d3] transition-all text-sm"
                placeholder={gameState.language === 'zh' ? '输入 豆包 视频 API Key' : 'Enter Doubao Video API Key'}
              />
            </div>
          </div>
        </div>

        <button 
          onClick={async () => {
            setIsLoading(true);
            const result = await testConnection(apiSettings);
            setIsLoading(false);
            if (result.success) {
              setSetupStep('world');
            } else {
              alert(gameState.language === 'zh' ? `连接测试失败: ${result.message}` : `Connection test failed: ${result.message}`);
            }
          }}
          disabled={isLoading}
          className="w-full py-3 bg-[#d4b595]/20 hover:bg-[#d4b595]/40 text-[#f5e6d3] rounded-xl font-bold transition-all cold-white-glow flex items-center justify-center gap-2"
        >
          {isLoading ? <RefreshCw className="animate-spin" /> : null}
          {gameState.language === 'zh' ? '测试并继续' : 'Test & Continue'}
        </button>
      </motion.div>
    </div>
  );
}
