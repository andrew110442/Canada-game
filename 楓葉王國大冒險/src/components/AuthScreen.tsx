import React, { useState } from 'react';
import { User, SQUADS } from '../types';
import { Compass, ArrowRight, UserPlus, Flame, Shield, Key, UserCheck } from 'lucide-react';

interface AuthScreenProps {
  existingUsers: User[];
  onLogin: (username: string, password: string) => Promise<void>;
  onRegister: (username: string, password: string, realName: string, avatar: string, team: string, role: 'captain' | 'user') => Promise<void>;
}

const AVATAR_COLORS = [
  "bg-red-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-rose-500",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-teal-500"
];

export default function AuthScreen({ existingUsers, onLogin, onRegister }: AuthScreenProps) {
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(existingUsers.length === 0);
  const [selectedAvatar] = useState<string>(() => {
    const randomIndex = Math.floor(Math.random() * AVATAR_COLORS.length);
    return AVATAR_COLORS[randomIndex];
  });
  
  // Login / Register fields
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [realName, setRealName] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('🛡️ 北境守衛軍');
  const [selectedRole, setSelectedRole] = useState<'captain' | 'user'>('user');
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg("請完整填寫帳號與密碼！");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onLogin(username.trim().toLowerCase(), password.trim());
    } catch (err: any) {
      setErrorMsg(err.message || "登入失敗，請確認帳號或密碼是否正確。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !realName.trim()) {
      setErrorMsg("請完整填寫帳號、密碼與真實姓名！");
      return;
    }

    // Basic regex check to prevent spaces or weird symbols in username
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setErrorMsg("帳號僅限英文字母、數字與底線！");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onRegister(username.trim().toLowerCase(), password.trim(), realName.trim(), selectedAvatar, selectedTeam, selectedRole);
    } catch (err: any) {
      setErrorMsg(err.message || "註冊失敗，請換個帳號試試看。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Absolute Decorative Visual Glow Layers */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Floating Sparkles decorative objects */}
      <div className="absolute top-12 left-12 opacity-10 animate-pulse pointer-events-none">
        <Compass className="w-16 h-16 text-red-500 animate-[spin_40s_linear_infinite]" />
      </div>

      <div className="w-full max-w-md z-10 space-y-6">
        {/* App Branding Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 bg-red-50 border border-red-200 rounded-3xl relative shadow-md">
            <span className="text-5xl animate-bounce">🍁</span>
            <div className="absolute -top-1 -right-1 bg-yellow-400 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider font-mono shadow flex items-center gap-0.5">
              <Flame className="w-2.5 h-2.5 fill-slate-950 animate-pulse" />
              HOT
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-black text-slate-800 tracking-tight">
              楓葉王國大冒險
            </h1>
            <p className="text-xs font-mono uppercase tracking-widest text-red-600 font-bold">
              加拿大探險之旅
            </p>
          </div>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">
            登入系統，記錄業務與小隊活動，累積個人與小隊楓葉幣！
          </p>
        </div>

        {/* Central Auth Card container */}
        <div className="bg-white border-4 border-slate-100 rounded-3xl p-6 shadow-2xl relative">
          {/* Top selection modes */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 mb-6 border border-slate-200">
            <button
              id="btn-mode-select-existing"
              onClick={() => {
                setIsRegisterMode(false);
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                !isRegisterMode 
                  ? 'bg-red-650 text-white shadow shadow-red-700/20 font-black' 
                  : 'text-slate-500 hover:text-slate-850'
              }`}
            >
              帳號密碼登入
            </button>
            <button
              id="btn-mode-register-new"
              onClick={() => {
                setIsRegisterMode(true);
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                isRegisterMode 
                  ? 'bg-red-650 text-white shadow shadow-red-700/20 font-black' 
                  : 'text-slate-500 hover:text-slate-850'
              }`}
            >
              註冊新探險角色
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2.5 rounded-xl text-left font-bold animate-pulse">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Form Content */}
          {!isRegisterMode ? (
            /* USERNAME & PASSWORD LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider block">
                  使用者帳號 Account Name
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400 font-bold text-xs font-mono">@</span>
                  <input
                    id="login-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="請輸入註冊帳號 (例如: strong_chiang)"
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 transition font-mono font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider block flex justify-between">
                  <span>登入密碼 Password</span>
                  <span className="text-[10px] text-slate-400 lowercase">預設密碼為 123</span>
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="請輸入密碼"
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 transition font-mono"
                  />
                </div>
              </div>

              <button
                id="btn-login-submit"
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 bg-gradient-to-r from-red-650 to-red-600 hover:from-red-600 hover:to-red-500 text-white rounded-xl text-xs font-bold font-display tracking-widest uppercase transition-all shadow-md shadow-red-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>驗證並進入探險儀表板 VERIFY & ENTER</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider block">
                  1. 設定使用者帳號 Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400 font-bold text-xs font-mono">@</span>
                  <input
                    id="input-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="限英數字及底線，例如: strong_jack"
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 transition font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider block">
                  2. 設定登入密碼 Password
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-3.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    id="input-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="請設定登入密碼 (可輸入 123)"
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 transition font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider block">
                  3. 填寫真實中文姓名 Real Name
                </label>
                <input
                  id="input-realname"
                  type="text"
                  required
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  placeholder="例如: 張家豪 (阿豪)"
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 transition"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider block">
                  4. 選擇所屬小隊 Squad Team
                </label>
                <select
                  id="select-squad"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-red-500 transition font-sans font-bold cursor-pointer"
                >
                  {SQUADS.map((squad) => (
                    <option key={squad} value={squad}>
                      {squad}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider block">
                  5. 選擇冒險角色 Adventure Role
                </label>
                <select
                  id="select-role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as 'captain' | 'user')}
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-red-500 transition font-sans font-bold cursor-pointer"
                >
                  <option value="user">隊員 (Member)</option>
                  <option value="captain">小隊長 (Captain)</option>
                </select>
              </div>

              <button
                id="btn-register-submit"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-red-650 to-red-600 hover:from-red-600 hover:to-red-500 text-white rounded-xl text-xs font-bold font-display tracking-widest uppercase transition-all shadow-md shadow-red-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    創建角色並登入 START ADVENTURE
                  </>
                )}
              </button>
            </form>
          )}
        </div>



        {/* Footnote statistics / fun detail */}
        <div className="flex justify-around text-center text-slate-400 text-xs font-mono font-bold">
          <div className="space-y-0.5">
            <span className="text-slate-700 font-black block">{existingUsers.length}</span>
            <span>已註冊隊員</span>
          </div>
          <div className="w-px bg-slate-200" />
          <div className="space-y-0.5">
            <span className="text-slate-700 font-black block">11+</span>
            <span>核心業務指標</span>
          </div>
          <div className="w-px bg-slate-200" />
          <div className="space-y-0.5">
            <span className="text-slate-700 font-black block">10 大</span>
            <span>解鎖加國地標</span>
          </div>
        </div>
      </div>
    </div>
  );
}
