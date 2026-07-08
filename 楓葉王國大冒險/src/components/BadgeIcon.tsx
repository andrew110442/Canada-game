import React from 'react';
import { motion } from 'motion/react';
import { Shield, Sparkles, Award, Compass, Heart, Zap } from 'lucide-react';

export interface BadgeDetail {
  rank: number;
  title: string;
  emoji: string;
  min: number;
  max: number;
  description: string;
  colorName: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
}

export const BADGE_DETAILS: Record<number, BadgeDetail> = {
  1: {
    rank: 1,
    title: '初始勇者 🍁',
    emoji: '🍁',
    min: 0,
    max: 50,
    description: '踏上冒險的第一步，充滿無限可能！',
    colorName: '古銅銅橘',
    bgClass: 'bg-orange-50/70',
    borderClass: 'border-orange-200',
    textClass: 'text-orange-800',
    accentColor: '#f97316',
    gradientFrom: 'from-orange-500/10',
    gradientTo: 'to-amber-500/5'
  },
  2: {
    rank: 2,
    title: '楓林行者 🌲',
    emoji: '🌲',
    min: 51,
    max: 100,
    description: '已熟悉開拓路線，展露頭角！',
    colorName: '森林翡翠',
    bgClass: 'bg-emerald-50/70',
    borderClass: 'border-emerald-200',
    textClass: 'text-emerald-800',
    accentColor: '#10b981',
    gradientFrom: 'from-emerald-500/10',
    gradientTo: 'to-teal-500/5'
  },
  3: {
    rank: 3,
    title: '落磯山獵手 🏔️',
    emoji: '🏔️',
    min: 101,
    max: 200,
    description: '具備豐富獵取業績戰果的經驗，是團隊的中堅力量！',
    colorName: '冰川湛藍',
    bgClass: 'bg-cyan-50/70',
    borderClass: 'border-cyan-200',
    textClass: 'text-cyan-800',
    accentColor: '#06b6d4',
    gradientFrom: 'from-cyan-500/10',
    gradientTo: 'to-blue-500/5'
  },
  4: {
    rank: 4,
    title: '黃刀守衛 🛡️',
    emoji: '🛡️',
    min: 201,
    max: 300,
    description: '戰績輝煌，默默守護著團隊！',
    colorName: '極光金輝',
    bgClass: 'bg-amber-50/80',
    borderClass: 'border-amber-300',
    textClass: 'text-amber-800',
    accentColor: '#f59e0b',
    gradientFrom: 'from-amber-500/20',
    gradientTo: 'to-yellow-500/10'
  },
  5: {
    rank: 5,
    title: '尼加拉騎士 ⚔️',
    emoji: '⚔️',
    min: 301,
    max: 400,
    description: '全力保衛團隊，並帶領小隊衝鋒陣地！',
    colorName: '銀翼星藍',
    bgClass: 'bg-indigo-50/80',
    borderClass: 'border-indigo-300',
    textClass: 'text-indigo-800',
    accentColor: '#6366f1',
    gradientFrom: 'from-indigo-500/20',
    gradientTo: 'to-blue-600/15'
  },
  6: {
    rank: 6,
    title: '荒野大開拓家 🪓',
    emoji: '🪓',
    min: 401,
    max: 600,
    description: '劈荊斬棘、無畏前行！在荒野中開闢出全新道路，是團隊的先鋒表率！',
    colorName: '狂野赤紅',
    bgClass: 'bg-red-50/80',
    borderClass: 'border-red-300',
    textClass: 'text-red-800',
    accentColor: '#ef4444',
    gradientFrom: 'from-red-500/20',
    gradientTo: 'to-orange-600/15'
  },
  7: {
    rank: 7,
    title: '芬迪潮汐領主 🐋',
    emoji: '🐋',
    min: 601,
    max: 900,
    description: '掌控著世界最高潮汐般的洶湧氣勢，一出手便能席捲全場、扭轉乾坤！',
    colorName: '深海幽藍',
    bgClass: 'bg-sky-50/80',
    borderClass: 'border-sky-300',
    textClass: 'text-sky-800',
    accentColor: '#0ea5e9',
    gradientFrom: 'from-sky-500/20',
    gradientTo: 'to-blue-600/15'
  },
  8: {
    rank: 8,
    title: '勞倫斯破冰船長 ⚓',
    emoji: '⚓',
    min: 901,
    max: 1200,
    description: '坐鎮於聖勞倫斯灣的風浪之中，開闢航線，帶領團隊突破重重險阻！',
    colorName: '鋼鐵灰銀',
    bgClass: 'bg-slate-50/80',
    borderClass: 'border-slate-400',
    textClass: 'text-slate-800',
    accentColor: '#64748b',
    gradientFrom: 'from-slate-500/20',
    gradientTo: 'to-gray-600/15'
  },
  9: {
    rank: 9,
    title: '極地無畏戰神 ❄️',
    emoji: '❄️',
    min: 1201,
    max: 2000,
    description: '繼承了北極圈至高霸主的力量，在暴風雪中傲然挺立，威震四方！',
    colorName: '冰晶皓白',
    bgClass: 'bg-gray-50/90',
    borderClass: 'border-gray-300',
    textClass: 'text-gray-800',
    accentColor: '#9ca3af',
    gradientFrom: 'from-gray-300/30',
    gradientTo: 'to-slate-400/20'
  },
  10: {
    rank: 10,
    title: '極光聖域智者 🌌',
    emoji: '🌌',
    min: 2001,
    max: 3000,
    description: '沐浴在神聖歐若拉光芒下，洞悉先機，以超凡的智慧指引團隊前行！',
    colorName: '星雲紫光',
    bgClass: 'bg-violet-50/90',
    borderClass: 'border-violet-300',
    textClass: 'text-violet-900',
    accentColor: '#8b5cf6',
    gradientFrom: 'from-violet-500/30',
    gradientTo: 'to-purple-600/20'
  },
  11: {
    rank: 11,
    title: '冰川不滅巨擘 🧊',
    emoji: '🧊',
    min: 3001,
    max: 5000,
    description: '意志如哥倫比亞冰原般萬年不化、堅毅不拔，是萬人景仰的傳奇巨頭！',
    colorName: '永凍霜藍',
    bgClass: 'bg-teal-50/90',
    borderClass: 'border-teal-300',
    textClass: 'text-teal-900',
    accentColor: '#14b8a6',
    gradientFrom: 'from-teal-500/30',
    gradientTo: 'to-cyan-600/20'
  },
  12: {
    rank: 12,
    title: '極境至尊 👑',
    emoji: '👑',
    min: 5001,
    max: 99999,
    description: '征服所有未知疆域，傲立於世界盡頭的冰封王座！',
    colorName: '至臻紫金',
    bgClass: 'bg-fuchsia-50/90',
    borderClass: 'border-fuchsia-300',
    textClass: 'text-fuchsia-900',
    accentColor: '#d946ef',
    gradientFrom: 'from-fuchsia-500/30',
    gradientTo: 'to-purple-600/20'
  }
};

export function getBadgeByScore(score: number): BadgeDetail {
  if (score <= 50) return BADGE_DETAILS[1];
  if (score <= 100) return BADGE_DETAILS[2];
  if (score <= 200) return BADGE_DETAILS[3];
  if (score <= 300) return BADGE_DETAILS[4];
  if (score <= 400) return BADGE_DETAILS[5];
  if (score <= 600) return BADGE_DETAILS[6];
  if (score <= 900) return BADGE_DETAILS[7];
  if (score <= 1200) return BADGE_DETAILS[8];
  if (score <= 2000) return BADGE_DETAILS[9];
  if (score <= 3000) return BADGE_DETAILS[10];
  if (score <= 5000) return BADGE_DETAILS[11];
  return BADGE_DETAILS[12];
}

interface BadgeIconProps {
  rank: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
}

export default function BadgeIcon({ rank, size = 'md', animate = true }: BadgeIconProps) {
  const badge = BADGE_DETAILS[rank] || BADGE_DETAILS[1];

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-2xl border-2',
    lg: 'w-20 h-20 text-4xl border-3',
    xl: 'w-28 h-28 text-6xl border-4'
  };

  const ringGlow = {
    1: 'shadow-orange-100',
    2: 'shadow-emerald-100',
    3: 'shadow-cyan-100',
    4: 'shadow-amber-200/50',
    5: 'shadow-indigo-200/50',
    6: 'shadow-fuchsia-300/60'
  }[rank] || 'shadow-slate-100';

  const containerClass = `
    relative flex items-center justify-center rounded-full shrink-0
    ${badge.bgClass} ${badge.borderClass} ${sizeClasses[size]} ${ringGlow} shadow-lg
  `;

  // Define some inner ambient glowing rings or sparkle effects for higher ranks
  const showSparkle = rank >= 7;

  const content = (
    <div className="relative flex items-center justify-center w-full h-full rounded-full">
      {/* Background radial gradient */}
      <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${badge.gradientFrom} ${badge.gradientTo} opacity-80`} />
      
      {/* Emoji icon */}
      <span className="relative z-10 select-none transform hover:scale-110 transition-transform duration-250">
        {badge.emoji}
      </span>

      {/* Decorative Sparkles for High Tiers */}
      {showSparkle && size !== 'sm' && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 pointer-events-none"
        >
          <Sparkles 
            className={`absolute top-0 right-1 ${size === 'xl' ? 'w-5 h-5' : 'w-3.5 h-3.5'} text-yellow-400 opacity-80`}
            style={{ color: badge.accentColor }} 
          />
          <Sparkles 
            className={`absolute bottom-1 left-0.5 ${size === 'xl' ? 'w-4 h-4' : 'w-2.5 h-2.5'} text-yellow-300 opacity-60`} 
          />
        </motion.div>
      )}
    </div>
  );

  if (!animate) {
    return <div className={containerClass}>{content}</div>;
  }

  // Choose animation depending on rank
  const getMotionProps = () => {
    if (rank >= 10) {
      return {
        animate: { 
          y: [0, -6, 0],
          scale: [1, 1.03, 1],
          boxShadow: [
            `0 10px 15px -3px ${badge.accentColor}33, 0 4px 6px -4px ${badge.accentColor}33`,
            `0 20px 25px -5px ${badge.accentColor}73, 0 8px 10px -6px ${badge.accentColor}73`,
            `0 10px 15px -3px ${badge.accentColor}33, 0 4px 6px -4px ${badge.accentColor}33`
          ]
        },
        transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
      };
    }
    if (rank >= 7) {
      return {
        animate: { 
          y: [0, -4, 0],
          boxShadow: [
            `0 10px 15px -3px ${badge.accentColor}33`,
            `0 15px 20px -3px ${badge.accentColor}59`,
            `0 10px 15px -3px ${badge.accentColor}33`
          ]
        },
        transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
      };
    }
    if (rank >= 4) {
      return {
        animate: { 
          y: [0, -3, 0],
          boxShadow: [
            `0 4px 6px -1px ${badge.accentColor}26`,
            `0 10px 15px -3px ${badge.accentColor}40`,
            `0 4px 6px -1px ${badge.accentColor}26`
          ]
        },
        transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
      };
    }
    return {
      whileHover: { scale: 1.05, y: -2 },
      transition: { duration: 0.2 }
    };
  };

  return (
    <motion.div className={containerClass} {...getMotionProps()}>
      {content}
    </motion.div>
  );
}
