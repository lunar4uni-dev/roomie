
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { EmotionType, ReflectionCategory, DiaryEntry, ChatMessage, GlobalMemory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MAX_RETRIES = 5; // Increased to give more room for recovery
const INITIAL_BACKOFF = 2000; // Increased base backoff to 2s

export class GeminiService {
  /**
   * Loads a prompt from a markdown file in the /prompts directory.
   */
  private static async loadPrompt(name: string): Promise<string> {
    try {
      const response = await fetch(`./prompts/${name}.md`);
      if (!response.ok) throw new Error(`Failed to load prompt: ${name}`);
      return await response.text();
    } catch (e) {
      console.error(`Prompt load error for ${name}:`, e);
      return "";
    }
  }

  /**
   * Helper to handle retries with exponential backoff for 429 errors.
   */
  private static async withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const errorString = JSON.stringify(error).toLowerCase();
      const errorMessage = (error?.message || "").toLowerCase();

      const isRateLimit =
        error?.status === 429 ||
        errorMessage.includes('429') ||
        errorMessage.includes('resource_exhausted') ||
        errorMessage.includes('quota') ||
        errorString.includes('429') ||
        errorString.includes('resource_exhausted');

      if (isRateLimit && retries > 0) {
        // Exponential backoff: 2s, 4s, 8s, 16s, 32s + jitter
        const attempt = MAX_RETRIES - retries;
        const waitTime = INITIAL_BACKOFF * Math.pow(2, attempt) + Math.random() * 1000;

        console.warn(`[Roomie] Quota hit. Attempt ${attempt + 1}/${MAX_RETRIES}. Retrying in ${Math.round(waitTime)}ms...`);

        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.withRetry(fn, retries - 1);
      }
      throw error;
    }
  }

  static async chatWithRoomie(
    message: string,
    history: ChatMessage[],
    memory: GlobalMemory,
    recentEntries: DiaryEntry[]
  ) {
    return this.withRetry(async () => {
      const promptTemplate = await this.loadPrompt('system_instruction');

      const reflectionContext = recentEntries.length > 0
        ? recentEntries.slice(0, 5).map(e => `- [${new Date(e.timestamp).toLocaleDateString()}] Felt ${e.emotion}: "${e.summary}"`).join('\n')
        : "No past reflections recorded yet.";

      const systemPrompt = promptTemplate
        .replace('{{GLOBAL_SUMMARY}}', memory.summary)
        .replace('{{REFLECTION_CONTEXT}}', reflectionContext) || "You are Roomie, a helpful robot.";

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          ...history,
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: systemPrompt,
        }
      });

      return response.text;
    });
  }

  static async updateGlobalMemory(history: ChatMessage[], entries: DiaryEntry[], currentMemory: string): Promise<string> {
    return this.withRetry(async () => {
      const promptTemplate = await this.loadPrompt('global_memory_update');
      const convoText = history.slice(-20).map(h => `${h.role}: ${h.parts[0].text}`).join('\n');
      const entryText = entries.slice(0, 10).map(e => e.summary).join(' | ');

      const prompt = promptTemplate
        .replace('{{OLD_SUMMARY}}', currentMemory)
        .replace('{{CONVO_TEXT}}', convoText)
        .replace('{{ENTRY_TEXT}}', entryText) || "Summarize the user history.";

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      return response.text || currentMemory;
    });
  }

  static async analyzeDiaryEntry(content: string): Promise<Partial<DiaryEntry>> {
    return this.withRetry(async () => {
      const promptTemplate = await this.loadPrompt('diary_analysis');
      const prompt = promptTemplate.replace('{{CONTENT}}', content) || `Analyze: ${content}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              emotion: {
                type: Type.STRING,
                description: "Must be one of: Happy, Calm, Sad, Anxious, Excited, Tired"
              },
              category: {
                type: Type.STRING,
                description: "Must be one of: Personal Feelings, Relationships, Books & Dreams, General"
              },
              summary: {
                type: Type.STRING,
                description: "A concise, 1-sentence heartwarming summary for the log."
              }
            },
            required: ["emotion", "category", "summary"]
          }
        }
      });

      try {
        const text = response.text || '{}';
        return JSON.parse(text);
      } catch (e) {
        return { emotion: EmotionType.CALM, category: ReflectionCategory.GENERAL, summary: "A moment of sharing." };
      }
    });
  }

  static async getMusicRecommendations(emotion: string): Promise<{ title: string, artist: string }[]> {
    return this.withRetry(async () => {
      const promptTemplate = await this.loadPrompt('music_recommendations');
      const prompt = promptTemplate.replace('{{EMOTION}}', emotion) || `Music for ${emotion}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                artist: { type: Type.STRING }
              },
              required: ["title", "artist"]
            }
          }
        }
      });
      try {
        const text = response.text || '[]';
        return JSON.parse(text);
      } catch (e) {
        return [];
      }
    });
  }
}
