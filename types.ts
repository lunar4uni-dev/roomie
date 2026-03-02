
export enum EmotionType {
  HAPPY = 'Happy',
  CALM = 'Calm',
  SAD = 'Sad',
  ANXIOUS = 'Anxious',
  EXCITED = 'Excited',
  TIRED = 'Tired'
}

export enum ReflectionCategory {
  PERSONAL = 'Personal Feelings',
  RELATIONSHIPS = 'Relationships',
  BOOKS = 'Books & Dreams',
  GENERAL = 'General'
}

export interface DiaryEntry {
  id: string;
  timestamp: number;
  content: string;
  emotion: EmotionType;
  category: ReflectionCategory;
  summary: string;
}

export interface RecommendedTrack {
  title: string;
  artist: string;
  mood: string;
  url: string;
}

export interface RobotState {
  isSpeaking: boolean;
  currentEmotion: EmotionType;
  lastResponse: string;
}

export interface GlobalMemory {
  summary: string;
  lastUpdated: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}
