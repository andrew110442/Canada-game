export interface User {
  id: string;
  username: string;
  password?: string; // Optional password field for authorization
  realName: string;
  avatar: string; // Tailwind color or avatar class
  role: 'admin' | 'captain' | 'user';
  totalScore: number;
  mapleCoins?: number;
  team?: string; // Squad assignment
  fyc?: number;
  fycAllTime?: number; // Historical accumulated FYC that does not reset
  hasDiamond?: boolean; // Cumulative FYC
  items?: string[]; // Array of purchased item IDs
}

export interface StoreItem {
  id: string;
  name: string;
  icon: string;
  cost: number;
  description: string;
  effectDescription: string;
}

export const STORE_ITEMS: StoreItem[] = [
  { id: 'item_0', name: '神奇海螺', icon: '🐚', cost: 700, description: '「約訪」楓葉幣 x3', effectDescription: '約訪' },
  { id: 'item_1', name: '楓葉勳章', icon: '🍁', cost: 1000, description: '「成交壽險件」楓葉幣 x 1.5', effectDescription: '成交壽險件' },
  { id: 'item_5', name: '探險地圖', icon: '🗺️', cost: 600, description: '「遞送建議書」楓葉幣 x 1.5', effectDescription: '遞送建議書' },
  { id: 'item_3', name: '雪地布靴', icon: '🥾', cost: 600, description: '「客戶拜訪」楓葉幣 x 2', effectDescription: '客戶拜訪' },
  { id: 'item_4', name: '拓荒營火', icon: '🏕️', cost: 500, description: '「增員活動邀約」楓葉幣 x 2', effectDescription: '增員活動邀約' },
  { id: 'item_6', name: '極地救援包', icon: '🧰', cost: 400, description: '「理賠」楓葉幣 x 4', effectDescription: '理賠' },
  { id: 'item_7', name: '北境情報卡', icon: '📜', cost: 500, description: '「保全變更(客戶資訊)」 楓葉幣 x 1.5', effectDescription: '保全變更 (客戶資訊)' },
  { id: 'item_2', name: '時光羅盤', icon: '🧭', cost: 1000, description: '「準時出席早會」楓葉幣 x 4', effectDescription: '準時出席早會' }
];

export const SQUADS = [
  '🛡️ 北境守衛軍',
  '⚔️ 極光先鋒隊',
  '🏔️ 冰河遠征隊',
  '🔥 楓葉騎士團',
  '👑 魁北克軍團',
  '🌌 暗夜洛磯隊'
];

export type ActivityType =
  | '約訪' // 約訪 (5 楓葉幣)
  | '客戶拜訪' // 客戶拜訪 (8 楓葉幣)
  | '遞送建議書' // 遞送建議書 (15 楓葉幣)
  | '成交壽險件' // 成交壽險件 (20 楓葉幣)
  | '簽收保單' // 簽收保單 (6 楓葉幣)
  | '保全變更 (客戶資訊)' // 保全變更 (客戶資訊) (10 楓葉幣)
  | '保全變更(加保)' // 保全變更(加保) (20 楓葉幣)
  | '理賠' // 理賠 (10 楓葉幣)
  | '邀約轉介紹' // 邀約轉介紹 (8 楓葉幣)
  | '成交產團險' // 成交產團險 (10 楓葉幣)
  | '成交信用卡' // 成交信用卡 (6 楓葉幣)
  | '完成MS問卷' // 完成MS問卷 (10 楓葉幣)
  | '開增員議題' // 開增員議題 (5 楓葉幣)
  | '增員綁定' // 增員綁定 (10 楓葉幣)
  | '增員活動邀約' // 增員活動邀約 (5 楓葉幣)
  | '起聘新人' // 起聘新人 (100 楓葉幣)
  | '準時出席早會' // 準時出席早會 (5 楓葉幣)
  | '擔任早會主持DJ' // 擔任早會主持DJ (5 楓葉幣)
  | '成為case study案主' // 成為case study案主 (25 楓葉幣)
  | '早會分享回饋' // 早會分享回饋 (5 楓葉幣)
  | '與主管討論行銷增員' // 與主管討論行銷增員 (5 楓葉幣)
  | '小組實體聚會' // 小組實體聚會 (20 楓葉幣)
  | '受理FYC'; // 受理FYC (輸入數字，累積FYC)

export interface ActivityRule {
  type: ActivityType;
  label: string;
  points: number;
  icon: string;
  category: 'business' | 'recruit' | 'team' | 'other';
  subtitle?: string;
}

export const ACTIVITY_RULES: Record<ActivityType, ActivityRule> = {
  '約訪': { type: '約訪', label: '約訪', points: 5, icon: 'CalendarDays', category: 'business', subtitle: '電話或訊息成功約訪' },
  '客戶拜訪': { type: '客戶拜訪', label: '客戶拜訪', points: 8, icon: 'MapPin', category: 'business', subtitle: '實體或視訊' },
  '遞送建議書': { type: '遞送建議書', label: '遞送建議書', points: 15, icon: 'FileText', category: 'business' },
  '成交壽險件': { type: '成交壽險件', label: '成交壽險件', points: 20, icon: 'FileSignature', category: 'business', subtitle: '以件數計算' },
  '簽收保單': { type: '簽收保單', label: '簽收保單', points: 6, icon: 'FileCheck', category: 'business', subtitle: '僅限紙本保單' },
  '保全變更 (客戶資訊)': { type: '保全變更 (客戶資訊)', label: '保全變更 (客戶資訊)', points: 10, icon: 'FileText', category: 'business' },
  '保全變更(加保)': { type: '保全變更(加保)', label: '保全變更(加保)', points: 20, icon: 'FileText', category: 'business' },
  '理賠': { type: '理賠', label: '理賠', points: 10, icon: 'HeartHandshake', category: 'business' },
  '邀約轉介紹': { type: '邀約轉介紹', label: '邀約轉介紹', points: 8, icon: 'Users', category: 'business' },
  '成交產團險': { type: '成交產團險', label: '成交產團險', points: 8, icon: 'Shield', category: 'business' },
  '成交信用卡': { type: '成交信用卡', label: '成交信用卡', points: 6, icon: 'CreditCard', category: 'business' },
  '完成MS問卷': { type: '完成MS問卷', label: '完成MS問卷', points: 10, icon: 'ClipboardList', category: 'business' },
  '開增員議題': { type: '開增員議題', label: '開增員議題', points: 5, icon: 'UserPlus', category: 'recruit' },
  '增員綁定': { type: '增員綁定', label: '增員綁定', points: 10, icon: 'UserCheck', category: 'recruit', subtitle: '需區部簽核完成' },
  '增員活動邀約': { type: '增員活動邀約', label: '增員活動邀約', points: 5, icon: 'Users', category: 'recruit', subtitle: '須出席活動' },
  '起聘新人': { type: '起聘新人', label: '起聘新人', points: 100, icon: 'Award', category: 'recruit', subtitle: '需起聘正職' },
  '準時出席早會': { type: '準時出席早會', label: '準時出席早會', points: 5, icon: 'Clock', category: 'team', subtitle: '8:30前打卡' },
  '擔任早會主持DJ': { type: '擔任早會主持DJ', label: '擔任早會主持DJ', points: 5, icon: 'Mic', category: 'team' },
  '成為case study案主': { type: '成為case study案主', label: '成為case study案主', points: 25, icon: 'BookOpen', category: 'team' },
  '早會分享回饋': { type: '早會分享回饋', label: '早會分享回饋', points: 5, icon: 'MessageSquare', category: 'team' },
  '與主管討論行銷增員': { type: '與主管討論行銷增員', label: '與主管討論行銷增員', points: 5, icon: 'Compass', category: 'team', subtitle: '一天上限一次' },
  '小組實體聚會': { type: '小組實體聚會', label: '小組實體聚會', points: 20, icon: 'Users', category: 'team', subtitle: '一週上限2次' },
  '受理FYC': { type: '受理FYC', label: '受理 FYC', points: 0, icon: 'Coins', category: 'business' },
};

export interface ActivityReport {
  id: string;
  userId: string;
  username: string;
  realName: string;
  type: ActivityType;
  points: number;
  count: number; // Multiplier, standard is 1
  note?: string;
  timestamp: string; // ISO string
  isArchived?: boolean; // If true, excluded from rankings but retained in history
}

export interface Landmark {
  id: string;
  name: string;
  nameEn: string;
  province: string;
  pointsRequired: number;
  description: string;
  coords: { x: number; y: number }; // Percentage coords for mapping: left/top
  fact: string; // A fun fact about the place
  image: string; // High-resolution real photo of the landmark
}

export function getAdventurerTitle(score: number): { title: string; min: number; max: number; progress: number; description: string; rank: number } {
  if (score <= 50) {
    return { 
      title: '初始勇者 🍁', 
      min: 0, 
      max: 50, 
      progress: (score / 50) * 100,
      description: '踏上冒險的第一步，充滿無限可能！',
      rank: 1
    };
  } else if (score <= 100) {
    return { 
      title: '楓林行者 🌲', 
      min: 51, 
      max: 100, 
      progress: ((score - 50) / 50) * 100,
      description: '已熟悉開拓路線，展露頭角！',
      rank: 2
    };
  } else if (score <= 200) {
    return { 
      title: '落磯山獵手 🏔️', 
      min: 101, 
      max: 200, 
      progress: ((score - 100) / 100) * 100,
      description: '具備豐富獵取業績戰果的經驗，是團隊的中堅力量！',
      rank: 3
    };
  } else if (score <= 300) {
    return { 
      title: '黃刀守衛 🛡️', 
      min: 201, 
      max: 300, 
      progress: ((score - 200) / 100) * 100,
      description: '戰績輝煌，默默守護著團隊！',
      rank: 4
    };
  } else if (score <= 400) {
    return { 
      title: '尼加拉騎士 ⚔️', 
      min: 301, 
      max: 400, 
      progress: ((score - 300) / 100) * 100,
      description: '全力保衛團隊，並帶領小隊衝鋒陣地！',
      rank: 5
    };
  } else if (score <= 600) {
    return { 
      title: '荒野大開拓家 🪓', 
      min: 401, 
      max: 600, 
      progress: ((score - 400) / 200) * 100,
      description: '劈荊斬棘、無畏前行！在荒野中開闢出全新道路，是團隊的先鋒表率！',
      rank: 6
    };
  } else if (score <= 900) {
    return { 
      title: '芬迪潮汐領主 🐋', 
      min: 601, 
      max: 900, 
      progress: ((score - 600) / 300) * 100,
      description: '掌控著世界最高潮汐般的洶湧氣勢，一出手便能席捲全場、扭轉乾坤！',
      rank: 7
    };
  } else if (score <= 1200) {
    return { 
      title: '勞倫斯破冰船長 ⚓', 
      min: 901, 
      max: 1200, 
      progress: ((score - 900) / 300) * 100,
      description: '坐鎮於聖勞倫斯灣的風浪之中，開闢航線，帶領團隊突破重重險阻！',
      rank: 8
    };
  } else if (score <= 2000) {
    return { 
      title: '極地無畏戰神 ❄️', 
      min: 1201, 
      max: 2000, 
      progress: ((score - 1200) / 800) * 100,
      description: '繼承了北極圈至高霸主的力量，在暴風雪中傲然挺立，威震四方！',
      rank: 9
    };
  } else if (score <= 3000) {
    return { 
      title: '極光聖域智者 🌌', 
      min: 2001, 
      max: 3000, 
      progress: ((score - 2000) / 1000) * 100,
      description: '沐浴在神聖歐若拉光芒下，洞悉先機，以超凡的智慧指引團隊前行！',
      rank: 10
    };
  } else if (score <= 5000) {
    return { 
      title: '冰川不滅巨擘 🧊', 
      min: 3001, 
      max: 5000, 
      progress: ((score - 3000) / 2000) * 100,
      description: '意志如哥倫比亞冰原般萬年不化、堅毅不拔，是萬人景仰的傳奇巨頭！',
      rank: 11
    };
  } else {
    return { 
      title: '極境至尊 👑', 
      min: 5001, 
      max: 99999, 
      progress: 100,
      description: '征服所有未知疆域，傲立於世界盡頭的冰封王座！',
      rank: 12
    };
  }
}

export interface ShoutMessage {
  id: string;
  userId: string;
  username: string;
  realName: string;
  avatar: string;
  team: string;
  text: string;
  timestamp: string; // ISO string
  expiresAt?: string; // ISO string
}

export interface PromotionEvent {
  id: string;
  userId: string;
  realName: string;
  username: string;
  avatar: string;
  team: string;
  oldTitle: string;
  newTitle: string;
  newRank: number;
  timestamp: string; // ISO string
}

export interface BadgeUnlockEvent {
  id: string;
  userId: string;
  realName: string;
  username: string;
  avatar: string;
  team: string;
  badgeId: string;
  badgeTitle: string;
  badgeIcon: string;
  badgeDesc: string;
  timestamp: string; // ISO string
}

export interface FycEvent {
  id: string;
  userId: string;
  realName: string;
  username: string;
  avatar: string;
  team: string;
  amount: number;
  note?: string;
  timestamp: string; // ISO string
}

export interface LandmarkUnlockEvent {
  id: string;
  landmarkId: string;
  landmarkName: string;
  landmarkNameEn: string;
  landmarkImage: string;
  teamName: string;
  realName: string;
  teamTotalScore: number;
  timestamp: string; // ISO string
}

export interface TeamRedemption {
  id: string;
  team: string;
  cost: number;
  reward: string;
  timestamp: string;
  captainName: string;
}

export interface ItemRedemption {
  id: string;
  userId: string;
  realName: string;
  team: string;
  itemId: string;
  itemName: string;
  cost: number;
  timestamp: string;
}

export const BADGE_RULES = [
  { id: 'app_1', title: '約訪新秀', icon: '🌱', min: 30, desc: '完成30次約訪', type: '約訪' },
  { id: 'app_2', title: '心動玩家', icon: '💓', min: 60, desc: '完成60次約訪', type: '約訪' },
  { id: 'app_3', title: '情場高手', icon: '💌', min: 90, desc: '完成90次約訪', type: '約訪' },
  { id: 'app_4', title: '戀愛大師', icon: '💋', min: 120, desc: '完成120次約訪', type: '約訪' },
  { id: 'app_5', title: '約會達人', icon: '🔥', min: 150, desc: '完成150次約訪', type: '約訪' },
  { id: 'app_6', title: '冬季戀歌', icon: '🤍', min: 200, desc: '完成200次約訪', type: '約訪' },

  { id: 'vis_1', title: '跑圖新手', icon: '🗺️', min: 10, desc: '完成10次拜訪', type: '客戶拜訪' },
  { id: 'vis_2', title: '外勤旅人', icon: '🚶', min: 20, desc: '完成20次拜訪', type: '客戶拜訪' },
  { id: 'vis_3', title: '開拓先鋒', icon: '🧭', min: 30, desc: '完成30次拜訪', type: '客戶拜訪' },
  { id: 'vis_4', title: '保單獵人', icon: '🏃', min: 40, desc: '完成40次拜訪', type: '客戶拜訪' },
  { id: 'vis_5', title: '馬拉松選手', icon: '🥾', min: 50, desc: '完成50次拜訪', type: '客戶拜訪' },
  { id: 'vis_6', title: '我是傳奇', icon: '👑', min: 60, desc: '完成60次拜訪', type: '客戶拜訪' },

  { id: 'deal_1', title: '簽約練習生', icon: '📑', min: 5, desc: '完成5次成交', type: '成交壽險件' },
  { id: 'deal_2', title: '收單忍者', icon: '✒️', min: 10, desc: '完成10次成交', type: '成交壽險件' },
  { id: 'deal_3', title: '成交引擎', icon: '🔥', min: 15, desc: '完成15次成交', type: '成交壽險件' },
  { id: 'deal_4', title: '保單怪獸', icon: '🚀', min: 20, desc: '完成20次成交', type: '成交壽險件' },
  { id: 'deal_5', title: '神單製造機', icon: '👑', min: 25, desc: '完成25次成交', type: '成交壽險件' },
  { id: 'deal_6', title: '簽手簽眼', icon: '🤝', min: 30, desc: '完成30次成交', type: '成交壽險件' },

  { id: 'rec_1', title: '人才召喚師', icon: '📢', min: 5, desc: '開增員議題 5次', type: '開增員議題' },
  { id: 'rec_1_5', title: '新星引路人', icon: '🌠', min: 1, desc: '增員綁定 1次', type: '增員綁定' },
  { id: 'rec_2', title: '勇者召集令', icon: '🗡️', min: 2, desc: '增員綁定 2次', type: '增員綁定' },
  { id: 'rec_3', title: '伯樂現身', icon: '🐴', min: 1, desc: '起聘新人 1人', type: '起聘新人' },
  { id: 'rec_4', title: '公會招募官', icon: '🛡️', min: 5, desc: '增員活動邀約 5次', type: '增員活動邀約' },
  { id: 'rec_5', title: '傳奇公會長', icon: '👑', min: 10, desc: '增員活動邀約 10次', type: '增員活動邀約' },

  { id: 'oth_1', title: '超級變變變', icon: '🦎', min: 1, desc: '保全變更(客戶資訊)', type: '保全變更 (客戶資訊)' },
  { id: 'oth_2', title: '跨售收割機', icon: '💼', min: 10, desc: '成交產團險 10次', type: '成交產團險' },
  { id: 'oth_3', title: '一卡在手', icon: '🔥', min: 5, desc: '成交信用卡 5張', type: '成交信用卡' },
  { id: 'oth_4', title: '打卡MVP', icon: '📍', min: 5, desc: '準時出席早會 5次', type: '準時出席早會' },
  { id: 'oth_5', title: '經驗傳承者', icon: '💡', min: 2, desc: '成為case study案主 2次', type: '成為case study案主' },
  { id: 'oth_6', title: '傳奇聚首', icon: '🪄', min: 2, desc: '小組實體聚會 2次', type: '小組實體聚會' },
  { id: 'oth_7', title: '南丁格爾', icon: '👩🏼', min: 3, desc: '理賠 3次', type: '理賠' },
  { id: 'oth_8', title: '市場開發員', icon: '📋', min: 5, desc: '完成MS問卷 5次', type: '完成MS問卷' },
  { id: 'oth_9', title: '星光傳承', icon: '🌟', min: 2, desc: '早會分享回饋 2次', type: '早會分享回饋' },
];
