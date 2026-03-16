import React from 'react';
import { motion } from 'motion/react';
import { BackgroundEffects, Constellations, RotatingSphereMesh } from '../BackgroundEffects';
import { useUIStore } from '../../store/uiStore';
import { useGameActions } from '../../hooks/useGameActions';

export function LanguageSetup() {
  const isTyping = useUIStore(state => state.isTyping);
  const isGlitching = useUIStore(state => state.isGlitching);
  const { handleLanguageSelect } = useGameActions();

  return (
    <div className={`min-h-screen bg-[#1a0f0a] text-[#d4b595] flex flex-col items-center justify-center font-serif relative overflow-hidden ${isGlitching ? 'glitch-effect' : ''}`}>
      <BackgroundEffects isTyping={isTyping} />
      <RotatingSphereMesh isTyping={isTyping} />
      <Constellations isTyping={isTyping} />
      <div className="celestial-pattern-edge" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')" }} />
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl px-6">
        {/* Language Selection at the top */}
        <div className="flex justify-between w-full max-w-md mb-24">
          <button 
            onClick={() => handleLanguageSelect('zh')}
            className="group flex flex-col items-center transition-all duration-500 hover:scale-110"
          >
            <span className="text-2xl font-light tracking-[0.2em] mb-1 group-hover:text-white transition-colors">CN</span>
            <span className="text-sm font-light opacity-60 group-hover:opacity-100 transition-opacity">简体中文</span>
          </button>
          <button 
            onClick={() => handleLanguageSelect('en')}
            className="group flex flex-col items-center transition-all duration-500 hover:scale-110"
          >
            <span className="text-2xl font-light tracking-[0.2em] mb-1 group-hover:text-white transition-colors">US</span>
            <span className="text-sm font-light opacity-60 group-hover:opacity-100 transition-opacity">English</span>
          </button>
        </div>

        {/* Main Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-center"
        >
          <h1 className="text-8xl md:text-9xl font-medium tracking-[0.15em] mb-4 text-[#f5e6d3] drop-shadow-[0_0_15px_rgba(245,230,211,0.3)]">
            WHATIF
          </h1>
          <p className="text-lg md:text-xl font-light tracking-[0.4em] text-[#d4b595]/80 uppercase">
            A Pathway Through Constellations
          </p>
        </motion.div>
      </div>
    </div>
  );
}
