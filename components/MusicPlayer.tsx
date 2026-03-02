
import React, { useState, useEffect, useRef } from 'react';
import { GeminiService } from '../services/geminiService';
import { EmotionType } from '../types';

interface MusicPlayerProps {
  emotion: EmotionType;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ emotion }) => {
  const [recommendations, setRecommendations] = useState<{title: string, artist: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const lastEmotionRef = useRef<EmotionType | null>(null);

  useEffect(() => {
    // Prevent redundant calls if the emotion is the same
    if (lastEmotionRef.current === emotion) return;

    const fetchMusic = async () => {
      setLoading(true);
      try {
        const recs = await GeminiService.getMusicRecommendations(emotion);
        setRecommendations(recs);
        lastEmotionRef.current = emotion;
      } catch (error) {
        console.error("Failed to fetch music recommendations", error);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(fetchMusic, 500); // Small delay to debounce rapid changes
    return () => clearTimeout(timeout);
  }, [emotion]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-100 rounded-lg">
          <i className="fas fa-headphones text-purple-600"></i>
        </div>
        <h3 className="text-lg font-bold text-slate-700">Roomie's Music Corner</h3>
      </div>
      
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-12 bg-slate-100 rounded-xl"></div>
          <div className="h-12 bg-slate-100 rounded-xl"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.length > 0 ? recommendations.map((track, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer group">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-800">{track.title}</span>
                <span className="text-xs text-slate-500">{track.artist}</span>
              </div>
              <i className="fas fa-play text-xs text-slate-300 group-hover:text-purple-500 transition-colors"></i>
            </div>
          )) : (
            <div className="text-xs text-slate-400 p-2 italic">I'm thinking of the perfect tunes... ✨</div>
          )}
        </div>
      )}
      <p className="mt-4 text-xs text-slate-400 italic">
        "Selected from the robot cabinet just for your {emotion.toLowerCase()} mood."
      </p>
    </div>
  );
};

export default MusicPlayer;
