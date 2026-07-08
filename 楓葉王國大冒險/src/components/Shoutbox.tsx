import React, { useState, useEffect } from 'react';
import { Megaphone, Send } from 'lucide-react';
import { User, ShoutMessage } from '../types';

interface ShoutboxProps {
  currentUser: User;
  onNewShoutSubmit: () => void;
}

export default function Shoutbox({ currentUser, onNewShoutSubmit }: ShoutboxProps) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouts, setShouts] = useState<ShoutMessage[]>([]);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setTimeout(() => {
        setCooldownRemaining((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownRemaining]);

  const fetchShouts = async () => {
    try {
      const res = await fetch(`${window.location.origin}/api/shouts`);
      if (res.ok) {
        const textData = await res.text();
        let data: ShoutMessage[] = [];
        try {
          data = JSON.parse(textData);
        } catch (parseErr) {
          return;
        }
        if (!Array.isArray(data)) return;

        // Sort by timestamp descending (newest first)
        const sorted = data.sort((a, b) => {
          let timeA = 0;
          let timeB = 0;
          try {
            timeA = new Date(a.timestamp).getTime();
            if (isNaN(timeA)) timeA = 0;
          } catch (e) {}
          try {
            timeB = new Date(b.timestamp).getTime();
            if (isNaN(timeB)) timeB = 0;
          } catch (e) {}
          return timeB - timeA;
        });
        setShouts(sorted);
      }
    } catch (err) {
      console.warn("Could not load shouts inside Shoutbox component:", err);
    }
  };

  useEffect(() => {
    fetchShouts();
    const interval = setInterval(fetchShouts, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${window.location.origin}/api/shouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          text: text.trim(),
        }),
      });

      if (!response.ok) {
        const textErr = await response.text();
        let errMessage = '嗆聲失敗';
        try {
          const errData = JSON.parse(textErr);
          errMessage = errData.error || errMessage;
        } catch (e) {}
        throw new Error(errMessage);
      }

      setText('');
      setCooldownRemaining(5);
      // Instantly refresh the shouts list locally
      fetchShouts();
      onNewShoutSubmit();
    } catch (err: any) {
      console.error(err);
      setError(err.message || '連線錯誤，請稍候重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCustomAvatar = (url?: string) => {
    return !!(url && (url.startsWith('data:image/') || url.startsWith('http') || url.startsWith('/')));
  };

  return (
    <div className="bg-white border-4 border-red-100 rounded-3xl p-5 shadow-xl text-left overflow-hidden relative">
      {/* Decorative background icon */}
      <div className="absolute -right-6 -bottom-6 text-red-50 opacity-30 select-none pointer-events-none">
        <Megaphone className="w-32 h-32 rotate-12" />
      </div>

      <div className="flex items-center gap-3 mb-3 relative z-10">
        <div className="p-2 bg-red-50 text-red-600 rounded-xl">
          <Megaphone className="w-5 h-5 animate-bounce" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-850 flex items-center gap-2">
            戰友嗆聲留言板 <span className="text-xs font-normal text-slate-400 font-mono">(Trash Talk Board)</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            即時推播，戰力互虧！
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 relative z-10">
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value.slice(0, 100));
            if (error) setError(null);
          }}
          placeholder="🔥 輸入你的嗆聲宣言 (例如：🛡️ 北境守衛軍衝啊！要把對手甩在後頭囉！)..."
          className="flex-1 px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-red-500 focus:outline-none text-xs font-medium text-slate-700 placeholder:text-slate-400 transition"
          maxLength={100}
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting || !text.trim() || cooldownRemaining > 0}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition select-none cursor-pointer ${
            text.trim() && cooldownRemaining === 0
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-550/20 active:scale-95'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          <span>{cooldownRemaining > 0 ? `冷卻中 (${cooldownRemaining}s)` : '嗆聲！'}</span>
        </button>
      </form>

      {error && (
        <p className="text-[10px] text-red-600 font-bold font-mono mt-1.5 relative z-10">
          ⚠️ {error}
        </p>
      )}

      {/* 玻璃擬態效果的容器 - 捲軸區域 */}
      {shouts.length > 0 && (
        <div className="mt-4 bg-slate-100/35 backdrop-blur-md border border-slate-200/50 shadow-inner rounded-2xl p-4 text-left relative z-10">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-650 animate-ping" />
              <span>近24小時嗆聲紀錄 ({shouts.length})</span>
            </span>
            <span className="text-[9px] text-slate-450 font-mono font-bold bg-slate-200/50 px-1.5 py-0.5 rounded">
              保留 1 天
            </span>
          </div>

          {/* Scrollable area */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-350 scrollbar-track-transparent">
            {shouts.map((shout, idx) => {
              const isNewestTwo = idx < 2;
              
              return (
                <div 
                  key={shout.id}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isNewestTwo 
                      ? 'bg-white/85 border-red-200/60 shadow-sm' 
                      : 'bg-white/45 border-slate-200/30 shadow-xs hover:bg-white/60'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* User Avatar */}
                    {isCustomAvatar(shout.avatar) ? (
                      <img 
                        src={shout.avatar} 
                        alt={shout.realName} 
                        className={`rounded-lg object-cover shadow-xs border border-white shrink-0 transition-all ${
                          isNewestTwo ? 'w-8 h-8' : 'w-7 h-7'
                        }`}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className={`rounded-lg flex items-center justify-center text-white font-black shadow-xs shrink-0 transition-all ${shout.avatar || 'bg-indigo-500'} ${
                        isNewestTwo ? 'w-8 h-8 text-xs' : 'w-7 h-7 text-[10px]'
                      }`}>
                        {shout.realName.slice(0, 1)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-1.5">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className={`font-black text-slate-800 truncate ${
                            isNewestTwo ? 'text-xs' : 'text-[11px]'
                          }`}>{shout.realName}</span>
                          <span className="text-[8px] text-slate-400 font-medium shrink-0">({shout.team})</span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono shrink-0">
                          {new Date(shout.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      {/* Text content - size smaller as requested */}
                      <p className={`mt-1 leading-relaxed break-words ${
                        isNewestTwo 
                          ? 'text-[11px] font-extrabold text-slate-850' 
                          : 'text-[10px] font-medium text-slate-600'
                      }`}>
                        「 {shout.text} 」
                      </p>
                    </div>

                    {isNewestTwo && (
                      <span className="text-[8px] font-black uppercase tracking-widest text-red-650 bg-red-50 border border-red-150 px-1 py-0.5 rounded shrink-0">
                        最新
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
