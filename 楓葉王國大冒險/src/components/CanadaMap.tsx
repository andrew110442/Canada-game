import React, { useState } from 'react';
import { Landmark } from '../types';
import { LANDMARKS } from '../landmarks';
import { Lock, CheckCircle2, Compass, Waves, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CanadaMapProps {
  teamScore: number;
}

export default function CanadaMap({ teamScore }: CanadaMapProps) {
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const unlockedLandmarks = LANDMARKS.filter(lm => teamScore >= lm.pointsRequired);
  const nextLandmark = LANDMARKS.find(lm => teamScore < lm.pointsRequired) || null;

  return (
    <div className="relative bg-white border-4 border-slate-100 rounded-3xl p-6 overflow-hidden shadow-xl h-[440px] lg:h-[520px] flex flex-col">
      {/* Background Decorative Grid Lines */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* Ocean/Water Waves Indicator in the corners */}
      <div className="absolute bottom-4 left-4 text-slate-400 pointer-events-none flex items-center gap-2 text-[10px] font-mono select-none z-10">
        <Waves className="w-4 h-4 animate-pulse text-blue-400" />
        <span className="font-bold tracking-wider text-slate-500 bg-white/60 px-1.5 py-0.5 rounded-md backdrop-blur-xs border border-slate-100">PACIFIC OCEAN</span>
      </div>
      <div className="absolute bottom-4 right-4 text-slate-400 pointer-events-none flex items-center gap-2 text-[10px] font-mono select-none z-10">
        <Waves className="w-4 h-4 animate-pulse text-blue-400" />
        <span className="font-bold tracking-wider text-slate-500 bg-white/60 px-1.5 py-0.5 rounded-md backdrop-blur-xs border border-slate-100">ATLANTIC OCEAN</span>
      </div>

      {/* Maple Compass */}
      <div className="absolute top-4 right-4 text-red-300 pointer-events-none flex flex-col items-center select-none z-10">
        <Compass className="w-8 h-8 text-red-500 animate-[spin_20s_linear_infinite] drop-shadow-sm" />
        <span className="text-[9px] tracking-widest font-mono mt-1 text-slate-500 font-bold bg-white/60 px-1.5 py-0.5 rounded-md backdrop-blur-xs border border-slate-100">TRUE NORTH</span>
      </div>

      {/* Header */}
      <div className="z-10 mb-4 flex justify-between items-start gap-4">
        <div className="text-left">
          <span className="text-[10px] font-mono text-red-600 font-bold uppercase tracking-widest bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
            加拿大冒險軌跡 Map Progress
          </span>
          <h2 className="text-2xl font-display font-black text-slate-800 mt-2">隊伍探險地圖</h2>
          <p className="text-xs text-slate-500 mt-1">隨著小隊總楓葉幣提升，冒險地標將逐一解鎖亮起！兌換獎勵不影響解鎖進度。</p>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
          {/* 已解鎖加國地標 */}
          <div className="bg-yellow-50 border border-yellow-100 rounded-2xl px-3 py-1.5 text-right shadow-sm shrink-0">
            <div className="text-[9px] text-yellow-600/80 font-bold font-mono tracking-wider uppercase">已解鎖加國地標</div>
            <div className="text-lg font-display font-black text-yellow-600 font-mono leading-none mt-0.5">
              {unlockedLandmarks.length} <span className="text-xs text-yellow-600/70">/ {LANDMARKS.length}</span>
            </div>
          </div>
          {/* 下一冒險目標 */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-3 py-1.5 text-right shadow-sm shrink-0 min-w-[90px]">
            <div className="text-[9px] text-blue-600/80 font-bold font-mono tracking-wider uppercase">下一冒險目標</div>
            <div className="text-sm font-display font-black text-blue-600 font-sans leading-none mt-1 truncate max-w-[100px]" title={nextLandmark ? nextLandmark.name : "征服全境！"}>
              {nextLandmark ? nextLandmark.name : "征服全境！👑"}
            </div>
          </div>
        </div>
      </div>

      {/* Map Stage Container with real-world scenic backdrop */}
      <div 
        className="relative flex-1 rounded-2xl overflow-hidden min-h-[220px] bg-cover bg-center border border-slate-200"
        style={{ 
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.82)), url('https://images.unsplash.com/photo-1480497490787-505ec076689f?auto=format&fit=crop&q=80&w=1200')` 
        }}
      >
        {/* SVG Map Graphics & Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {/* Stylized Canadian Coastlines/Provinces background blocks (geometric layout) */}
          {/* BC (Left) */}
          <polygon points="5,50 18,48 20,80 8,85" className="fill-slate-200/40 stroke-slate-200/60 stroke-1" />
          {/* Prairie Provinces (Mid Left) */}
          <polygon points="18,48 40,45 42,78 20,80" className="fill-slate-200/30 stroke-slate-200/60 stroke-1" />
          {/* Ontario / Great Lakes (Mid South) */}
          <polygon points="40,45 74,58 72,88 42,78" className="fill-slate-200/40 stroke-slate-200/60 stroke-1" />
          {/* Quebec (East Center) */}
          <polygon points="74,58 88,48 88,78 72,88" className="fill-slate-200/30 stroke-slate-200/60 stroke-1" />
          {/* Atlantic (Far East) */}
          <polygon points="88,78 98,72 96,82 88,85" className="fill-slate-200/50 stroke-slate-200/60 stroke-1" />
          {/* Northern Territories (Top Grid) */}
          <polygon points="5,20 88,18 74,58 18,48" className="fill-slate-200/20 stroke-slate-200/60 stroke-1" />

          {/* Connection Trail - Completed Segments */}
          {LANDMARKS.slice(0, LANDMARKS.length - 1).map((lm, idx) => {
            const nextLm = LANDMARKS[idx + 1];
            const isUnlocked = teamScore >= nextLm.pointsRequired;
            return (
              <line
                key={`trail-${lm.id}`}
                x1={`${lm.coords.x}%`}
                y1={`${lm.coords.y}%`}
                x2={`${nextLm.coords.x}%`}
                y2={`${nextLm.coords.y}%`}
                className={`stroke-2 ${isUnlocked ? 'stroke-red-500 stroke-dash-none' : 'stroke-slate-300'}`}
                style={{
                  strokeDasharray: isUnlocked ? undefined : '5,5',
                  opacity: isUnlocked ? 0.95 : 0.4,
                  transition: 'stroke 0.5s, opacity 0.5s'
                }}
              />
            );
          })}
        </svg>

        {/* Landmarks Nodes */}
        {LANDMARKS.map((landmark, idx) => {
          const isUnlocked = teamScore >= landmark.pointsRequired;
          
          return (
            <div
              key={landmark.id}
              className="absolute group z-10"
              style={{
                left: `${landmark.coords.x}%`,
                top: `${landmark.coords.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Pulse glow background for the active newest unlocked landmark */}
              {isUnlocked && (
                <div className="absolute -inset-3.5 rounded-full bg-red-500/20 animate-ping pointer-events-none" />
              )}

              {/* Node Button with circular thumbnail if unlocked, else lock icon */}
              <button
                id={`btn-landmark-${landmark.id}`}
                type="button"
                onClick={() => setSelectedLandmark(landmark)}
                className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 shadow-md ${
                  isUnlocked
                    ? 'border-yellow-400 hover:scale-115 ring-2 ring-red-500/20 hover:border-red-500 cursor-pointer bg-white'
                    : 'bg-white border-slate-300 text-slate-400 hover:bg-slate-100 hover:scale-105 cursor-pointer'
                }`}
              >
                {isUnlocked ? (
                  <div className="w-full h-full rounded-full overflow-hidden relative">
                    <img 
                      src={landmark.image} 
                      alt={landmark.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1501446529957-6226bd447c46?auto=format&fit=crop&q=80&w=600';
                      }}
                    />
                    {/* Index Overlay with dynamic dark veil */}
                    <div className="absolute inset-0 bg-black/15 hover:bg-transparent transition-all flex items-center justify-center">
                      <span className="text-[10px] font-mono font-black text-white drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.9)]">
                        {idx + 1}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center bg-slate-100/80 w-full h-full rounded-full">
                    <Lock className="w-3.5 h-3.5 text-slate-450" />
                  </div>
                )}
              </button>

              {/* Minimal Text Label on Hover or always for unlocked */}
              <div className="absolute left-1/2 -bottom-7 -translate-x-1/2 whitespace-nowrap bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 shadow-lg">
                <div className="text-[10px] text-white flex items-center gap-1 font-bold">
                  <span>{landmark.name}</span>
                  {!isUnlocked && <span className="text-[9px] text-yellow-400">({landmark.pointsRequired} 楓葉幣)</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Landmark Information Modal Overlay inside map box */}
      <AnimatePresence>
        {selectedLandmark && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="absolute inset-x-6 bottom-6 bg-white border-4 border-red-500 rounded-2xl p-4 shadow-2xl z-30 flex flex-col md:flex-row gap-4"
          >
            {/* Left/Image Representative block with Click-to-Zoom */}
            <div 
              onClick={() => {
                if (teamScore >= selectedLandmark.pointsRequired) {
                  setLightboxImage(selectedLandmark.image);
                }
              }}
              className={`md:w-1/3 h-28 md:h-auto rounded-xl relative overflow-hidden group/img border border-slate-200 shadow-md shrink-0 ${
                teamScore >= selectedLandmark.pointsRequired 
                  ? 'cursor-zoom-in bg-slate-100' 
                  : 'cursor-default bg-slate-200 flex flex-col items-center justify-center'
              }`}
              title={teamScore >= selectedLandmark.pointsRequired ? "點擊放大查看實景照片" : "累積足夠楓葉幣解鎖實景"}
            >
              {teamScore >= selectedLandmark.pointsRequired ? (
                <>
                  <img 
                    src={selectedLandmark.image} 
                    alt={selectedLandmark.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1501446529957-6226bd447c46?auto=format&fit=crop&q=80&w=600';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-2.5 text-left">
                    <span className="text-[9px] text-yellow-300 font-bold uppercase tracking-widest leading-none mb-1">{selectedLandmark.province}</span>
                    <span className="text-[9px] text-white font-mono leading-none flex items-center gap-1 font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                      <ZoomIn className="w-2.5 h-2.5 text-yellow-400" />
                      點擊放大實景
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center opacity-60 p-4">
                  <span className="text-4xl font-display font-black text-slate-400 mb-1">?</span>
                  <span className="text-[9px] font-bold text-slate-500 mt-1">實景尚未解鎖</span>
                </div>
              )}
            </div>

            {/* Right Information detail */}
            <div className="flex-1 flex flex-col justify-between text-left">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-800 font-display">
                      {selectedLandmark.name}
                    </h3>
                    <p className="text-[10px] font-mono text-slate-400 font-bold">{selectedLandmark.nameEn}</p>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-mono font-bold flex items-center gap-1 shrink-0 ml-2 ${
                    teamScore >= selectedLandmark.pointsRequired
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      : 'bg-yellow-50 text-yellow-600 border border-yellow-100'
                  }`}>
                    {teamScore >= selectedLandmark.pointsRequired ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        已解鎖 Unlocked
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3" />
                        解鎖門檻: {selectedLandmark.pointsRequired} 楓葉幣
                      </>
                    )}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-sans font-medium">
                  {selectedLandmark.description}
                </p>
                <div className="mt-2 bg-slate-50 border border-slate-100 rounded-lg p-2">
                  <span className="text-[9px] uppercase font-bold text-red-600 block tracking-wider">💡 探索知識 Fun Fact</span>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{selectedLandmark.fact}</p>
                </div>
              </div>

              <div className="mt-3 flex justify-end gap-2">
                <button
                  id="btn-close-landmark-detail"
                  type="button"
                  onClick={() => setSelectedLandmark(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-white rounded-lg cursor-pointer transition-colors shadow-sm"
                >
                  關閉詳情 Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* High Resolution Lightbox Zoom Modal Overlay */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full bg-white border-4 border-red-955 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="relative aspect-[16/10] bg-slate-900">
                <img 
                  src={lightboxImage} 
                  alt="Landmark scenery" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1501446529957-6226bd447c46?auto=format&fit=crop&q=80&w=600';
                  }}
                />
                
                {/* Image Credit and Header Overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 text-left">
                  <span className="text-xs text-yellow-300 font-bold uppercase tracking-widest">
                    {selectedLandmark?.province}
                  </span>
                  <h3 className="text-2xl font-black text-white font-display mt-1">
                    {selectedLandmark?.name}
                  </h3>
                  <p className="text-xs text-slate-300 font-mono italic mt-0.5">
                    {selectedLandmark?.nameEn}
                  </p>
                </div>
                
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  className="absolute top-4 right-4 bg-black/60 hover:bg-black/85 text-white rounded-full p-2 cursor-pointer transition border border-white/10 flex items-center gap-1 text-xs font-bold"
                >
                  <span className="px-1">✕ 關閉大圖 Close</span>
                </button>
              </div>
              
              {/* Description & Fact Panel */}
              <div className="p-5 text-left space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium">
                  {selectedLandmark?.description}
                </p>
                <div className="bg-red-50/60 border border-red-100 rounded-2xl p-4">
                  <span className="text-xs uppercase font-bold text-red-700 flex items-center gap-1">
                    💡 探索歷史文化與趣聞 (Fun Fact)
                  </span>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-sans">
                    {selectedLandmark?.fact}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
