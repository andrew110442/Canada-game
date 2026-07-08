import React, { useEffect } from 'react';
import { User, ActivityReport } from '../types';
import BadgeIcon, { BADGE_DETAILS, getBadgeByScore } from './BadgeIcon';
import { ShieldAlert, Trophy, Lock, Unlock, CheckCircle2, Sparkles, CalendarHeart, Footprints, FileSignature, Users, Star } from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';

interface BadgeEncyclopediaProps {
  currentUser: User;
  activities: ActivityReport[];
}

export default function BadgeEncyclopedia({ currentUser, activities }: BadgeEncyclopediaProps) {
  const currentBadge = getBadgeByScore(currentUser.totalScore);

  const fireCelebration = (colorHex?: string) => {
    const primaryColor = colorHex || '#eab308';
    
    // 1. Center high-intensity burst
    confetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.65 },
      colors: [primaryColor, '#fbbf24', '#f59e0b', '#38bdf8', '#818cf8', '#f43f5e']
    });

    // 2. Left side fan
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 60,
      origin: { x: 0.1, y: 0.85 },
      colors: [primaryColor, '#fbbf24', '#38bdf8', '#34d399']
    });

    // 3. Right side fan
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 60,
      origin: { x: 0.9, y: 0.85 },
      colors: [primaryColor, '#fbbf24', '#818cf8', '#f43f5e']
    });
  };

  useEffect(() => {
    if (!currentUser.id) return;
    
    const storageKey = `unlocked_badge_rank_${currentUser.id}`;
    const storedRankStr = localStorage.getItem(storageKey);
    const storedRank = storedRankStr ? parseInt(storedRankStr, 10) : null;

    if (storedRank !== null) {
      if (currentBadge.rank > storedRank) {
        // Delay slightly for dramatic and visual comfort after mount/render
        const timer = setTimeout(() => {
          fireCelebration(currentBadge.accentColor);
        }, 800);
        localStorage.setItem(storageKey, currentBadge.rank.toString());
        return () => clearTimeout(timer);
      }
    } else {
      localStorage.setItem(storageKey, currentBadge.rank.toString());
    }
  }, [currentBadge.rank, currentUser.id]);

  const userActivities = activities.filter(a => a.userId === currentUser.id);
  const appointmentCount = userActivities.reduce((acc, act) => act.type === '約訪' ? acc + act.count : acc, 0);
  const visitCount = userActivities.reduce((acc, act) => act.type === '客戶拜訪' ? acc + act.count : acc, 0);
  const dealCount = userActivities.reduce((acc, act) => act.type === '成交壽險件' ? acc + act.count : acc, 0);

  const recruitTopicCount = userActivities.reduce((acc, act) => act.type === '開增員議題' ? acc + act.count : acc, 0);
  const recruitBindCount = userActivities.reduce((acc, act) => act.type === '增員綁定' ? acc + act.count : acc, 0);
  const recruitHireCount = userActivities.reduce((acc, act) => act.type === '起聘新人' ? acc + act.count : acc, 0);
  const recruitInviteCount = userActivities.reduce((acc, act) => act.type === '增員活動邀約' ? acc + act.count : acc, 0);

  const policyChangeCount = userActivities.reduce((acc, act) => act.type === '保全變更 (客戶資訊)' ? acc + act.count : acc, 0);
  const propGroupDealCount = userActivities.reduce((acc, act) => act.type === '成交產團險' ? acc + act.count : acc, 0);
  const creditCardCount = userActivities.reduce((acc, act) => act.type === '成交信用卡' ? acc + act.count : acc, 0);
  const morningMeetingCount = userActivities.reduce((acc, act) => act.type === '準時出席早會' ? acc + act.count : acc, 0);
  const caseStudyCount = userActivities.reduce((acc, act) => act.type === '成為case study案主' ? acc + act.count : acc, 0);
  const groupGatheringCount = userActivities.reduce((acc, act) => act.type === '小組實體聚會' ? acc + act.count : acc, 0);
  const claimCount = userActivities.reduce((acc, act) => act.type === '理賠' ? acc + act.count : acc, 0);
  const msSurveyCount = userActivities.reduce((acc, act) => act.type === '完成MS問卷' ? acc + act.count : acc, 0);
  const morningShareCount = userActivities.reduce((acc, act) => act.type === '早會分享回饋' ? acc + act.count : acc, 0);

  const APPOINTMENT_BADGES = [
    { id: 'app_1', title: '約訪新秀', icon: '🌱', min: 30, desc: '完成30次約訪' },
    { id: 'app_2', title: '心動玩家', icon: '💓', min: 60, desc: '完成60次約訪' },
    { id: 'app_3', title: '情場高手', icon: '💌', min: 90, desc: '完成90次約訪' },
    { id: 'app_4', title: '戀愛大師', icon: '💋', min: 120, desc: '完成120次約訪' },
    { id: 'app_5', title: '約會達人', icon: '🔥', min: 150, desc: '完成150次約訪' },
    { id: 'app_6', title: '冬季戀歌', icon: '🤍', min: 200, desc: '完成200次約訪' },
  ];

  const VISIT_BADGES = [
    { id: 'vis_1', title: '跑圖新手', icon: '🗺️', min: 10, desc: '完成10次拜訪' },
    { id: 'vis_2', title: '外勤旅人', icon: '🚶', min: 20, desc: '完成20次拜訪' },
    { id: 'vis_3', title: '開拓先鋒', icon: '🧭', min: 30, desc: '完成30次拜訪' },
    { id: 'vis_4', title: '保單獵人', icon: '🏃', min: 40, desc: '完成40次拜訪' },
    { id: 'vis_5', title: '馬拉松選手', icon: '🥾', min: 50, desc: '完成50次拜訪' },
    { id: 'vis_6', title: '我是傳奇', icon: '👑', min: 60, desc: '完成60次拜訪' },
  ];

  const DEAL_BADGES = [
    { id: 'deal_1', title: '簽約練習生', icon: '📑', min: 5, desc: '完成5次成交' },
    { id: 'deal_2', title: '收單忍者', icon: '✒️', min: 10, desc: '完成10次成交' },
    { id: 'deal_3', title: '成交引擎', icon: '🔥', min: 15, desc: '完成15次成交' },
    { id: 'deal_4', title: '保單怪獸', icon: '🚀', min: 20, desc: '完成20次成交' },
    { id: 'deal_5', title: '神單製造機', icon: '👑', min: 25, desc: '完成25次成交' },
    { id: 'deal_6', title: '簽手簽眼', icon: '🤝', min: 30, desc: '完成30次成交' },
  ];

  const RECRUIT_BADGES = [
    { id: 'rec_1', title: '人才召喚師', icon: '📢', min: 5, current: recruitTopicCount, desc: '開增員議題 5次' },
    { id: 'rec_1_5', title: '新星引路人', icon: '🌠', min: 1, current: recruitBindCount, desc: '增員綁定 1次' },
    { id: 'rec_2', title: '勇者召集令', icon: '🗡️', min: 2, current: recruitBindCount, desc: '增員綁定 2次' },
    { id: 'rec_3', title: '伯樂現身', icon: '🐴', min: 1, current: recruitHireCount, desc: '起聘新人 1人' },
    { id: 'rec_4', title: '公會招募官', icon: '🛡️', min: 5, current: recruitInviteCount, desc: '增員活動邀約 5次' },
    { id: 'rec_5', title: '傳奇公會長', icon: '👑', min: 10, current: recruitInviteCount, desc: '增員活動邀約 10次' },
  ];

  const OTHER_BADGES = [
    { id: 'oth_1', title: '超級變變變', icon: '🦎', min: 1, current: policyChangeCount, desc: '保全變更(客戶資訊)' },
    { id: 'oth_2', title: '跨售收割機', icon: '💼', min: 10, current: propGroupDealCount, desc: '成交產團險 10次' },
    { id: 'oth_3', title: '一卡在手', icon: '🔥', min: 5, current: creditCardCount, desc: '成交信用卡 5張' },
    { id: 'oth_4', title: '打卡MVP', icon: '📍', min: 5, current: morningMeetingCount, desc: '準時出席早會 5次' },
    { id: 'oth_5', title: '經驗傳承者', icon: '💡', min: 2, current: caseStudyCount, desc: '成為case study案主 2次' },
    { id: 'oth_6', title: '傳奇聚首', icon: '🪄', min: 2, current: groupGatheringCount, desc: '小組實體聚會 2次' },
    { id: 'oth_7', title: '南丁格爾', icon: '👩🏼', min: 3, current: claimCount, desc: '理賠 3次' },
    { id: 'oth_8', title: '市場開發員', icon: '📋', min: 5, current: msSurveyCount, desc: '完成MS問卷 5次' },
    { id: 'oth_9', title: '星光傳承', icon: '🌟', min: 2, current: morningShareCount, desc: '早會分享回饋 2次' },
  ];

  return (
    <div className="bg-white border-4 border-slate-100 rounded-3xl p-6 shadow-xl text-left space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shrink-0">
            <Trophy className="w-6 h-6 text-amber-600 animate-bounce" />
          </div>
          <div>
            <h2 className="text-xl font-display font-black text-slate-800">
              冒險者稱號與徽章圖鑑
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              累積楓葉幣解鎖更高階稱號，並透過活動次數收集專屬徽章！
            </p>
          </div>
        </div>
        
        {/* Current status display */}
        <div 
          onClick={() => fireCelebration(currentBadge.accentColor)}
          className="bg-gradient-to-r from-red-50 to-orange-50 border border-orange-100 px-4 py-2.5 rounded-2xl flex items-center gap-3 self-start sm:self-auto cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all duration-200"
          title="點擊慶祝當前榮耀"
        >
          <BadgeIcon rank={currentBadge.rank} size="sm" />
          <div>
            <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-wider font-bold flex items-center gap-1">
              當前稱號等級 <Sparkles className="w-2.5 h-2.5 text-orange-500 animate-pulse" />
            </span>
            <span className="text-sm font-black text-slate-800 font-sans block">{currentBadge.title}</span>
          </div>
        </div>
      </div>

      {/* Appointment Badges */}
      <div>
        <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
          <CalendarHeart className="w-4 h-4 text-red-500" />
          約訪專屬徽章
          <span className="text-[10px] text-slate-400 font-mono font-normal tracking-wider ml-1">當前約訪次數: {appointmentCount}</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {APPOINTMENT_BADGES.map((badge) => {
            const isUnlocked = appointmentCount >= badge.min;
            return (
              <div 
                key={badge.id}
                className={`
                  relative p-3 rounded-xl border transition-all duration-300 flex flex-col justify-between overflow-hidden select-none
                  ${isUnlocked 
                    ? 'bg-gradient-to-br from-red-900 to-red-800 border-red-700 shadow-md shadow-red-900/50 ring-1 ring-red-700 hover:shadow-lg hover:shadow-red-900/60 hover:-translate-y-0.5' 
                    : 'bg-slate-50/70 border-slate-150 opacity-75'
                  }
                `}
                title={isUnlocked ? "已解鎖！" : "未解鎖"}
              >
                <div className="flex flex-col items-center justify-center text-center gap-2">
                  <div className={`text-3xl shrink-0 ${!isUnlocked && 'filter grayscale opacity-50'}`}>
                    {badge.icon}
                  </div>
                  <div className="space-y-1 w-full">
                    <span className={`text-sm font-black tracking-tight block ${isUnlocked ? 'text-white' : 'text-slate-500 font-bold'}`}>
                      {badge.title}
                    </span>
                    <span className={`text-[10px] font-mono font-bold block ${isUnlocked ? 'text-red-100' : 'text-slate-400'}`}>
                      需 {badge.min} 次約訪
                    </span>
                  </div>
                </div>

                <div className={`mt-3 pt-2 border-t flex items-center justify-center ${isUnlocked ? 'border-red-700/50' : 'border-slate-100'}`}>
                  {isUnlocked ? (
                    <span className="text-[10px] text-white font-bold bg-white/20 px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      已解鎖
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold bg-slate-150 px-2.5 py-1 rounded-md flex items-center gap-1">
                      <Lock className="w-3 h-3 shrink-0" />
                      未解鎖
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visit Badges */}
      <div>
        <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
          <Footprints className="w-4 h-4 text-green-500" />
          拜訪專屬徽章
          <span className="text-[10px] text-slate-400 font-mono font-normal tracking-wider ml-1">當前拜訪次數: {visitCount}</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {VISIT_BADGES.map((badge) => {
            const isUnlocked = visitCount >= badge.min;
            return (
              <div 
                key={badge.id}
                className={`
                  relative p-3 rounded-xl border transition-all duration-300 flex flex-col justify-between overflow-hidden select-none
                  ${isUnlocked 
                    ? 'bg-gradient-to-br from-green-900 to-green-800 border-green-700 shadow-md shadow-green-900/50 ring-1 ring-green-700 hover:shadow-lg hover:shadow-green-900/60 hover:-translate-y-0.5' 
                    : 'bg-slate-50/70 border-slate-150 opacity-75'
                  }
                `}
                title={isUnlocked ? "已解鎖！" : "未解鎖"}
              >
                <div className="flex flex-col items-center justify-center text-center gap-2">
                  <div className={`text-3xl shrink-0 ${!isUnlocked && 'filter grayscale opacity-50'}`}>
                    {badge.icon}
                  </div>
                  <div className="space-y-1 w-full">
                    <span className={`text-sm font-black tracking-tight block ${isUnlocked ? 'text-white' : 'text-slate-500 font-bold'}`}>
                      {badge.title}
                    </span>
                    <span className={`text-[10px] font-mono font-bold block ${isUnlocked ? 'text-green-100' : 'text-slate-400'}`}>
                      需 {badge.min} 次拜訪
                    </span>
                  </div>
                </div>

                <div className={`mt-3 pt-2 border-t flex items-center justify-center ${isUnlocked ? 'border-green-700/50' : 'border-slate-100'}`}>
                  {isUnlocked ? (
                    <span className="text-[10px] text-white font-bold bg-white/20 px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      已解鎖
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold bg-slate-150 px-2.5 py-1 rounded-md flex items-center gap-1">
                      <Lock className="w-3 h-3 shrink-0" />
                      未解鎖
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deal Badges */}
      <div>
        <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
          <FileSignature className="w-4 h-4 text-teal-500" />
          成交專屬徽章
          <span className="text-[10px] text-slate-400 font-mono font-normal tracking-wider ml-1">當前成交次數: {dealCount}</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {DEAL_BADGES.map((badge) => {
            const isUnlocked = dealCount >= badge.min;
            return (
              <div 
                key={badge.id}
                className={`
                  relative p-3 rounded-xl border transition-all duration-300 flex flex-col justify-between overflow-hidden select-none
                  ${isUnlocked 
                    ? 'bg-gradient-to-br from-teal-700 to-teal-600 border-teal-500 shadow-md shadow-teal-700/50 ring-1 ring-teal-500 hover:shadow-lg hover:shadow-teal-700/60 hover:-translate-y-0.5' 
                    : 'bg-slate-50/70 border-slate-150 opacity-75'
                  }
                `}
                title={isUnlocked ? "已解鎖！" : "未解鎖"}
              >
                <div className="flex flex-col items-center justify-center text-center gap-2">
                  <div className={`text-3xl shrink-0 ${!isUnlocked && 'filter grayscale opacity-50'}`}>
                    {badge.icon}
                  </div>
                  <div className="space-y-1 w-full">
                    <span className={`text-sm font-black tracking-tight block ${isUnlocked ? 'text-white' : 'text-slate-500 font-bold'}`}>
                      {badge.title}
                    </span>
                    <span className={`text-[10px] font-mono font-bold block ${isUnlocked ? 'text-teal-100' : 'text-slate-400'}`}>
                      需 {badge.min} 次成交
                    </span>
                  </div>
                </div>

                <div className={`mt-3 pt-2 border-t flex items-center justify-center ${isUnlocked ? 'border-teal-500/50' : 'border-slate-100'}`}>
                  {isUnlocked ? (
                    <span className="text-[10px] text-white font-bold bg-white/20 px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      已解鎖
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold bg-slate-150 px-2.5 py-1 rounded-md flex items-center gap-1">
                      <Lock className="w-3 h-3 shrink-0" />
                      未解鎖
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recruit Badges */}
      <div>
        <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-sky-500" />
          增員徽章專區
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {RECRUIT_BADGES.map((badge) => {
            const isUnlocked = badge.current >= badge.min;
            return (
              <div 
                key={badge.id}
                className={`
                  relative p-3 rounded-xl border transition-all duration-300 flex flex-col justify-between overflow-hidden select-none
                  ${isUnlocked 
                    ? 'bg-gradient-to-br from-sky-700 to-sky-600 border-sky-500 shadow-md shadow-sky-700/50 ring-1 ring-sky-500 hover:shadow-lg hover:shadow-sky-700/60 hover:-translate-y-0.5' 
                    : 'bg-slate-50/70 border-slate-150 opacity-75'
                  }
                `}
                title={isUnlocked ? "已解鎖！" : "未解鎖"}
              >
                <div className="flex flex-col items-center justify-center text-center gap-2">
                  <div className={`text-3xl shrink-0 ${!isUnlocked && 'filter grayscale opacity-50'}`}>
                    {badge.icon}
                  </div>
                  <div className="space-y-1 w-full">
                    <span className={`text-sm font-black tracking-tight block ${isUnlocked ? 'text-white' : 'text-slate-500 font-bold'}`}>
                      {badge.title}
                    </span>
                    <span className={`text-[10px] font-mono font-bold block ${isUnlocked ? 'text-sky-100' : 'text-slate-400'}`}>
                      {badge.desc}
                    </span>
                  </div>
                </div>

                <div className={`mt-3 pt-2 border-t flex items-center justify-center ${isUnlocked ? 'border-sky-500/50' : 'border-slate-100'}`}>
                  {isUnlocked ? (
                    <span className="text-[10px] text-white font-bold bg-white/20 px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      已解鎖
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold bg-slate-150 px-2.5 py-1 rounded-md flex items-center gap-1">
                      <Lock className="w-3 h-3 shrink-0" />
                      {badge.current}/{badge.min}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Other Badges */}
      <div>
        <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" />
          其他徽章專區
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {OTHER_BADGES.map((badge) => {
            const isUnlocked = badge.current >= badge.min;
            return (
              <div 
                key={badge.id}
                className={`
                  relative p-3 rounded-xl border transition-all duration-300 flex flex-col justify-between overflow-hidden select-none
                  ${isUnlocked 
                    ? 'bg-gradient-to-br from-amber-700 to-amber-600 border-amber-500 shadow-md shadow-amber-700/50 ring-1 ring-amber-500 hover:shadow-lg hover:shadow-amber-700/60 hover:-translate-y-0.5' 
                    : 'bg-slate-50/70 border-slate-150 opacity-75'
                  }
                `}
                title={isUnlocked ? "已解鎖！" : "未解鎖"}
              >
                <div className="flex flex-col items-center justify-center text-center gap-2">
                  <div className={`text-3xl shrink-0 ${!isUnlocked && 'filter grayscale opacity-50'}`}>
                    {badge.icon}
                  </div>
                  <div className="space-y-1 w-full">
                    <span className={`text-sm font-black tracking-tight block ${isUnlocked ? 'text-white' : 'text-slate-500 font-bold'}`}>
                      {badge.title}
                    </span>
                    <span className={`text-[10px] font-mono font-bold block ${isUnlocked ? 'text-amber-100' : 'text-slate-400'}`}>
                      {badge.desc}
                    </span>
                  </div>
                </div>

                <div className={`mt-3 pt-2 border-t flex items-center justify-center ${isUnlocked ? 'border-amber-500/50' : 'border-slate-100'}`}>
                  {isUnlocked ? (
                    <span className="text-[10px] text-white font-bold bg-white/20 px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      已解鎖
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold bg-slate-150 px-2.5 py-1 rounded-md flex items-center gap-1">
                      <Lock className="w-3 h-3 shrink-0" />
                      {badge.current}/{badge.min}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rank Grid of 6 Badges */}
      <div>
        <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          冒險者稱號進度
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Object.values(BADGE_DETAILS).map((badge) => {
          const isUnlocked = currentUser.totalScore >= badge.min;
          const isActive = currentBadge.rank === badge.rank;
          
          return (
            <div 
              key={badge.rank}
              className={`
                relative p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden select-none
                ${isActive 
                  ? 'bg-gradient-to-br from-orange-900 to-orange-800 border-orange-500 ring-4 ring-orange-500/60 shadow-xl shadow-orange-900/50 scale-[1.02]' 
                  : isUnlocked 
                    ? 'bg-gradient-to-br from-amber-900 to-amber-800 border-amber-700 shadow-md shadow-amber-900/50 ring-1 ring-amber-700 hover:shadow-lg hover:shadow-amber-900/60 hover:-translate-y-0.5' 
                    : 'bg-slate-50/70 border-slate-150 opacity-75'
                }
              `}
              title={isUnlocked ? "已成功解鎖稱號" : `解鎖還需要 ${badge.min - currentUser.totalScore} 楓葉幣`}
            >
              {/* Active current label */}
              {isActive && (
                <div className="absolute top-2.5 right-2.5 bg-orange-500 text-white text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase flex items-center gap-0.5">
                  <span>當前階級</span>
                </div>
              )}

              <div className="flex gap-4 items-start">
                {/* Badge Icon container */}
                <div className={`shrink-0 ${!isUnlocked && 'filter grayscale brightness-75 opacity-60'}`}>
                  <BadgeIcon rank={badge.rank} size="md" animate={isUnlocked} />
                </div>

                <div className="space-y-1 text-left min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-sm font-black tracking-tight ${isUnlocked ? 'text-white' : 'text-slate-500 font-bold'}`}>
                      {badge.title}
                    </span>
                  </div>
                  
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-widest block ${isUnlocked ? 'text-amber-200' : 'text-slate-400'}`}>
                    {badge.min} {badge.max === 99999 ? '+' : `~ ${badge.max}`} 楓葉幣
                  </span>
                  
                  <p className={`text-xs line-clamp-2 mt-1 leading-relaxed ${isUnlocked ? 'text-amber-50' : 'text-slate-500'}`}>
                    {badge.description}
                  </p>
                </div>
              </div>

              {/* Status footer inside badge card */}
              <div className={`mt-4 pt-3 border-t flex items-center justify-end ${isUnlocked ? 'border-amber-700/50' : 'border-slate-100'}`}>
                <div className="flex items-center gap-1">
                  {isUnlocked ? (
                    <span className="text-[10px] text-white font-bold bg-white/20 px-2.5 py-0.5 rounded-lg flex items-center gap-0.5 shadow-sm">
                      <CheckCircle2 className="w-3 h-3 text-white shrink-0" />
                      已解鎖 ✓
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold bg-slate-150 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                      差 {badge.min - currentUser.totalScore} 幣
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
