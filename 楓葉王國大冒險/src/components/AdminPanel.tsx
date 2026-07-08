import React, { useState } from 'react';
import { User, ActivityReport, SQUADS, ACTIVITY_RULES, STORE_ITEMS } from '../types';
import { 
  Users, 
  Activity, 
  Shield, 
  Edit3, 
  Trash2, 
  Plus, 
  Check, 
  X, 
  RefreshCw, 
  Search, 
  Filter, 
  UserPlus, 
  Award, 
  MapPin, 
  TrendingUp, 
  Calendar,
  AlertTriangle,
  Megaphone,
  Save,
  Download,
  UploadCloud,
  Clock,
  Database
} from 'lucide-react';

interface AdminPanelProps {
  users: User[];
  activities: ActivityReport[];
  currentUserId: string;
  onRefreshData: () => Promise<void>;
  onResetDatabase: () => Promise<void>;
}

export default function AdminPanel({ 
  users, 
  activities, 
  currentUserId, 
  onRefreshData,
  onResetDatabase 
}: AdminPanelProps) {
  const currentUser = users.find(u => u.id === currentUserId);
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'activities' | 'system' | 'shouts' | 'redemptions'>('users');
  
  // Shoutbox Management States
  const [shouts, setShouts] = useState<any[]>([]);
  const [shoutSearch, setShoutSearch] = useState('');
  const [isShoutsLoading, setIsShoutsLoading] = useState(false);

  // Mall Redemptions State
  const [teamRedemptions, setTeamRedemptions] = useState<any[]>([]);
  const [itemRedemptions, setItemRedemptions] = useState<any[]>([]);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isPurchasingItem, setIsPurchasingItem] = useState(false);
  const [coffeeQty, setCoffeeQty] = useState(1);
  const [breakfastQty, setBreakfastQty] = useState(1);
  const [isAuroraFiring, setIsAuroraFiring] = useState(false);

  const handleAuroraTower = () => {
    const userCoins = currentUser?.mapleCoins ?? 0;
    
    if (userCoins < 200) {
      triggerMessage('error', '個人楓葉幣不足 200，無法使用極光電波塔！');
      return;
    }

    showConfirm(
      "發射極光電波",
      "確定要消耗 200 楓葉幣使用「極光電波塔」嗎？\n這將隨機影響一名玩家的楓葉幣數量！",
      async () => {
        setIsAuroraFiring(true);
        try {
          const eligibleUsers = users.filter(u => u.role !== 'admin' && u.id !== currentUser?.id);
          if (eligibleUsers.length === 0) {
            triggerMessage('error', '沒有符合條件的玩家可發送電波！');
            return;
          }

          const randomUser = eligibleUsers[Math.floor(Math.random() * eligibleUsers.length)];

          const effects = [100, -70, -30];
          const effectAmount = effects[Math.floor(Math.random() * effects.length)];
          
          const targetCoins = randomUser.mapleCoins !== undefined ? randomUser.mapleCoins : 0;
          
          const newTargetCoins = Math.max(0, targetCoins + effectAmount);

          const currentUserCoins = Math.max(0, userCoins - 200);

          const res1 = await fetch(`${window.location.origin}/api/admin/users/${currentUser?.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              mapleCoins: currentUserCoins
            })
          });

          if (!res1.ok) {
            throw new Error('電波發送失敗，更新使用者資料發生錯誤。');
          }

          const res2 = await fetch(`${window.location.origin}/api/admin/users/${randomUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              mapleCoins: newTargetCoins
            })
          });

          if (!res2.ok) {
            throw new Error('電波發送失敗，更新玩家資料發生錯誤。');
          }

          let effectDesc = effectAmount > 0 ? `隨機獲得了 ${effectAmount} 楓葉幣！🎉` : `隨機失去了 ${Math.abs(effectAmount)} 楓葉幣...🥶`;
          
          await fetch(`${window.location.origin}/api/shouts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser?.id,
              text: `[極光電波塔] 廣播：神秘電波擊中了【${randomUser.realName}】，造成了效果：${effectDesc}`
            })
          });

          triggerMessage('success', `極光電波發射成功！擊中了 ${randomUser.realName}。`);
          await onRefreshData();
          if (activeSubTab === 'shouts') {
            fetchAdminShouts();
          }
        } catch (err: any) {
          triggerMessage('error', err.message || '發送發生錯誤');
        } finally {
          setIsAuroraFiring(false);
        }
      }
    );
  };

  const fetchRedemptions = async () => {
    try {
      const res = await fetch(`${window.location.origin}/api/redemptions`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setTeamRedemptions(data);
          setItemRedemptions([]);
        } else {
          setTeamRedemptions(data.teamRedemptions || []);
          setItemRedemptions(data.itemRedemptions || []);
        }
      }
    } catch (err) {
      console.warn("Failed to load redemptions:", err);
    }
  };

  const handleRevertItemPurchase = async (id: string) => {
    showConfirm("退回個人道具", "確定要退回此道具嗎？退回後所有玩家因購買之花費楓葉幣會一併退回，對應道具造成之行動回報加成效果也會一併回覆原狀。", async () => {
      try {
        const res = await fetch(`${window.location.origin}/api/admin/revert-item-purchase`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ redemptionId: id })
        });
        if (res.ok) {
          const data = await res.json();
          triggerMessage("success", data.message || "成功退回道具");
          await onRefreshData();
          fetchRedemptions();
        } else {
          triggerMessage("error", "退回失敗");
        }
      } catch (e) { triggerMessage("error", "發生錯誤"); }
    });
  };

  const handleRevertTeamPurchase = async (id: string) => {
    showConfirm("退回小隊道具", "確定要退回此小隊道具嗎？退回後小隊花費將退還給所有隊員。", async () => {
      try {
        const res = await fetch(`${window.location.origin}/api/admin/revert-team-purchase`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ redemptionId: id })
        });
        if (res.ok) {
          const data = await res.json();
          triggerMessage("success", data.message || "成功退回小隊道具");
          await onRefreshData();
          fetchRedemptions();
        } else {
          triggerMessage("error", "退回失敗");
        }
      } catch (e) { triggerMessage("error", "發生錯誤"); }
    });
  };

  const handleRedeem = async (cost: number, reward: string) => {
    if (!currentUser) return;
    
    const squadMembers = users.filter(u => u.team === currentUser.team);
    const squadMembersCount = squadMembers.length || 1;
    const costPerMember = Math.round(cost / squadMembersCount);

    const memberWithInsufficientFunds = squadMembers.find(u => {
      const currentCoins = u.mapleCoins !== undefined ? u.mapleCoins : u.totalScore;
      return currentCoins < costPerMember;
    });

    if (memberWithInsufficientFunds) {
      showAlert('兌換失敗', `小隊成員 ${memberWithInsufficientFunds.realName} 楓葉幣不足，無法平均扣除 ${costPerMember} 幣，禁止兌換。`);
      return;
    }

    showConfirm(
      "確認兌換小隊公用獎勵",
      `【⚠️ 扣除小隊與個人公款 ⚠️】確定要花費 ${cost} 楓葉幣兌換「${reward}」嗎？此操作將從小隊所有成員的「個人楓葉幣」中平均扣除（每人約扣除 ${costPerMember} 幣），並同步反映在「小隊楓葉幣」總額。兌換後將會發送通知。`,
      async () => {
        setIsRedeeming(true);
        try {
          const res = await fetch(`${window.location.origin}/api/redemptions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, cost, reward })
          });
          
          if (res.ok) {
            triggerMessage('success', `成功兌換 ${reward}！已扣除小隊公款。`);
            fetchRedemptions();
            // Optional: send a shout to notify admin
            await fetch(`${window.location.origin}/api/shouts`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: currentUser.id,
                text: `[小隊公帳兌換通知] 我剛剛動用了小隊公用資金 ${cost} 楓葉幣兌換了「${reward}」！`
              })
            });
            await onRefreshData();
          } else {
            const data = await res.json();
            throw new Error(data.error || '兌換失敗');
          }
        } catch (err: any) {
          triggerMessage('error', err.message || '兌換發生錯誤');
        } finally {
          setIsRedeeming(false);
        }
      }
    );
  };

  const handlePurchaseItem = async (itemId: string, name: string, cost: number) => {
    if (!currentUser) return;
    showConfirm(
      "兌換個人專屬道具",
      `【🔒 扣除個人私款 🔒】確定要花費 ${cost} 個人楓葉幣兌換個人道具「${name}」嗎？本操作絕對是獨立的安全隔離機制，只會扣除您個人的個人楓葉幣，絕對不會扣除您小隊的小隊楓葉幣！`,
      async () => {
        setIsPurchasingItem(true);
        try {
          const res = await fetch(`${window.location.origin}/api/purchase-item`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, itemId })
          });
          
          if (res.ok) {
            triggerMessage('success', `成功兌換 ${name}！已從您的個人楓葉幣扣除。`);
            await onRefreshData();
          } else {
            const data = await res.json();
            throw new Error(data.error || '兌換失敗');
          }
        } catch (err: any) {
          triggerMessage('error', err.message || '兌換發生錯誤');
        } finally {
          setIsPurchasingItem(false);
        }
      }
    );
  };

  const fetchAdminShouts = async () => {
    setIsShoutsLoading(true);
    try {
      const res = await fetch(`${window.location.origin}/api/shouts`);
      if (res.ok) {
        const text = await res.text();
        let data: any[] = [];
        try {
          data = JSON.parse(text);
        } catch (e) {
          return;
        }
        if (!Array.isArray(data)) return;

        // Newest first
        const sorted = data.sort((a: any, b: any) => {
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
      console.warn("Failed to load admin shouts:", err);
    } finally {
      setIsShoutsLoading(false);
    }
  };

  // Backup States
  const [backups, setBackups] = useState<any[]>([]);
  const [isBackupsLoading, setIsBackupsLoading] = useState(false);

  const fetchBackups = async () => {
    setIsBackupsLoading(true);
    try {
      const res = await fetch(`${window.location.origin}/api/admin/backups`);
      if (res.ok) {
        const data = await res.json();
        setBackups(data);
      }
    } catch (err) {
      console.warn("Failed to load backups:", err);
    } finally {
      setIsBackupsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      const response = await fetch(`${window.location.origin}/api/admin/backups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId })
      });
      if (response.ok) {
        const data = await response.json();
        triggerMessage('success', data.message || '備份建立成功！');
        fetchBackups();
      } else {
        const errData = await response.json();
        throw new Error(errData.error || '建立備份失敗');
      }
    } catch (err: any) {
      triggerMessage('error', err.message || '連線錯誤');
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    showConfirm(
      "確認還原備份？",
      `警告：此操作將會覆蓋當前所有資料，還原至備份檔 ${filename} 的狀態！\n還原後所有當前的遊戲進度與修改都會遺失，確定要還原嗎？`,
      async () => {
        try {
          const response = await fetch(`${window.location.origin}/api/admin/backups/restore`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUserId, filename })
          });
          if (response.ok) {
            const data = await response.json();
            triggerMessage('success', data.message || '備份還原成功！');
            await onRefreshData();
          } else {
            const errData = await response.json();
            throw new Error(errData.error || '還原備份失敗');
          }
        } catch (err: any) {
          triggerMessage('error', err.message || '連線錯誤');
        }
      }
    );
  };

  const handleDeleteBackup = async (filename: string) => {
    showConfirm(
      "確認刪除備份？",
      `確定要刪除備份檔 ${filename} 嗎？刪除後無法復原。`,
      async () => {
        try {
          const response = await fetch(`${window.location.origin}/api/admin/backups/${filename}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUserId })
          });
          if (response.ok) {
            triggerMessage('success', '備份已成功刪除！');
            fetchBackups();
          } else {
            const errData = await response.json();
            throw new Error(errData.error || '刪除備份失敗');
          }
        } catch (err: any) {
          triggerMessage('error', err.message || '連線錯誤');
        }
      }
    );
  };

  React.useEffect(() => {
    fetchRedemptions();
  }, []);

  React.useEffect(() => {
    if (activeSubTab === 'shouts') {
      fetchAdminShouts();
    } else if (activeSubTab === 'system') {
      fetchBackups();
    }
  }, [activeSubTab]);

  const handleDeleteShout = async (shoutId: string) => {
    showConfirm(
      "刪除嗆聲留言",
      "確定要刪除這則嗆聲留言嗎？這個操作無法復原。",
      async () => {
        try {
          const res = await fetch(`${window.location.origin}/api/shouts/${shoutId}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            triggerMessage('success', '已成功刪除該嗆聲留言！');
            fetchAdminShouts();
          } else {
            const errText = await res.text();
            let errMessage = '刪除失敗';
            try {
              const errData = JSON.parse(errText);
              errMessage = errData.error || errMessage;
            } catch (e) {}
            throw new Error(errMessage);
          }
        } catch (err: any) {
          triggerMessage('error', err.message || '刪除失敗');
        }
      }
    );
  };

  // User Management States
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    realName: string;
    team: string;
    totalScore: number;
    mapleCoins: number;
    fyc?: number;
    role: 'admin' | 'captain' | 'user';
    avatar: string;
    password?: string;
  }>({
    realName: '',
    team: '🛡️ 北境守衛軍',
    totalScore: 0,
    mapleCoins: 0,
    fyc: 0,
    role: 'user',
    avatar: 'bg-indigo-500',
    password: ''
  });

  // Create User States
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    realName: '',
    team: '🛡️ 北境守衛軍',
    totalScore: 0,
    mapleCoins: 0,
    role: 'user' as 'admin' | 'captain' | 'user',
    avatar: 'bg-red-500'
  });

  // Filters
  const [userSearch, setUserSearch] = useState('');
  const [activitySearch, setActivitySearch] = useState('');
  const [selectedActivityType, setSelectedActivityType] = useState<string>('all');
  const [selectedSquadFilter, setSelectedSquadFilter] = useState<string>('all');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const triggerMessage = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => {
      setActionMessage(null);
    }, 4000);
  };

  // Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    isAlert?: boolean;
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

  const showAlert = (title: string, message: string) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      isAlert: true,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleStartEdit = (user: User) => {
    setEditingUserId(user.id);
    setEditForm({
      realName: user.realName,
      team: user.team || '🛡️ 北境守衛軍',
      totalScore: user.totalScore,
      mapleCoins: user.mapleCoins ?? user.totalScore,
      fyc: user.fyc || 0,
      role: user.role,
      avatar: user.avatar,
      password: ''
    });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
  };

  const handleSaveUser = async (userId: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${window.location.origin}/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        const text = await response.text();
        let errMessage = '更新失敗';
        try {
          const data = JSON.parse(text);
          errMessage = data.error || errMessage;
        } catch (e) {}
        throw new Error(errMessage);
      }

      triggerMessage('success', '隊員資料更新成功！');
      setEditingUserId(null);
      await onRefreshData();
    } catch (err: any) {
      triggerMessage('error', err.message || '更新失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.id === currentUserId) {
      triggerMessage('error', '您不能刪除自己目前的管理員帳號！');
      return;
    }
    const isAndrew = user.username.toLowerCase() === 'andrew110442' || user.username.toLowerCase() === 'andrew';
    if (isAndrew) {
      triggerMessage('error', '不允許刪除主管理員帳號！');
      return;
    }

    showConfirm(
      "刪除隊員帳號",
      `確定要刪除隊員「${user.realName}」嗎？\n這將會同時清除他所有的活動回報紀錄，且此操作不可逆！`,
      async () => {
        try {
          const response = await fetch(`${window.location.origin}/api/admin/users/${user.id}`, {
            method: 'DELETE'
          });

          if (!response.ok) {
            const text = await response.text();
            let errMessage = '刪除失敗';
            try {
              const data = JSON.parse(text);
              errMessage = data.error || errMessage;
            } catch (e) {}
            throw new Error(errMessage);
          }

          triggerMessage('success', '隊員帳號及相關活動記錄已成功刪除！');
          await onRefreshData();
        } catch (err: any) {
          triggerMessage('error', err.message || '刪除失敗');
        }
      }
    );
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.username.trim() || !createForm.realName.trim()) {
      triggerMessage('error', '請填寫完整帳號與真實姓名！');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${window.location.origin}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          username: createForm.username.trim()
        })
      });

      if (!response.ok) {
        const text = await response.text();
        let errMessage = '新增失敗';
        try {
          const data = JSON.parse(text);
          errMessage = data.error || errMessage;
        } catch (e) {}
        throw new Error(errMessage);
      }

      triggerMessage('success', `手動新增隊員 ${createForm.realName} 成功！`);
      setCreateForm({
        username: '',
        password: '',
        realName: '',
        team: '🛡️ 北境守衛軍',
        totalScore: 0,
        mapleCoins: 0,
        role: 'user',
        avatar: 'bg-indigo-500'
      });
      setShowCreateForm(false);
      await onRefreshData();
    } catch (err: any) {
      triggerMessage('error', err.message || '新增失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditActivity = async (act: ActivityReport) => {
    if (act.type !== '受理FYC') {
      triggerMessage('error', '只有「受理FYC」類型的回報可以修改數值');
      return;
    }
    
    const newFycStr = prompt(`請輸入新的 FYC 數值 (目前為: ${act.count})`, act.count.toString());
    if (newFycStr === null) return; // User cancelled
    
    // Remove commas, spaces, etc
    const cleanedStr = newFycStr.replace(/,/g, '').trim();
    const newFyc = parseInt(cleanedStr, 10);
    if (isNaN(newFyc) || newFyc < 0) {
      triggerMessage('error', '請輸入有效的正整數');
      return;
    }
    
    try {
      const response = await fetch(`${window.location.origin}/api/activities/${act.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ count: newFyc })
      });

      if (!response.ok) {
        throw new Error('修改回報記錄失敗');
      }

      triggerMessage('success', '已成功修改 FYC 數值！');
      await onRefreshData();
    } catch (err: any) {
      triggerMessage('error', err.message || '修改失敗');
    }
  };

  const handleDeleteActivity = async (act: ActivityReport) => {
    const pointsDeduction = act.type === '受理FYC' ? `${act.count} FYC` : `${act.points} 楓葉幣`;
    showConfirm(
      "刪除回報記錄",
      `確定要刪除並收回「${act.realName}」的此筆「${act.type}」回報記錄嗎？\n這將會即時扣除該隊員對應的 ${pointsDeduction}。`,
      async () => {
        try {
          const response = await fetch(`${window.location.origin}/api/activities/${act.id}`, {
            method: 'DELETE'
          });

          if (!response.ok) {
            throw new Error('刪除回報記錄失敗');
          }

          triggerMessage('success', '已成功刪除此回報記錄，分數已扣回！');
          await onRefreshData();
        } catch (err: any) {
          triggerMessage('error', err.message || '刪除失敗');
        }
      }
    );
  };

  const isCaptain = currentUser?.role === 'captain';
  const captainTeam = currentUser?.team;

  const squadUsersForMall = users.filter(u => u.team === currentUser?.team);
  const squadTotalScoreForMall = squadUsersForMall.reduce((sum, u) => sum + (u.mapleCoins !== undefined ? u.mapleCoins : u.totalScore), 0);
  const squadAvailableScore = squadTotalScoreForMall; // Spent score is directly deducted from personal mapleCoins

  // Filter users
  const filteredUsers = users.filter(u => {
    if (isCaptain && u.team !== captainTeam) {
      return false;
    }
    const query = userSearch.toLowerCase();
    const matchSearch = u.realName.toLowerCase().includes(query) || u.username.toLowerCase().includes(query);
    const matchSquad = selectedSquadFilter === 'all' || u.team === selectedSquadFilter;
    return matchSearch && matchSquad;
  });

  // Filter activities
  const filteredActivities = activities.filter(act => {
    const query = activitySearch.toLowerCase();
    const matchSearch = 
      act.realName.toLowerCase().includes(query) || 
      (act.note && act.note.toLowerCase().includes(query)) ||
      act.username.toLowerCase().includes(query);
    const matchType = selectedActivityType === 'all' || act.type === selectedActivityType;
    return matchSearch && matchType;
  });

  const AVATAR_COLORS = [
    "bg-red-500", "bg-amber-500", "bg-emerald-500", "bg-sky-500", 
    "bg-rose-500", "bg-indigo-500", "bg-purple-500", "bg-teal-500"
  ];

  return (
    <div className="bg-white border-4 border-slate-100 rounded-3xl p-6 shadow-xl text-left space-y-6">
      
      {/* Tab Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-red-600 font-bold uppercase tracking-widest bg-red-50 px-2.5 py-1 rounded-full border border-red-100 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              楓葉商城 Maple Leaf Mall
            </span>
          </div>
          <h2 className="text-2xl font-display font-black text-slate-800 mt-2">
            楓葉商城
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {currentUser?.role === 'user'
              ? `您是「${currentUser?.team}」的隊員 ${currentUser?.realName}。您可以使用個人楓葉幣兌換道具。`
              : currentUser?.role === 'captain' 
                ? `您是「${currentUser?.team}」的小隊長 ${currentUser?.realName}。您可以使用小隊金幣兌換獎勵及道具。`
                : `您是大隊長 ${currentUser?.realName || 'Andrew'}。您可以使用金幣兌換，並管理下方系統。`
            }
          </p>
        </div>
        
        {/* Actions bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              await onRefreshData();
              fetchRedemptions();
              triggerMessage('success', '資料同步重新整理成功！');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            重新整理 Sync
          </button>
        </div>
      </div>

      {/* Account Info Panel for Captains & Admins to separate personal vs. squad funds */}
      {(currentUser?.role === 'captain' || currentUser?.role === 'admin') && (
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-700 shadow-lg mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-amber-400" />
            <h4 className="text-sm font-black tracking-wider text-amber-400">
              【小隊長 / 大隊長 專用】楓葉幣雙帳戶看板
            </h4>
          </div>
          <p className="text-[11px] text-slate-300 mb-4 leading-relaxed">
            親愛的管理幹部，為避免您購買個人道具時誤花到隊員共同累積的「小隊公款」，系統已將您的個人與小隊資產進行雙軌制隔離。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800 border border-slate-700/60 p-4 rounded-xl flex items-center justify-between">
              <div className="text-left space-y-1">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest block">💳 個人楓葉幣</span>
                <span className="text-[9px] text-slate-400 block font-bold">適用對象：僅能購買下方「個人道具專區」</span>
                <div className="text-xl font-black text-white font-mono mt-1">
                  {(currentUser?.mapleCoins ?? 0).toLocaleString()} <span className="text-xs text-slate-400">🍁</span>
                </div>
              </div>
              <div className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-[9px] font-bold">
                個人私款
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700/60 p-4 rounded-xl flex items-center justify-between">
              <div className="text-left space-y-1">
                <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-widest block">🏛️ 小隊楓葉幣</span>
                <span className="text-[9px] text-slate-400 block font-bold">適用對象：僅能兌換下方「邊境補給站」</span>
                <div className="text-xl font-black text-white font-mono mt-1">
                  {squadAvailableScore.toLocaleString()} <span className="text-xs text-slate-400">🍁</span>
                </div>
              </div>
              <div className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-[9px] font-bold">
                小隊公積金
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Items Section (All users) */}
      <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-5 sm:p-6 mb-8 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
          <div>
            <h3 className="text-lg font-black text-amber-700 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              冒險裝備庫
            </h3>
            <p className="text-xs text-amber-600/80 mt-1 font-bold">
              使用您的個人楓葉幣兌換增益道具，購買後即永久生效。
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-amber-200 shadow-sm flex flex-col items-end gap-1">
            <div className="flex items-baseline gap-1.5 justify-end">
              <div className="text-3xl font-black text-red-600 font-mono">
                {(currentUser?.mapleCoins ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 font-bold tracking-wider">個人楓葉幣 <span className="text-[10px]">🍁</span></div>
            </div>
            {(currentUser?.role === 'captain' || currentUser?.role === 'admin') && (
              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 block mt-0.5">
                🔒 僅扣除個人私款，絕不扣小隊公款
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {STORE_ITEMS.map(item => {
            const hasItem = currentUser?.items?.includes(item.id);
            const canAfford = (currentUser?.mapleCoins ?? 0) >= item.cost;
            return (
              <div key={item.id} className="flex flex-col gap-3 p-4 bg-white border border-amber-100 rounded-2xl shadow-sm transition-all relative overflow-hidden">
                {hasItem && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded-bl-xl shadow-sm">
                    已擁有
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-2xl shrink-0 border border-amber-100">
                    {item.icon}
                  </div>
                  <div className="text-left flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 w-full">
                      <div className="font-black text-slate-800 text-lg leading-tight">{item.name}</div>
                      <div className="flex items-baseline gap-0.5 text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md shrink-0 shadow-sm border border-amber-200/50">
                        <span className="text-lg font-black leading-none">{item.cost}</span>
                        <span className="text-[10px] font-black">楓葉幣</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">{item.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handlePurchaseItem(item.id, item.name, item.cost)}
                  disabled={hasItem || !canAfford || isPurchasingItem}
                  className={`w-full flex items-center justify-center p-2.5 font-black rounded-xl transition cursor-pointer disabled:pointer-events-none mt-auto ${
                    hasItem 
                      ? 'bg-slate-100 text-slate-400 border border-slate-200'
                      : canAfford
                        ? 'bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700'
                        : 'bg-red-50 text-red-400 border border-red-100'
                  }`}
                >
                  {hasItem ? '已購買' : canAfford ? `兌換 (${item.cost})` : '楓葉幣不足'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Aurora Tower Section (北境奇遇站) */}
      <div className="bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-5 sm:p-6 mb-8 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
          <div>
            <h3 className="text-lg font-black text-indigo-700 flex items-center gap-2">
              <span className="text-xl">🏔️</span>
              北境奇遇站
            </h3>
            <p className="text-xs text-indigo-600/80 mt-1 font-bold">
              向未知的雪原發射電波，可能會為某位探險者帶來驚喜...或驚嚇。
            </p>
          </div>
        </div>

        <div className="bg-white border border-indigo-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-4 transition-all hover:shadow-md">
          <div className="w-16 h-16 bg-indigo-50 rounded-xl flex items-center justify-center text-3xl shrink-0 border border-indigo-100">
            📡
          </div>
          <div className="text-left flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 w-full">
               <div className="font-black text-slate-800 text-lg leading-tight">極光電波塔</div>
               <div className="flex items-baseline gap-0.5 text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md shrink-0 shadow-sm border border-indigo-200/50">
                  <span className="text-lg font-black leading-none">200</span>
                  <span className="text-[10px] font-black">楓葉幣</span>
               </div>
            </div>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              使用後會隨機向一位玩家發送「神秘電波」。<br/>
              <span className="text-xs text-indigo-500 font-bold">效果：楓葉幣隨機增加或減少</span>
            </p>
          </div>
          <button
            onClick={handleAuroraTower}
            disabled={isAuroraFiring || ((currentUser?.mapleCoins ?? 0) < 200)}
            className={`w-full sm:w-auto shrink-0 flex items-center justify-center px-6 py-3 font-black text-sm rounded-xl transition cursor-pointer shadow-sm ${
              ((currentUser?.mapleCoins ?? 0) < 200)
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50'
            }`}
          >
            {isAuroraFiring ? '發送中...' : (((currentUser?.mapleCoins ?? 0) < 200) ? '楓葉幣不足' : '發射神秘電波')}
          </button>
        </div>
      </div>

      {/* Mall Redemption Section (Captains and Admins only) */}
      {(currentUser?.role === 'captain' || currentUser?.role === 'admin') && (
      <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-5 sm:p-6 mb-8 animate-fade-in shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
          <div>
            <h3 className="text-lg font-black text-red-700 flex items-center gap-2">
              <Award className="w-5 h-5" />
              邊境補給站
            </h3>
            <p className="text-xs text-red-600/80 mt-1 font-bold">
              您的所屬小隊：<span className="text-red-700 font-black">{currentUser?.team || '無'}</span>
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-red-200 shadow-sm flex flex-col items-end gap-1">
            <div className="flex items-baseline gap-1.5 justify-end">
              <div className="text-3xl font-black text-red-600 font-mono">
                {squadAvailableScore.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 font-bold tracking-wider">小隊楓葉幣 <span className="text-[10px]">🍁</span></div>
            </div>
            <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 block mt-0.5">
              👥 團隊公用資金：兌換將直接扣除小隊公帳
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-3 p-4 bg-white border border-red-100 rounded-2xl shadow-sm transition-all">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-start gap-1.5">
                    <span className="text-lg leading-tight">☕</span>
                    <div className="flex flex-col">
                      <div className="font-black text-slate-800 text-lg leading-tight">
                        極地暖心飲
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold mt-0.5">超商大杯咖啡</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCoffeeQty(Math.max(1, coffeeQty - 1))}
                  className="w-7 h-7 flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-full cursor-pointer font-black text-lg pb-0.5"
                >-</button>
                <span className="font-mono font-bold w-5 text-center">{coffeeQty}</span>
                <button 
                  onClick={() => setCoffeeQty(coffeeQty + 1)}
                  className="w-7 h-7 flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-full cursor-pointer font-black text-lg pb-0.5"
                >+</button>
              </div>
            </div>
            <button
              onClick={() => handleRedeem(1500 * coffeeQty, `極地暖心飲 x ${coffeeQty}`)}
              disabled={squadAvailableScore < 1500 * coffeeQty || isRedeeming}
              className="w-full flex items-center justify-center p-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-black text-base sm:text-lg rounded-xl transition cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              兌換 ({(1500 * coffeeQty).toLocaleString()})
            </button>
          </div>

          <div className="flex flex-col gap-3 p-4 bg-white border border-red-100 rounded-2xl shadow-sm transition-all">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-start gap-1.5">
                    <span className="text-lg leading-tight">🍳</span>
                    <div className="flex flex-col">
                      <div className="font-black text-slate-800 text-lg leading-tight">
                        探險補給券
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold mt-0.5">100元早餐</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setBreakfastQty(Math.max(1, breakfastQty - 1))}
                  className="w-7 h-7 flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-full cursor-pointer font-black text-lg pb-0.5"
                >-</button>
                <span className="font-mono font-bold w-5 text-center">{breakfastQty}</span>
                <button 
                  onClick={() => setBreakfastQty(breakfastQty + 1)}
                  className="w-7 h-7 flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-full cursor-pointer font-black text-lg pb-0.5"
                >+</button>
              </div>
            </div>
            <button
              onClick={() => handleRedeem(3000 * breakfastQty, `探險補給券 x ${breakfastQty}`)}
              disabled={squadAvailableScore < 3000 * breakfastQty || isRedeeming}
              className="w-full flex items-center justify-center p-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-black text-base sm:text-lg rounded-xl transition cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              兌換 ({(3000 * breakfastQty).toLocaleString()})
            </button>
          </div>
        </div>
      </div>
      )}

      {(currentUser?.role === 'captain' || currentUser?.role === 'admin') && (
      <div className="border-t border-slate-100 pt-6">
        <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-slate-500" />
          {currentUser?.role === 'captain' ? '小隊管理系統' : '後台管理系統'}
        </h3>
      </div>
      )}

      {/* Internal Sub Navigation tabs */}
      {currentUser?.role === 'admin' && (
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 border border-slate-200 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setActiveSubTab('users')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'users'
                ? 'bg-red-650 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-850 hover:bg-white/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>隊員帳號管理 ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('activities')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'activities'
                ? 'bg-red-650 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-850 hover:bg-white/50'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>所有回報審查 ({activities.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('shouts')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'shouts'
                ? 'bg-red-650 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-850 hover:bg-white/50'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>留言板管理</span>
          </button>
          <button
            onClick={() => setActiveSubTab('redemptions')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'redemptions'
                ? 'bg-red-650 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-850 hover:bg-white/50'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>兌換紀錄 ({teamRedemptions.length + itemRedemptions.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('system')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'system'
                ? 'bg-red-650 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-850 hover:bg-white/50'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>系統維護</span>
          </button>
        </div>
      )}

      {/* Notification banner */}
      {actionMessage && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 animate-fade-in ${
          actionMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
            : 'bg-red-50 text-red-700 border-red-150'
        }`}>
          <span>{actionMessage.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Tab 1: User Account management */}
      {activeSubTab === 'users' && (currentUser?.role === 'captain' || currentUser?.role === 'admin') && (
        <div className="space-y-6">
          
          {/* Top filter and Manual create trigger */}
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex flex-1 flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜尋隊員姓名、帳號..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl pl-10 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-red-500 transition-all text-slate-800"
                />
              </div>
              {currentUser?.role !== 'captain' && (
                <div className="relative shrink-0">
                  <select
                    value={selectedSquadFilter}
                    onChange={(e) => setSelectedSquadFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-150 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:border-red-500 transition-all cursor-pointer"
                  >
                    <option value="all">所有小隊</option>
                    {SQUADS.map(sq => (
                      <option key={sq} value={sq}>{sq}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {currentUser?.role !== 'captain' && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-black transition shadow-sm cursor-pointer shrink-0 justify-center"
              >
                {showCreateForm ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {showCreateForm ? '取消新增' : '手動新增隊員'}
              </button>
            )}
          </div>

          {/* Form to create user manually */}
          {showCreateForm && (
            <form onSubmit={handleCreateUser} className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 space-y-4 animate-fade-in text-slate-700">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-red-600" />
                新增探險隊員帳號
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block">帳號 ID (Username, 必填)</label>
                  <input
                    type="text"
                    required
                    placeholder="限英數字底線，例如: test_user"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:border-red-500 text-slate-800 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block">設定密碼 (Password, 必填)</label>
                  <input
                    type="password"
                    required
                    placeholder="例如: 123456"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:border-red-500 text-slate-800 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">中文真實姓名 (必填)</label>
                  <input
                    type="text"
                    required
                    placeholder="例如: 王小明"
                    value={createForm.realName}
                    onChange={(e) => setCreateForm({ ...createForm, realName: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:border-red-500 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">所屬小隊 (Squad)</label>
                  <select
                    value={createForm.team}
                    onChange={(e) => setCreateForm({ ...createForm, team: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:border-red-500 cursor-pointer"
                  >
                    {SQUADS.map(sq => (
                      <option key={sq} value={sq}>{sq}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">初始冒險積分 (排名/勳章)</label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.totalScore}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setCreateForm({ ...createForm, totalScore: val, mapleCoins: val });
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:border-red-500 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">初始個人楓葉幣</label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.mapleCoins}
                    onChange={(e) => setCreateForm({ ...createForm, mapleCoins: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:border-red-500 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">帳號角色 (Role)</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as 'admin' | 'captain' | 'user' })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:border-red-500 cursor-pointer"
                  >
                    <option value="user">隊員</option>
                    <option value="captain">小隊長</option>
                    <option value="admin">大隊長</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">頭像特徵色 (Avatar Color)</label>
                  <div className="flex gap-1.5 flex-wrap pt-1">
                    {AVATAR_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setCreateForm({ ...createForm, avatar: color })}
                        className={`w-6 h-6 rounded-md ${color} transition-all ${
                          createForm.avatar === color ? 'ring-2 ring-red-500 ring-offset-1 scale-110' : 'opacity-65 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-slate-850 hover:bg-slate-750 text-white text-xs font-black rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? '新增中...' : '確認新增隊員'}
                </button>
              </div>
            </form>
          )}

          {/* Users List Grid Table */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-white">
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-xs text-left text-slate-600 relative">
                <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase font-mono border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-5 py-3 font-bold">使用者 / 帳號</th>
                    {currentUser?.role !== 'captain' && <th className="px-5 py-3 font-bold">所屬小隊</th>}
                    <th className="px-5 py-3 font-bold">個人FYC</th>
                    {currentUser?.role === 'captain' ? (
                      <th className="px-5 py-3 font-bold">個人楓葉幣</th>
                    ) : (
                      <th className="px-5 py-3 font-bold">冒險積分 / 個人楓葉幣</th>
                    )}
                    {currentUser?.role !== 'captain' && <th className="px-5 py-3 font-bold">權限角色</th>}
                    {currentUser?.role !== 'captain' && <th className="px-5 py-3 font-bold text-right">管理操作</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans font-medium">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => {
                      const isEditing = editingUserId === user.id;
                      const isAndrew = user.username.toLowerCase() === 'andrew110442' || user.username.toLowerCase() === 'andrew';
                      
                      return (
                        <tr key={user.id} className={`hover:bg-slate-50/50 transition-colors ${isEditing ? 'bg-red-50/15' : ''}`}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {isEditing ? (
                                <div className="flex flex-col gap-1.5 w-full">
                                  <input
                                    type="text"
                                    value={editForm.realName}
                                    onChange={(e) => setEditForm({ ...editForm, realName: e.target.value })}
                                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-red-500 bg-white"
                                  />
                                  <input
                                    type="password"
                                    placeholder="重設密碼 (留空則不修改)"
                                    value={editForm.password || ''}
                                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                    className="px-2.5 py-1 text-[10px] border border-slate-200 rounded-lg font-mono text-slate-800 focus:outline-none focus:border-red-500 bg-white"
                                  />
                                  <span className="text-[10px] font-mono text-slate-400">@{user.username} (帳號不可改)</span>
                                </div>
                              ) : (
                                <>
                                  {user.avatar && (user.avatar.startsWith('data:image/') || user.avatar.startsWith('http') || user.avatar.startsWith('/')) ? (
                                    <img 
                                      src={user.avatar} 
                                      alt={user.realName} 
                                      className="w-8 h-8 rounded-lg object-cover shadow-sm shrink-0" 
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold shrink-0 shadow-sm ${user.avatar || 'bg-indigo-500'}`}>
                                      {user.realName.slice(0, 1)}
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-bold text-slate-850 flex items-center gap-1.5 flex-wrap">
                                      <span>{user.realName}</span>
                                      {user.role === 'admin' && (
                                        <span className="bg-red-50 text-red-600 text-[9px] px-1.5 py-0.5 rounded font-black flex items-center gap-0.5 border border-red-100">
                                          <Shield className="w-2.5 h-2.5 text-red-500" />
                                          大隊長
                                        </span>
                                      )}
                                      {user.role === 'captain' && (
                                        <span className="bg-amber-50 text-amber-600 text-[9px] px-1.5 py-0.5 rounded font-black flex items-center gap-0.5 border border-amber-100">
                                          <Award className="w-2.5 h-2.5 text-amber-500" />
                                          小隊長
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono">@{user.username}</div>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                          {currentUser?.role !== 'captain' && (
                            <td className="px-5 py-4">
                              {isEditing ? (
                                <select
                                  value={editForm.team}
                                  onChange={(e) => setEditForm({ ...editForm, team: e.target.value })}
                                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white"
                                >
                                  {SQUADS.map(sq => (
                                    <option key={sq} value={sq}>{sq}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className="px-2.5 py-1 bg-slate-50 border border-slate-100 text-slate-600 font-black rounded-lg">
                                  {user.team || "無小隊"}
                                </span>
                              )}
                            </td>
                          )}
                          <td className="px-5 py-4">
                            {isEditing ? (
                              <input
                                type="number"
                                min="0"
                                value={editForm.fyc}
                                onChange={(e) => setEditForm({ ...editForm, fyc: parseInt(e.target.value) || 0 })}
                                className="w-24 px-2.5 py-1.5 border border-amber-200 rounded-lg text-xs font-mono font-bold text-amber-800 bg-amber-50"
                              />
                            ) : (
                              <span className="font-mono text-sm font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                {user.fyc || 0}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {currentUser?.role === 'captain' ? (
                              <div className="flex flex-col gap-1">
                                <span className="font-mono text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-150 self-start block">
                                  🍁 {user.mapleCoins ?? user.totalScore} 幣
                                </span>
                              </div>
                            ) : isEditing ? (
                              <div className="flex flex-col gap-1.5">
                                <div>
                                  <span className="text-[9px] font-bold text-slate-400 block mb-0.5">冒險積分 (排名):</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={editForm.totalScore}
                                    onChange={(e) => setEditForm({ ...editForm, totalScore: parseInt(e.target.value) || 0 })}
                                    className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 bg-white"
                                  />
                                </div>
                                <div>
                                  <span className="text-[9px] font-bold text-slate-400 block mb-0.5">個人楓葉幣 (消費):</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={editForm.mapleCoins}
                                    onChange={(e) => setEditForm({ ...editForm, mapleCoins: parseInt(e.target.value) || 0 })}
                                    className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 bg-white"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <span className="font-mono text-xs text-slate-500 block">
                                  🏆 {user.totalScore} 積分
                                </span>
                                <span className="font-mono text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-150 self-start block">
                                  🍁 {user.mapleCoins ?? user.totalScore} 幣
                                </span>
                              </div>
                            )}
                          </td>
                          {currentUser?.role !== 'captain' && (
                            <td className="px-5 py-4">
                              {isEditing ? (
                                <select
                                  value={editForm.role}
                                  disabled={isAndrew}
                                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'admin' | 'captain' | 'user' })}
                                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white disabled:opacity-60"
                                >
                                  <option value="user">隊員</option>
                                  <option value="captain">小隊長</option>
                                  <option value="admin">大隊長</option>
                                </select>
                              ) : (
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                                  user.role === 'admin'
                                    ? 'bg-red-100 text-red-700'
                                    : user.role === 'captain'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {user.role === 'admin' 
                                    ? '大隊長' 
                                    : user.role === 'captain' 
                                      ? '小隊長' 
                                      : '隊員'}
                                </span>
                              )}
                            </td>
                          )}
                          {currentUser?.role !== 'captain' && (
                            <td className="px-5 py-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => handleSaveUser(user.id)}
                                      disabled={isSubmitting}
                                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg transition shadow-xs cursor-pointer"
                                      title="儲存變更"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-lg transition cursor-pointer"
                                      title="取消"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleStartEdit(user)}
                                      className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-600 rounded-lg transition cursor-pointer"
                                      title="修改隊員資訊"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(user)}
                                      disabled={user.id === currentUserId || isAndrew}
                                      className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-150 text-red-600 rounded-lg transition cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                                      title="刪除帳號"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={currentUser?.role === 'captain' ? 3 : 6} className="px-5 py-8 text-center text-slate-400">
                        查無符合過濾條件的探險隊員！
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Activity Review and Audit */}
      {activeSubTab === 'activities' && currentUser?.role === 'admin' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Filtering bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜尋姓名、備忘說明、活動關鍵字..."
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-150 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:border-red-500 transition-all text-slate-800"
              />
            </div>
            <div className="relative shrink-0">
              <select
                value={selectedActivityType}
                onChange={(e) => setSelectedActivityType(e.target.value)}
                className="bg-slate-50 border border-slate-150 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-600 focus:outline-none focus:border-red-500 transition-all cursor-pointer h-full"
              >
                <option value="all">所有活動類型</option>
                {Object.keys(ACTIVITY_RULES).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Timeline report list as a beautiful scroll table */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-white">
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-xs text-left text-slate-600 relative">
                <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase font-mono border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-5 py-3 font-bold">申報人</th>
                    <th className="px-5 py-3 font-bold">業務活動項目</th>
                    <th className="px-5 py-3 font-bold">增扣分數</th>
                    <th className="px-5 py-3 font-bold">活動備忘備註 (備註 description)</th>
                    <th className="px-5 py-3 font-bold">回報時間 (Time)</th>
                    <th className="px-5 py-3 font-bold text-right">審核操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans font-medium">
                  {filteredActivities.length > 0 ? (
                    [...filteredActivities].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(act => {
                      const rule = ACTIVITY_RULES[act.type];
                      const isRecruit = rule?.category === 'recruit';
                      const isTeam = rule?.category === 'team';
                      
                      return (
                        <tr key={act.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <div>
                              <span className="font-bold text-slate-800 block">{act.realName}</span>
                              <span className="text-[10px] font-mono text-slate-400">@{act.username}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 rounded-lg font-black border text-[10px] ${
                              isRecruit
                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                : isTeam
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : 'bg-red-50 text-red-700 border-red-100'
                            }`}>
                              {act.type} (x{act.count || 1})
                            </span>
                          </td>
                          <td className="px-5 py-4 font-mono font-black text-sm text-slate-800">
                            +{act.points} 楓葉幣
                          </td>
                          <td className="px-5 py-4 max-w-xs truncate text-slate-600 italic">
                            {act.note || <span className="text-slate-350 text-[10px]">無填寫備忘</span>}
                          </td>
                          <td className="px-5 py-4 text-[10px] text-slate-400 font-mono">
                            {new Date(act.timestamp).toLocaleString('zh-TW')}
                          </td>
                          <td className="px-5 py-4 text-right flex items-center justify-end gap-1">
                            {act.type === '受理FYC' && (
                              <button
                                onClick={() => handleEditActivity(act)}
                                className="p-1.5 hover:bg-slate-100 border border-transparent hover:border-slate-200 text-slate-500 hover:text-slate-700 rounded-lg transition cursor-pointer"
                                title="修改 FYC"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteActivity(act)}
                              className="p-1.5 hover:bg-red-50 border border-transparent hover:border-red-100 text-red-500 hover:text-red-650 rounded-lg transition cursor-pointer"
                              title="刪除/退回此申報"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                        查無符合條件的活動申報紀錄！
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Shoutbox Management */}
      {activeSubTab === 'shouts' && currentUser?.role === 'admin' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Filtering bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜尋留言內容、姓名、帳號..."
                value={shoutSearch}
                onChange={(e) => setShoutSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-150 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:border-red-500 transition-all text-slate-800"
              />
            </div>
            <button
              onClick={fetchAdminShouts}
              disabled={isShoutsLoading}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-black transition cursor-pointer shrink-0 justify-center disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isShoutsLoading ? 'animate-spin' : ''}`} />
              <span>重新整理</span>
            </button>
          </div>

          {/* Shouts list */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-white">
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-xs text-left text-slate-600 relative">
                <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase font-mono border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-5 py-3 font-bold">留言人</th>
                    <th className="px-5 py-3 font-bold">小隊</th>
                    <th className="px-5 py-3 font-bold">嗆聲留言內容</th>
                    <th className="px-5 py-3 font-bold">發布時間</th>
                    <th className="px-5 py-3 font-bold text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans font-medium">
                  {isShoutsLoading && shouts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                        載入中...
                      </td>
                    </tr>
                  ) : (
                    (() => {
                      const filtered = shouts.filter(shout => {
                        const query = shoutSearch.toLowerCase();
                        return (
                          shout.text.toLowerCase().includes(query) ||
                          shout.realName.toLowerCase().includes(query) ||
                          shout.username.toLowerCase().includes(query) ||
                          (shout.team && shout.team.toLowerCase().includes(query))
                        );
                      });

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                              目前沒有任何符合條件的嗆聲留言！
                            </td>
                          </tr>
                        );
                      }

                      return filtered.map(shout => (
                        <tr key={shout.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              {shout.avatar && (shout.avatar.startsWith('data:image/') || shout.avatar.startsWith('http') || shout.avatar.startsWith('/')) ? (
                                <img 
                                  src={shout.avatar} 
                                  alt={shout.realName} 
                                  className="w-7 h-7 rounded-lg object-cover shadow-xs border border-white shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-[10px] shadow-xs shrink-0 ${shout.avatar || 'bg-indigo-500'}`}>
                                  {shout.realName.slice(0, 1)}
                                </div>
                              )}
                              <div>
                                <span className="font-bold text-slate-800 block">{shout.realName}</span>
                                <span className="text-[10px] font-mono text-slate-400">@{shout.username}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold rounded text-[10px]">
                              {shout.team || '🛡️ 北境守衛軍'}
                            </span>
                          </td>
                          <td className="px-5 py-4 max-w-sm break-words text-slate-850 font-bold">
                            「 {shout.text} 」
                          </td>
                          <td className="px-5 py-4 text-[10px] text-slate-400 font-mono">
                            {new Date(shout.timestamp).toLocaleString('zh-TW')}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => handleDeleteShout(shout.id)}
                              className="p-1.5 hover:bg-red-50 border border-transparent hover:border-red-100 text-red-500 hover:text-red-650 rounded-lg transition cursor-pointer"
                              title="刪除留言"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ));
                    })()
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Redemptions */}
      {activeSubTab === 'redemptions' && currentUser?.role === 'admin' && (
        <div className="space-y-8">
          {/* 冒險裝備庫 */}
          <div>
            <h3 className="text-lg font-black text-amber-700 mb-3">🛡️ 冒險裝備庫紀錄 (個人道具)</h3>
            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-white">
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-xs text-left text-slate-600 relative">
                  <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase font-mono border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-5 py-3 font-bold">兌換時間</th>
                      <th className="px-5 py-3 font-bold">小隊名稱</th>
                      <th className="px-5 py-3 font-bold">兌換人</th>
                      <th className="px-5 py-3 font-bold">兌換道具</th>
                      <th className="px-5 py-3 font-bold text-right">消耗金幣</th>
                      <th className="px-5 py-3 font-bold text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans font-medium">
                    {itemRedemptions.length > 0 ? (
                      itemRedemptions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(red => (
                        <tr key={red.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4 text-[10px] text-slate-400 font-mono">
                            {new Date(red.timestamp).toLocaleString("zh-TW")}
                          </td>
                          <td className="px-5 py-4">
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-600 font-black rounded-lg">
                              {red.team}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-800">
                            {red.realName}
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-800">
                            {red.itemName}
                          </td>
                          <td className="px-5 py-4 text-right font-mono font-black text-amber-600">
                            -{red.cost} 🍁
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button onClick={() => handleRevertItemPurchase(red.id)} className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1 rounded font-bold transition">
                              取消退回
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-slate-400">目前沒有任何道具兌換紀錄！</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 邊境補給站 */}
          <div>
            <h3 className="text-lg font-black text-red-700 mb-3">☕ 邊境補給站紀錄 (小隊公款)</h3>
            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-white">
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-xs text-left text-slate-600 relative">
                  <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase font-mono border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-5 py-3 font-bold">兌換時間</th>
                      <th className="px-5 py-3 font-bold">小隊名稱</th>
                      <th className="px-5 py-3 font-bold">兌換人</th>
                      <th className="px-5 py-3 font-bold">兌換商品</th>
                      <th className="px-5 py-3 font-bold text-right">消耗金幣</th>
                      <th className="px-5 py-3 font-bold text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans font-medium">
                    {teamRedemptions.length > 0 ? (
                      teamRedemptions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(red => (
                        <tr key={red.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4 text-[10px] text-slate-400 font-mono">
                            {new Date(red.timestamp).toLocaleString("zh-TW")}
                          </td>
                          <td className="px-5 py-4">
                            <span className="px-2.5 py-1 bg-red-50 text-red-600 font-black rounded-lg">
                              {red.team}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-800">
                            {red.captainName}
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-800">
                            {red.reward}
                          </td>
                          <td className="px-5 py-4 text-right font-mono font-black text-red-600">
                            -{red.cost} 💰
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button onClick={() => handleRevertTeamPurchase(red.id)} className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1 rounded font-bold transition">
                              取消退回
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-slate-400">目前沒有任何兌換紀錄！</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Tab 3: System reset and maintenance */}
      {activeSubTab === 'system' && currentUser?.role === 'admin' && (
        <div className="space-y-6 animate-fade-in text-slate-700">
          
          {/* Alert Callout */}
          <div className="bg-red-50 border border-red-200 p-5 rounded-2xl flex items-start gap-3.5">
            <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-black text-red-850">重要安全性提示 Safety Notice</h4>
              <p className="text-xs text-red-750 leading-relaxed font-sans font-medium">
                此頁面所執行的資料庫重置操作將會覆寫整個競賽數據。除非競賽全新開始、或者系統發生異常，否則請不要輕易點選此處的重置功能。
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
          {/* System Maintenance block */}
            <div className="bg-white border-2 border-slate-100 p-5 rounded-2xl flex flex-col space-y-4 shadow-sm">
              <div className="space-y-1 text-left">
                <span className="text-xs font-mono text-slate-400 font-bold block uppercase tracking-wider">系統維護 System Maintenance</span>
                <h3 className="text-base font-black text-slate-800">完整系統重置功能已停用</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  依據最新規定，為保全隊員已註冊之帳號資料與密碼設定，完整清除所有人帳號的一鍵系統重設已停用。如果您需要重新開始競賽，請使用下方專屬工具清空所有遊戲中輸入之數值。
                </p>
              </div>
            </div>

            {/* Clear Game Data Block */}
            <div className="bg-white border-2 border-slate-100 p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-sm">
              <div className="space-y-1 text-left">
                <span className="text-xs font-mono text-amber-600 font-bold block uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  管理員特殊工具 Admin Tool
                </span>
                <h3 className="text-base font-black text-slate-800">一鍵清空遊戲數值 (保留帳號角色)</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  此功能會<strong>清空所有徽章、積分、道具、楓葉幣及活動回報與商城紀錄</strong>，讓遊戲重新開始。但會<strong>完整保留所有已註冊的隊員帳號、密碼與小隊設定</strong>，大家不需重新註冊即可直接登入開始新一輪競賽！
                </p>
              </div>
              <button
                onClick={() => {
                  showConfirm(
                    "確認清空所有遊戲數值？",
                    "警告：此操作將會清空所有隊員的積分、FYC、已解鎖徽章、已購買道具，並刪除所有的活動申報記錄與商城兌換歷史。\n\n但會「完整保留」所有註冊的角色帳號，不會影響登入！此操作無法還原，請確認再執行！",
                    async () => {
                      try {
                        const response = await fetch(`${window.location.origin}/api/admin/clear-game-data`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userId: currentUserId })
                        });
                        if (response.ok) {
                          const resData = await response.json();
                          triggerMessage('success', resData.message || '已成功清空所有遊戲數值！');
                          await onRefreshData();
                        } else {
                          const errData = await response.json();
                          throw new Error(errData.error || '清空失敗');
                        }
                      } catch (error: any) {
                        triggerMessage('error', error.message || '連線錯誤，請稍後再試！');
                      }
                    }
                  );
                }}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 hover:shadow-lg text-white font-black rounded-xl text-xs transition-all duration-300 cursor-pointer text-center shadow-md shadow-amber-50"
              >
                清空數值 (保留功能與帳號)
              </button>
            </div>

            {/* Clear FYC Data Block */}
            <div className="bg-white border-2 border-slate-100 p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-sm">
              <div className="space-y-1 text-left">
                <span className="text-xs font-mono text-indigo-600 font-bold block uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  管理員特殊工具 Admin Tool
                </span>
                <h3 className="text-base font-black text-slate-800">一鍵清空遊戲FYC</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  此功能只清空所有玩家<strong>申報受理之FYC</strong>以及與FYC 有關之各項排名、鑽石業務，並清除「約訪排行」、「拜訪排行」、「件數排行」這三項排行之次數。其餘所有楓葉幣、徽章、道具、稱號、積分、地點解鎖、以及個人頁面下階段FYC門檻皆不受影響。
                </p>
              </div>
              <button
                onClick={() => {
                  showConfirm(
                    "確認清空遊戲FYC？",
                    "警告：此操作將會清空所有隊員的FYC、受理FYC回報紀錄、相關的鑽石業務狀態，以及三大排行榜（約訪、拜訪、件數）之次數！楓葉幣、徽章、道具、稱號、積分、下階段門檻等皆會保留。此操作無法還原，請確認再執行！",
                    async () => {
                      try {
                        const response = await fetch(`${window.location.origin}/api/admin/clear-fyc`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userId: currentUserId })
                        });
                        if (response.ok) {
                          const resData = await response.json();
                          triggerMessage('success', resData.message || '已成功清空遊戲FYC！');
                          await onRefreshData();
                        } else {
                          const errData = await response.json();
                          throw new Error(errData.error || '清空FYC失敗');
                        }
                      } catch (error: any) {
                        triggerMessage('error', error.message || '連線錯誤，請稍後再試！');
                      }
                    }
                  );
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg text-white font-black rounded-xl text-xs transition-all duration-300 cursor-pointer text-center shadow-md shadow-indigo-50"
              >
                清空FYC
              </button>
            </div>
            
            {/* Database Backup Management Block */}
            <div className="bg-white border-2 border-slate-100 p-5 rounded-2xl flex flex-col space-y-4 shadow-sm md:col-span-2">
              <div className="flex justify-between items-start">
                <div className="space-y-1 text-left">
                  <span className="text-xs font-mono text-emerald-600 font-bold block uppercase tracking-wider flex items-center gap-1">
                    <Database className="w-3.5 h-3.5" />
                    資料庫備份管理 Database Backups
                  </span>
                  <h3 className="text-base font-black text-slate-800">建立與還原系統備份</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    您可以在此手動備份當前的所有資料（包含帳號、分數、商城購買與歷史紀錄）。當系統崩潰或資料異常時，可選擇任一備份檔還原。
                  </p>
                </div>
                <button
                  onClick={handleCreateBackup}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  建立新備份
                </button>
              </div>

              <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden">
                <div className="max-h-[300px] overflow-y-auto bg-slate-50">
                  {isBackupsLoading ? (
                    <div className="p-8 text-center text-slate-400 font-medium text-xs flex flex-col items-center">
                      <RefreshCw className="w-6 h-6 animate-spin mb-2" />
                      載入備份列表中...
                    </div>
                  ) : backups.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 font-medium text-xs">目前沒有任何備份檔</div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-wider sticky top-0">
                        <tr>
                          <th className="py-3 px-4">備份檔名</th>
                          <th className="py-3 px-4">建立時間</th>
                          <th className="py-3 px-4">檔案大小</th>
                          <th className="py-3 px-4 text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {backups.map((backup) => (
                          <tr key={backup.filename} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 text-xs font-medium text-slate-700 font-mono break-all">{backup.filename}</td>
                            <td className="py-3 px-4 text-xs text-slate-500">
                              {new Date(backup.timestamp).toLocaleString('zh-TW', {
                                year: 'numeric', month: '2-digit', day: '2-digit',
                                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
                              })}
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">{(backup.size / 1024).toFixed(2)} KB</td>
                            <td className="py-3 px-4 flex justify-end gap-2">
                              <button
                                onClick={() => handleRestoreBackup(backup.filename)}
                                className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-colors flex items-center gap-1"
                                title="還原此備份"
                              >
                                <UploadCloud className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-bold">還原</span>
                              </button>
                              <button
                                onClick={() => handleDeleteBackup(backup.filename)}
                                className="p-2 text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors"
                                title="刪除此備份"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            {/* General Help documentation block */}
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-3.5">
              <h4 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">💡 管理員小指南 Administrator Quick Tips</h4>
              <ul className="text-xs text-slate-500 space-y-2 list-disc pl-4 font-sans font-medium leading-relaxed">
                <li>每個小隊的總分（楓葉幣）是累計該小隊所有註冊隊員的個人楓葉幣總和。</li>
                <li>當全體小隊總積分增加，將會在「首頁解鎖探險地圖」亮起對應地標，點擊地標可以查看其詳細的人文風景與Fun Fact！</li>
                <li>若有隊員報錯分數，您不需要刪除帳號，只要在「隊員帳號管理」中，將他的分數欄位直接修改，或是在「所有回報審查」中，刪除該筆申報，分數就會自動同步扣除。</li>
              </ul>
            </div>

          </div>

        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4" id="custom-admin-confirm-modal">
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
              {!confirmModal.isAlert && (
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition cursor-pointer text-center"
                >
                  取消
                </button>
              )}
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition cursor-pointer text-center shadow-md shadow-red-100"
              >
                {confirmModal.isAlert ? '了解' : '確認執行'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
