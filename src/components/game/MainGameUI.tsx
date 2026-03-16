import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Map as MapIcon, 
  Package, 
  Settings as SettingsIcon, 
  Scroll, 
  Heart, 
  AlertTriangle, 
  ChevronRight, 
  Send,
  RefreshCw,
  History,
  ShieldAlert,
  CloudSun,
  MapPin
} from 'lucide-react';
import { BBCodeRenderer } from '../BBCodeRenderer';
import { MapPanel } from '../MapPanel';
import { BackgroundEffects, Constellations, RotatingSphereMesh } from '../BackgroundEffects';
import { ReviewScreen } from '../ReviewScreen';
import { VideoScreen } from '../VideoScreen';
import { UI_STRINGS } from '../../constants';
import { getWeatherEffect, getTimeEffect } from '../../utils/gameUtils';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useGameActions } from '../../hooks/useGameActions';
import { GameOverOverlay } from './GameOverOverlay';

export function MainGameUI() {
  const { gameState, setGameState, options } = useGameStore();
  const { apiSettings, setApiSettings } = useSettingsStore();
  const {
    input, setInput, isLoading, showWarning, activeTab, setActiveTab,
    isGlitching, isConducting, showReview, setShowReview, showVideo, setShowVideo,
    videoUrl, setVideoUrl, isTyping, setIsTyping, isGeneratingImage, setIsGeneratingImage, notifications
  } = useUIStore();
  const {
    chatEndRef, handleReset, handleReweave, handleNodeClick, handleAction
  } = useGameActions();

  return (
    <div className={`h-screen bg-[#1a0f0a] text-[#d4b595] flex flex-col font-serif overflow-hidden relative ${isGlitching ? 'glitch-effect' : ''}`}>
      {showReview && !showVideo && (
        <ReviewScreen 
          onClose={() => setShowReview(false)} 
          onVideoReady={(url) => {
            setVideoUrl(url);
            setShowVideo(true);
          }}
        />
      )}
      {showVideo && videoUrl && (
        <VideoScreen 
          videoUrl={videoUrl} 
          onClose={() => setShowVideo(false)} 
        />
      )}
      <BackgroundEffects isTyping={isTyping} />
      <RotatingSphereMesh isTyping={isTyping} />
      <Constellations isConducting={isConducting} isTyping={isTyping} />
      <div className="celestial-pattern-edge" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')" }} />
      
      {/* Background Constellation Pulse */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] border border-[#d4b595]/10 rounded-full animate-pulse-breath" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] border border-[#d4b595]/5 rounded-full animate-pulse-breath" style={{ animationDelay: '2s' }} />
      </div>

      {/* Notifications */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className="frosted-glass dynamic-border px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 min-w-[240px] pointer-events-auto"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${n.type === 'item' ? 'bg-amber-500/20 text-amber-400' : n.type === 'system' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                {n.type === 'item' ? <Scroll size={20} /> : n.type === 'system' ? <Heart size={20} /> : <MapPin size={20} />}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#d4b595]/60 font-bold">
                  {n.type === 'item' ? (gameState.language === 'zh' ? '获得新道具' : 'New Item') : n.type === 'system' ? (gameState.language === 'zh' ? '系统提示' : 'System') : (gameState.language === 'zh' ? '发现新地点' : 'New Location')}
                </p>
                <p className="text-sm font-medium text-[#f5e6d3]">{n.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Warning Popup */}
      <AnimatePresence>
        {showWarning && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] bg-red-600 text-white px-8 py-4 rounded-2xl shadow-2xl font-bold text-2xl flex items-center gap-4 border-4 border-white animate-pulse"
          >
            <ShieldAlert size={48} />
            {UI_STRINGS[gameState.language].warning}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guide Overlay */}
      <AnimatePresence>
        {gameState.showGuide && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-stone-950/95 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <div className="max-w-2xl w-full bg-stone-900 border border-stone-800 rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
              <h2 className="text-3xl font-bold mb-6 text-amber-400 flex items-center gap-3">
                <Scroll className="text-amber-500" />
                {UI_STRINGS[gameState.language].guideTitle}
              </h2>
              
              <div className="space-y-6 text-sm">
                <section className="p-4 bg-stone-950 rounded-xl border border-stone-800">
                  <h3 className="text-amber-500 font-bold mb-2 uppercase tracking-widest text-[10px]">{UI_STRINGS[gameState.language].guideWorld}</h3>
                  <p className="text-stone-300">{gameState.world?.description}</p>
                </section>

                <section className="p-4 bg-stone-950 rounded-xl border border-stone-800">
                  <h3 className="text-amber-500 font-bold mb-2 uppercase tracking-widest text-[10px]">{UI_STRINGS[gameState.language].guideChar}</h3>
                  <p className="text-stone-300"><span className="font-bold text-amber-200">{gameState.character?.name}</span> - {gameState.character?.traits}</p>
                </section>

                <section className="p-4 bg-stone-950 rounded-xl border border-stone-800">
                  <h3 className="text-amber-500 font-bold mb-2 uppercase tracking-widest text-[10px]">{UI_STRINGS[gameState.language].guideRules}</h3>
                  <ul className="space-y-2">
                    {gameState.world?.rules.slice(0, 5).map((rule, i) => (
                      <li key={i} className="flex items-start gap-2 text-stone-400">
                        <div className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                        {rule}
                      </li>
                    ))}
                  </ul>
                </section>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-stone-950 rounded-xl border border-stone-800">
                    <h3 className="text-amber-500 font-bold mb-2 uppercase tracking-widest text-[10px]">{UI_STRINGS[gameState.language].guideTime}</h3>
                    <p className="text-stone-300 font-mono">Day 1 08:00</p>
                  </div>
                  <div className="p-4 bg-stone-950 rounded-xl border border-stone-800">
                    <h3 className="text-amber-500 font-bold mb-2 uppercase tracking-widest text-[10px]">{UI_STRINGS[gameState.language].guideWeather}</h3>
                    <p className="text-stone-300">{gameState.weather}</p>
                  </div>
                </div>

                <section className="p-4 bg-amber-900/10 rounded-xl border border-amber-500/20">
                  <h3 className="text-amber-400 font-bold mb-3 uppercase tracking-widest text-[10px]">{UI_STRINGS[gameState.language].guideStructure}</h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs text-stone-400">
                    <li className="flex items-center gap-2">
                      <ChevronRight size={12} className="text-amber-500" />
                      {gameState.language === 'zh' ? `共 ${gameState.totalChapters} 个章节` : `${gameState.totalChapters} Chapters`}
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight size={12} className="text-amber-500" />
                      {UI_STRINGS[gameState.language].guideSteps}
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight size={12} className="text-amber-500" />
                      {UI_STRINGS[gameState.language].guideProgression}
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight size={12} className="text-amber-500" />
                      {UI_STRINGS[gameState.language].guideEnding}
                    </li>
                  </ul>
                </section>

                <section className="p-4 bg-stone-950 rounded-xl border border-stone-800">
                  <h3 className="text-amber-500 font-bold mb-2 uppercase tracking-widest text-[10px]">{UI_STRINGS[gameState.language].guideWeatherTimeTitle}</h3>
                  <p className="text-stone-300 whitespace-pre-line">{UI_STRINGS[gameState.language].guideWeatherTimeDesc}</p>
                </section>

                <p className="text-center text-stone-500 italic text-xs">{UI_STRINGS[gameState.language].guideItems}</p>
              </div>

              <button 
                onClick={() => setGameState(prev => ({ ...prev, showGuide: false }))}
                className="mt-8 w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-900/20"
              >
                {UI_STRINGS[gameState.language].begin}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Half: Scene & Interaction */}
      <div className="h-2/3 flex min-h-0 border-b border-[#d4b595]/20 relative z-10">
        {/* Left 1/3: Scene Image Area */}
        <div className="w-1/3 border-r border-[#d4b595]/20 flex flex-col bg-black/20 frosted-glass">
          <div className="p-2 border-b border-[#d4b595]/20 bg-[#d4b595]/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapIcon size={14} className="text-[#f5e6d3]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4b595]/60">{UI_STRINGS[gameState.language].scene}</span>
            </div>
            <div className="text-[10px] text-[#d4b595]/40 font-mono">CH {gameState.currentChapter}/{gameState.totalChapters} - R {gameState.currentStep}/4</div>
          </div>
          <div className="flex-1 overflow-hidden relative group bg-stone-950">
            {gameState.currentVideo ? (
              <video 
                src={gameState.currentVideo}
                autoPlay
                muted
                playsInline
                crossOrigin="anonymous"
                className={`w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 ${gameState.status < 40 ? 'contrast-75 blur-[1px]' : ''}`}
                onEnded={(e) => {
                  const videoElement = e.currentTarget;
                  try {
                    const canvas = document.createElement('canvas');
                    canvas.width = videoElement.videoWidth || 1280;
                    canvas.height = videoElement.videoHeight || 720;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                      setGameState(prev => ({ ...prev, currentImage: dataUrl, currentVideo: undefined }));
                    } else {
                      setGameState(prev => ({ ...prev, currentVideo: undefined }));
                    }
                  } catch (err) {
                    console.error("Failed to extract frame on video end", err);
                    setGameState(prev => ({ ...prev, currentVideo: undefined }));
                  }
                  setIsGeneratingImage(false);
                }}
                onError={() => {
                  setGameState(prev => ({ ...prev, currentVideo: undefined }));
                  setIsGeneratingImage(false);
                }}
              />
            ) : gameState.currentImage ? (
              <img 
                src={gameState.currentImage} 
                alt={UI_STRINGS[gameState.language].scene} 
                className={`w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 ${gameState.status < 40 ? 'contrast-75 blur-[1px]' : ''}`}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <RefreshCw size={24} className="animate-spin text-amber-500/30" />
                <span className="text-[10px] text-stone-600 italic">{UI_STRINGS[gameState.language].visualizing}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 to-transparent pointer-events-none" />
          </div>
          <div className="p-2 border-t border-stone-800 bg-stone-900/30 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CloudSun size={12} className="text-blue-400" />
              <span className="text-[9px] text-stone-400 uppercase">{gameState.weather}</span>
            </div>
            <span className="text-[9px] text-stone-500 font-mono">{gameState.time}</span>
          </div>
        </div>

        {/* Right 2/3: Chat & Interaction */}
        <div className="w-2/3 flex flex-col min-h-0 bg-black/10">
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <AnimatePresence mode="popLayout">
              {gameState.history.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[90%] p-4 rounded-2xl frosted-glass border ${
                    msg.role === 'user' 
                      ? 'bg-[#d4b595]/10 border-[#d4b595]/30 text-[#f5e6d3]' 
                      : msg.role === 'system'
                      ? 'bg-black/40 border-[#d4b595]/10 text-[#d4b595]/60 italic'
                      : 'bg-[#d4b595]/5 border-[#d4b595]/20 text-[#d4b595]'
                  }`}>
                    <BBCodeRenderer text={msg.content} className="prose prose-invert prose-stone max-w-none text-sm leading-relaxed" />
                    {msg.hpBreakdown && (
                      <div className="mt-3 pt-3 border-t border-stone-800/50 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] text-stone-500">
                        <div className="flex justify-between"><span>Action:</span> <span className={msg.hpBreakdown.action_change > 0 ? 'text-emerald-400' : msg.hpBreakdown.action_change < 0 ? 'text-red-400' : ''}>{msg.hpBreakdown.action_change > 0 ? '+' : ''}{msg.hpBreakdown.action_change}</span></div>
                        <div className="flex justify-between"><span>Violation:</span> <span className={msg.hpBreakdown.violation_penalty < 0 ? 'text-red-400' : ''}>{msg.hpBreakdown.violation_penalty}</span></div>
                        <div className="flex justify-between"><span>Time:</span> <span className={msg.hpBreakdown.time_erosion < 0 ? 'text-red-400' : ''}>{msg.hpBreakdown.time_erosion}</span></div>
                        <div className="flex justify-between"><span>Weather:</span> <span className={msg.hpBreakdown.weather_effect > 0 ? 'text-emerald-400' : msg.hpBreakdown.weather_effect < 0 ? 'text-red-400' : ''}>{msg.hpBreakdown.weather_effect > 0 ? '+' : ''}{msg.hpBreakdown.weather_effect}</span></div>
                        <div className="flex justify-between"><span>Item:</span> <span className={msg.hpBreakdown.item_modifier > 0 ? 'text-emerald-400' : msg.hpBreakdown.item_modifier < 0 ? 'text-red-400' : ''}>{msg.hpBreakdown.item_modifier > 0 ? '+' : ''}{msg.hpBreakdown.item_modifier}</span></div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl flex items-center gap-3">
                  <RefreshCw size={16} className="animate-spin text-amber-500" />
                  <span className="text-xs italic text-stone-500">{UI_STRINGS[gameState.language].weaverWorking}</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Image Generation Progress */}
          {isGeneratingImage && !gameState.currentVideo && !gameState.isGameOver && (
            <div className="px-4 py-3 flex flex-col items-center justify-center bg-black/40 border-t border-[#d4b595]/20 frosted-glass">
              <div className="text-xs text-[#d4b595] mb-2 animate-pulse">
                {gameState.language === 'zh' ? '世界正在构筑中，请稍候...' : 'The world is forming, please wait...'}
              </div>
              <div className="w-64 h-1 bg-stone-800 rounded-full overflow-hidden relative">
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-[#d4b595] w-1/3 rounded-full"
                  animate={{ left: ['-33%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                />
              </div>
            </div>
          )}

          {/* Options Area */}
          {options.length > 0 && !gameState.isGameOver && !isGeneratingImage && (
            <div className="px-4 py-2 flex flex-wrap gap-2 justify-center bg-black/20 border-t border-[#d4b595]/10 frosted-glass">
              {options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAction(opt)}
                  disabled={isLoading || isGeneratingImage}
                  className="px-4 py-1.5 deep-brown-card rounded-full text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <BBCodeRenderer text={opt} />
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 bg-black/40 border-t border-[#d4b595]/20 frosted-glass">
            <div className="flex gap-2 max-w-4xl mx-auto">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                onKeyDown={(e) => e.key === 'Enter' && handleAction(input)}
                placeholder={UI_STRINGS[gameState.language].whatWillYouDo}
                className="flex-1 bg-black/40 border border-[#d4b595]/30 rounded-xl px-4 py-3 focus:outline-none focus:border-[#f5e6d3] transition-all cold-white-glow text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || isGeneratingImage || gameState.isGameOver}
              />
              <button 
                onClick={() => handleAction(input)}
                disabled={isLoading || isGeneratingImage || !input.trim() || gameState.isGameOver}
                className="p-3 bg-[#d4b595]/20 hover:bg-[#d4b595]/40 disabled:bg-black/20 text-[#f5e6d3] rounded-xl transition-all cold-white-glow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Half: Status & Controls */}
      <div className="h-1/3 flex border-t border-[#d4b595]/20 bg-black/20 frosted-glass relative z-10">
        {/* Left 1/3: Status Area */}
        <div className="w-1/3 border-r border-[#d4b595]/20 p-4 overflow-y-auto bg-black/10">
          <div className="flex items-center gap-2 mb-4">
            <Heart size={16} className="text-[#f5e6d3]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#d4b595]/60">{UI_STRINGS[gameState.language].status}</span>
          </div>
          
          <div className="space-y-4">
            <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-stone-500 uppercase">{UI_STRINGS[gameState.language].vitality}</span>
                <span className="text-xs font-bold text-stone-200">{gameState.status}%</span>
              </div>
              <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${gameState.status}%` }} />
              </div>
            </div>

            <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[#d4b595]/60 uppercase">{UI_STRINGS[gameState.language].status}</span>
                <AlertTriangle size={12} className="text-[#f5e6d3]" />
              </div>
              <div className="text-xl font-bold text-[#f5e6d3]">{gameState.violations}</div>
              <p className="text-[9px] text-[#d4b595]/40 leading-tight">{UI_STRINGS[gameState.language].violationDesc}</p>
            </div>

            <div className="p-3 bg-black/40 rounded-xl border border-[#d4b595]/20 frosted-glass">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#d4b595]/60 uppercase">{UI_STRINGS[gameState.language].environment}</span>
                <CloudSun size={14} className="text-[#f5e6d3]" />
              </div>
              <div className="text-sm font-bold text-[#f5e6d3]">{gameState.weather}</div>
              <div className="text-xs text-[#d4b595]/40 mt-1">{gameState.time}</div>
              <div className="text-[10px] text-[#d4b595]/60 mt-2 border-t border-[#d4b595]/20 pt-2 space-y-1">
                <div>{getWeatherEffect(gameState.weather, gameState.language)}</div>
                <div>{getTimeEffect(gameState.time, gameState.language)}</div>
              </div>
            </div>

            {/* Physical States Display */}
            {Object.entries(gameState.physicalStates).length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] text-[#d4b595]/60 uppercase block px-1">Physical States</span>
                {Object.entries(gameState.physicalStates).map(([key, value]: [string, any]) => (
                  <div key={key} className="p-2 bg-black/40 rounded-lg border border-[#d4b595]/20 flex justify-between items-center frosted-glass">
                    <span className="text-[10px] text-[#d4b595]/60">{key}</span>
                    <span className={`text-[10px] font-bold ${value.state === 'Bright' || value.state === 'Full' || value.state === 'On' ? 'text-white' : 'text-[#d4b595]/40'}`}>
                      {value.state}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 2/3: Functional Tabs */}
        <div className="w-2/3 flex flex-col min-h-0">
          {/* Tab Navigation */}
          <div className="flex overflow-x-auto border-b border-[#d4b595]/20 scrollbar-hide bg-black/20">
            {[
              { id: 'inventory', icon: Package, label: UI_STRINGS[gameState.language].inventory },
              { id: 'map', icon: MapIcon, label: UI_STRINGS[gameState.language].map },
              { id: 'rules', icon: ShieldAlert, label: UI_STRINGS[gameState.language].rules },
              { id: 'chapters', icon: History, label: UI_STRINGS[gameState.language].chapters },
              { id: 'settings', icon: SettingsIcon, label: UI_STRINGS[gameState.language].settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'border-[#d4b595] bg-[#d4b595]/10 text-[#f5e6d3]' 
                    : 'border-transparent text-[#d4b595]/40 hover:text-[#d4b595]/70'
                }`}
              >
                <tab.icon size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <AnimatePresence mode="wait">
              {activeTab === 'inventory' && (
                <motion.div 
                  key="inventory"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                >
                  {gameState.inventory.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-stone-600 italic text-sm">{UI_STRINGS[gameState.language].emptyInventory}</div>
                  ) : (
                    gameState.inventory.map((item) => (
                      <button 
                        key={item.id} 
                        onClick={() => {
                          const useText = gameState.language === 'zh' ? `[使用 ${item.name}] ` : `[Use ${item.name}] `;
                          setInput(input + useText);
                        }}
                        className="p-3 bg-stone-950 rounded-xl border border-stone-800 group text-left hover:border-amber-500/50 transition-all relative overflow-hidden"
                      >
                        <div className="text-xs font-bold text-amber-400 mb-1">
                          <BBCodeRenderer text={item.name} />
                        </div>
                        <BBCodeRenderer text={item.description} className="text-[10px] text-stone-500 leading-tight mb-4" />
                        <div className="absolute bottom-1 right-2 text-[10px] font-mono text-amber-500/60 font-bold">
                          x{item.quantity}
                        </div>
                      </button>
                    ))
                  )}
                </motion.div>
              )}

            {activeTab === 'map' && (
              <motion.div 
                key="map"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full"
              >
                <MapPanel 
                  nodes={gameState.mapNodes} 
                  edges={gameState.mapEdges} 
                  currentId={gameState.currentLocationId}
                  language={gameState.language}
                  weather={gameState.weather}
                  onNodeClick={handleNodeClick}
                />
              </motion.div>
            )}

            {activeTab === 'rules' && (
              <motion.div 
                key="rules"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-4">{UI_STRINGS[gameState.language].laws}</h3>
                {gameState.world?.rules.map((rule, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-stone-950 rounded-xl border border-stone-800">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <BBCodeRenderer text={rule} className="text-sm text-stone-300" />
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'chapters' && (
              <motion.div 
                key="chapters"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-wrap gap-4 justify-center py-4"
              >
                {Array.from({ length: gameState.totalChapters }, (_, i) => i + 1).map((ch) => (
                  <button
                    key={ch}
                    disabled={!gameState.unlockedChapters.includes(ch)}
                    onClick={() => setGameState(prev => ({ ...prev, currentChapter: ch }))}
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold transition-all ${
                      gameState.currentChapter === ch
                        ? 'border-amber-500 bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/20'
                        : gameState.unlockedChapters.includes(ch)
                        ? 'border-stone-700 text-stone-300 hover:border-amber-500/50'
                        : 'border-stone-900 text-stone-800 cursor-not-allowed'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-4 max-w-md mx-auto"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-stone-500 uppercase block mb-1">AI Provider</label>
                    <select 
                      value={apiSettings.provider}
                      onChange={(e) => {
                        const provider = e.target.value as any;
                        const model = provider === 'gemini' ? 'gemini-3-flash-preview' : 'deepseek-chat';
                        setApiSettings(p => ({ ...p, provider, model }));
                      }}
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs"
                    >
                      <option value="gemini">Google Gemini</option>
                      <option value="deepseek">DeepSeek</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500 uppercase block mb-1">Model</label>
                    <input 
                      value={apiSettings.model}
                      onChange={(e) => setApiSettings(p => ({ ...p, model: e.target.value }))}
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-stone-500 uppercase block mb-1">Language API Key (Optional for Gemini)</label>
                  <input 
                    type="password"
                    value={apiSettings.apiKey}
                    onChange={(e) => setApiSettings(p => ({ ...p, apiKey: e.target.value }))}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs"
                    placeholder="Enter key..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-stone-500 uppercase block mb-1">Image Provider</label>
                    <select 
                      value={apiSettings.imageProvider}
                      onChange={(e) => {
                        const provider = e.target.value as any;
                        setApiSettings(p => ({ 
                          ...p, 
                          imageProvider: provider,
                          imageModel: provider === 'doubao' ? '' : p.imageModel
                        }));
                      }}
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs"
                    >
                      <option value="gemini">Gemini (Fallback)</option>
                      <option value="doubao">Doubao (Yibu API)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500 uppercase block mb-1">Image Model / Endpoint ID</label>
                    <input 
                      value={apiSettings.imageModel}
                      onChange={(e) => setApiSettings(p => ({ ...p, imageModel: e.target.value }))}
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs"
                      placeholder="e.g. ep-2024..."
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-stone-500 uppercase block mb-1">Yibu API Key (for Doubao)</label>
                  <input 
                    type="password"
                    value={apiSettings.imageApiKey}
                    onChange={(e) => setApiSettings(p => ({ ...p, imageApiKey: e.target.value }))}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs"
                    placeholder="sk-..."
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-500 uppercase block mb-1">Doubao Video API Key</label>
                  <input 
                    type="password"
                    value={apiSettings.videoApiKey || ''}
                    onChange={(e) => setApiSettings(p => ({ ...p, videoApiKey: e.target.value }))}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs"
                    placeholder="Doubao Video API Key"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-stone-500 uppercase block mb-1">Context Window</label>
                    <input 
                      type="number"
                      value={apiSettings.contextLimit}
                      onChange={(e) => setApiSettings(p => ({ ...p, contextLimit: parseInt(e.target.value) }))}
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500 uppercase block mb-1">RAG Limit</label>
                    <input 
                      type="number"
                      value={apiSettings.ragLimit}
                      onChange={(e) => setApiSettings(p => ({ ...p, ragLimit: parseInt(e.target.value) }))}
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs"
                    />
                  </div>
                </div>
                <div className="pt-4 border-t border-stone-800 flex justify-center">
                  <button 
                    onClick={handleReset}
                    className="px-6 py-2 bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-bold hover:bg-red-900/40 transition-all flex items-center gap-2"
                  >
                    <RefreshCw size={14} />
                    {UI_STRINGS[gameState.language].reset}
                  </button>
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <GameOverOverlay />
    </div>
  );
}
