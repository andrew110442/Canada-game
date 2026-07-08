import React from 'react';
import { ActivityReport, ACTIVITY_RULES, User } from '../types';
import { 
  CalendarDays, 
  MapPin, 
  FileText, 
  FileSignature, 
  Users, 
  Shield, 
  CreditCard, 
  UserPlus, 
  UserCheck, 
  Award,
  Clock,
  Sparkles,
  Map
} from 'lucide-react';

interface TimelineProps {
  activities: ActivityReport[];
  users: User[];
}

export default function Timeline({ activities, users }: TimelineProps) {
  // Get time differences formatted nicely in Chinese
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return "剛剛";
    if (diffMin < 60) return `${diffMin} 分鐘前`;
    if (diffHr < 24) return `${diffHr} 小時前`;
    if (diffDay === 1) return "昨天";
    return `${diffDay} 天前`;
  };

  const isCustomAvatar = (url?: string) => {
    return !!(url && (url.startsWith('data:image/') || url.startsWith('http') || url.startsWith('/')));
  };

  return (
    <div className="bg-white border-4 border-slate-100 rounded-3xl p-6 shadow-xl flex flex-col h-full">
      <div className="mb-5 flex justify-between items-center text-left">
        <div>
          <span className="text-[10px] font-mono text-red-600 font-bold uppercase tracking-widest bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
            即時戰報 Feed Activities
          </span>
          <h2 className="text-2xl font-display font-black text-slate-800 mt-2">最新冒險戰報</h2>
          <p className="text-xs text-slate-500 mt-1">團隊即時動態與戰果回報，互相激勵衝刺業績！</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-150 shrink-0 self-start">
          <Clock className="w-3.5 h-3.5 text-red-500 animate-[spin_5s_linear_infinite]" />
          <span className="font-bold">REALTIME</span>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="flex-1 space-y-4 overflow-y-auto max-h-[380px] pr-1">
        {activities.slice(0, 30).map((act, idx) => {
          const rule = ACTIVITY_RULES[act.type];
          const user = users.find(u => u.id === act.userId);
          const userAvatar = user?.avatar;
          const displayRealName = act.realName || user?.realName || '探險家';
          
          return (
            <div key={act.id} className="relative flex gap-4 text-left group">
              {/* Vertical line connector */}
              {idx < activities.length - 1 && (
                <div className="absolute left-6 top-10 bottom-[-16px] w-0.5 bg-slate-100 pointer-events-none group-hover:bg-slate-250 transition-colors" />
              )}

              {/* User Avatar Circle on the Left instead of Activity Icon */}
              {isCustomAvatar(userAvatar) ? (
                <img 
                  src={userAvatar} 
                  alt={displayRealName} 
                  className="w-12 h-12 rounded-2xl object-cover shadow-md border-2 border-slate-100 hover:scale-105 transition shrink-0 z-10"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md border-2 border-white/50 hover:scale-105 transition shrink-0 z-10 ${userAvatar || 'bg-indigo-500'}`}>
                  {displayRealName.slice(0, 1)}
                </div>
              )}

              {/* Event detail block */}
              <div className="flex-1 bg-slate-50/40 border border-slate-100 hover:border-slate-200 rounded-2xl p-4 transition-all">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    {/* User profile identifier */}
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">
                        {displayRealName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono font-medium">
                        @{act.username}
                      </span>
                    </div>

                    {/* Action header */}
                    <div className="text-xs text-slate-500 mt-1 font-sans flex items-center gap-1.5 flex-wrap">
                      <span>回報了</span>
                      <span className={`font-bold px-2 py-0.5 rounded text-[11px] border ${
                        rule?.category === 'recruit'
                          ? 'text-blue-600 bg-blue-50 border-blue-100'
                          : rule?.category === 'team'
                            ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                            : 'text-red-600 bg-red-50 border-red-100'
                      }`}>
                        {act.type}
                      </span>
                      {act.count > 1 && (
                        <span className="text-slate-600 font-bold font-mono">
                          x{act.count}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score badge added */}
                  <div className="text-right">
                    {act.type === '受理FYC' ? (
                      <span className="text-xs font-bold font-mono text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full flex items-center gap-1 select-none">
                        <Sparkles className="w-3.5 h-3.5" />
                        +{act.count.toLocaleString()} FYC
                      </span>
                    ) : (
                      <span className="text-xs font-bold font-mono text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1 select-none">
                        <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                        +{act.points} 楓葉幣
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono mt-1.5 block font-medium">
                      {formatRelativeTime(act.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Report notes */}
                {act.note && (
                  <div className="mt-3 bg-white border border-slate-100 rounded-xl p-3 border-l-4 border-red-500">
                    <p className="text-slate-600 text-xs italic leading-relaxed">
                      &quot;{act.note}&quot;
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {activities.length === 0 && (
          <div className="text-center py-16 text-sm text-slate-400 font-mono italic flex flex-col items-center justify-center gap-3">
            <Map className="w-10 h-10 text-slate-300 animate-bounce" />
            <span>目前尚無戰報回報紀錄，快來進行第一次回報吧！</span>
          </div>
        )}
      </div>
    </div>
  );
}
