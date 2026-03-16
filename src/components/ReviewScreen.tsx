import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { UI_STRINGS } from '../constants';
import { ChevronLeft, Play } from 'lucide-react';
import { BBCodeRenderer } from './BBCodeRenderer';
import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';
import { useUIStore } from '../store/uiStore';

interface ReviewScreenProps {
  onClose: () => void;
  onVideoReady: (url: string) => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({ onClose, onVideoReady }) => {
  const gameState = useGameStore(state => state.gameState);
  const apiSettings = useSettingsStore(state => state.apiSettings);
  const { videoUrl, setVideoUrl } = useUIStore();

  const scriptRef = useRef<HTMLDivElement>(null);
  const storyboardRef = useRef<HTMLDivElement>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const activeScrollRef = useRef<'script' | 'storyboard' | null>(null);

  // Sync scrolling
  const handleScriptScroll = () => {
    if (!scriptRef.current || !storyboardRef.current) return;
    if (activeScrollRef.current !== 'script') return;
    const scrollPercentage = scriptRef.current.scrollTop / (scriptRef.current.scrollHeight - scriptRef.current.clientHeight);
    storyboardRef.current.scrollTop = scrollPercentage * (storyboardRef.current.scrollHeight - storyboardRef.current.clientHeight);
  };

  const handleStoryboardScroll = () => {
    if (!scriptRef.current || !storyboardRef.current) return;
    if (activeScrollRef.current !== 'storyboard') return;
    const scrollPercentage = storyboardRef.current.scrollTop / (storyboardRef.current.scrollHeight - storyboardRef.current.clientHeight);
    scriptRef.current.scrollTop = scrollPercentage * (scriptRef.current.scrollHeight - scriptRef.current.clientHeight);
  };

  const scrollToItem = (index: number) => {
    if (!scriptRef.current || !storyboardRef.current) return;
    
    const scriptItems = scriptRef.current.querySelectorAll('.script-item');
    const storyboardItems = storyboardRef.current.querySelectorAll('.storyboard-item');
    
    if (scriptItems[index] && storyboardItems[index]) {
      scriptItems[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
      storyboardItems[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Track progress and trigger join
  useEffect(() => {
    if (gameState.storyboard.length === 0) return;
    if (!apiSettings.videoApiKey) {
      setVideoError(true);
      setIsGenerating(false);
      return;
    }
    
    const itemsWithVideo = gameState.storyboard.filter(item => item.videoUrl !== undefined && item.videoUrl !== 'skipped');
    const total = itemsWithVideo.length;
    const completed = itemsWithVideo.filter(item => item.videoUrl !== 'pending').length;
    const progress = total === 0 ? 100 : Math.floor((completed / total) * 100);
    
    console.log(`[Video Progress] Total videos to generate: ${total}, Completed: ${completed}, Progress: ${progress}%`);
    setVideoProgress(progress);

    if (completed === total && !videoUrl && !videoError && isGenerating) {
      console.log(`[Video Progress] All ${total} videos finished generating. Starting video join process...`);
      // All done, join them
      const joinVideos = async () => {
        try {
          const validUrls = itemsWithVideo
            .map(item => item.videoUrl)
            .filter(url => url && url !== 'failed' && url !== 'pending') as string[];

          console.log(`[Video Progress] Found ${validUrls.length} valid video URLs to join.`);

          if (validUrls.length === 0) {
            console.error(`[Video Progress] No valid video URLs found. Aborting join.`);
            setVideoError(true);
            setIsGenerating(false);
            return;
          }

          const response = await fetch('/api/video/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoUrls: validUrls })
          });

          if (!response.ok) {
            throw new Error('Failed to join videos');
          }

          const data = await response.json();
          setVideoUrl(data.url);
        } catch (e) {
          console.error("Video join failed", e);
          setVideoError(true);
        } finally {
          setIsGenerating(false);
        }
      };

      joinVideos();
    }
  }, [gameState.storyboard, videoUrl, videoError, isGenerating]);

  // Start generation process
  useEffect(() => {
    if (gameState.storyboard.length > 0 && !videoUrl) {
      setIsGenerating(true);
    }
  }, [gameState.storyboard.length, videoUrl]);

  return (
    <div className="fixed inset-0 bg-stone-950 z-50 flex flex-col font-serif text-stone-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-stone-900/50">
        <button onClick={onClose} className="flex items-center gap-2 text-stone-400 hover:text-stone-200 transition-colors">
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>
        <h2 className="text-xl font-bold text-amber-500 tracking-widest uppercase">{UI_STRINGS[gameState.language].reviewJourney}</h2>
        <div className="w-20"></div> {/* Spacer */}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Script */}
        <div 
          ref={scriptRef}
          onScroll={handleScriptScroll}
          onMouseEnter={() => activeScrollRef.current = 'script'}
          className="w-1/3 border-r border-stone-800 overflow-y-auto p-6 space-y-6 hide-scrollbar"
        >
          <h3 className="text-lg font-bold text-stone-400 uppercase tracking-widest mb-8 sticky top-0 bg-stone-950/80 backdrop-blur py-2 z-10">
            {UI_STRINGS[gameState.language].scriptTitle}
          </h3>
          {gameState.storyboard.map((item, index) => (
            <div 
              key={index} 
              className="script-item cursor-pointer hover:bg-stone-900/50 p-4 rounded-lg transition-colors border border-transparent hover:border-stone-800"
              onClick={() => {
                activeScrollRef.current = null; // Disable sync temporarily
                scrollToItem(index);
              }}
            >
              <div className="text-xs text-amber-600/70 font-sans mb-2 uppercase tracking-wider">
                Chapter {item.chapter} - Turn {item.step}
              </div>
              <div className="text-stone-300 leading-relaxed text-lg">
                <BBCodeRenderer text={item.text} />
              </div>
            </div>
          ))}
        </div>

        {/* Right: Storyboard */}
        <div 
          ref={storyboardRef}
          onScroll={handleStoryboardScroll}
          onMouseEnter={() => activeScrollRef.current = 'storyboard'}
          className="w-2/3 overflow-y-auto p-6 space-y-12 hide-scrollbar bg-stone-900/20"
        >
          <h3 className="text-lg font-bold text-stone-400 uppercase tracking-widest mb-8 sticky top-0 bg-stone-950/80 backdrop-blur py-2 z-10">
            {UI_STRINGS[gameState.language].storyboardTitle}
          </h3>
          {gameState.storyboard.map((item, index) => (
            <div 
              key={index} 
              className="storyboard-item flex gap-8 items-center cursor-pointer group"
              onClick={() => {
                activeScrollRef.current = null; // Disable sync temporarily
                scrollToItem(index);
              }}
            >
              <div className="w-1/2 relative aspect-video rounded-xl overflow-hidden border border-stone-800 group-hover:border-amber-500/50 transition-colors shadow-2xl">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={`Scene ${index}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-stone-900 flex items-center justify-center text-stone-600">No Image</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-xs font-sans text-amber-500 tracking-widest uppercase">Ch {item.chapter} . {item.step}</span>
                </div>
              </div>
              <div className="w-1/2">
                <p className="text-stone-400 text-xl leading-relaxed italic">
                  "{item.actionText || item.text.split('\n')[0]}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer: Video Progress */}
      <div className="h-24 border-t border-stone-800 bg-stone-900/80 backdrop-blur flex items-center justify-center px-8">
        {videoUrl ? (
          <button 
            onClick={() => onVideoReady(videoUrl)}
            className="flex items-center gap-3 px-8 py-3 bg-amber-600 hover:bg-amber-500 text-stone-900 rounded-full font-bold text-lg transition-all shadow-[0_0_20px_rgba(217,119,6,0.3)] hover:shadow-[0_0_30px_rgba(217,119,6,0.5)]"
          >
            <Play size={20} fill="currentColor" />
            {UI_STRINGS[gameState.language].viewVideo}
          </button>
        ) : videoError ? (
          <div className="text-red-500 font-sans text-sm tracking-widest uppercase">
            Video Generation Failed
          </div>
        ) : (
          <div className="w-full max-w-2xl space-y-2">
            <div className="flex justify-between text-sm font-sans text-stone-400 uppercase tracking-wider">
              <span>{videoProgress === 100 ? UI_STRINGS[gameState.language].joiningVideo : UI_STRINGS[gameState.language].generatingVideo}</span>
              <span>{videoProgress}%</span>
            </div>
            <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-amber-600"
                initial={{ width: 0 }}
                animate={{ width: `${videoProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};