import React, { useState } from 'react';
import { User as UserType, getAdventurerTitle, STORE_ITEMS } from '../types';
import BadgeIcon from './BadgeIcon';
import { User, Lock, Shield, Check, AlertCircle, Save, Key, Camera, Upload, RotateCcw, Sparkles } from 'lucide-react';

interface ProfilePanelProps {
  currentUser: UserType;
  onProfileUpdate: (updatedUser: UserType) => void;
}

export default function ProfilePanel({ currentUser, onProfileUpdate }: ProfilePanelProps) {
  const titleInfo = getAdventurerTitle(currentUser.totalScore);
  const [realName, setRealName] = useState<string>(currentUser.realName);
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [avatar, setAvatar] = useState<string>(currentUser.avatar);
  const [dragActive, setDragActive] = useState<boolean>(false);
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isCustomAvatar = (url: string) => {
    return url && (url.startsWith('data:image/') || url.startsWith('http') || url.startsWith('/'));
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg("只能上傳圖片格式檔案 (*.jpg, *.png, *.webp, 等)！");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to resize image (e.g., max 160x160 px for optimal JSON storage)
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 160;
        const MAX_HEIGHT = 160;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          setAvatar(compressedBase64);
          setSuccessMsg(null);
          setErrorMsg(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleResetAvatar = () => {
    // Revert to a default Tailwind background color based on name length
    const defaultColors = ['bg-indigo-500', 'bg-red-500', 'bg-emerald-500', 'bg-sky-500', 'bg-purple-500'];
    const idx = realName.length % defaultColors.length;
    setAvatar(defaultColors[idx]);
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!realName.trim()) {
      setErrorMsg("真實姓名不能為空！");
      return;
    }

    const body: any = {};
    if (realName.trim() !== currentUser.realName) {
      body.realName = realName.trim();
    }

    if (password) {
      if (password !== confirmPassword) {
        setErrorMsg("兩次輸入的密碼不一致！");
        return;
      }
      body.password = password;
    }

    if (avatar !== currentUser.avatar) {
      body.avatar = avatar;
    }

    if (Object.keys(body).length === 0) {
      setErrorMsg("您尚未修改任何欄位！");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${window.location.origin}/api/users/${currentUser.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errText = await response.text();
        let errMessage = "更新設定失敗";
        try {
          const errData = JSON.parse(errText);
          errMessage = errData.error || errMessage;
        } catch (e) {}
        throw new Error(errMessage);
      }

      const dataText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(dataText);
      } catch (e) {}

      if (data.success && data.updatedUser) {
        onProfileUpdate(data.updatedUser);
        setSuccessMsg("個人帳號資訊更新成功！");
        setPassword('');
        setConfirmPassword('');
      } else {
        throw new Error("伺服器回傳格式不正確");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "更新失敗，請稍候重試。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border-4 border-slate-100 rounded-3xl p-6 shadow-xl max-w-2xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="p-3 bg-red-50 text-red-650 rounded-2xl shrink-0">
          <User className="w-6 h-6 text-red-650" />
        </div>
        <div className="text-left">
          <h2 className="text-xl font-display font-black text-slate-800">
            個人頁面
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            在此更新您的登入密碼以及冒險者真實中文姓名。
          </p>
        </div>
      </div>

      {/* Account Info Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl text-left border border-slate-100">
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">登入帳號 Username</span>
          <span className="text-sm font-mono font-bold text-slate-800">@{currentUser.username}</span>
        </div>
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">所屬小隊 Squad</span>
          <span className="text-sm font-bold text-red-700">{currentUser.team}</span>
        </div>
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">系統角色 Role</span>
          <span className="text-sm font-bold text-slate-800 flex items-center gap-1">
            <Shield className={`w-3.5 h-3.5 ${
              currentUser.role === 'admin' 
                ? 'text-red-500' 
                : currentUser.role === 'captain'
                  ? 'text-amber-500'
                  : 'text-slate-400'
            }`} />
            {currentUser.role === 'admin' 
              ? '大隊長 Leader' 
              : currentUser.role === 'captain'
                ? '小隊長 Captain'
                : '隊員 Member'}
          </span>
        </div>
      </div>

      {/* Current Title & Badge Banner */}
      <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-2 border-orange-200 p-5 rounded-3xl flex flex-col gap-4 text-left shadow-sm">
        <div className="flex items-center gap-4">
          <BadgeIcon rank={titleInfo.rank} size="lg" />
          <div className="space-y-1 flex-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">當前解鎖徽章與稱號</span>
            <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 animate-[spin_6s_linear_infinite]" />
              {titleInfo.title}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {titleInfo.description}
            </p>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-4 pt-4 border-t border-amber-200/50 mt-1">
          {/* Score Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                晉升下一稱號所需楓葉幣
              </span>
              <span className="text-xs font-mono font-black text-amber-600">
                {currentUser.totalScore} <span className="text-slate-400 font-sans font-medium">/ {titleInfo.rank === 12 ? 'MAX' : titleInfo.max + 1}</span>
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-200/80 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000 shadow-sm"
                style={{ width: `${Math.min(100, Math.max(0, titleInfo.progress))}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-500 text-right font-medium">
              {titleInfo.rank === 12 ? '已達到最高稱號等級！' : `還差 ${titleInfo.max + 1 - currentUser.totalScore} 楓葉幣即可解鎖新稱號`}
            </p>
          </div>

          {/* FYC Progress */}
          {(() => {
            const currentFyc = currentUser.fycAllTime ?? currentUser.fyc ?? 0;
            const targetFyc = 180000;
            const isFycMax = currentFyc >= targetFyc;
            
            const fycProgressPercentage = isFycMax 
              ? 100 
              : (currentFyc / targetFyc) * 100;
            
            return (
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    下階段 FYC 門檻
                  </span>
                  <span className="text-xs font-mono font-black text-rose-600">
                    {currentFyc.toLocaleString()} <span className="text-slate-400 font-sans font-medium">/ {targetFyc.toLocaleString()}</span>
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-200/80 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-rose-400 to-red-500 rounded-full transition-all duration-1000 shadow-sm relative"
                    style={{ width: `${fycProgressPercentage}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-500 text-right font-medium">
                  {isFycMax ? '已達成下階段 FYC 門檻！' : `距離下階段還差 ${(targetFyc - currentFyc).toLocaleString()} FYC`}
                </p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Items Area */}
      <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-2 border-amber-200 p-5 rounded-3xl flex flex-col gap-4 text-left shadow-sm">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">裝備庫 Items Area</span>
          <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
            已擁有裝備
          </h3>
        </div>
        <div className="flex flex-wrap gap-4">
          {currentUser.items && currentUser.items.length > 0 ? (
            currentUser.items.map(itemId => {
              const item = STORE_ITEMS.find(i => i.id === itemId);
              if (!item) return null;
              return (
                <div key={item.id} className="flex flex-col items-center gap-2 p-3 bg-white border border-amber-100 rounded-xl shadow-sm w-28 text-center relative group">
                  <div className="w-12 h-12 flex items-center justify-center text-2xl bg-amber-50 rounded-full border border-amber-200 shadow-inner group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <span className="text-xs font-black text-slate-800">{item.name}</span>
                </div>
              );
            })
          ) : (
            <div className="text-xs text-slate-500 font-medium py-2">
              您尚未擁有任何裝備。可前往楓葉商城使用個人楓葉幣兌換！
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-4 py-3 rounded-xl font-bold flex items-center gap-2 text-left animate-fade-in">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-3 rounded-xl font-bold flex items-center gap-2 text-left animate-pulse">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-5 text-left">
        {/* Avatar Upload Field */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider block">
            個人大頭照 Profile Photo
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-slate-100/50 transition relative">
            
            {/* Visual Preview */}
            <div className="relative shrink-0 select-none group">
              {isCustomAvatar(avatar) ? (
                <img 
                  src={avatar} 
                  alt="Avatar Preview" 
                  className="w-24 h-24 rounded-2xl object-cover shadow-md border-2 border-white ring-4 ring-slate-100"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-md border-2 border-white ring-4 ring-slate-100 ${avatar || 'bg-indigo-500'}`}>
                  {realName.slice(0, 1) || '👤'}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-red-650 text-white p-1.5 rounded-xl shadow-md border border-white">
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Upload action area */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`flex-1 flex flex-col items-center sm:items-start text-center sm:text-left gap-2 py-2 px-1 w-full rounded-xl transition ${
                dragActive ? 'bg-red-50 border-red-200' : ''
              }`}
            >
              <h4 className="text-xs font-bold text-slate-800">
                {dragActive ? "放開滑鼠即可載入圖片！" : "拖曳圖片至此處，或點擊按鈕選擇"}
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                支援 JPG、PNG 格式，系統將自動進行壓縮調整，以確保大螢幕載入流暢。
              </p>
              
              <div className="flex flex-wrap gap-2 mt-1">
                {/* Hidden input */}
                <input 
                  type="file" 
                  id="avatar-file-input" 
                  accept="image/*" 
                  onChange={(e) => { if (e.target.files?.[0]) handleImageFile(e.target.files[0]); }} 
                  className="hidden" 
                />
                
                {/* Custom File trigger */}
                <label 
                  htmlFor="avatar-file-input"
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1 shadow-sm transition active:scale-95 select-none"
                >
                  <Upload className="w-3 h-3" />
                  上傳大頭照 Upload
                </label>

                {/* Reset button */}
                {isCustomAvatar(avatar) && (
                  <button
                    type="button"
                    onClick={handleResetAvatar}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-lg flex items-center gap-1 transition active:scale-95 cursor-pointer select-none"
                  >
                    <RotateCcw className="w-3 h-3 text-slate-500" />
                    回復預設
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Name Fields */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider block">
            真實中文姓名 Real Name
          </label>
          <input
            id="profile-realname"
            type="text"
            required
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
            placeholder="請輸入您的真實姓名，例如: 林志強"
            className="w-full bg-slate-50 border border-slate-150 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-red-500 transition-all font-medium"
          />
        </div>

        {/* Password Fields */}
        <div className="border-t border-slate-100 pt-5 space-y-4">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Key className="w-4 h-4 text-red-600" />
            <h3 className="text-xs font-black uppercase tracking-wider font-mono text-slate-700">重設登入密碼 Reset Password</h3>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            若不需更改密碼，請將下方密碼欄位留空即可。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider block">
                新密碼 New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  id="profile-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="請輸入新設定的密碼"
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-red-500 transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider block">
                確認新密碼 Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  id="profile-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="請再次輸入新密碼"
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-red-500 transition-all font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="border-t border-slate-100 pt-5 flex justify-end">
          <button
            id="btn-profile-submit"
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold font-display tracking-wider uppercase transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                儲存設定變更 SAVE CHANGES
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
