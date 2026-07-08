import React, { useState } from 'react';
import { ActivityType, ACTIVITY_RULES, User } from '../types';
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
  MessageSquareCode,
  Send,
  Coins,
  ClipboardList,
  Clock,
  BookOpen,
  MessageSquare,
  Compass,
  Mic,
  FileCheck,
  HeartHandshake
} from 'lucide-react';

// Explicit mapping of icon name strings to Lucide components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
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
  Coins,
  ClipboardList,
  Clock,
  BookOpen,
  MessageSquare,
  Compass,
  Mic,
  FileCheck,
  HeartHandshake
};

interface ActivityReportFormProps {
  currentUserId: string;
  currentUser: User;
  onSubmitActivity: (type: ActivityType, count: number, note: string) => Promise<void>;
}

export default function ActivityReportForm({ currentUserId, currentUser, onSubmitActivity }: ActivityReportFormProps) {
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<'business' | 'recruit' | 'team'>('business');

  // Custom states for 受理FYC reporting
  const [fycAmount, setFycAmount] = useState<string>('');
  const [fycNote, setFycNote] = useState<string>('');
  const [isFycSubmitting, setIsFycSubmitting] = useState<boolean>(false);
  const [fycError, setFycError] = useState<string>('');
  
  const [toastMessage, setToastMessage] = useState<{ label: string; points: number } | null>(null);

  const [cooldownTime, setCooldownTime] = useState<number>(0);

  React.useEffect(() => {
    if (cooldownTime <= 0) return;
    const timer = setInterval(() => {
      setCooldownTime(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownTime]);

  // Convert ACTIVITY_RULES to list for rendering, filtering out 受理FYC which is managed in the big dedicated section
  const rulesList = Object.values(ACTIVITY_RULES).filter(rule => rule.type !== '受理FYC');

  const filteredRules = rulesList.filter(rule => {
    return rule.category === categoryFilter;
  });

  const getBuffedPoints = (type: ActivityType, basePoints: number) => {
    let points = basePoints;
    const items = currentUser.items || [];
    if (type === '約訪' && items.includes('item_0')) {
      points = points * 3;
    }
    if (type === '成交壽險件' && items.includes('item_1')) {
      points = Math.floor(points * 1.5);
    }
    if (type === '遞送建議書' && items.includes('item_5')) {
      points = Math.round(points * 1.5);
    }
    if (type === '準時出席早會' && items.includes('item_2')) {
      points = points * 4;
    }
    if (type === '客戶拜訪' && items.includes('item_3')) {
      points = points * 2;
    }
    if (type === '增員活動邀約' && items.includes('item_4')) {
      points = points * 2;
    }
    if (type === '理賠' && items.includes('item_6')) {
      points = points * 4;
    }
    if (type === '保全變更 (客戶資訊)' && items.includes('item_7')) {
      points = Math.round(points * 1.5);
    }
    return points;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;

    setIsSubmitting(true);
    try {
      const typeLabel = ACTIVITY_RULES[selectedType].label;
      const basePoints = getBuffedPoints(selectedType, ACTIVITY_RULES[selectedType].points);
      const totalPoints = basePoints + (note.trim() ? 5 : 0);
      
      await onSubmitActivity(selectedType, 1, note);
      
      // Show toast
      setToastMessage({ label: typeLabel, points: totalPoints });
      setTimeout(() => setToastMessage(null), 3000);

      // Reset form states on success
      setSelectedType(null);
      setNote('');
      setCooldownTime(3); // Apply 3 seconds cooldown
    } catch (error) {
      console.error("Failed to submit activity:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFycError('');
    const amountNum = parseInt(fycAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFycError("請輸入大於 0 的有效金額！");
      return;
    }
    if (!fycNote.trim()) {
      setFycError("請填寫成交商品險種或代號！");
      return;
    }
    setIsFycSubmitting(true);
    try {
      await onSubmitActivity('受理FYC', amountNum, fycNote.trim());
      
      setFycAmount('');
      setFycNote('');
      setCooldownTime(3); // Apply 3 seconds cooldown
    } catch (err) {
      console.error("FYC submission error:", err);
    } finally {
      setIsFycSubmitting(false);
    }
  };

  // Get dynamic placeholders based on chosen activity
  const getNotePlaceholder = (type: ActivityType | null) => {
    if (!type) return "請輸入簡短的活動備忘描述（選填）...";
    switch(type) {
      case '約訪': return "例如：與王經理約下週三進行商品說明";
      case '客戶拜訪': return "例如：前往內湖拜訪李醫師，相談甚歡";
      case '遞送建議書': return "例如：送交張小姐年金險建議書一份";
      case '成交壽險件': return "例如：成交高額終身醫療險，簽署合約";
      case '保全變更 (客戶資訊)': return "例如：協助客戶辦理保單給付或保全變更手續";
      case '保全變更(加保)': return "例如：協助客戶辦理加保手續";
      case '邀約轉介紹': return "例如：陳醫師推薦了他的兩位同事";
      case '成交產團險': return "例如：簽下中小企業10人團險";
      case '成交信用卡': return "例如：協助王先生申辦鈦金信用卡一張";
      case '完成MS問卷': return "例如：完成5月份MS問卷調查填寫";
      case '開增員議題': return "例如：與餐飲業轉職小李開立增員談話";
      case '增員綁定': return "例如：學妹正式簽署增員意向綁定";
      case '增員活動邀約': return "例如：邀約對象小陳參加本週五增員說明會";
      case '起聘新人': return "例如：新晉同仁阿凱今日起聘培訓！";
      case '準時出席早會': return "例如：準時出席今日早會，簽到完成";
      case '擔任早會主持DJ': return "例如：擔任今日早會主持DJ，氣氛熱烈";
      case '成為case study案主': return "例如：參與早會case study案例研討與分析";
      case '早會分享回饋': return "例如：於早會分享拜訪心路歷程與實戰回饋";
      case '與主管討論行銷增員': return "例如：與主管研討本週行銷計畫與增員進度";
      case '小組實體聚會': return "例如：舉辦小組實體聚餐，共5人參與";
      default: return "請輸入簡短的活動備忘描述（選填）...";
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-slate-50 to-slate-100/80 border-4 border-slate-100 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col h-full relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-8 left-1/2 z-[100] bg-gradient-to-r from-red-600 to-orange-500 text-white px-6 py-3 rounded-full shadow-2xl shadow-red-600/30 font-bold flex items-center gap-3 animate-toast-in font-sans tracking-wide">
          <span className="bg-white/20 px-3 py-1 rounded-lg">「{toastMessage.label} + 🍁{toastMessage.points} 」</span>
        </div>
      )}

      {/* Concurrency Safe Lock Overlay */}
      {(isSubmitting || isFycSubmitting) && (
        <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-md rounded-3xl z-50 flex flex-col items-center justify-center text-white p-4 text-center">
          <div className="w-14 h-14 border-4 border-red-500/30 border-t-red-600 rounded-full animate-spin mb-4 shadow-lg shadow-red-500/20" />
          <h3 className="text-base sm:text-lg font-black tracking-wider">連線安全傳輸中 Secure Sync...</h3>
          <p className="text-xs text-slate-350 mt-1.5 font-medium max-w-[280px]">防當機保護機制已啟動，正在排隊處理中，請稍候</p>
        </div>
      )}

      {cooldownTime > 0 && (
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md rounded-3xl z-50 flex flex-col items-center justify-center text-white p-4 text-center">
          <div className="text-4xl animate-bounce mb-3">⚡</div>
          <h3 className="text-base sm:text-lg font-black tracking-wider">行動回報中 ({cooldownTime}s)</h3>
          <p className="text-xs text-slate-300 mt-1.5 font-medium max-w-[280px]">耐心等候。</p>
        </div>
      )}

      <div className="mb-3 text-left">
        <span className="text-[10px] font-mono text-red-600 font-bold uppercase tracking-widest bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100">
          戰報回報 Report Activity
        </span>
        <h2 className="text-xl sm:text-2xl font-display font-black text-slate-800 mt-1.5">業務活動戰報</h2>
        <p className="text-xs text-slate-500 mt-0.5">選取你完成的業務或增員活動，為自己和團隊贏得楓葉幣！</p>
      </div>

      {/* 個人狀態區 - 並列顯示 FYC 與 楓葉幣 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white border-2 border-slate-100 rounded-2xl p-3 shadow-sm flex flex-col items-start text-left relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <span className="text-[10px] font-bold text-slate-500 tracking-wider flex items-center gap-1 relative z-10">
            <Coins className="w-3 h-3 text-amber-500"/> 個人FYC業績
          </span>
          <span className="text-2xl sm:text-3xl font-display font-black text-amber-600 font-mono flex items-baseline gap-1 mt-0.5 relative z-10">
            {currentUser.fyc?.toLocaleString() || 0}
          </span>
        </div>
        <div className="bg-white border-2 border-slate-100 rounded-2xl p-3 shadow-sm flex flex-col items-start text-left relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <span className="text-[10px] font-bold text-slate-500 tracking-wider flex items-center gap-1 relative z-10">
            <Award className="w-3 h-3 text-red-500"/> 個人楓葉幣
          </span>
          <span className="text-2xl sm:text-3xl font-display font-black text-red-600 font-mono flex items-baseline gap-1 mt-0.5 relative z-10">
            {currentUser.mapleCoins ?? currentUser.totalScore ?? 0}
            <span className="text-sm text-slate-500 font-bold">🍁</span>
          </span>
        </div>
      </div>

      {/* 受理FYC 專屬特大申報區 */}
      <div className="mb-4 bg-gradient-to-br from-amber-50 to-orange-50/50 border-[3px] border-amber-400 rounded-2xl p-4 shadow-lg relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <Coins className="w-28 h-28 text-amber-500" />
        </div>
        
        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-2 bg-amber-500 text-white rounded-lg shadow-md shadow-amber-200">
            <Coins className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-amber-900 font-sans tracking-wide">🏆 恭喜成交</h3>
            <p className="text-[10px] text-amber-600 font-bold">輸入受理FYC，自動累積計算個人與小隊總 FYC！</p>
          </div>
        </div>

        <form onSubmit={handleFycSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="請輸入受理 FYC 數字"
                value={fycAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  // Only allow numbers/digits
                  if (/^\d*$/.test(val)) {
                    setFycAmount(val);
                    setFycError('');
                  }
                }}
                className="w-full bg-white border-2 border-amber-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-amber-500 transition-all text-slate-800 shadow-xs"
              />
            </div>
            <input
              type="text"
              placeholder="成交商品險種或代號 (必填)"
              value={fycNote}
              onChange={(e) => {
                setFycNote(e.target.value);
                if (e.target.value.trim()) setFycError('');
              }}
              className="w-full bg-white border-2 border-amber-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-amber-500 transition-all text-slate-800 shadow-xs"
              required
            />
          </div>

          {fycError && (
            <div className="text-red-600 text-xs font-bold font-sans bg-red-50 border border-red-100 px-3.5 py-1.5 rounded-xl">
              ⚠️ {fycError}
            </div>
          )}

          <button
            type="submit"
            disabled={isFycSubmitting || !fycAmount || !fycNote.trim()}
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-black font-display tracking-widest uppercase transition-all shadow-md shadow-amber-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
          >
            {isFycSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                送出 FYC 申報 SUBMIT FYC
              </>
            )}
          </button>
        </form>
      </div>

      {/* Category Tab Filter */}
      <div className="flex bg-slate-200/60 p-1 rounded-xl gap-1 mb-3 border border-slate-200/80 shadow-inner">
        <button
          id="btn-filter-business"
          type="button"
          onClick={() => setCategoryFilter('business')}
          className={`flex-1 py-1.5 text-sm sm:text-base font-bold rounded-lg transition-all cursor-pointer ${
            categoryFilter === 'business' 
              ? 'bg-red-600 text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          業務銷售
        </button>
        <button
          id="btn-filter-recruit"
          type="button"
          onClick={() => setCategoryFilter('recruit')}
          className={`flex-1 py-1.5 text-sm sm:text-base font-bold rounded-lg transition-all cursor-pointer ${
            categoryFilter === 'recruit' 
              ? 'bg-red-600 text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          增員招募
        </button>
        <button
          id="btn-filter-team"
          type="button"
          onClick={() => setCategoryFilter('team')}
          className={`flex-1 py-1.5 text-sm sm:text-base font-bold rounded-lg transition-all cursor-pointer ${
            categoryFilter === 'team' 
              ? 'bg-red-600 text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          團隊參與
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
        {/* Scrollable Rules Grid - Display only 4 options (2 rows) */}
        <div className="grid grid-cols-2 gap-2 max-h-[190px] overflow-y-auto pr-1 mb-4 rounded-xl">
          {filteredRules.map((rule) => {
            const IconComponent = ICON_MAP[rule.icon] || Award;
            const isSelected = selectedType === rule.type;
            const buffedPoints = getBuffedPoints(rule.type, rule.points);
            const isBuffed = buffedPoints !== rule.points;
            
            return (
              <button
                key={rule.type}
                type="button"
                id={`btn-rule-${rule.type}`}
                onClick={() => setSelectedType(rule.type)}
                className={`flex flex-col items-start p-2.5 rounded-xl border backdrop-blur-md text-left transition-all duration-200 cursor-pointer justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_2px_4px_rgba(0,0,0,0.05)] hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_4px_8px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-br from-red-50/90 to-red-100/70 border-red-300 ring-2 ring-red-400/40 text-slate-800'
                    : 'bg-gradient-to-br from-white/60 to-slate-50/40 border-white/80 text-slate-600'
                }`}
              >
                <div className="flex w-full items-center justify-between gap-1">
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    isSelected 
                      ? 'bg-red-100/80 text-red-600 shadow-sm' 
                      : rule.category === 'recruit' 
                        ? 'bg-blue-50/80 text-blue-600 border border-blue-100/50 shadow-sm' 
                        : rule.category === 'team'
                          ? 'bg-emerald-50/80 text-emerald-600 border border-emerald-100/50 shadow-sm'
                          : 'bg-red-50/80 text-red-600 border border-red-100/50 shadow-sm'
                  }`}>
                    <IconComponent className="w-4 h-4" />
                  </div>

                  <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-black font-mono tracking-wide shadow-xs border transition-all duration-200 shrink-0 ${
                    isSelected 
                      ? 'bg-orange-600 text-white border-orange-500 scale-105 shadow-md shadow-orange-100' 
                      : isBuffed
                        ? 'bg-amber-500 text-white border-amber-400 shadow-sm animate-pulse'
                        : rule.category === 'recruit'
                          ? 'bg-blue-600/90 text-white border-blue-500/80 hover:bg-blue-700'
                          : rule.category === 'team'
                            ? 'bg-emerald-600/90 text-white border-emerald-500/80 hover:bg-emerald-700'
                            : 'bg-red-600/90 text-white border-red-500/80 hover:bg-red-700'
                  }`}>
                    <span>🍁</span>
                    <span>+{buffedPoints}</span>
                  </span>
                </div>
                
                <div className="mt-2 w-full text-left">
                  <h4 className="text-xs font-bold text-slate-800 font-sans leading-snug">
                    {rule.label}
                  </h4>
                  {rule.subtitle && (
                    <p className="text-[9px] text-slate-500 font-medium mt-0.5 leading-tight truncate w-full">{rule.subtitle}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Controls depending on Selected Item */}
        <div className={`space-y-4 border-t border-slate-100 pt-4 transition-all duration-300 ${
          selectedType ? 'opacity-100' : 'opacity-40 pointer-events-none'
        }`}>
          {/* Selected activity display label */}
          {selectedType && (
            <div className="text-sm font-bold text-slate-800 font-sans text-left">
              已選取活動：<span className="text-red-650">{ACTIVITY_RULES[selectedType].label}</span>
            </div>
          )}

          {/* Comment/Note input */}
          <div className="space-y-1 text-left">
            <label className="text-[11px] text-slate-500 flex items-center gap-1 font-mono font-bold">
              <MessageSquareCode className="w-3 h-3 text-red-500" />
              戰報備註 Notes <span className="text-red-500 font-normal">(非必填，填寫額外 +5 幣)</span>
            </label>
            <input
              id="input-activity-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={getNotePlaceholder(selectedType)}
              className="w-full bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition shadow-inner"
              maxLength={100}
            />
          </div>

          {/* Submit Trigger */}
          <button
            id="btn-submit-activity"
            type="submit"
            disabled={!selectedType || isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-450 text-white rounded-xl text-sm font-bold font-display tracking-widest uppercase transition-all shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none active:scale-95"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                送出回報 SUBMIT REPORT (+{selectedType ? getBuffedPoints(selectedType, ACTIVITY_RULES[selectedType].points) : 0} 楓葉幣)
              </>
            )}
          </button>
        </div>

        {!selectedType && (
          <div className="text-center py-6 text-xs text-slate-450 font-mono font-bold animate-pulse">
            👆 請先從上方清單中選取一項活動進行回報
          </div>
        )}
      </form>
    </div>
  );
}
