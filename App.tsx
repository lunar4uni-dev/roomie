
import React, { useState, useEffect, useRef } from 'react';
import { EmotionType, ReflectionCategory, DiaryEntry, RobotState, GlobalMemory, ChatMessage } from './types';
import { GeminiService } from './services/geminiService';
import { THEME } from './assets/theme';
import RobotFace from './components/RobotFace';
import EmotionChart from './components/EmotionChart';
import MusicPlayer from './components/MusicPlayer';

const App: React.FC = () => {
  const [view, setView] = useState<'robot' | 'dashboard' | 'screentime'>('robot');
  const [dashboardTab, setDashboardTab] = useState<'analytics' | 'memories' | 'raw-data'>('analytics');
  const [isSyncing, setIsSyncing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [entries, setEntries] = useState<DiaryEntry[]>(() => {
    const saved = localStorage.getItem('roomie_db_entries');
    return saved ? JSON.parse(saved) : [];
  });

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('roomie_db_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [globalMemory, setGlobalMemory] = useState<GlobalMemory>(() => {
    const saved = localStorage.getItem('roomie_db_memory');
    return saved ? JSON.parse(saved) : {
      summary: "Initializing Heart Database... ✨",
      lastUpdated: Date.now()
    };
  });

  const [robotState, setRobotState] = useState<RobotState>({
    isSpeaking: false,
    currentEmotion: EmotionType.CALM,
    lastResponse: ""
  });

  const [inputText, setInputText] = useState('');
  const [isLosingPhone, setIsLosingPhone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('roomie_db_entries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('roomie_db_history', JSON.stringify(chatHistory));
    if (chatHistory.length > 0 && chatHistory.length % 5 === 0) {
      syncHeart();
    }
  }, [chatHistory]);

  useEffect(() => {
    localStorage.setItem('roomie_db_memory', JSON.stringify(globalMemory));
  }, [globalMemory]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const syncHeart = async () => {
    setIsSyncing(true);
    setApiError(null);
    try {
      const newSummary = await GeminiService.updateGlobalMemory(chatHistory, entries, globalMemory.summary);
      setGlobalMemory({
        summary: newSummary,
        lastUpdated: Date.now()
      });
    } catch (e: any) {
      console.error("Heart Sync failed", e);
      const isRateLimit = JSON.stringify(e).includes('429') || (e?.message || "").includes('429');
      if (isRateLimit) {
        setApiError("Roomie is taking a long breath (Rate limit). Memories will sync later! ✨");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || robotState.isSpeaking) return;

    const userMessage = inputText;
    setInputText('');
    setApiError(null);

    const newChatHistory: ChatMessage[] = [...chatHistory, { role: 'user', parts: [{ text: userMessage }] }];
    setChatHistory(newChatHistory);
    setRobotState(prev => ({ ...prev, isSpeaking: true }));

    try {
      // Step 1: Chat Response
      const response = await GeminiService.chatWithRoomie(
        userMessage,
        chatHistory,
        globalMemory,
        entries
      );

      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: response || "" }] }]);

      // Step 2: Small pause to avoid hitting rate limits with consecutive rapid-fire calls
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 3: Secondary background call for analysis
      const analysis = await GeminiService.analyzeDiaryEntry(userMessage);
      if (analysis.summary && analysis.emotion) {
        const newEntry: DiaryEntry = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          content: userMessage,
          emotion: analysis.emotion as EmotionType || EmotionType.CALM,
          category: analysis.category as ReflectionCategory || ReflectionCategory.GENERAL,
          summary: analysis.summary || "Shared a thought."
        };
        setEntries(prev => [newEntry, ...prev]);
        setRobotState(prev => ({
          ...prev,
          currentEmotion: analysis.emotion as EmotionType || prev.currentEmotion
        }));
      }
    } catch (error: any) {
      console.error("Roomie connection error:", error);
      const errorStr = JSON.stringify(error).toLowerCase();
      const isRateLimit = errorStr.includes('429') || errorStr.includes('resource_exhausted');
      setApiError(isRateLimit
        ? "I'm a bit overwhelmed with messages right now. Let's wait a moment! 🤖🧡"
        : "Something went wrong with my circuits. Try again? ✨");
    } finally {
      setRobotState(prev => ({ ...prev, isSpeaking: false }));
    }
  };

  const exportDatabase = () => {
    const data = {
      entries,
      chatHistory,
      globalMemory,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${THEME.branding.appName.toLowerCase()}_heart_db_${new Date().getTime()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importDatabase = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.entries && data.chatHistory && data.globalMemory) {
          setEntries(data.entries);
          setChatHistory(data.chatHistory);
          setGlobalMemory(data.globalMemory);
          alert("Heart Database successfully imported! ✨");
        }
      } catch (err) {
        alert("Import failed. Invalid JSON structure.");
      }
    };
    reader.readAsText(file);
  };

  const handlePhoneToss = () => {
    setIsLosingPhone(true);
    setTimeout(() => setIsLosingPhone(false), 5000);
  };

  const clearDatabase = () => {
    if (confirm("Factory Reset? This will wipe the Database. 🤖💔")) {
      setChatHistory([]);
      setGlobalMemory({ summary: "Memory cleared. ✨", lastUpdated: Date.now() });
      setEntries([]);
      localStorage.clear();
    }
  };

  return (
    <div className="min-h-screen bg-[#fdf6f0] pb-24">
      <header className="p-6 flex justify-between items-center bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center text-white relative">
            <i className={THEME.icons.robot}></i>
            {(isSyncing || robotState.isSpeaking) && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-none">{THEME.branding.appName}</h1>
            {isSyncing && <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Writing to JSON...</span>}
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setView('robot')} className={`p-2 rounded-xl transition-all ${view === 'robot' ? 'bg-orange-100 text-orange-600' : 'text-slate-400'}`}>
            <i className={THEME.icons.chat + " text-xl"}></i>
          </button>
          <button onClick={() => setView('dashboard')} className={`p-2 rounded-xl transition-all ${view === 'dashboard' ? 'bg-orange-100 text-orange-600' : 'text-slate-400'}`}>
            <i className={THEME.icons.database + " text-xl"}></i>
          </button>
          <button onClick={() => setView('screentime')} className={`p-2 rounded-xl transition-all ${view === 'screentime' ? 'bg-orange-100 text-orange-600' : 'text-slate-400'}`}>
            <i className={THEME.icons.focus + " text-xl"}></i>
          </button>
        </div>
      </header>

      {apiError && (
        <div className="bg-orange-100 border-b border-orange-200 p-2 text-center text-orange-800 text-[10px] font-bold uppercase tracking-widest animate-pulse sticky top-20 z-40">
          <i className="fas fa-wind mr-2"></i> {apiError}
        </div>
      )}

      <main className="max-w-4xl mx-auto p-4 mt-4">
        {view === 'robot' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex justify-between items-start">
              <RobotFace emotion={robotState.currentEmotion} isSpeaking={robotState.isSpeaking} />
            </div>

            <div className="flex flex-col items-end gap-2">
              <button onClick={clearDatabase} className="text-[10px] text-slate-300 hover:text-red-400 flex items-center gap-1 uppercase tracking-tighter">
                <i className={THEME.icons.trash}></i> Reset
              </button>
              <button onClick={exportDatabase} className="text-[10px] text-orange-400 hover:text-orange-600 flex items-center gap-1 uppercase tracking-tighter font-bold">
                <i className={THEME.icons.save}></i> Export JSON
              </button>
            </div>

            <div className="bg-white/40 backdrop-blur-sm rounded-[2rem] p-6 shadow-sm border border-white/60 h-[450px] overflow-y-auto flex flex-col gap-4 scrollbar-hide">
              {chatHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                  <div className="bg-white p-6 rounded-3xl shadow-sm text-center max-w-sm border-2 border-dashed border-orange-100">
                    <p className="text-slate-600 font-medium italic">"Hello! My heart database is ready for your reflections."</p>
                  </div>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-3xl shadow-sm ${msg.role === 'user'
                    ? 'bg-orange-500 text-white rounded-br-none'
                    : 'bg-white text-slate-700 rounded-bl-none'
                    }`}>
                    {msg.parts[0].text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#fdf6f0]/60 backdrop-blur-lg z-40 border-t border-white/50">
              <div className="max-w-4xl mx-auto relative group">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={robotState.isSpeaking ? "Roomie is processing..." : "Talk to Roomie..."}
                  disabled={robotState.isSpeaking}
                  className="w-full p-5 pr-16 rounded-full border-2 border-white shadow-xl focus:ring-4 focus:ring-orange-100 outline-none text-slate-700 bg-white transition-all disabled:opacity-50"
                />
                <button onClick={handleSendMessage} disabled={robotState.isSpeaking} className="absolute right-3 top-3 bg-orange-500 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-orange-600 transition-all active:scale-90 disabled:opacity-50">
                  <i className={`fas ${robotState.isSpeaking ? 'fa-circle-notch animate-spin' : THEME.icons.pencil.split(' ')[1]}`}></i>
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'dashboard' && (
          <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-orange-50 self-start w-fit">
              <button onClick={() => setDashboardTab('analytics')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${dashboardTab === 'analytics' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400'}`}>Analytics</button>
              <button onClick={() => setDashboardTab('memories')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${dashboardTab === 'memories' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400'}`}>Memories</button>
              <button onClick={() => setDashboardTab('raw-data')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${dashboardTab === 'raw-data' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400'}`}>Raw JSON</button>
            </div>

            {dashboardTab === 'analytics' && (
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-[2.5rem] text-slate-800 shadow-xl border-t-8 border-orange-400 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <i className={THEME.icons.brain + " text-9xl"}></i>
                  </div>
                  <div className="flex items-center gap-3 mb-4 text-orange-500">
                    <i className={THEME.icons.heart + " text-xl animate-pulse"}></i>
                    <h3 className="font-bold text-sm uppercase tracking-widest">Permanent Heart Summary</h3>
                  </div>
                  <p className="text-xl leading-relaxed font-semibold italic text-slate-700">
                    "{globalMemory.summary}"
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <EmotionChart entries={entries} />
                  <MusicPlayer emotion={robotState.currentEmotion} />
                </div>
              </div>
            )}

            {dashboardTab === 'memories' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <i className={THEME.icons.memory + " text-orange-400"}></i>
                  Memory Log
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {entries.map(entry => (
                    <div key={entry.id} className="bg-white p-6 rounded-3xl shadow-sm border border-orange-50 hover:translate-y-[-4px] transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-orange-100 text-orange-600`}>
                          {entry.category}
                        </span>
                        <span className="text-[10px] text-slate-300 font-bold">{new Date(entry.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-800 font-medium text-sm leading-relaxed">{entry.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dashboardTab === 'raw-data' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col h-[600px] border-4 border-slate-800">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{THEME.branding.dbFileName}</div>
                    <div className="flex gap-3">
                      <button onClick={exportDatabase} className="text-xs text-orange-400 font-bold">
                        <i className={THEME.icons.save + " mr-1"}></i> Export
                      </button>
                      <button onClick={() => fileInputRef.current?.click()} className="text-xs text-green-400 font-bold">
                        <i className={THEME.icons.import + " mr-1"}></i> Import
                      </button>
                      <input type="file" ref={fileInputRef} onChange={importDatabase} accept=".json" className="hidden" />
                    </div>
                  </div>
                  <pre className="text-xs font-mono text-green-400 overflow-auto flex-1 p-2 bg-slate-950/50 rounded-xl scrollbar-hide">
                    {JSON.stringify({ globalMemory, entries, historyCount: chatHistory.length }, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'screentime' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-fade-in">
            <div className="relative">
              <div className={`w-72 h-72 bg-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-1000 ${isLosingPhone ? 'scale-0 rotate-180 opacity-0' : 'scale-100'}`}>
                <i className={THEME.icons.focus + " text-9xl text-slate-100 drop-shadow-lg"}></i>
              </div>
              {isLosingPhone && (
                <div className="absolute top-0 left-0 w-72 h-72 bg-orange-400 rounded-full flex flex-col items-center justify-center animate-pulse shadow-2xl">
                  <i className={THEME.icons.check + " text-7xl text-white"}></i>
                  <p className="mt-4 font-bold text-white uppercase tracking-widest">Phone Secured</p>
                </div>
              )}
            </div>

            <div className="max-w-md bg-white p-8 rounded-[2.5rem] shadow-xl">
              <h2 className="text-3xl font-bold text-slate-800 mb-4">Focus Mode</h2>
              <button onClick={handlePhoneToss} disabled={isLosingPhone} className="w-full py-5 bg-orange-500 text-white rounded-full font-black uppercase tracking-widest shadow-lg shadow-orange-200 hover:bg-orange-600 active:scale-95 transition-all disabled:bg-slate-200">
                {isLosingPhone ? 'Safely Secured' : 'Lock Away Device'}
              </button>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
