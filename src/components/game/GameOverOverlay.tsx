import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ShieldAlert } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { useGameActions } from '../../hooks/useGameActions';
import { UI_STRINGS } from '../../constants';

export function GameOverOverlay() {
  const gameState = useGameStore(state => state.gameState);
  const { showReview, showVideo, setShowReview } = useUIStore();
  const { handleReweave } = useGameActions();

  return (
    <AnimatePresence>
      {gameState.isGameOver && !showReview && !showVideo && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] bg-stone-950/95 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto"
        >
          <div className="max-w-2xl w-full text-center space-y-8 py-12">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className={`text-7xl font-bold mb-4 ${
                gameState.ending === 'Happy' ? 'text-amber-400' : 
                gameState.ending === 'Bad' ? 'text-red-600' : 'text-stone-400'
              }`}>
                {gameState.ending === 'Happy' ? UI_STRINGS[gameState.language].endingHappy : 
                 gameState.ending === 'Bad' ? UI_STRINGS[gameState.language].endingBad : 
                 UI_STRINGS[gameState.language].endingOpen} {UI_STRINGS[gameState.language].endingLabel}
              </h2>
              <p className="text-xl text-stone-300 italic">
                {gameState.ending === 'Happy' ? UI_STRINGS[gameState.language].happyQuote :
                 gameState.ending === 'Bad' ? UI_STRINGS[gameState.language].badQuote :
                 UI_STRINGS[gameState.language].openQuote}
              </p>
            </motion.div>

            {/* Summary Section */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-stone-900 border border-stone-800 rounded-3xl p-8 text-left space-y-6"
            >
              <h3 className="text-2xl font-bold text-amber-500 border-b border-stone-800 pb-4">{UI_STRINGS[gameState.language].summaryTitle}</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">{UI_STRINGS[gameState.language].summaryAccomplishments}</h4>
                  <ul className="space-y-1 text-sm text-stone-300">
                    {gameState.summary.accomplishments.map((a, i) => <li key={i} className="flex gap-2"><ChevronRight size={14} className="text-amber-500 shrink-0" />{a}</li>)}
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">{UI_STRINGS[gameState.language].summaryItems}</h4>
                  <ul className="space-y-1 text-sm text-stone-300">
                    {gameState.summary.items.map((item, i) => <li key={i} className="flex gap-2"><ChevronRight size={14} className="text-amber-500 shrink-0" />{item}</li>)}
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">{UI_STRINGS[gameState.language].summaryDifficulties}</h4>
                  <ul className="space-y-1 text-sm text-stone-300">
                    {gameState.summary.difficulties.map((d, i) => <li key={i} className="flex gap-2"><ChevronRight size={14} className="text-amber-500 shrink-0" />{d}</li>)}
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">{UI_STRINGS[gameState.language].summaryViolations}</h4>
                  <ul className="space-y-1 text-sm text-red-400">
                    {gameState.summary.ruleViolations.map((v, i) => <li key={i} className="flex gap-2"><ShieldAlert size={14} className="text-red-500 shrink-0" />{v}</li>)}
                  </ul>
                </div>
              </div>
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleReweave}
                className="px-12 py-4 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-full font-bold text-xl transition-all border border-stone-700"
              >
                {UI_STRINGS[gameState.language].reweave}
              </button>
              <button 
                onClick={() => setShowReview(true)}
                className="px-12 py-4 bg-amber-600 hover:bg-amber-500 text-stone-900 rounded-full font-bold text-xl transition-all border border-amber-500"
              >
                {UI_STRINGS[gameState.language].reviewJourney}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
