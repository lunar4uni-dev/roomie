
import React from 'react';
import { EmotionType } from '../types';
import { EyeAssets, MouthAssets, FaceDecorations } from '../assets/illustrations';

interface RobotFaceProps {
  emotion: EmotionType;
  isSpeaking: boolean;
}

const RobotFace: React.FC<RobotFaceProps> = ({ emotion, isSpeaking }) => {
  const renderEyes = () => {
    switch (emotion) {
      case EmotionType.HAPPY: return <EyeAssets.Happy />;
      case EmotionType.SAD: return <EyeAssets.Sad />;
      case EmotionType.EXCITED: return <EyeAssets.Excited />;
      default: return <EyeAssets.Default />;
    }
  };

  const mouthPath = isSpeaking ? MouthAssets.Speaking : (emotion === EmotionType.SAD ? MouthAssets.Sad : MouthAssets.Resting);

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-[2.5rem] shadow-xl border-4 border-white w-full max-w-sm mx-auto transition-all duration-500">
      <div className="relative w-64 h-64 bg-slate-800 rounded-[3.5rem] shadow-inner flex items-center justify-center overflow-hidden border-[12px] border-slate-700">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Eyes Layer */}
          <g className={isSpeaking ? "animate-bounce" : ""}>
            {renderEyes()}
          </g>
          
          {/* Mouth Layer */}
          <path 
            d={mouthPath} 
            stroke="white" 
            strokeWidth="4" 
            fill="none" 
            strokeLinecap="round"
            className={isSpeaking ? "animate-pulse" : ""}
          />
          
          {/* Decorative Layer */}
          <FaceDecorations />
        </svg>
      </div>
      <div className="mt-5 flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full bg-green-400 ${isSpeaking ? 'animate-ping' : ''}`}></div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
          {isSpeaking ? 'Processing Signal' : 'Standby Mode'}
        </span>
      </div>
    </div>
  );
};

export default RobotFace;
