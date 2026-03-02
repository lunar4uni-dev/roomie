
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DiaryEntry, EmotionType } from '../types';

interface EmotionChartProps {
  entries: DiaryEntry[];
}

const EmotionChart: React.FC<EmotionChartProps> = ({ entries }) => {
  const emotionValues: Record<string, number> = {
    [EmotionType.HAPPY]: 5,
    [EmotionType.EXCITED]: 4,
    [EmotionType.CALM]: 3,
    [EmotionType.TIRED]: 2,
    [EmotionType.ANXIOUS]: 1,
    [EmotionType.SAD]: 0,
  };

  const data = entries.slice(-7).map(entry => ({
    name: new Date(entry.timestamp).toLocaleDateString([], { weekday: 'short' }),
    value: emotionValues[entry.emotion] || 0,
    label: entry.emotion
  }));

  return (
    <div className="h-64 w-full bg-white p-4 rounded-2xl shadow-sm border border-orange-100">
      <h3 className="text-lg font-bold text-slate-700 mb-4">Mood Journey</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis hide />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: number) => [Object.keys(emotionValues).find(key => emotionValues[key] === value), 'Mood']}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#f97316" 
            strokeWidth={4} 
            dot={{ r: 6, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EmotionChart;
