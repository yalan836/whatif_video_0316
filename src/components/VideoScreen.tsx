import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { UI_STRINGS } from '../constants';
import { useGameStore } from '../store/gameStore';

interface VideoScreenProps {
  videoUrl: string;
  onClose: () => void;
}

export const VideoScreen: React.FC<VideoScreenProps> = ({ videoUrl, onClose }) => {
  const gameState = useGameStore(state => state.gameState);

  return (
    <div className="fixed inset-0 bg-stone-950 z-50 flex flex-col font-serif text-stone-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-stone-900/50">
        <button onClick={onClose} className="flex items-center gap-2 text-stone-400 hover:text-stone-200 transition-colors">
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>
        <h2 className="text-xl font-bold text-amber-500 tracking-widest uppercase">Journey Video</h2>
        <div className="w-20"></div> {/* Spacer */}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-8 bg-black">
        <video 
          src={videoUrl} 
          controls 
          autoPlay 
          className="max-w-full max-h-full rounded-xl shadow-2xl border border-stone-800"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
};
