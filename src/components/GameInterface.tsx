import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, AlertTriangle, Map as MapIcon, Settings, ScrollText, Package, RefreshCw, Eye, Film, CheckCircle2, AlertCircle } from 'lucide-react';
import { GameState, ApiSettings } from '../types';
import { UI_STRINGS } from '../constants';
import { getWeatherEffect, getTimeEffect } from '../utils/gameUtils';
import { BBCodeRenderer } from './BBCodeRenderer';
import { BackgroundEffects } from './BackgroundEffects';
import { MapPanel } from './MapPanel';

interface GameInterfaceProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  apiSettings: ApiSettings;
  setApiSettings: React.Dispatch<React.SetStateAction<ApiSettings>>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  options: string[];
  isConducting: boolean;
  isTyping: boolean;
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
  isGeneratingImage: boolean;
  handleAction: (action: string) => void;
  showWarning: boolean;
  isGlitching: boolean;
  notifications: { id: string; message: string; type: 'item' | 'location' | 'system' }[];
  activeTab: 'inventory' | 'map' | 'rules' | 'settings';
  setActiveTab: React.Dispatch<React.SetStateAction<'inventory' | 'map' | 'rules' | 'settings'>>;
  setShowReview: React.Dispatch<React.SetStateAction<boolean>>;
  setShowVideo: React.Dispatch<React.SetStateAction<boolean>>;
  resetGame: () => void;
  reweaveReality: () => void;
  prevHpRef: React.MutableRefObject<number>;
}

export const GameInterface: React.FC<GameInterfaceProps> = ({
  gameState,
  setGameState,
  apiSettings,
  setApiSettings,
  input,
  setInput,
  isLoading,
  options,
  isConducting,
  isTyping,
  setIsTyping,
  isGeneratingImage,
  handleAction,
  showWarning,
  isGlitching,
  notifications,
  activeTab,
  setActiveTab,
  setShowReview,
  setShowVideo,
  resetGame,
  reweaveReality,
  prevHpRef
}) => {
  const strings = UI_STRINGS[gameState.language];
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const hpDiff = gameState.status - prevHpRef.current;
  const hpColor = gameState.status > 70 ? 'text-celestial-gold' : gameState.status > 30 ? 'text-amber-400' : 'text-red-400';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.history, isTyping]);

  useEffect(() => {
    prevHpRef.current = gameState.status;
  }, [gameState.status, prevHpRef]);

  return (
    <div className={`flex flex-col h-screen bg-celestial-dark text-celestial-white font-serif overflow-hidden ${isGlitching ? 'animate-glitch' : ''}`}>
      <BackgroundEffects weather={gameState.weather} time={gameState.time} />

      {/* Warning Overlay */}
      <AnimatePresence>
        {showWarning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-red-900/40"
          >
            <div className="text-red-400 text-6xl font-bold tracking-widest animate-pulse border-y-4 border-red-400 py-8 w-full text-center bg-celestial-dark/80">
              {strings.ruleViolated}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {notifications.map(note => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className={`px-4 py-2 border flex items-center gap-2 ${
                note.type === 'item' ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' :
                note.type === 'location' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' :
                'bg-celestial-gold/10 border-celestial-gold/50 text-celestial-gold'
              }`}
            >
              {note.type === 'item' && <Package className="w-4 h-4" />}
              {note.type === 'location' && <MapIcon className="w-4 h-4" />}
              {note.type === 'system' && <AlertCircle className="w-4 h-4" />}
              <span className="text-sm">{note.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Top Half: Visuals & Narrative */}
      <div className="flex-1 flex flex-col md:flex-row relative z-10 min-h-0">
        
        {/* Left: Scene Image */}
        <div className="w-full md:w-1/2 h-64 md:h-full border-b md:border-b-0 md:border-r border-celestial-gold/20 relative bg-celestial-dark/50 overflow-hidden group">
          {gameState.currentImage ? (
            <>
              <img 
                src={gameState.currentImage} 
                alt="Scene" 
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-1000"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50 pointer-events-none" />
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                <div className="bg-celestial-dark/60 backdrop-blur-sm border border-celestial-gold/20 px-3 py-1 text-xs text-celestial-white/80 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-celestial-gold animate-pulse" />
                  {strings.chapter} {gameState.currentChapter} - {strings.step} {gameState.currentStep}/4
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowReview(true)}
                    className="bg-celestial-dark/60 backdrop-blur-sm border border-celestial-gold/20 p-2 text-celestial-white/80 hover:text-celestial-gold hover:border-celestial-gold/50 transition-colors"
                    title={strings.review}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowVideo(true)}
                    className="bg-celestial-dark/60 backdrop-blur-sm border border-celestial-gold/20 p-2 text-celestial-white/80 hover:text-celestial-gold hover:border-celestial-gold/50 transition-colors"
                    title={strings.video}
                  >
                    <Film className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-celestial-white/40 border border-celestial-gold/10 m-4 border-dashed">
              <div className="text-center space-y-2">
                <Eye className="w-8 h-8 mx-auto opacity-50" />
                <div className="text-xs tracking-widest uppercase">{strings.awaitingVision}</div>
              </div>
            </div>
          )}
          
          {isGeneratingImage && (
            <div className="absolute inset-0 bg-celestial-dark/80 backdrop-blur-sm flex items-center justify-center z-20">
              <div className="text-center space-y-4">
                <RefreshCw className="w-8 h-8 mx-auto text-celestial-gold animate-spin" />
                <div className="text-celestial-gold text-sm tracking-widest uppercase animate-pulse">
                  {strings.generatingVision}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Narrative Chat */}
        <div className="w-full md:w-1/2 flex flex-col h-full bg-celestial-dark/80 backdrop-blur-md">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {gameState.history.map((msg, idx) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${msg.role === 'user' ? 'text-celestial-gold border-l-2 border-celestial-gold pl-4' : 'text-celestial-white/80'}`}
              >
                {msg.role === 'user' ? (
                  <div className="flex items-center gap-2 opacity-80">
                    <span className="text-xs border border-celestial-gold/30 px-1 text-celestial-gold/70">&gt;</span>
                    {msg.content}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <BBCodeRenderer 
                      text={msg.content} 
                      onTypingComplete={() => {
                        if (idx === gameState.history.length - 1) setIsTyping(false);
                      }}
                      isLast={idx === gameState.history.length - 1}
                    />
                    {msg.hpBreakdown && (
                      <div className="mt-2 p-3 bg-celestial-gold/5 border border-celestial-gold/20 text-xs text-celestial-white/70 font-serif space-y-1">
                        <div className="text-celestial-gold/70 mb-2 border-b border-celestial-gold/20 pb-1">SYSTEM LOG // HP CALCULATION</div>
                        <div className="flex justify-between"><span>Action Base:</span> <span className={msg.hpBreakdown.action_change > 0 ? 'text-celestial-gold' : 'text-red-400'}>{msg.hpBreakdown.action_change > 0 ? '+' : ''}{msg.hpBreakdown.action_change}</span></div>
                        <div className="flex justify-between"><span>Violation Penalty:</span> <span className="text-red-400">{msg.hpBreakdown.violation_penalty}</span></div>
                        <div className="flex justify-between"><span>Time Erosion:</span> <span className="text-red-400">{msg.hpBreakdown.time_erosion}</span></div>
                        <div className="flex justify-between"><span>Weather Effect:</span> <span className={msg.hpBreakdown.weather_effect > 0 ? 'text-celestial-gold' : msg.hpBreakdown.weather_effect < 0 ? 'text-red-400' : ''}>{msg.hpBreakdown.weather_effect > 0 ? '+' : ''}{msg.hpBreakdown.weather_effect}</span></div>
                        <div className="flex justify-between"><span>Item Modifier:</span> <span className={msg.hpBreakdown.item_modifier > 0 ? 'text-celestial-gold' : msg.hpBreakdown.item_modifier < 0 ? 'text-red-400' : ''}>{msg.hpBreakdown.item_modifier > 0 ? '+' : ''}{msg.hpBreakdown.item_modifier}</span></div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
            
            {isLoading && (
              <div className="flex items-center gap-3 text-celestial-gold/50 border-l-2 border-celestial-gold/30 pl-4">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm tracking-widest uppercase animate-pulse">{strings.processing}</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-celestial-gold/20 bg-celestial-dark/90">
            {options.length > 0 && !isLoading && !isTyping && !isGeneratingImage && (
              <div className="mb-4 space-y-2">
                <div className="text-xs text-celestial-white/50 uppercase tracking-widest mb-2">{strings.suggestedActions}</div>
                {options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAction(opt)}
                    disabled={isConducting || isGeneratingImage}
                    className="block w-full text-left p-3 border border-celestial-gold/20 hover:border-celestial-gold hover:bg-celestial-gold/10 transition-colors text-sm text-celestial-white/80 disabled:opacity-50"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
            
            <form onSubmit={(e) => { e.preventDefault(); handleAction(input); }} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={strings.customAction}
                disabled={isLoading || isConducting || isTyping || isGeneratingImage}
                className="flex-1 bg-transparent border border-celestial-gold/30 p-3 text-celestial-white focus:border-celestial-gold focus:outline-none disabled:opacity-50 transition-colors"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading || isConducting || isTyping || isGeneratingImage}
                className="px-6 border border-celestial-gold text-celestial-gold hover:bg-celestial-gold/30 hover:text-black disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-celestial-gold transition-colors uppercase tracking-widest text-sm"
              >
                {strings.execute}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Half: Status & Controls */}
      <div className="h-64 border-t border-celestial-gold/20 bg-celestial-dark/95 flex flex-col relative z-20">
        
        {/* Status Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-celestial-gold/10 text-sm">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Shield className={`w-4 h-4 ${hpColor}`} />
              <span className="text-celestial-white/70">HP:</span>
              <span className={`font-bold ${hpColor} flex items-center gap-2`}>
                {gameState.status}%
                {hpDiff !== 0 && (
                  <span className={`text-xs ${hpDiff > 0 ? 'text-celestial-gold' : 'text-red-400'}`}>
                    ({hpDiff > 0 ? '+' : ''}{hpDiff})
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${gameState.violations > 0 ? 'text-red-400' : 'text-celestial-white/50'}`} />
              <span className="text-celestial-white/70">{strings.violations}:</span>
              <span className={gameState.violations > 0 ? 'text-red-400 font-bold' : 'text-celestial-white/80'}>{gameState.violations}/4</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-xs text-celestial-white/70">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500/50" />
              {gameState.weather}
              <span className="text-blue-500/50">({getWeatherEffect(gameState.weather, gameState.language)})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500/50" />
              {gameState.time}
              <span className="text-amber-500/50">({getTimeEffect(gameState.time, gameState.language)})</span>
            </div>
          </div>
        </div>

        {/* Control Tabs */}
        <div className="flex-1 flex">
          {/* Tab Navigation */}
          <div className="w-16 border-r border-celestial-gold/10 flex flex-col">
            {[
              { id: 'inventory', icon: Package, label: strings.inventory },
              { id: 'map', icon: MapIcon, label: strings.map },
              { id: 'rules', icon: ScrollText, label: strings.rules },
              { id: 'settings', icon: Settings, label: strings.settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center border-b border-celestial-gold/10 transition-colors relative group ${activeTab === tab.id ? 'text-celestial-gold bg-celestial-gold/5' : 'text-celestial-white/50 hover:text-celestial-white/80 hover:bg-celestial-gold/5'}`}
                title={tab.label}
              >
                {activeTab === tab.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-celestial-gold" />}
                <tab.icon className="w-5 h-5" />
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {activeTab === 'inventory' && (
              <div className="space-y-4">
                <h3 className="text-celestial-gold uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4" /> {strings.inventory}
                </h3>
                {gameState.inventory.length === 0 ? (
                  <div className="text-celestial-white/40 text-sm italic">{strings.emptyInventory}</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {gameState.inventory.map(item => (
                      <div key={item.id} className="border border-celestial-gold/20 p-3 bg-celestial-gold/5 hover:border-celestial-gold/50 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-amber-400 text-sm font-bold">{item.name}</span>
                          <span className="text-xs bg-celestial-dark px-2 py-1 border border-celestial-gold/20 text-celestial-white/70">x{item.quantity}</span>
                        </div>
                        <div className="text-xs text-celestial-white/50 leading-relaxed">{item.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'map' && (
              <div className="h-full flex flex-col">
                <h3 className="text-celestial-gold uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                  <MapIcon className="w-4 h-4" /> {strings.map}
                </h3>
                <div className="flex-1 border border-celestial-gold/20 bg-celestial-dark/50 relative overflow-hidden">
                  <MapPanel nodes={gameState.mapNodes} edges={gameState.mapEdges} currentLocationId={gameState.currentLocationId} />
                </div>
              </div>
            )}

            {activeTab === 'rules' && (
              <div className="space-y-4">
                <h3 className="text-celestial-gold uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                  <ScrollText className="w-4 h-4" /> {strings.rules}
                </h3>
                <div className="space-y-2">
                  {gameState.world?.rules.map((rule, idx) => (
                    <div key={idx} className="flex gap-3 text-sm p-3 border border-celestial-gold/10 bg-celestial-gold/5 hover:bg-celestial-gold/10 transition-colors">
                      <span className="text-red-400 font-bold">[{idx + 1}]</span>
                      <span className="text-celestial-white/80">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6 max-w-2xl">
                <h3 className="text-celestial-gold uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                  <Settings className="w-4 h-4" /> {strings.settings}
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs text-celestial-white/50 uppercase tracking-widest">{strings.apiKey}</label>
                    <input 
                      type="password"
                      value={apiSettings.apiKey}
                      onChange={e => setApiSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                      className="w-full bg-celestial-dark border border-celestial-gold/30 p-2 text-sm focus:border-celestial-gold outline-none"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs text-celestial-white/50 uppercase tracking-widest">{strings.modelSelect}</label>
                    <select 
                      value={apiSettings.model}
                      onChange={e => setApiSettings(prev => ({ ...prev, model: e.target.value }))}
                      className="w-full bg-celestial-dark border border-celestial-gold/30 p-2 text-sm focus:border-celestial-gold outline-none"
                    >
                      <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                      <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-celestial-gold/20 flex gap-4">
                    <button 
                      onClick={reweaveReality}
                      className="px-4 py-2 border border-amber-500/50 text-amber-500 hover:bg-amber-500/10 transition-colors text-sm uppercase tracking-widest flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" /> {strings.reweave}
                    </button>
                    <button 
                      onClick={resetGame}
                      className="px-4 py-2 border border-red-400/50 text-red-400 hover:bg-red-800/10 transition-colors text-sm uppercase tracking-widest flex items-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" /> {strings.hardReset}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
