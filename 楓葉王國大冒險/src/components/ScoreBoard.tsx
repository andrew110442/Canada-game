import React, { useState } from 'react';
import { User, ActivityReport, getAdventurerTitle, ACTIVITY_RULES, SQUADS, ActivityType } from '../types';
import BadgeIcon from './BadgeIcon';
import { 
  Trophy, 
  Target,
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Crown,
  TrendingUp,
  Map,
  Users,
  Shield,
  Activity,
  AlertTriangle
} from 'lucide-react';

interface ScoreBoardProps {
  users: User[];
  activities: ActivityReport[];
  currentUserId: string;
  onRetractActivity: (id: string) => Promise<void>;
  nextFycBonus: number;
}

const SQUAD_STYLES: Record<string, { bg: string; text: string; border: string; accent: string; glow: string }> = {
  '⚔️ 極光先鋒隊': { bg: 'bg-gradient-to-r from-emerald-100/90 via-emerald-50/50 to-white/40 backdrop-blur-md border-emerald-200/80 shadow-[0_4px_12px_rgba(16,185,129,0.08)] hover:shadow-[0_8px_24px_rgba(16,185,129,0.15)]', text: 'text-emerald-900', border: 'border-emerald-200/80', accent: 'bg-emerald-500', glow: 'shadow-emerald-200/50' },
  '🔥 楓葉騎士團': { bg: 'bg-gradient-to-r from-red-100/90 via-red-50/50 to-white/40 backdrop-blur-md border-red-200/80 shadow-[0_4px_12px_rgba(239,68,68,0.08)] hover:shadow-[0_8px_24px_rgba(239,68,68,0.15)]', text: 'text-red-900', border: 'border-red-200/80', accent: 'bg-red-500', glow: 'shadow-red-200/50' },
  '🌌 暗夜洛磯隊': { bg: 'bg-gradient-to-r from-slate-200/90 via-slate-100/50 to-white/40 backdrop-blur-md border-slate-200/80 shadow-[0_4px_12px_rgba(100,116,139,0.08)] hover:shadow-[0_8px_24px_rgba(100,116,139,0.15)]', text: 'text-slate-900', border: 'border-slate-200/80', accent: 'bg-slate-500', glow: 'shadow-slate-200/50' },
  '🏔️ 冰河遠征隊': { bg: 'bg-gradient-to-r from-sky-100/90 via-sky-50/50 to-white/40 backdrop-blur-md border-sky-200/80 shadow-[0_4px_12px_rgba(14,165,233,0.08)] hover:shadow-[0_8px_24px_rgba(14,165,233,0.15)]', text: 'text-sky-900', border: 'border-sky-200/80', accent: 'bg-sky-500', glow: 'shadow-sky-200/50' },
  '🛡️ 北境守衛軍': { bg: 'bg-gradient-to-r from-purple-100/90 via-purple-50/50 to-white/40 backdrop-blur-md border-purple-200/80 shadow-[0_4px_12px_rgba(168,85,247,0.08)] hover:shadow-[0_8px_24px_rgba(168,85,247,0.15)]', text: 'text-purple-900', border: 'border-purple-200/80', accent: 'bg-purple-500', glow: 'shadow-purple-200/50' },
  '👑 魁北克軍團': { bg: 'bg-gradient-to-r from-amber-100/90 via-amber-50/50 to-white/40 backdrop-blur-md border-amber-200/80 shadow-[0_4px_12px_rgba(245,158,11,0.08)] hover:shadow-[0_8px_24px_rgba(245,158,11,0.15)]', text: 'text-amber-900', border: 'border-amber-200/80', accent: 'bg-amber-500', glow: 'shadow-amber-200/50' }
};

export default function ScoreBoard({ users, activities, currentUserId, onRetractActivity, nextFycBonus }: ScoreBoardProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isRetractingId, setIsRetractingId] = useState<string | null>(null);

  // Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void | Promise<void>) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        await onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // 1. Calculate Team (Squad) scores purely by FYC
  const squadScores = SQUADS.map(squadName => {
    const squadUsers = users.filter(u => u.team === squadName);
    const totalScore = squadUsers.reduce((sum, u) => sum + u.totalScore, 0);
    const totalFyc = squadUsers.reduce((sum, u) => sum + (u.fyc || 0), 0);
    const memberCount = squadUsers.length;
    const avgFyc = memberCount > 0 ? Math.round(totalFyc / memberCount) : 0;
    
    return {
      name: squadName,
      totalScore,
      totalFyc,
      avgFyc,
      memberCount
    };
  }).sort((a, b) => {
    if (b.avgFyc !== a.avgFyc) {
      return b.avgFyc - a.avgFyc; // Sort by average FYC descending
    }
    return b.totalFyc - a.totalFyc; // Fallback to total FYC descending
  });

  const SQUAD_BONUS_RATES = [0.4, 0.25, 0.15, 0.10, 0.07, 0.03];

  // 2. Rank individual users (Top 10) purely by FYC
  const rankedUsers = [...users]
    .sort((a, b) => (b.fyc || 0) - (a.fyc || 0))
    .slice(0, 10);

  const getUserActivities = (userId: string) => {
    return activities.filter(act => act.userId === userId);
  };

  const handleRetract = async (id: string) => {
    showConfirm(
      "收回回報紀錄",
      "確定要收回/刪除這筆回報紀錄嗎？這將會同步扣除對應的楓葉幣。",
      async () => {
        setIsRetractingId(id);
        try {
          await onRetractActivity(id);
        } catch (error) {
          console.error("Retraction failed:", error);
        } finally {
          setIsRetractingId(null);
        }
      }
    );
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUserId(prev => prev === userId ? null : userId);
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return <Crown className="w-5 h-5 text-yellow-500 fill-yellow-500 animate-[pulse_1.5s_infinite]" />;
    if (index === 1) return <Trophy className="w-4.5 h-4.5 text-slate-400 fill-slate-300" />;
    if (index === 2) return <Trophy className="w-4.5 h-4.5 text-amber-700 fill-amber-600" />;
    return <span className="text-xs font-mono font-bold text-slate-500 w-5 text-center">{index + 1}</span>;
  };

  // 3. Activity specific rankings
  const getTopUsersByActivity = (type: ActivityType, limit: number = 3) => {
    const userStats = users.map(user => {
      const userActs = activities.filter(a => a.userId === user.id && a.type === type && !a.isArchived);
      const totalCount = userActs.reduce((sum, a) => sum + a.count, 0);
      return { user, count: totalCount };
    });
    
    return userStats
      .filter(stat => stat.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  };

  const topAppointments = getTopUsersByActivity('約訪', 3);
  const topVisits = getTopUsersByActivity('客戶拜訪', 3);
  const topCases = getTopUsersByActivity('成交壽險件', 3);

  // 3. Diamond Stage Users
  const diamondUsers = users.filter(u => (u.fyc && u.fyc >= 25000)).sort((a, b) => (b.fyc || 0) - (a.fyc || 0));

  // Max score helper for squad progress percentage
  return (
    <div className="space-y-8">
      {/* SECTION 0: DIAMOND STAGE */}
      {diamondUsers.length > 0 && (
        <div className="bg-gradient-to-r from-cyan-900 via-blue-900 to-indigo-950 border-2 border-cyan-400/30 rounded-2xl p-4 shadow-lg relative overflow-hidden text-left mb-6">
          {/* Decorative Background */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none" />
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-400/20 blur-3xl rounded-full" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full" />
          
          <div className="relative z-10">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono text-cyan-200 font-bold uppercase tracking-widest bg-cyan-900/50 px-2 py-0.5 rounded-full border border-cyan-400/30 font-semibold shadow-inner">
                  Diamond Stage
                </span>
                <h2 className="text-lg md:text-xl font-display font-black text-white mt-1.5 flex items-center gap-1.5 drop-shadow-md">
                  <Crown className="w-4 h-4 text-cyan-300" />
                  頂尖鑽石業務
                </h2>
              </div>
            </div>

            {/* Glass-morphic scroll container (visible 2 max, rest scrolls) */}
            <div className="space-y-2 overflow-y-auto max-h-[140px] pr-1.5 custom-glass-scrollbar">
              {diamondUsers.map((user, idx) => {
                const isCustomAvatar = user.avatar && (user.avatar.startsWith('data:image/') || user.avatar.startsWith('http') || user.avatar.startsWith('/'));
                const userTitleInfo = getAdventurerTitle(user.totalScore);
                return (
                  <div key={user.id} className="bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-xl flex items-center gap-3 hover:bg-white/15 transition-all">
                    {isCustomAvatar ? (
                      <img src={user.avatar} className="w-10 h-10 rounded-lg border border-cyan-300/50 object-cover" />
                    ) : (
                      <div className={`w-10 h-10 rounded-lg border border-cyan-300/50 flex items-center justify-center text-white font-bold text-lg shadow-sm ${user.avatar || 'bg-cyan-600'}`}>{user.realName.charAt(0)}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-white font-bold text-sm truncate block">{user.realName}</span>
                      <div className="text-cyan-100/80 font-bold text-[10px] mt-0.5 truncate">{userTitleInfo.title}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: SQUAD LEADERBOARD */}
      <div className="bg-white/60 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.06)] rounded-3xl p-6 text-left relative overflow-hidden bg-gradient-to-br from-white/70 via-slate-50/50 to-slate-100/60">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase tracking-widest bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold shadow-sm">
                團隊對抗 Team FYC
              </span>
              <h2 className="text-xl md:text-2xl font-display font-black text-slate-800 mt-2">團隊競賽排行榜</h2>
              <p className="text-xs text-slate-500 mt-1 font-bold">加國冒險 6 大小隊爭奪戰！依據小隊平均 FYC 進行排名。</p>
            </div>
            <div className="bg-white/80 border border-slate-200 rounded-2xl px-3 py-1.5 flex items-center gap-1.5 shrink-0 select-none shadow-sm backdrop-blur-sm">
              <Shield className="w-4 h-4 text-emerald-500 animate-[pulse_1.5s_infinite]" />
              <span className="text-xs font-black text-slate-700 font-sans tracking-wide">6 小隊並進</span>
            </div>
          </div>

        <div className="space-y-3.5">
          {squadScores.map((squad, index) => {
            const style = SQUAD_STYLES[squad.name] || {
              bg: 'bg-slate-50/70 border-slate-100',
              text: 'text-slate-700',
              accent: 'bg-slate-500',
              border: 'border-slate-100',
              glow: 'shadow-slate-100'
            };

            return (
              <div 
                key={squad.name}
                className={`border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${style.bg}`}
              >
                {/* Squad Identifier */}
                <div className="flex items-center gap-3 shrink-0 flex-1">
                  <div className="w-7 flex justify-center items-center">
                    {index === 0 ? (
                      <div className="relative">
                        <div className="absolute inset-0 bg-yellow-400 blur-sm rounded-full opacity-50 animate-pulse"></div>
                        <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500 drop-shadow-md relative z-10" />
                      </div>
                    ) : (
                      <span className="text-xs font-mono font-black text-slate-500">#{index + 1}</span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div>
                      <h3 className={`font-black text-lg md:text-xl ${style.text} flex items-center gap-1.5`}>
                        {squad.name}
                      </h3>
                    </div>
                    {/* Bonus Badge */}
                    <div className="bg-yellow-50/80 border border-yellow-200/80 rounded-lg px-2.5 py-1.5 shadow-sm flex items-center gap-1.5 shrink-0 w-fit">
                      <Sparkles className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-black text-yellow-700 font-mono tracking-tight">
                        獎金 ${(nextFycBonus * (SQUAD_BONUS_RATES[index] || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score indicators */}
                <div className="text-right shrink-0 flex flex-col items-start md:items-end bg-white/80 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white shadow-sm">
                  <div className="text-lg md:text-xl font-display font-black text-slate-800 font-mono flex items-baseline gap-1 justify-start md:justify-end">
                    {squad.avgFyc.toLocaleString()} <span className="text-[10px] md:text-xs text-slate-500 font-bold">/ {squad.totalFyc.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500 font-bold ml-1">FYC</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 font-mono mt-0.5">
                    平均 FYC / 總 FYC
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>

      {/* SECTION 2: INDIVIDUAL LEADERBOARD */}
      <div className="bg-white border-4 border-slate-100 rounded-3xl p-6 shadow-xl text-left">
        <div className="mb-5 flex justify-between items-start">
          <div>
            <span className="text-[10px] font-mono text-red-600 font-bold uppercase tracking-widest bg-red-50 px-2.5 py-1 rounded-full border border-red-100 font-semibold">
              個人爭霸 Individual FYC
            </span>
            <h2 className="text-xl font-display font-black text-slate-850 mt-2">個人爭霸排行榜</h2>
            <p className="text-xs text-slate-500 mt-1">排行榜包含玩家個人、所屬小隊、冒險稱號與 FYC 業績。</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-2xl px-3 py-1.5 flex items-center gap-1.5 shrink-0 select-none">
            <Trophy className="w-4 h-4 text-red-600 animate-[bounce_2s_infinite]" />
            <span className="text-xs font-black text-red-750 font-sans">前 10 菁英</span>
          </div>
        </div>

        {/* Ranked User List */}
        <div className="space-y-2.5 overflow-y-auto max-h-[480px] pr-1">
          {rankedUsers.map((user, index) => {
            const userTitleInfo = getAdventurerTitle(user.totalScore);
            const isSelf = user.id === currentUserId;

            const isCustomAvatar = user.avatar && (user.avatar.startsWith('data:image/') || user.avatar.startsWith('http') || user.avatar.startsWith('/'));

            let cardClasses = "border rounded-2xl transition-all duration-300 ";
            if (index === 0) {
              cardClasses += "bg-gradient-to-r from-yellow-50 to-amber-100/50 border-yellow-400/60 shadow-[0_0_15px_rgba(250,204,21,0.5)] hover:shadow-[0_0_20px_rgba(250,204,21,0.7)] z-10 relative";
            } else if (index === 1) {
              cardClasses += "bg-gradient-to-r from-slate-50 to-slate-200/50 border-slate-300/70 shadow-[0_0_12px_rgba(148,163,184,0.4)] hover:shadow-[0_0_15px_rgba(148,163,184,0.6)] z-10 relative";
            } else if (index === 2) {
              cardClasses += "bg-gradient-to-r from-orange-50 to-amber-200/40 border-amber-300/60 shadow-[0_0_12px_rgba(251,191,36,0.3)] hover:shadow-[0_0_15px_rgba(251,191,36,0.5)] z-10 relative";
            } else {
              cardClasses += "bg-slate-50/20 border-slate-100 hover:bg-slate-50";
            }

            return (
              <div
                key={user.id}
                className={cardClasses}
              >
                {/* Leaderboard Row item */}
                <div className="flex items-center justify-between p-4 select-none">
                  <div className="flex items-center gap-3 text-left">
                    {/* Rank Indicator */}
                    <div className="w-8 flex justify-center items-center">
                      {index === 0 ? (
                        <div className="relative">
                           <div className="absolute inset-0 bg-yellow-400 blur-sm rounded-full opacity-60 animate-pulse"></div>
                           <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500 relative z-10 drop-shadow-md animate-[pulse_1.5s_infinite]" />
                        </div>
                      ) : index === 1 ? (
                        <div className="relative">
                           <div className="absolute inset-0 bg-slate-400 blur-sm rounded-full opacity-40"></div>
                           <Trophy className="w-5 h-5 text-slate-500 fill-slate-300 relative z-10 drop-shadow-md" />
                        </div>
                      ) : index === 2 ? (
                        <div className="relative">
                           <div className="absolute inset-0 bg-amber-600 blur-sm rounded-full opacity-30"></div>
                           <Trophy className="w-5 h-5 text-amber-700 fill-amber-600 relative z-10 drop-shadow-md" />
                        </div>
                      ) : (
                        <span className="text-xs font-mono font-bold text-slate-500 w-5 text-center">{index + 1}</span>
                      )}
                    </div>

                    {/* Profile Avatar with dynamic bg */}
                    <div className="relative">
                      {index === 0 && <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 rounded-xl blur opacity-70 animate-pulse"></div>}
                      {index === 1 && <div className="absolute -inset-1 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-400 rounded-xl blur opacity-60"></div>}
                      {index === 2 && <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 rounded-xl blur opacity-50"></div>}
                      
                      {isCustomAvatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.realName} 
                          className={`relative w-10 h-10 rounded-xl object-cover shadow shrink-0 z-10 ${index < 3 ? 'border-2 border-white' : 'border border-slate-100'}`}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow shrink-0 z-10 ${index < 3 ? 'border-2 border-white' : 'border border-white/10'} ${user.avatar || 'bg-indigo-500'}`}>
                          {user.realName.slice(0, 1)}
                        </div>
                      )}
                    </div>

                    {/* Name, Level Title and Squad Tag */}
                    <div className="text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 text-sm lg:text-base">
                          {user.realName}
                        </span>
                        {user.team && (
                          <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-sans px-1.5 py-0.5 rounded-md font-bold">
                            {user.team}
                          </span>
                        )}
                        {isSelf && (
                          <span className="bg-red-50 text-red-600 border border-red-100 text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded-md">
                            ME 你
                          </span>
                        )}
                      </div>
                      <div 
                        title={userTitleInfo.description}
                        className="text-xs text-yellow-700 font-bold font-sans flex items-center gap-1.5 mt-1 cursor-help"
                      >
                        <BadgeIcon rank={userTitleInfo.rank} size="sm" animate={false} />
                        <span>{userTitleInfo.title}</span>
                      </div>
                    </div>
                  </div>

                  {/* Score badge */}
                  <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                    <div className="text-xl md:text-2xl font-display font-black text-rose-600 font-mono flex items-baseline gap-0.5 justify-end">
                      {(user.fyc || 0).toLocaleString()} <span className="text-[10px] text-slate-450 font-bold font-sans">FYC</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {rankedUsers.length === 0 && (
            <div className="text-center py-12 text-sm text-slate-400 font-mono italic">
              目前排行榜無任何冒險家加入
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: SPECIFIC ACTIVITY LEADERBOARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 約訪排行 */}
        <div className="bg-white border-4 border-slate-100 rounded-3xl p-5 shadow-xl text-left">
          <div className="mb-4 flex flex-col items-start md:items-center text-left md:text-center">
            <span className="text-[10px] font-mono text-purple-600 font-bold uppercase tracking-widest bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100 font-semibold inline-block mb-1">
              Top Appointments
            </span>
            <h2 className="text-lg font-display font-black text-slate-850">約訪排行</h2>
          </div>
          <div className="space-y-2.5 mt-4">
            {topAppointments.map((stat, index) => (
              <div key={stat.user.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-6 flex justify-center items-center">{getRankBadge(index)}</div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-slate-700">{stat.user.realName}</span>
                    {stat.user.team && <span className="text-[9px] text-slate-400 font-bold">{stat.user.team}</span>}
                  </div>
                </div>
                <div className="text-base font-black text-purple-600 font-mono">
                  {stat.count} <span className="text-[10px] text-slate-400 font-bold">次</span>
                </div>
              </div>
            ))}
            {topAppointments.length === 0 && (
              <div className="text-xs text-slate-400 text-center py-4 italic font-bold">暫無紀錄</div>
            )}
          </div>
        </div>

        {/* 拜訪排行 */}
        <div className="bg-white border-4 border-slate-100 rounded-3xl p-5 shadow-xl text-left">
          <div className="mb-4 flex flex-col items-start md:items-center text-left md:text-center">
            <span className="text-[10px] font-mono text-blue-600 font-bold uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 font-semibold inline-block mb-1">
              Top Visits
            </span>
            <h2 className="text-lg font-display font-black text-slate-850">拜訪排行</h2>
          </div>
          <div className="space-y-2.5 mt-4">
            {topVisits.map((stat, index) => (
              <div key={stat.user.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-6 flex justify-center items-center">{getRankBadge(index)}</div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-slate-700">{stat.user.realName}</span>
                    {stat.user.team && <span className="text-[9px] text-slate-400 font-bold">{stat.user.team}</span>}
                  </div>
                </div>
                <div className="text-base font-black text-blue-600 font-mono">
                  {stat.count} <span className="text-[10px] text-slate-400 font-bold">次</span>
                </div>
              </div>
            ))}
            {topVisits.length === 0 && (
              <div className="text-xs text-slate-400 text-center py-4 italic font-bold">暫無紀錄</div>
            )}
          </div>
        </div>

        {/* 件數排行 */}
        <div className="bg-white border-4 border-slate-100 rounded-3xl p-5 shadow-xl text-left">
          <div className="mb-4 flex flex-col items-start md:items-center text-left md:text-center">
            <span className="text-[10px] font-mono text-emerald-600 font-bold uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 font-semibold inline-block mb-1">
              Top Cases
            </span>
            <h2 className="text-lg font-display font-black text-slate-850">件數排行</h2>
          </div>
          <div className="space-y-2.5 mt-4">
            {topCases.map((stat, index) => (
              <div key={stat.user.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-6 flex justify-center items-center">{getRankBadge(index)}</div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-slate-700">{stat.user.realName}</span>
                    {stat.user.team && <span className="text-[9px] text-slate-400 font-bold">{stat.user.team}</span>}
                  </div>
                </div>
                <div className="text-base font-black text-emerald-600 font-mono">
                  {stat.count} <span className="text-[10px] text-slate-400 font-bold">件</span>
                </div>
              </div>
            ))}
            {topCases.length === 0 && (
              <div className="text-xs text-slate-400 text-center py-4 italic font-bold">暫無紀錄</div>
            )}
          </div>
        </div>

      </div>

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4" id="custom-scoreboard-confirm-modal">
          <div className="bg-white border-4 border-slate-100 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-left">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <div className="p-2.5 bg-red-50 border border-red-100 rounded-2xl">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-black text-slate-800">{confirmModal.title}</h3>
            </div>
            
            <p className="text-xs text-slate-600 font-bold leading-relaxed mb-6 whitespace-pre-line">
              {confirmModal.message}
            </p>
            
            <div className="flex gap-2.5">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition cursor-pointer text-center"
              >
                取消
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition cursor-pointer text-center shadow-md shadow-red-100"
              >
                確認執行
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
