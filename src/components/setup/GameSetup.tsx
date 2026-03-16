import React from 'react';
import { motion } from 'motion/react';
import { User, Scroll, RefreshCw } from 'lucide-react';
import { BackgroundEffects, Constellations, RotatingSphereMesh } from '../BackgroundEffects';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { useGameActions } from '../../hooks/useGameActions';
import { WORLD_PRESETS, CHAR_PRESETS, UI_STRINGS } from '../../constants';

export function GameSetup() {
  const { gameState, setGameState } = useGameStore();
  const { setupStep, setSetupStep, isLoading, isTyping, isGlitching } = useUIStore();
  const { handleSetupWorld, handleSetupCharacter, startGame } = useGameActions();

  return (
    <div className={`min-h-screen bg-[#1a0f0a] text-[#d4b595] p-6 flex flex-col items-center justify-center font-serif relative overflow-hidden ${isGlitching ? 'glitch-effect' : ''}`}>
      <BackgroundEffects isTyping={isTyping} />
      <RotatingSphereMesh isTyping={isTyping} />
      <Constellations isTyping={isTyping} />
      <div className="celestial-pattern-edge" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')" }} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full frosted-glass dynamic-border rounded-2xl p-8 shadow-2xl z-10"
      >
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">
          {UI_STRINGS[gameState.language].title}
        </h1>

        {setupStep === 'world' && (
          <div className="space-y-6">
            <h2 className="text-xl italic text-[#d4b595]/60">{UI_STRINGS[gameState.language].chooseWorld}</h2>
            <div className="grid gap-3">
              {WORLD_PRESETS[gameState.language].map((w, i) => (
                <button 
                  key={i}
                  onClick={() => handleSetupWorld(w)}
                  className="text-left p-4 rounded-xl deep-brown-card transition-all group"
                >
                  <span className="text-[#f5e6d3] group-hover:text-white font-bold block mb-1">
                    {w.split('：').length > 1 ? w.split('：')[0] : w.split(':')[0]}
                  </span>
                  <span className="text-sm text-[#d4b595]/60">{w.split('：').length > 1 ? w.split('：')[1] : w.split(':')[1]}</span>
                </button>
              ))}
            </div>
            <div className="pt-4 border-t border-[#d4b595]/20">
              <p className="text-sm text-[#d4b595]/60 mb-2">{UI_STRINGS[gameState.language].customWorld}</p>
              <div className="flex gap-2">
                <input 
                  className="flex-1 bg-black/40 border border-[#d4b595]/30 rounded-lg px-4 py-2 focus:outline-none focus:border-[#f5e6d3] transition-all cold-white-glow"
                  placeholder={UI_STRINGS[gameState.language].worldPlaceholder}
                  onKeyDown={(e) => e.key === 'Enter' && handleSetupWorld(e.currentTarget.value)}
                />
              </div>
            </div>
          </div>
        )}

        {setupStep === 'character' && (
          <div className="space-y-6">
            <h2 className="text-xl italic text-[#d4b595]/60">{UI_STRINGS[gameState.language].whoAreYou}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CHAR_PRESETS[gameState.language].map((c, i) => (
                <button 
                  key={i}
                  onClick={() => handleSetupCharacter(c)}
                  className="text-left p-4 rounded-xl deep-brown-card transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <User size={16} className="text-[#f5e6d3]" />
                    <span className="font-bold">{c.name}</span>
                  </div>
                  <p className="text-xs text-[#d4b595]/60">{c.traits}</p>
                </button>
              ))}
            </div>
            <div className="pt-4 border-t border-[#d4b595]/20">
              <p className="text-sm text-[#d4b595]/60 mb-2">{UI_STRINGS[gameState.language].customChar}</p>
              <div className="space-y-2">
                <input id="custom-name" className="w-full bg-black/40 border border-[#d4b595]/30 rounded-lg px-4 py-2 focus:outline-none focus:border-[#f5e6d3] transition-all cold-white-glow" placeholder={UI_STRINGS[gameState.language].name} />
                <input id="custom-traits" className="w-full bg-black/40 border border-[#d4b595]/30 rounded-lg px-4 py-2 focus:outline-none focus:border-[#f5e6d3] transition-all cold-white-glow" placeholder={UI_STRINGS[gameState.language].traits} />
                <button 
                  onClick={() => {
                    const name = (document.getElementById('custom-name') as HTMLInputElement).value;
                    const traits = (document.getElementById('custom-traits') as HTMLInputElement).value;
                    if (name && traits) handleSetupCharacter({ name, gender: 'Other', traits });
                  }}
                  className="w-full py-2 bg-[#d4b595]/20 hover:bg-[#d4b595]/40 text-[#f5e6d3] rounded-lg font-bold transition-all cold-white-glow"
                >
                  {UI_STRINGS[gameState.language].create}
                </button>
              </div>
            </div>
          </div>
        )}

        {setupStep === 'chapters' && (
          <div className="space-y-6">
            <h2 className="text-xl italic text-[#d4b595]/60">{UI_STRINGS[gameState.language].chooseChapters}</h2>
            <p className="text-sm text-[#d4b595]/40">{UI_STRINGS[gameState.language].chaptersDesc}</p>
            <div className="grid grid-cols-3 gap-3">
              {[3, 5, 10].map((num) => (
                <button 
                  key={num}
                  onClick={() => {
                    setGameState(prev => ({ ...prev, totalChapters: num }));
                    setSetupStep('ready');
                  }}
                  className="p-4 rounded-xl deep-brown-card transition-all font-bold text-lg text-center hover:bg-[#d4b595]/20"
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="pt-4 border-t border-[#d4b595]/20">
              <p className="text-sm text-[#d4b595]/60 mb-2">{UI_STRINGS[gameState.language].customChar}</p>
              <div className="flex gap-2">
                <input 
                  id="custom-chapters" 
                  type="number" 
                  min="1" 
                  max="100"
                  defaultValue="5"
                  className="flex-1 bg-black/40 border border-[#d4b595]/30 rounded-lg px-4 py-2 focus:outline-none focus:border-[#f5e6d3] transition-all cold-white-glow text-center" 
                />
                <button 
                  onClick={() => {
                    const val = parseInt((document.getElementById('custom-chapters') as HTMLInputElement).value) || 5;
                    setGameState(prev => ({ ...prev, totalChapters: Math.max(1, val) }));
                    setSetupStep('ready');
                  }}
                  className="px-6 py-2 bg-[#d4b595]/20 hover:bg-[#d4b595]/40 text-[#f5e6d3] rounded-lg font-bold transition-all cold-white-glow"
                >
                  {UI_STRINGS[gameState.language].create}
                </button>
              </div>
            </div>
          </div>
        )}

        {setupStep === 'ready' && (
          <div className="text-center space-y-6 py-8">
            <div className="p-6 bg-black/40 rounded-2xl border border-[#d4b595]/20 inline-block text-left frosted-glass">
              <p className="text-[#f5e6d3] font-bold mb-2">{UI_STRINGS[gameState.language].world}: <span className="text-[#d4b595] font-normal">{gameState.world?.description.split('：')[0].split(':')[0]}</span></p>
              <p className="text-[#f5e6d3] font-bold">{UI_STRINGS[gameState.language].protagonist}: <span className="text-[#d4b595] font-normal">{gameState.character?.name}</span></p>
            </div>
            <p className="text-[#d4b595]/60 italic">{UI_STRINGS[gameState.language].ready}</p>
            <button 
              onClick={startGame}
              disabled={isLoading}
              className="px-12 py-4 bg-[#d4b595]/20 hover:bg-[#d4b595]/40 text-[#f5e6d3] rounded-full font-bold text-xl shadow-lg shadow-[#d4b595]/10 transition-all flex items-center gap-3 mx-auto cold-white-glow"
            >
              {isLoading ? <RefreshCw className="animate-spin" /> : <Scroll />}
              {UI_STRINGS[gameState.language].begin}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
