import React, { useState, useEffect, useRef } from 'react';
import { User, ActivityReport, ActivityType, getAdventurerTitle, ShoutMessage, PromotionEvent, FycEvent, LandmarkUnlockEvent, BadgeUnlockEvent } from './types';
import { LANDMARKS } from './landmarks';
import CanadaMap from './components/CanadaMap';
import ActivityReportForm from './components/ActivityReportForm';
import ScoreBoard from './components/ScoreBoard';
import Timeline from './components/Timeline';
import AuthScreen from './components/AuthScreen';
import AdminPanel from './components/AdminPanel';
import ProfilePanel from './components/ProfilePanel';
import Shoutbox from './components/Shoutbox';
import BadgeEncyclopedia from './components/BadgeEncyclopedia';
import BadgeIcon, { getBadgeByScore, BADGE_DETAILS } from './components/BadgeIcon';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  Sparkles, 
  LogOut, 
  Trophy, 
  Activity, 
  Map, 
  Info,
  Flame,
  Shield,
  UserCog,
  Coins,
  AlertTriangle,
  Bell,
  BellOff,
  RefreshCw
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<ActivityReport[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const titleColor = 'dark';
  const [activeTab, setActiveTab] = useState<'home' | 'report' | 'leaderboard' | 'admin' | 'profile'>('home');
  const [bulletin, setBulletin] = useState<string>('');
  const [isEditingBulletin, setIsEditingBulletin] = useState<boolean>(false);
  const [editBulletinText, setEditBulletinText] = useState<string>('');

  // Custom Confirmation & Alert Modal States
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

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: ''
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
    setAlertModal({
      isOpen: true,
      title,
      message
    });
  };

  // Sync data from the Express backend
  const fetchData = async () => {
    try {
      const [usersRes, activitiesRes, bulletinRes, redemptionsRes] = await Promise.all([
        fetch(`${window.location.origin}/api/users`),
        fetch(`${window.location.origin}/api/activities`),
        fetch(`${window.location.origin}/api/bulletin`),
        fetch(`${window.location.origin}/api/redemptions`)
      ]);

      if (usersRes.ok && activitiesRes.ok) {
        const usersText = await usersRes.text();
        const activitiesText = await activitiesRes.text();
        let usersData = [];
        let activitiesData = [];
        try {
          usersData = JSON.parse(usersText);
          activitiesData = JSON.parse(activitiesText);
        } catch (parseErr) {
          return;
        }
        setUsers(usersData);
        setActivities(activitiesData);
        
        if (bulletinRes.ok) {
          const bulletinData = await bulletinRes.json();
          setBulletin(bulletinData.bulletin || '');
        }

        if (redemptionsRes && redemptionsRes.ok) {
          const redemptionsData = await redemptionsRes.json();
          setRedemptions(redemptionsData || []);
        }

        // If a user was previously logged in, sync their local state with updated backend data
        const storedUser = localStorage.getItem('adventure_king_user');
        if (storedUser) {
          const parsedLocalUser = JSON.parse(storedUser) as User;
          const syncedUser = usersData.find((u: User) => u.id === parsedLocalUser.id || u.username === parsedLocalUser.username);
          if (syncedUser) {
            setCurrentUser(syncedUser);
          } else {
            setCurrentUser(parsedLocalUser);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to sync with API endpoints:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Register service worker for push notifications on mobile
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.warn('Service worker registration failed:', err);
      });
    }

    // Auto-request system notification permission if supported
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then(perm => {
        setNotificationPermission(perm);
        if (perm === "granted") {
          showSystemNotification("🔔 系統通知已成功啟用", {
            body: "您將會在此裝置接收到即時申報與抵達通知！",
            icon: "/favicon.ico"
          });
        }
      }).catch(() => {});
    }
  }, []);

  const [latestShout, setLatestShout] = useState<ShoutMessage | null>(null);
  const [showShoutBubble, setShowShoutBubble] = useState<boolean>(false);
  
  const shownShoutIdsRef = useRef<Set<string>>(new Set());
  const shoutQueueRef = useRef<ShoutMessage[]>([]);
  const isDisplayingRef = useRef<boolean>(false);
  const shoutCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleCloseShoutPopup = () => {
    if (shoutCloseTimerRef.current) {
      clearTimeout(shoutCloseTimerRef.current);
      shoutCloseTimerRef.current = null;
    }
    setShowShoutBubble(false);
    setTimeout(() => {
      isDisplayingRef.current = false;
      processShoutQueue();
    }, 500);
  };

  // Function to process the queue of pending shouts
  const processShoutQueue = () => {
    if (isDisplayingRef.current) return;
    if (shoutQueueRef.current.length === 0) return;

    const nextShout = shoutQueueRef.current.shift()!;
    isDisplayingRef.current = true;
    setLatestShout(nextShout);
    setShowShoutBubble(true);

    if (shoutCloseTimerRef.current) {
      clearTimeout(shoutCloseTimerRef.current);
    }

    shoutCloseTimerRef.current = setTimeout(() => {
      handleCloseShoutPopup();
    }, 10000);
  };

  // Click anywhere on the screen to close the active shout bubble
  useEffect(() => {
    if (!showShoutBubble) return;

    const handleWindowClick = () => {
      handleCloseShoutPopup();
    };

    // Use a small timeout to ensure the current click event is not caught
    const timeoutId = setTimeout(() => {
      window.addEventListener('click', handleWindowClick);
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('click', handleWindowClick);
    };
  }, [showShoutBubble]);

  // Poll for active shouts and push any unseen ones to the queue
  useEffect(() => {
    let isInitial = true;

    const fetchAllShouts = async () => {
      try {
        const res = await fetch(`${window.location.origin}/api/shouts`);
        if (res.ok) {
          const text = await res.text();
          let shouts: ShoutMessage[] = [];
          try {
            shouts = JSON.parse(text);
          } catch (parseErr) {
            return;
          }
          if (!Array.isArray(shouts)) return;

          let addedAny = false;

          shouts.forEach(shout => {
            if (!shownShoutIdsRef.current.has(shout.id)) {
              shownShoutIdsRef.current.add(shout.id);
              // On initial load, only show the latest shout if it's less than 10s old
              if (isInitial) {
                let age = 0;
                try {
                  age = Date.now() - new Date(shout.timestamp).getTime();
                  if (isNaN(age)) age = 999999;
                } catch (e) {
                  age = 999999;
                }
                if (age < 10000 && shout.id === shouts[shouts.length - 1]?.id) {
                  shoutQueueRef.current.push(shout);
                  addedAny = true;
                }
              } else {
                shoutQueueRef.current.push(shout);
                addedAny = true;
              }
            }
          });

          isInitial = false;

          if (addedAny) {
            processShoutQueue();
          }
        }
      } catch (err) {
        console.warn("Could not retrieve active shouts:", err);
      }
    };

    fetchAllShouts();
    const interval = setInterval(fetchAllShouts, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Immediately query and queue new shouts when self or others submit
  const handleNewShoutSubmitted = async () => {
    try {
      const res = await fetch(`${window.location.origin}/api/shouts`);
      if (res.ok) {
        const text = await res.text();
        let shouts: ShoutMessage[] = [];
        try {
          shouts = JSON.parse(text);
        } catch (e) {
          return;
        }
        if (!Array.isArray(shouts)) return;

        let addedAny = false;
        shouts.forEach(shout => {
          if (!shownShoutIdsRef.current.has(shout.id)) {
            shownShoutIdsRef.current.add(shout.id);
            shoutQueueRef.current.push(shout);
            addedAny = true;
          }
        });
        if (addedAny) {
          processShoutQueue();
        }
      }
    } catch (err) {
      console.warn("Could not handle new shout submission:", err);
    }
  };

  // --- PROMOTION & LOGIN NOTIFICATION STATE & EFFECTS ---
  const [currentPromoToShow, setCurrentPromoToShow] = useState<PromotionEvent | null>(null);
  const [showPromoPopup, setShowPromoPopup] = useState<boolean>(false);
  const [showLoginWelcome, setShowLoginWelcome] = useState<boolean>(false);
  
  const shownPromoIdsRef = useRef<Set<string>>(new Set());
  const promoQueueRef = useRef<PromotionEvent[]>([]);
  const isDisplayingPromoRef = useRef<boolean>(false);
  const welcomedUserRef = useRef<string | null>(null);

  // FYC Broadcast states
  const [currentFycToShow, setCurrentFycToShow] = useState<FycEvent | null>(null);
  const [showFycPopup, setShowFycPopup] = useState<boolean>(false);
  const shownFycIdsRef = useRef<Set<string>>(new Set());
  const fycQueueRef = useRef<FycEvent[]>([]);
  const isDisplayingFycRef = useRef<boolean>(false);
  const fycCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Badge Broadcast states
  const [currentBadgeEventToShow, setCurrentBadgeEventToShow] = useState<BadgeUnlockEvent | null>(null);
  const [showBadgePopup, setShowBadgePopup] = useState<boolean>(false);
  const shownBadgeEventIdsRef = useRef<Set<string>>(new Set());
  const badgeEventQueueRef = useRef<BadgeUnlockEvent[]>([]);
  const isDisplayingBadgeRef = useRef<boolean>(false);
  const badgeCloseTimerRef = useRef<NodeJS.Timeout | null>(null);


  // System notification permission state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );
  const [appNotificationEnabled, setAppNotificationEnabled] = useState<boolean>(() => {
    return localStorage.getItem("appNotificationEnabled") === "true";
  });

  const showSystemNotification = async (title: string, options: NotificationOptions) => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration) {
          await registration.showNotification(title, options);
          return;
        }
      }
      const notification = new window.Notification(title, options);
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (err) {
      console.warn("Failed to trigger system notification:", err);
    }
  };

  // Trigger system push notification for FYC or Badge event
  const triggerPhoneNotification = (evt: FycEvent | BadgeUnlockEvent) => {
    if (!appNotificationEnabled) return;
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      let notificationTitle = "";
      let notificationBody = "";

      if ('amount' in evt) {
        const formattedFyc = Number(evt.amount).toLocaleString();
        notificationTitle = `${evt.realName}已完成FYC ${formattedFyc}`;
        notificationBody = `【${evt.team}】小隊成員申報新戰績！`;
      } else {
        notificationTitle = `${evt.realName}解鎖了【${evt.badgeTitle}】徽章！`;
        notificationBody = `恭喜【${evt.team}】小隊成員獲得新成就。`;
      }
      
      const options: NotificationOptions = {
        body: notificationBody,
        icon: "/favicon.ico",
        tag: evt.id,
        silent: false,
        requireInteraction: false
      };

      showSystemNotification(notificationTitle, options);
    }
  };

  const processPromoQueue = () => {
    if (isDisplayingPromoRef.current) return;
    if (promoQueueRef.current.length === 0) return;

    const nextPromo = promoQueueRef.current.shift()!;
    isDisplayingPromoRef.current = true;
    setCurrentPromoToShow(nextPromo);
    setShowPromoPopup(true);
  };

  const handleClosePromoPopup = () => {
    setShowPromoPopup(false);
    setTimeout(() => {
      setCurrentPromoToShow(null);
      isDisplayingPromoRef.current = false;
      processPromoQueue();
    }, 500);
  };

  const processFycQueue = () => {
    if (isDisplayingFycRef.current) return;
    if (fycQueueRef.current.length === 0) return;

    const nextFyc = fycQueueRef.current.shift()!;
    isDisplayingFycRef.current = true;
    setCurrentFycToShow(nextFyc);
    setShowFycPopup(true);

    // Auto-close after 10 seconds
    const timer = setTimeout(() => {
      handleCloseFycPopup();
    }, 10000);
    fycCloseTimerRef.current = timer;
  };

  const handleCloseFycPopup = () => {
    if (fycCloseTimerRef.current) {
      clearTimeout(fycCloseTimerRef.current);
      fycCloseTimerRef.current = null;
    }
    setShowFycPopup(false);
    setTimeout(() => {
      setCurrentFycToShow(null);
      isDisplayingFycRef.current = false;
      processFycQueue();
    }, 500);
  };


  const processBadgeQueue = () => {
    if (isDisplayingBadgeRef.current) return;
    if (badgeEventQueueRef.current.length === 0) return;

    const nextBadge = badgeEventQueueRef.current.shift()!;
    isDisplayingBadgeRef.current = true;
    setCurrentBadgeEventToShow(nextBadge);
    setShowBadgePopup(true);

    // Auto-close after 8 seconds
    const timer = setTimeout(() => {
      handleCloseBadgePopup();
    }, 8000);
    badgeCloseTimerRef.current = timer;
  };

  const handleCloseBadgePopup = () => {
    if (badgeCloseTimerRef.current) {
      clearTimeout(badgeCloseTimerRef.current);
      badgeCloseTimerRef.current = null;
    }
    setShowBadgePopup(false);
    setTimeout(() => {
      setCurrentBadgeEventToShow(null);
      isDisplayingBadgeRef.current = false;
      processBadgeQueue();
    }, 500);
  };

  // --- LANDMARK UNLOCK EVENT BROADCAST STATE & EFFECTS ---
  const [currentLandmarkEventToShow, setCurrentLandmarkEventToShow] = useState<LandmarkUnlockEvent | null>(null);
  const [showLandmarkPopup, setShowLandmarkPopup] = useState<boolean>(false);
  
  const shownLandmarkIdsRef = useRef<Set<string>>(new Set());
  const landmarkQueueRef = useRef<LandmarkUnlockEvent[]>([]);
  const isDisplayingLandmarkRef = useRef<boolean>(false);

  const processLandmarkQueue = () => {
    if (isDisplayingLandmarkRef.current) return;
    if (landmarkQueueRef.current.length === 0) return;

    const nextEvent = landmarkQueueRef.current.shift()!;
    isDisplayingLandmarkRef.current = true;
    setCurrentLandmarkEventToShow(nextEvent);
    setShowLandmarkPopup(true);
  };

  const handleCloseLandmarkPopup = () => {
    setShowLandmarkPopup(false);
    setTimeout(() => {
      setCurrentLandmarkEventToShow(null);
      isDisplayingLandmarkRef.current = false;
      processLandmarkQueue();
    }, 500);
  };

  // Poll for active landmark unlocks and push any unseen ones to the queue
  useEffect(() => {
    let isInitial = true;

    const fetchAllLandmarkEvents = async () => {
      try {
        const res = await fetch(`${window.location.origin}/api/landmark-events`);
        if (res.ok) {
          const text = await res.text();
          let events: LandmarkUnlockEvent[] = [];
          try {
            events = JSON.parse(text);
          } catch (parseErr) {
            return;
          }
          if (!Array.isArray(events)) return;

          let addedAny = false;

          events.forEach(evt => {
            if (!shownLandmarkIdsRef.current.has(evt.id)) {
              shownLandmarkIdsRef.current.add(evt.id);
              // On initial load, only show events from the last 15 seconds to avoid backlog bombarding
              if (isInitial) {
                let age = 0;
                try {
                  age = Date.now() - new Date(evt.timestamp).getTime();
                  if (isNaN(age)) age = 999999;
                } catch (e) {
                  age = 999999;
                }
                if (age < 15000) {
                  landmarkQueueRef.current.push(evt);
                  addedAny = true;
                }
              } else {
                landmarkQueueRef.current.push(evt);
                addedAny = true;
              }
            }
          });

          isInitial = false;

          if (addedAny) {
            processLandmarkQueue();
          }
        }
      } catch (err) {
        console.warn("Could not retrieve landmark unlock events:", err);
      }
    };

    fetchAllLandmarkEvents();
    const interval = setInterval(fetchAllLandmarkEvents, 2500); // Poll every 2.5 seconds

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Poll for active promotions and push any unseen ones to the queue
  useEffect(() => {
    let isInitial = true;

    const fetchAllPromotions = async () => {
      try {
        const res = await fetch(`${window.location.origin}/api/promotions`);
        if (res.ok) {
          const text = await res.text();
          let promotions: PromotionEvent[] = [];
          try {
            promotions = JSON.parse(text);
          } catch (parseErr) {
            return;
          }
          if (!Array.isArray(promotions)) return;

          let addedAny = false;

          promotions.forEach(promo => {
            if (!shownPromoIdsRef.current.has(promo.id)) {
              shownPromoIdsRef.current.add(promo.id);
              // On initial load, only show promotions from the last 15 seconds to avoid backlog bombarding
              if (isInitial) {
                let age = 0;
                try {
                  age = Date.now() - new Date(promo.timestamp).getTime();
                  if (isNaN(age)) age = 999999;
                } catch (e) {
                  age = 999999;
                }
                if (age < 15000) {
                  promoQueueRef.current.push(promo);
                  addedAny = true;
                }
              } else {
                promoQueueRef.current.push(promo);
                addedAny = true;
              }
            }
          });

          isInitial = false;

          if (addedAny) {
            processPromoQueue();
          }
        }
      } catch (err) {
        console.warn("Could not retrieve promotions:", err);
      }
    };

    fetchAllPromotions();
    const interval = setInterval(fetchAllPromotions, 2500); // Poll every 2.5 seconds

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Poll for active FYC events and push any unseen ones to the queue
  useEffect(() => {
    let isInitial = true;

    const fetchAllFycEvents = async () => {
      try {
        const res = await fetch(`${window.location.origin}/api/fyc-events`);
        if (res.ok) {
          const text = await res.text();
          let events: FycEvent[] = [];
          try {
            events = JSON.parse(text);
          } catch (parseErr) {
            return;
          }
          if (!Array.isArray(events)) return;

          let addedAny = false;

          events.forEach(evt => {
            if (!shownFycIdsRef.current.has(evt.id)) {
              shownFycIdsRef.current.add(evt.id);
              // On initial load, only show events from the last 15 seconds to avoid backlog bombarding
              if (isInitial) {
                let age = 0;
                try {
                  age = Date.now() - new Date(evt.timestamp).getTime();
                  if (isNaN(age)) age = 999999;
                } catch (e) {
                  age = 999999;
                }
                if (age < 15000) {
                  fycQueueRef.current.push(evt);
                  addedAny = true;
                  triggerPhoneNotification(evt);
                }
              } else {
                fycQueueRef.current.push(evt);
                addedAny = true;
                triggerPhoneNotification(evt);
              }
            }
          });

          isInitial = false;

          if (addedAny) {
            processFycQueue();
          }
        }
      } catch (err) {
        console.warn("Could not retrieve FYC events:", err);
      }
    };

    fetchAllFycEvents();
    const interval = setInterval(fetchAllFycEvents, 2500); // Poll every 2.5 seconds

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Poll for active Badge unlock events and push any unseen ones to the queue
  useEffect(() => {
    let isInitial = true;

    const fetchAllBadgeEvents = async () => {
      try {
        const res = await fetch(`${window.location.origin}/api/badge-events`);
        if (res.ok) {
          const text = await res.text();
          let events: BadgeUnlockEvent[] = [];
          try {
            events = JSON.parse(text);
          } catch (parseErr) {
            return;
          }
          if (!Array.isArray(events)) return;

          let addedAny = false;

          events.forEach(evt => {
            if (!shownBadgeEventIdsRef.current.has(evt.id)) {
              shownBadgeEventIdsRef.current.add(evt.id);
              if (isInitial) {
                let age = 0;
                try {
                  age = Date.now() - new Date(evt.timestamp).getTime();
                  if (isNaN(age)) age = 999999;
                } catch (e) {
                  age = 999999;
                }
                if (age < 15000) {
                  badgeEventQueueRef.current.push(evt);
                  addedAny = true;
                  triggerPhoneNotification(evt);
                }
              } else {
                badgeEventQueueRef.current.push(evt);
                addedAny = true;
                triggerPhoneNotification(evt);
              }
            }
          });

          if (addedAny) {
            processBadgeQueue();
          }
          isInitial = false;
        }
      } catch (err) {
        console.warn("Error fetching badge events:", err);
      }
    };

    fetchAllBadgeEvents();
    const interval = setInterval(fetchAllBadgeEvents, 2500);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Login Welcome Notification Trigger
  useEffect(() => {
    if (currentUser) {
      if (welcomedUserRef.current !== currentUser.id) {
        welcomedUserRef.current = currentUser.id;
        setShowLoginWelcome(true);
        const timer = setTimeout(() => {
          setShowLoginWelcome(false);
        }, 10000); // Keep it visible for 10 seconds
        return () => clearTimeout(timer);
      }
    } else {
      welcomedUserRef.current = null;
    }
  }, [currentUser]);

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await fetch(`${window.location.origin}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const text = await response.text();
        let errMessage = "登入失敗";
        try {
          const errData = JSON.parse(text);
          errMessage = errData.error || errMessage;
        } catch (e) {}
        throw new Error(errMessage);
      }

      const textData = await response.text();
      let loggedUser = null;
      try {
        loggedUser = JSON.parse(textData);
      } catch (e) {}

      if (!loggedUser) {
        throw new Error("伺服器回應無效");
      }

      setCurrentUser(loggedUser);
      localStorage.setItem('adventure_king_user', JSON.stringify(loggedUser));
      
      // Refresh backend states to synchronize and update scoreboards
      await fetchData();
    } catch (error: any) {
      console.warn("Login failure:", error);
      throw error;
    }
  };

  const handleRegister = async (username: string, password: string, realName: string, avatar: string, team: string, role?: 'captain' | 'user') => {
    try {
      const response = await fetch(`${window.location.origin}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, realName, avatar, team, role })
      });

      if (!response.ok) {
        const text = await response.text();
        let errMessage = "註冊失敗";
        try {
          const errData = JSON.parse(text);
          errMessage = errData.error || errMessage;
        } catch (e) {}
        throw new Error(errMessage);
      }

      const textData = await response.text();
      let loggedUser = null;
      try {
        loggedUser = JSON.parse(textData);
      } catch (e) {}

      if (!loggedUser) {
        throw new Error("伺服器回應無效");
      }

      setCurrentUser(loggedUser);
      localStorage.setItem('adventure_king_user', JSON.stringify(loggedUser));
      
      // Refresh backend states to capture new registration
      await fetchData();
    } catch (error: any) {
      console.warn("Registration failure:", error);
      throw error;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('adventure_king_user');
  };

  const handleProfileUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('adventure_king_user', JSON.stringify(updatedUser));
    fetchData();
  };

  const handleSubmitActivity = async (type: ActivityType, count: number, note: string) => {
    if (!currentUser) return;

    try {
      const response = await fetch(`${window.location.origin}/api/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          type,
          count,
          note
        })
      });

      if (!response.ok) {
        throw new Error("Failed to submit activity");
      }

      // Re-fetch all data to synchronize states and score updates
      await fetchData();
    } catch (error) {
      console.warn("Submission failed:", error);
      showAlert("提交失敗", "回報失敗，請重試！");
    }
  };

  const handleRetractActivity = async (activityId: string) => {
    try {
      const response = await fetch(`${window.location.origin}/api/activities/${activityId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error("Failed to retract activity");
      }

      // Re-fetch all data to synchronize states and deduct points
      await fetchData();
    } catch (error) {
      console.warn("Retraction failed:", error);
      showAlert("收回失敗", "收回失敗，請重試！");
    }
  };

  const handleResetDatabase = async () => {
    showConfirm(
      "系統數據重置",
      "確定要重設所有數據嗎？這將會清空所有自訂回報記錄並還原至預設展示資料。",
      async () => {
        setIsResetting(true);
        try {
          const response = await fetch(`${window.location.origin}/api/reset`, { method: 'POST' });
          if (response.ok) {
            await fetchData();
            showAlert("重置成功", "資料庫已成功重置為預設展示狀態！");
          }
        } catch (error) {
          console.warn("Reset failed:", error);
        } finally {
          setIsResetting(false);
        }
      }
    );
  };

  const handleUpdateBulletin = async () => {
    if (!currentUser || currentUser.role !== 'admin') return;
    try {
      const response = await fetch(`${window.location.origin}/api/bulletin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulletin: editBulletinText, userId: currentUser.id })
      });
      if (response.ok) {
        setBulletin(editBulletinText);
        setIsEditingBulletin(false);
        showAlert("更新成功", "佈告欄已成功更新，並已推播給所有隊員！");
        handleNewShoutSubmitted(); // Trigger immediate shoutbox fetch
      } else {
        showAlert("更新失敗", "無法更新佈告欄");
      }
    } catch (error) {
      console.warn("Update bulletin failed:", error);
      showAlert("錯誤", "發生錯誤，請重試");
    }
  };

  // Derive global statistics
  const teamTotalScore = users.reduce((sum, u) => sum + u.totalScore, 0);
  const teamTotalFyc = users.reduce((sum, u) => sum + (u.fyc || 0), 0);

  // Derive squad statistics
  const squadUsers = currentUser ? users.filter(u => u.team === currentUser.team) : [];
  const squadTotalScore = squadUsers.reduce((sum, u) => sum + (u.mapleCoins !== undefined ? u.mapleCoins : u.totalScore), 0);
  const squadAvailableScore = squadTotalScore; // Spent score is already deducted from individuals' mapleCoins
  const squadTotalFyc = squadUsers.reduce((sum, u) => sum + (u.fyc || 0), 0);

  // Calculate next FYC milestone
  let nextFycMilestone = 1500000;
  let nextFycBonus = 15000;
  let isFycMaxed = false;

  if (teamTotalFyc >= 2500000) {
    isFycMaxed = true;
    nextFycBonus = 35000;
  } else if (teamTotalFyc >= 2000000) {
    nextFycMilestone = 2500000;
    nextFycBonus = 35000;
  } else if (teamTotalFyc >= 1500000) {
    nextFycMilestone = 2000000;
    nextFycBonus = 25000;
  }
  
  const fycDiff = isFycMaxed ? 0 : nextFycMilestone - teamTotalFyc;

  // Calculate FYC reporting rate for the current month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const fycReportersThisMonth = new Set(
    activities
      .filter(a => {
        const d = new Date(a.timestamp);
        return a.type === '受理FYC' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .map(a => a.userId)
  );
  const fycReportedUsersCount = fycReportersThisMonth.size;
  const fycAchievementRate = (fycReportedUsersCount / 37) * 100;

  // Compute unlock metrics (moved to CanadaMap component)

  // Title Upgrade Animation State
  const [showTitleUpgrade, setShowTitleUpgrade] = useState(false);
  const [upgradeTitleText, setUpgradeTitleText] = useState("");
  const prevScoreRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (currentUser) {
      if (prevScoreRef.current !== null && currentUser.totalScore > prevScoreRef.current) {
        const prevTitleInfo = getAdventurerTitle(prevScoreRef.current);
        const newTitleInfo = getAdventurerTitle(currentUser.totalScore);
        
        if (prevTitleInfo.title !== newTitleInfo.title) {
          setUpgradeTitleText(newTitleInfo.title);
          setShowTitleUpgrade(true);
          setTimeout(() => setShowTitleUpgrade(false), 6000);
        }
      }
      prevScoreRef.current = currentUser.totalScore;
    } else {
      prevScoreRef.current = null;
    }
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
        <p className="text-sm font-mono text-slate-400">正在探尋加拿大冒險國度，請稍候...</p>
      </div>
    );
  }

  // Direct unauthorized or unregistered users to Auth Screen
  if (!currentUser) {
    return (
      <AuthScreen 
        existingUsers={users}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    );
  }

  const currentUserTitleInfo = getAdventurerTitle(currentUser.totalScore);
  const isCustomAvatar = (url: string) => url && (url.startsWith('data:image/') || url.startsWith('http') || url.startsWith('/'));

  // Daily Champions Logic
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let todayTopFycUser: User | null = null;
  let todayMaxFyc = 0;

  let todayTopExplorerUser: User | null = null;
  let todayMaxCoins = 0;

  users.forEach(user => {
    const userTodayActivities = activities.filter(a => a.userId === user.id && new Date(a.timestamp).getTime() >= todayStart.getTime());
    
    const fycSum = userTodayActivities.filter(a => a.type === '受理FYC').reduce((sum, a) => sum + a.count, 0);
    if (fycSum > todayMaxFyc) {
      todayMaxFyc = fycSum;
      todayTopFycUser = user;
    }

    const coinsSum = userTodayActivities.filter(a => a.points > 0).reduce((sum, a) => sum + a.points, 0);
    if (coinsSum > todayMaxCoins) {
      todayMaxCoins = coinsSum;
      todayTopExplorerUser = user;
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-red-500 selection:text-white relative">
      {/* Title Upgrade Golden Maple Leaf Animation */}
      <AnimatePresence>
        {showTitleUpgrade && (
          <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden flex items-center justify-center">
            {Array.from({ length: 40 }).map((_, i) => {
              const startX = Math.random() * 100;
              const endX = startX + (Math.random() * 30 - 15);
              return (
                <motion.div
                  key={i}
                  initial={{ y: -100, x: `${startX}vw`, opacity: 0, rotate: 0, scale: Math.random() * 0.6 + 0.4 }}
                  animate={{ 
                    y: '100vh', 
                    x: `${endX}vw`,
                    opacity: [0, 1, 1, 0], 
                    rotate: Math.random() * 720 - 360
                  }}
                  transition={{ duration: Math.random() * 2.5 + 3.5, ease: 'linear', delay: Math.random() * 1.5 }}
                  className="absolute top-0 left-0 text-yellow-500 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)] text-3xl md:text-5xl"
                >
                  🍁
                </motion.div>
              );
            })}
            
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: -50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className="z-[201] pointer-events-none mt-[-20vh]"
            >
              <div className="text-yellow-400 font-display font-black text-5xl md:text-7xl drop-shadow-[0_0_25px_rgba(250,204,21,1)] bg-slate-900/60 px-10 py-6 rounded-[2.5rem] backdrop-blur-md border-4 border-yellow-400/60 flex flex-col items-center">
                <span className="text-xl md:text-3xl text-white drop-shadow-md mb-2">榮耀晉升</span>
                <span>{upgradeTitleText}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Real-time top-floating speech bubble push notification */}
      <AnimatePresence>
        {showShoutBubble && latestShout && (
          <motion.div
            initial={{ opacity: 0, y: -80, scale: 0.8, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: -40, scale: 0.8, x: '-50%' }}
            transition={{ type: 'spring', damping: 15, stiffness: 100 }}
            className="fixed top-24 left-1/2 z-[100] w-full max-w-lg px-4"
          >
            <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-3xl shadow-[0_15px_35px_rgba(225,29,72,0.35)] p-4 border-2 border-white relative flex items-start gap-3">
              {/* Avatar */}
              {latestShout.avatar && isCustomAvatar(latestShout.avatar) ? (
                <img 
                  src={latestShout.avatar} 
                  alt={latestShout.realName} 
                  className="w-10 h-10 rounded-2xl object-cover shrink-0 border-2 border-white/20 shadow-md"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border-2 border-white/20 shadow-md bg-white text-red-600">
                  {latestShout.realName.slice(0, 1)}
                </div>
              )}
              
              {/* Message Details */}
              <div className="flex-1 text-left relative min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-bold text-yellow-300 flex items-center gap-1">
                    <span>{latestShout.realName}</span>
                    <span className="text-[10px] text-white/80">({latestShout.team})</span>
                    <span>📢 嗆聲：</span>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] text-white font-bold bg-black/20 px-2 py-0.5 rounded-full border border-white/10 animate-pulse">
                      點擊螢幕任意處關閉
                    </span>
                    <span className="text-[9px] text-yellow-200 font-bold font-mono bg-black/30 px-1.5 py-0.5 rounded-md">
                      10s
                    </span>
                  </div>
                </div>
                
                <p className="text-sm font-extrabold tracking-wide mt-1 leading-relaxed break-words bg-white/10 px-3 py-2 rounded-xl border border-white/5 shadow-inner">
                  「 {latestShout.text} 」
                </p>
              </div>

              {/* Bubble Tail pointing up */}
              <div className="absolute -top-2 left-8 w-4 h-4 bg-red-650 border-t-2 border-l-2 border-white transform rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Main Navigation Header - Responsive and Configurable color */}
      <header className={`sticky top-0 z-50 border-b px-4 py-3 lg:px-8 shadow-md text-white shrink-0 transition-all duration-350 ${
        titleColor === 'dark' 
          ? 'bg-red-950 border-red-900 shadow-red-950/20' 
          : 'bg-red-600 border-red-700 shadow-red-600/15'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          {/* Logo Brand */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
            <div className="p-2 bg-white rounded-xl shadow-sm shrink-0 flex items-center justify-center">
              <span className="text-2xl filter drop-shadow leading-none animate-pulse">🍁</span>
            </div>
            <div className="text-left">
              <h1 className="text-xl font-display font-black tracking-tight text-white uppercase flex items-center gap-2">
                楓葉王國大冒險
                <span className="bg-yellow-400 text-slate-900 text-[10px] font-bold font-mono px-2 py-0.5 rounded-md uppercase tracking-wider">
                  團隊版
                </span>
              </h1>
              <p className="text-[10px] font-mono text-red-100 uppercase tracking-widest mt-0.5">
                加拿大探險之旅
              </p>
            </div>
          </div>

          {/* User profile actions */}
          <div className="flex flex-col items-center sm:items-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">
            {/* User Profile Summary */}
            <div className={`w-full max-w-[280px] sm:w-auto sm:max-w-none border-2 rounded-2xl px-5 py-2.5 flex items-center justify-center sm:justify-start gap-4 shadow-lg transition-colors duration-300 ${
              titleColor === 'dark'
                ? 'bg-red-900/60 border-yellow-500/50'
                : 'bg-red-700/90 border-yellow-400/50'
            }`}>
              {currentUser.avatar && isCustomAvatar(currentUser.avatar) ? (
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.realName} 
                  className="w-10 h-10 rounded-xl object-cover shrink-0 border-2 border-white/30"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-red-600 font-bold text-lg bg-white border-2 border-white/20 shadow-sm`}>
                  {currentUser.realName.slice(0, 1)}
                </div>
              )}
              <div className="text-left flex flex-col justify-center">
                <span className="text-base font-bold text-white leading-tight">{currentUser.realName}</span>
                <span 
                  title={currentUserTitleInfo.description}
                  className="text-xs text-yellow-300 font-bold flex items-center gap-1 mt-1 leading-tight cursor-help"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-[spin_5s_linear_infinite]" />
                  <span className="flex items-center gap-1.5">
                    {currentUserTitleInfo.title}
                    {((currentUser.fyc || 0) >= 25000 || currentUser.hasDiamond) && (
                      <span title="鑽石業務 (FYC 25,000+)" className="text-xl leading-none drop-shadow-md">💎</span>
                    )}
                  </span>
                </span>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex justify-center sm:justify-end items-center gap-2 flex-wrap w-full">

            {/* System Notification Enable Button */}
            <button
              onClick={async () => {
                if (!("Notification" in window)) {
                  alert("目前裝置或瀏覽器不支援推播通知功能。");
                  return;
                }
                
                try {
                  let perm = notificationPermission;
                  if (perm !== "granted") {
                    perm = await Notification.requestPermission();
                    setNotificationPermission(perm);
                  }
                  
                  if (perm === "granted") {
                    const newState = !appNotificationEnabled;
                    setAppNotificationEnabled(newState);
                    localStorage.setItem("appNotificationEnabled", String(newState));
                    
                    if (newState) {
                      showSystemNotification("🔔 系統通知已打開", {
                        body: "當有新 FYC 申報時，您將會收到即時通知！",
                        icon: "/favicon.ico"
                      });
                    }
                  } else {
                    alert("請在瀏覽器設定中允許通知權限，才能開啟此功能。");
                  }
                } catch (e) {
                  console.warn(e);
                }
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-sm ${
                appNotificationEnabled && notificationPermission === 'granted'
                  ? 'bg-yellow-400 hover:bg-yellow-500 text-slate-900 border-transparent animate-none'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20 animate-pulse'
              }`}
              title="打開/關閉系統推播通知"
            >
              {appNotificationEnabled && notificationPermission === 'granted' ? (
                <Bell className="w-3.5 h-3.5 text-slate-900" />
              ) : (
                <BellOff className="w-3.5 h-3.5 text-white" />
              )}
              <span>{appNotificationEnabled && notificationPermission === 'granted' ? '關閉通知' : '打開通知'}</span>
            </button>

            {/* Refresh App Trigger */}
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
              title="重新整理取得最新版本"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>重新整理</span>
            </button>

            {/* Logout Trigger */}
            <button
              id="btn-global-logout"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-red-650 border border-transparent text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5 text-red-600" />
              <span className="text-red-600">登出</span>
            </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body Layout Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        
        {/* Dynamic Highlight Stats Strip / Bento Section */}
        {activeTab !== 'report' && activeTab !== 'profile' && activeTab !== 'admin' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            {/* Bulletin Board or Daily Champions */}
            {activeTab === 'leaderboard' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* 左邊：本日FYC王 */}
                <div className="relative overflow-hidden bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center sm:flex-row sm:justify-between group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
                  {/* Decorative Background */}
                  <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-gradient-to-br from-amber-300/30 to-orange-400/30 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500 pointer-events-none"></div>
                  
                  <div className="flex flex-col items-center sm:items-start z-10 mb-3 sm:mb-0">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase flex items-center gap-1.5 shadow-md shadow-amber-500/20 mb-2">
                      <Trophy className="w-3.5 h-3.5" /> 本日FYC王
                    </div>
                    <div className="text-xs text-slate-500 font-medium ml-1">今日最高受理</div>
                  </div>

                  {todayTopFycUser && todayMaxFyc > 0 ? (
                    <div className="flex items-center gap-3 bg-white/50 border border-white/80 p-2 pr-4 rounded-xl shadow-sm z-10 backdrop-blur-md">
                      {isCustomAvatar((todayTopFycUser as User).avatar) ? (
                        <img src={(todayTopFycUser as User).avatar} alt="avatar" className="w-10 h-10 rounded-lg object-cover border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
                      ) : (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm border-2 border-white ${(todayTopFycUser as User).avatar || 'bg-slate-400'}`}>
                          {(todayTopFycUser as User).realName.slice(0, 1)}
                        </div>
                      )}
                      <div className="flex flex-col text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-slate-800">{(todayTopFycUser as User).realName}</span>
                          <span className="text-lg font-black text-amber-600 bg-amber-100/80 px-2.5 py-0.5 rounded-md shadow-sm leading-none">{todayMaxFyc.toLocaleString()}</span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-700/80">{getAdventurerTitle((todayTopFycUser as User).totalScore).title}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-14 flex items-center justify-center z-10">
                      <span className="text-sm font-bold text-slate-400 italic bg-white/30 px-4 py-1.5 rounded-lg border border-white/50">虛位以待</span>
                    </div>
                  )}
                </div>

                {/* 右邊：本日探險冠軍 */}
                <div className="relative overflow-hidden bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center sm:flex-row sm:justify-between group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
                  {/* Decorative Background */}
                  <div className="absolute bottom-0 right-0 -mr-4 -mb-4 w-32 h-32 bg-gradient-to-br from-rose-400/20 to-red-500/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500 pointer-events-none"></div>
                  
                  <div className="flex flex-col items-center sm:items-start z-10 mb-3 sm:mb-0">
                    <div className="bg-gradient-to-r from-rose-500 to-red-500 text-white px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase flex items-center gap-1.5 shadow-md shadow-red-500/20 mb-2">
                      <Flame className="w-3.5 h-3.5" /> 本日探險冠軍
                    </div>
                    <div className="text-xs text-slate-500 font-medium ml-1">今日最多楓葉幣</div>
                  </div>

                  {todayTopExplorerUser && todayMaxCoins > 0 ? (
                    <div className="flex items-center gap-3 bg-white/50 border border-white/80 p-2 pr-4 rounded-xl shadow-sm z-10 backdrop-blur-md">
                      {isCustomAvatar((todayTopExplorerUser as User).avatar) ? (
                        <img src={(todayTopExplorerUser as User).avatar} alt="avatar" className="w-10 h-10 rounded-lg object-cover border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
                      ) : (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm border-2 border-white ${(todayTopExplorerUser as User).avatar || 'bg-slate-400'}`}>
                          {(todayTopExplorerUser as User).realName.slice(0, 1)}
                        </div>
                      )}
                      <div className="flex flex-col text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-slate-800">{(todayTopExplorerUser as User).realName}</span>
                          <span className="text-lg font-black text-rose-600 bg-rose-100/80 px-2.5 py-0.5 rounded-md shadow-sm leading-none">+{todayMaxCoins}</span>
                        </div>
                        <span className="text-[10px] font-bold text-rose-700/80">{getAdventurerTitle((todayTopExplorerUser as User).totalScore).title}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-14 flex items-center justify-center z-10">
                      <span className="text-sm font-bold text-slate-400 italic bg-white/30 px-4 py-1.5 rounded-lg border border-white/50">虛位以待</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-center justify-between shadow-sm mb-4">
                <div className="flex items-center gap-2 overflow-hidden flex-1">
                  <div className="bg-yellow-400 text-slate-900 px-2 py-0.5 rounded text-xs font-black uppercase shrink-0 flex items-center gap-1 shadow-sm">
                    <span className="animate-pulse">📌</span> 大隊佈告欄
                  </div>
                  {isEditingBulletin ? (
                    <input
                      type="text"
                      value={editBulletinText}
                      onChange={(e) => setEditBulletinText(e.target.value)}
                      className="flex-1 bg-white border border-yellow-300 rounded px-2 py-1 text-sm text-slate-800 outline-none focus:border-yellow-500 font-bold"
                      placeholder="輸入佈告欄訊息..."
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm font-bold text-slate-700 truncate">{bulletin || "目前沒有置頂佈告"}</span>
                  )}
                </div>
                {currentUser.role === 'admin' && (
                  <div className="shrink-0 ml-3 flex gap-2">
                    {isEditingBulletin ? (
                      <>
                        <button
                          onClick={handleUpdateBulletin}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold px-3 py-1 rounded transition"
                        >
                          儲存更新
                        </button>
                        <button
                          onClick={() => setIsEditingBulletin(false)}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-3 py-1 rounded transition"
                        >
                          取消
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setEditBulletinText(bulletin);
                          setIsEditingBulletin(true);
                        }}
                        className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded transition"
                      >
                        編輯佈告
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <section className={`grid gap-4 grid-cols-1 sm:grid-cols-2`}>
              
              {/* Stat 1: FYC Stats (Left-top) */}
              <div className="bg-white border-4 border-slate-100 p-5 rounded-3xl shadow-xl flex items-center justify-between">
                <div className="space-y-1 text-left flex-1">
                  <span className="text-xs font-mono text-slate-450 uppercase tracking-widest block">個人 FYC 業績</span>
                  <div className="text-2xl font-display font-black text-amber-600 font-mono flex items-baseline gap-1 mt-0.5">
                    {(currentUser?.fyc || 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-3.5 bg-amber-50 border border-amber-100 text-amber-600 rounded-2xl shrink-0 self-start">
                  <Coins className="w-6 h-6 text-amber-500 animate-pulse" />
                </div>
              </div>

              {/* Stat 2: Maple Coins Stats (Right-top) */}
              <div className="bg-white border-4 border-slate-100 p-5 rounded-3xl shadow-xl flex items-center justify-between">
                <div className="space-y-1 text-left flex-1">
                  <span className="text-xs font-mono text-slate-450 uppercase tracking-widest block">個人楓葉幣</span>
                  <div className="text-2xl font-display font-black text-red-650 font-mono flex items-baseline gap-1 mt-0.5">
                    {(currentUser?.mapleCoins ?? 0).toLocaleString()} <span className="text-xs text-slate-500 font-bold">🍁</span>
                  </div>
                </div>
                <div className="p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-2xl shrink-0 self-start">
                  <Trophy className="w-6 h-6 text-red-600 animate-pulse" />
                </div>
              </div>

              {/* Stat 3 & 4 are moved to CanadaMap component */}

            </section>

            {/* Team FYC Milestone Panel */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-4 border-slate-950 p-6 rounded-3xl shadow-2xl relative overflow-hidden text-white flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              
              <div className="relative z-10 flex-1 w-full space-y-2">
                <span className="text-sm font-mono text-amber-400 uppercase tracking-widest font-black block text-left">
                  大隊總FYC
                </span>
                <div className="text-4xl md:text-5xl font-display font-black text-white font-mono flex items-baseline gap-2 text-left">
                  {teamTotalFyc.toLocaleString()} <span className="text-xl text-slate-400 font-sans font-bold">/ {isFycMaxed ? '2,500,000+' : nextFycMilestone.toLocaleString()}</span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between items-center w-full">
                  <div className="text-left">
                    {isFycMaxed ? (
                      <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" /> 已達成最高級距獎勵 (250萬以上)！
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-slate-300 block">
                        距離下一級距還差 <span className="text-amber-400 ml-1 font-mono">{fycDiff.toLocaleString()}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative z-10 shrink-0 bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-2xl flex flex-col items-center justify-center text-center w-full md:w-auto min-w-[140px]">
                <span className="text-[10px] font-mono text-cyan-200 uppercase tracking-widest block mb-1">
                  目前FYC舉績率
                </span>
                <div className="text-xl font-black text-white font-mono flex items-baseline justify-center gap-1">
                  {fycReportedUsersCount} <span className="text-sm text-cyan-200">/ 37</span>
                </div>
                <div className="text-sm font-bold text-cyan-400 font-mono mt-1">
                  {fycAchievementRate.toFixed(1)}%
                </div>
              </div>

              {!isFycMaxed && (
                <div className="relative z-10 shrink-0 bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-2xl flex flex-col items-center justify-center text-center w-full md:w-auto min-w-[140px]">
                  <span className="text-[10px] font-mono text-amber-200 uppercase tracking-widest block mb-1">
                    大隊即將取得獎金
                  </span>
                  <div className="text-2xl font-black text-yellow-400 font-mono flex items-center justify-center gap-1">
                    <Coins className="w-5 h-5 text-yellow-400" />
                    {nextFycBonus.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab-driven Dashboard Content */}
        <div className="transition-all duration-300">
          {activeTab === 'home' && (
            <div className="space-y-6 max-w-5xl mx-auto transition-all duration-300">
              {/* 0. Shoutbox Trash Talk Board */}
              <div id="section-shoutbox" className="transition-all duration-300">
                <Shoutbox 
                  currentUser={currentUser}
                  onNewShoutSubmit={handleNewShoutSubmitted}
                />
              </div>

              {/* 1. Map Progress Board */}
              <div id="section-canada-map">
                <CanadaMap teamScore={squadTotalScore} />
              </div>

              {/* 2. Global Action Feed Stream */}
              <div id="section-activities-timeline">
                <Timeline activities={activities} users={users} />
              </div>
            </div>
          )}

          {activeTab === 'report' && (
            <div className="max-w-2xl mx-auto transition-all duration-300 space-y-6">
              {/* Report log component */}
              <div id="section-activity-logger">
                <ActivityReportForm 
                  currentUserId={currentUser.id}
                  currentUser={currentUser}
                  onSubmitActivity={handleSubmitActivity}
                />
              </div>
              
              {/* Limited Time Mission Section */}
              <div id="section-limited-missions" className="bg-gradient-to-br from-white via-slate-50 to-slate-100/80 border-4 border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col relative overflow-hidden text-center">
                <div className="absolute inset-0 bg-slate-50 opacity-50 bg-[linear-gradient(45deg,transparent_25%,rgba(68,64,60,0.05)_25%,rgba(68,64,60,0.05)_50%,transparent_50%,transparent_75%,rgba(68,64,60,0.05)_75%,rgba(68,64,60,0.05)_100%)] bg-[length:20px_20px]"></div>
                
                <div className="relative z-10 flex flex-col items-center justify-center">
                  <div className="mb-3">
                    <span className="text-[10px] font-mono text-rose-600 font-bold uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                      Coming Soon
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-display font-black text-slate-800 mb-6 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-rose-500" />
                    限時任務
                    <Sparkles className="w-6 h-6 text-rose-500" />
                  </h2>
                  
                  <div className="w-full py-12 flex flex-col items-center justify-center bg-white/60 rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 shadow-inner">
                    <div className="text-7xl font-black text-slate-300 mb-4 animate-pulse">?</div>
                    <p className="text-sm font-bold text-slate-500 tracking-wider">即將開放，敬請期待</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="max-w-3xl mx-auto transition-all duration-300">
              {/* Leaderboard scoring ranking table */}
              <div id="section-scoreboard-leaderboard">
                <ScoreBoard 
                  users={users}
                  activities={activities}
                  currentUserId={currentUser.id}
                  onRetractActivity={handleRetractActivity}
                  nextFycBonus={nextFycBonus}
                />
              </div>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="max-w-5xl mx-auto transition-all duration-300">
              <AdminPanel 
                users={users}
                activities={activities}
                currentUserId={currentUser.id}
                onRefreshData={fetchData}
                onResetDatabase={handleResetDatabase}
              />
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto space-y-6 transition-all duration-300">
              <ProfilePanel 
                currentUser={currentUser}
                onProfileUpdate={handleProfileUpdate}
              />
              <div id="section-badge-encyclopedia">
                <BadgeEncyclopedia currentUser={currentUser} activities={activities} />
              </div>
            </div>
          )}
        </div>
        


      </main>

      {/* Bottom Tab Navigation Bar */}
      <nav className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3 px-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] shrink-0">
        <div className="max-w-3xl mx-auto flex justify-around items-center gap-1 sm:gap-4">
          {/* Tab 1: 首頁 */}
          <button
            id="tab-btn-home"
            onClick={() => setActiveTab('home')}
            className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-3 py-2 px-3 sm:px-5 rounded-2xl transition-all duration-300 cursor-pointer ${
              activeTab === 'home'
                ? 'text-red-650 font-extrabold bg-red-50/80 shadow-xs scale-105'
                : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50'
            }`}
          >
            <Compass className={`w-5 h-5 transition-all duration-300 ${activeTab === 'home' ? 'text-red-600 scale-110 rotate-12' : 'text-slate-400'}`} />
            <div className="flex flex-col text-left">
              <span className="text-xs tracking-wide font-black">首頁</span>
              <span className="text-[9px] text-slate-400 font-normal leading-none hidden sm:inline">探險地圖、最新冒險戰報</span>
            </div>
          </button>

          {/* Tab 2: 行動回報 */}
          <button
            id="tab-btn-report"
            onClick={() => setActiveTab('report')}
            className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-3 py-2 px-3 sm:px-5 rounded-2xl transition-all duration-300 cursor-pointer ${
              activeTab === 'report'
                ? 'text-red-650 font-extrabold bg-red-50/80 shadow-xs scale-105'
                : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50'
            }`}
          >
            <Activity className={`w-5 h-5 transition-all duration-300 ${activeTab === 'report' ? 'text-red-600 scale-110' : 'text-slate-400'}`} />
            <div className="flex flex-col text-left">
              <span className="text-xs tracking-wide font-black">行動回報</span>
              <span className="text-[9px] text-slate-400 font-normal leading-none hidden sm:inline">即時戰績申報</span>
            </div>
          </button>

          {/* Tab 3: 排行榜 */}
          <button
            id="tab-btn-leaderboard"
            onClick={() => setActiveTab('leaderboard')}
            className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-3 py-2 px-3 sm:px-5 rounded-2xl transition-all duration-300 cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'text-red-650 font-extrabold bg-red-50/80 shadow-xs scale-105'
                : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50'
            }`}
          >
            <Trophy className={`w-5 h-5 transition-all duration-300 ${activeTab === 'leaderboard' ? 'text-red-600 scale-110 -rotate-12' : 'text-slate-400'}`} />
            <div className="flex flex-col text-left">
              <span className="text-xs tracking-wide font-black">排行榜</span>
              <span className="text-[9px] text-slate-400 font-normal leading-none hidden sm:inline">小隊榮譽排名</span>
            </div>
          </button>

          {/* Tab 4: 楓葉商城 */}
          {currentUser && (
            <button
              id="tab-btn-admin"
              onClick={() => setActiveTab('admin')}
              className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-3 py-2 px-3 sm:px-5 rounded-2xl transition-all duration-300 cursor-pointer ${
                activeTab === 'admin'
                  ? 'text-red-650 font-extrabold bg-red-50/80 shadow-xs scale-105'
                  : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50'
              }`}
            >
              <Shield className={`w-5 h-5 transition-all duration-300 ${activeTab === 'admin' ? 'text-red-600 scale-110' : 'text-slate-400'}`} />
              <div className="flex flex-col text-left">
                <span className="text-xs tracking-wide font-black">楓葉商城</span>
                <span className="text-[9px] text-slate-400 font-normal leading-none hidden sm:inline">商城兌換與管理</span>
              </div>
            </button>
          )}

          {/* Tab 5: 個人帳號管理 */}
          <button
            id="tab-btn-profile"
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-3 py-2 px-3 sm:px-5 rounded-2xl transition-all duration-300 cursor-pointer ${
              activeTab === 'profile'
                ? 'text-red-650 font-extrabold bg-red-50/80 shadow-xs scale-105'
                : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50'
            }`}
          >
            <UserCog className={`w-5 h-5 transition-all duration-300 ${activeTab === 'profile' ? 'text-red-600 scale-110' : 'text-slate-400'}`} />
            <div className="flex flex-col text-left">
              <span className="text-xs tracking-wide font-black">個人頁面</span>
              <span className="text-[9px] text-slate-400 font-normal leading-none hidden sm:inline">修改姓名與密碼</span>
            </div>
          </button>
        </div>
      </nav>

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-[9999] p-4" id="global-confirm-modal">
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

      {/* Custom Alert Modal */}
      {alertModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-[9999] p-4" id="global-alert-modal">
          <div className="bg-white border-4 border-slate-100 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-left">
            <div className="flex items-center gap-3 mb-4 text-amber-500">
              <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-2xl">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-black text-slate-800">{alertModal.title}</h3>
            </div>
            
            <p className="text-xs text-slate-600 font-bold leading-relaxed mb-6 whitespace-pre-line">
              {alertModal.message}
            </p>
            
            <button
              onClick={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black transition cursor-pointer text-center shadow-md"
            >
              我知道了
            </button>
          </div>
        </div>
      )}

            {/* Badge Unlock Broadcast Overlay */}
      <AnimatePresence>
        {showBadgePopup && currentBadgeEventToShow && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-[10000] p-4"
            id="badge-unlock-popup"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1, transition: { type: "spring", stiffness: 150, damping: 20 } }}
              exit={{ scale: 0.9, y: 50, opacity: 0 }}
              className="bg-white border-8 border-indigo-400 rounded-[36px] max-w-lg w-full p-8 shadow-2xl relative text-center overflow-hidden flex flex-col items-center"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />
              <span className="absolute top-4 left-4 text-2xl animate-pulse">🏅</span>
              <span className="absolute top-4 right-4 text-2xl animate-pulse">🎉</span>

              {/* Close button */}
              <button 
                onClick={handleCloseBadgePopup}
                className="absolute top-4 right-14 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition rounded-full cursor-pointer z-10"
                aria-label="Close Badge popup"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center border-4 border-indigo-200 shadow-inner mb-6 relative z-10">
                <span className="text-5xl drop-shadow-md">{currentBadgeEventToShow.badgeIcon}</span>
              </div>
              
              <div className="mb-6 relative z-10">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  徽章解鎖通知
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </p>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {currentBadgeEventToShow.realName}
                </h2>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">
                    {currentBadgeEventToShow.team}
                  </span>
                </div>
              </div>
              
              <p className="text-lg font-bold text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 shadow-sm w-full relative z-10 leading-relaxed">
                成功解鎖徽章<br/>
                <span className="text-2xl font-black text-indigo-600 my-1 block">【{currentBadgeEventToShow.badgeTitle}】</span>
                <span className="text-sm text-slate-500 font-normal">{currentBadgeEventToShow.badgeDesc}</span>
              </p>
              
              <p className="text-sm text-slate-500 mb-8 font-medium italic relative z-10 leading-relaxed">
                🏅 恭喜達成全新里程碑，繼續保持這股氣勢！
              </p>

              {/* Call to action action button */}
              <button
                onClick={handleCloseBadgePopup}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-2xl text-sm font-black transition cursor-pointer text-center shadow-lg shadow-indigo-200 uppercase tracking-widest flex items-center justify-center gap-2 z-10 relative"
              >
                <span>收下徽章 🎯</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Large Promotion Broadcast Overlay */}
      <AnimatePresence>
        {showPromoPopup && currentPromoToShow && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-[10000] p-4"
            id="large-promotion-popup"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1, transition: { type: "spring", stiffness: 150, damping: 20 } }}
              exit={{ scale: 0.9, y: 50, opacity: 0 }}
              className={`bg-white border-8 ${currentPromoToShow.newRank === 99 ? 'border-cyan-400' : 'border-amber-400'} rounded-[36px] max-w-lg w-full p-8 shadow-2xl relative text-center overflow-hidden flex flex-col items-center`}
            >
              {currentPromoToShow.newRank === 99 ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-blue-500/5 to-transparent pointer-events-none" />
                  <span className="absolute top-4 left-4 text-2xl animate-pulse">💎</span>
                  <span className="absolute top-4 right-4 text-2xl animate-pulse">💎</span>

                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full scale-125 animate-pulse" />
                    <div className="w-24 h-24 bg-cyan-900 border-4 border-cyan-400 rounded-full flex items-center justify-center shadow-lg relative mx-auto text-4xl">
                      💎
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 w-full space-y-3 mb-6 text-slate-700 flex flex-col items-center justify-center">
                    {currentPromoToShow.avatar && isCustomAvatar(currentPromoToShow.avatar) ? (
                      <img 
                        src={currentPromoToShow.avatar} 
                        alt={currentPromoToShow.realName} 
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-400"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl border-2 border-cyan-400 ${currentPromoToShow.avatar || 'bg-cyan-600'}`}>
                        {currentPromoToShow.realName.slice(0, 1)}
                      </div>
                    )}
                    <h2 className="text-3xl font-display font-black text-slate-800 tracking-tight mt-2">
                      {currentPromoToShow.realName}
                    </h2>
                    <h3 className="text-xl font-bold text-slate-500">
                      {currentPromoToShow.oldTitle}
                    </h3>
                  </div>

                  <h1 className="text-4xl font-black text-cyan-600 mb-6 drop-shadow-sm">成為鑽石業務</h1>

                  <button
                    onClick={handleClosePromoPopup}
                    className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-2xl text-sm font-black transition cursor-pointer text-center shadow-lg shadow-cyan-100 uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <span>給予最高敬意 💎</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Golden dynamic burst behind */}
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-rose-500/5 to-transparent pointer-events-none" />
                  
                  {/* Corner maple leaves or decorations */}
                  <span className="absolute top-4 left-4 text-2xl animate-pulse">🍁</span>
                  <span className="absolute top-4 right-4 text-2xl animate-pulse">👑</span>

                  {/* Glowing title rank badge */}
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full scale-125 animate-pulse" />
                    <BadgeIcon rank={currentPromoToShow.newRank} size="xl" animate={true} />
                  </div>

                  {/* Title Header */}
                  <div className="space-y-1 mb-5">
                    <span className="text-xs font-mono font-black text-amber-500 uppercase tracking-[0.25em] block">冒險者名揚全境</span>
                    <h2 className="text-3xl font-display font-black text-slate-800 tracking-tight">
                      🍁 稱號重大突破 🍁
                    </h2>
                  </div>

                  {/* Promotion detail card */}
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 w-full space-y-3 mb-6 text-slate-700">
                    <div className="flex items-center gap-3 justify-center">
                      {currentPromoToShow.avatar && isCustomAvatar(currentPromoToShow.avatar) ? (
                        <img 
                          src={currentPromoToShow.avatar} 
                          alt={currentPromoToShow.realName} 
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${currentPromoToShow.avatar || 'bg-orange-500'}`}>
                          {currentPromoToShow.realName.slice(0, 1)}
                        </div>
                      )}
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <strong className="text-slate-800 font-bold text-sm">{currentPromoToShow.realName}</strong>
                          <span className="bg-orange-50 text-orange-650 border border-orange-100 text-[9px] font-bold px-1.5 py-0.2 rounded-md shrink-0">
                            {currentPromoToShow.team}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block">@{currentPromoToShow.username}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-4 text-xs font-bold text-slate-500">
                      <div className="text-center">
                        <span className="text-[10px] text-slate-400 font-normal block">原稱號</span>
                        <span className="line-through text-slate-400">{currentPromoToShow.oldTitle}</span>
                      </div>
                      <span className="text-lg text-amber-500 font-black">➔</span>
                      <div className="text-center">
                        <span className="text-[10px] text-amber-600 block">晉升稱號</span>
                        <span className="text-orange-600 font-black text-sm">{currentPromoToShow.newTitle}</span>
                      </div>
                    </div>
                  </div>

                  {/* Motivational message */}
                  <p className="text-sm font-sans font-black text-slate-700 leading-relaxed max-w-sm mb-6">
                    「{BADGE_DETAILS[currentPromoToShow.newRank]?.description}」
                  </p>

                  {/* Call to action action button */}
                  <button
                    onClick={handleClosePromoPopup}
                    className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl text-sm font-black transition cursor-pointer text-center shadow-lg shadow-orange-100 uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <span>致敬傳奇勇者 ⚔️</span>
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1.5. Large FYC Broadcast Overlay */}
      <AnimatePresence>
        {showFycPopup && currentFycToShow && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-[10000] p-4"
            id="large-fyc-popup"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1, transition: { type: "spring", stiffness: 150, damping: 20 } }}
              exit={{ scale: 0.9, y: 50, opacity: 0 }}
              className="bg-white border-8 border-rose-500 rounded-[36px] max-w-lg w-full p-8 shadow-2xl relative text-center overflow-hidden flex flex-col items-center"
            >
              {/* Flame/Rose dynamic gradient burst behind */}
              <div className="absolute inset-0 bg-gradient-to-b from-rose-500/10 via-orange-500/5 to-transparent pointer-events-none" />
              
              {/* Corner maple leaves or decorations */}
              <span className="absolute top-4 left-4 text-2xl animate-pulse">🔥</span>
              <span className="absolute top-4 right-4 text-2xl animate-pulse">🍁</span>

              {/* Close button at top-right */}
              <button 
                onClick={handleCloseFycPopup}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition rounded-full cursor-pointer z-10"
                aria-label="Close FYC popup"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Glowing Achievement Trophy */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-rose-500/20 blur-2xl rounded-full scale-125 animate-pulse" />
                <div className="w-20 h-20 bg-rose-50 border-4 border-rose-400 rounded-full flex items-center justify-center shadow-lg relative animate-bounce">
                  <Trophy className="w-10 h-10 text-rose-500" />
                </div>
              </div>

              {/* Title Header */}
              <div className="space-y-1 mb-5">
                <span className="text-xs font-mono font-black text-rose-600 uppercase tracking-[0.25em] block">🎉 榮耀捷報 • 全員喝采 👑</span>
                <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-800 tracking-tight">
                  FYC 業績重大突破！
                </h2>
              </div>

              {/* User detail card */}
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 w-full space-y-4 mb-6 text-slate-700">
                <div className="flex items-center gap-3 justify-center">
                  {currentFycToShow.avatar && isCustomAvatar(currentFycToShow.avatar) ? (
                    <img 
                      src={currentFycToShow.avatar} 
                      alt={currentFycToShow.realName} 
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${currentFycToShow.avatar || 'bg-orange-500'}`}>
                      {currentFycToShow.realName.slice(0, 1)}
                    </div>
                  )}
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <strong className="text-slate-800 font-bold text-base">{currentFycToShow.realName}</strong>
                      <span className="bg-rose-50 text-rose-650 border border-rose-100 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">
                        {currentFycToShow.team}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono block">@{currentFycToShow.username}</span>
                  </div>
                </div>

                {/* Big FYC Figure */}
                <div className="pt-4 border-t border-slate-150 text-center">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest block mb-1">受理 FYC</span>
                  <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-orange-500 text-transparent bg-clip-text font-black text-3xl sm:text-4xl tracking-tight">
                    <span>${Number(currentFycToShow.amount).toLocaleString()}</span>
                  </div>
                </div>

                {/* Optional Note */}
                {currentFycToShow.note && (
                  <div className="bg-rose-50/50 border border-rose-100/50 rounded-xl p-3 text-lg sm:text-xl text-rose-800 font-bold">
                    成交 {currentFycToShow.note === '受理 FYC 申報' ? '' : currentFycToShow.note}
                  </div>
                )}
              </div>

              {/* Motivational slogan */}
              <p className="text-xs text-slate-400 font-medium mb-6">
                🔥 每一份成交都是汗水與實力的結晶，讓我們為勇士的榮耀致敬！
              </p>

              {/* Call to action action button */}
              <button
                onClick={handleCloseFycPopup}
                className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white rounded-2xl text-sm font-black transition cursor-pointer text-center shadow-lg shadow-rose-100 uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <span>致敬探險英雄 ⚔️</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Login Welcome Notification Centered Overlay Modal */}
      <AnimatePresence>
        {showLoginWelcome && currentUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-[10000] p-4"
            id="login-welcome-popup"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1, transition: { type: "spring", stiffness: 150, damping: 20 } }}
              exit={{ scale: 0.9, y: 50, opacity: 0 }}
              className="bg-white border-8 border-orange-400 rounded-[36px] max-w-lg w-full p-8 shadow-2xl relative text-center overflow-hidden flex flex-col items-center"
            >
              {/* Orange dynamic burst behind */}
              <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-transparent pointer-events-none" />
              
              {/* Corner maple leaves or decorations */}
              <span className="absolute top-4 left-4 text-2xl animate-pulse">🍁</span>
              <span className="absolute top-4 right-4 text-2xl animate-pulse">🛡️</span>

              {/* Close button at top-right */}
              <button 
                onClick={() => setShowLoginWelcome(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition rounded-full cursor-pointer z-10"
                aria-label="Close welcome banner"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Glowing title rank badge */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full scale-125 animate-pulse" />
                <BadgeIcon rank={getAdventurerTitle(currentUser.totalScore).rank} size="xl" animate={true} />
              </div>

              {/* Title Header */}
              <div className="space-y-1 mb-5">
                <span className="text-xs font-mono font-black text-orange-500 uppercase tracking-[0.25em] block">冒險角色成功載入 🎮</span>
                <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-800 tracking-tight">
                  探險家 {currentUser.realName}，歡迎登入！
                </h2>
              </div>

              {/* Adventure Details Card */}
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 w-full space-y-3 mb-6 text-slate-700 text-center">
                <div className="text-center">
                  <span className="text-xs text-slate-400 font-bold block mb-1">當前冒險榮譽稱號</span>
                  <span className="text-lg text-orange-600 font-black">{getAdventurerTitle(currentUser.totalScore).title}</span>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium px-4">
                    「{getAdventurerTitle(currentUser.totalScore).description}」
                  </p>
                </div>

                {getAdventurerTitle(currentUser.totalScore).rank < 6 ? (
                  <div className="pt-3 border-t border-slate-100 space-y-1.5 max-w-xs mx-auto">
                    <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400 px-1">
                      <span>升級進度</span>
                      <span>{currentUser.totalScore} / {BADGE_DETAILS[getAdventurerTitle(currentUser.totalScore).rank + 1]?.min} 楓葉幣</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-amber-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (currentUser.totalScore / BADGE_DETAILS[getAdventurerTitle(currentUser.totalScore).rank + 1]?.min) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-orange-650 font-sans block text-center leading-normal px-1">
                      💡 再拿 <strong className="text-amber-600 font-black">{BADGE_DETAILS[getAdventurerTitle(currentUser.totalScore).rank + 1]?.min - currentUser.totalScore}</strong> 楓葉幣即可解鎖下一階段稱號！
                    </span>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1 text-[10px] text-yellow-600 font-black uppercase tracking-wider animate-pulse">
                    <span>👑 您已問鼎冒險之巔！達成最高榮耀！</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => setShowLoginWelcome(false)}
                className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl text-sm font-black transition cursor-pointer text-center shadow-lg shadow-orange-100 uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <span>開始加拿大探險 ⚔️</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Glorious Landmark Unlock Overlay */}
      <AnimatePresence>
        {showLandmarkPopup && currentLandmarkEventToShow && (() => {
          const matchedLandmark = LANDMARKS.find(lm => lm.id === currentLandmarkEventToShow.landmarkId);
          const displayImage = matchedLandmark ? matchedLandmark.image : currentLandmarkEventToShow.landmarkImage;
          const displayEnName = matchedLandmark ? matchedLandmark.nameEn : (currentLandmarkEventToShow.landmarkNameEn || "");
          
          return (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-[10000] p-4"
              id="large-landmark-unlock-popup"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1, transition: { type: "spring", stiffness: 150, damping: 20 } }}
                exit={{ scale: 0.9, y: 50, opacity: 0 }}
                className="bg-white border-8 border-yellow-400 rounded-[32px] max-w-md w-full p-5 sm:p-6 shadow-2xl relative text-center flex flex-col items-center max-h-[calc(100vh-2rem)] overflow-y-auto"
              >
                {/* Yellow/Gold dynamic gradient burst behind */}
                <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 via-amber-500/5 to-transparent pointer-events-none" />
                
                {/* Corner maple leaves or decorations */}
                <span className="absolute top-4 left-4 text-xl animate-pulse">🍁</span>
                <span className="absolute top-4 right-4 text-xl animate-pulse">🏔️</span>

                {/* Close button at top-right */}
                <button 
                  onClick={handleCloseLandmarkPopup}
                  className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition rounded-full cursor-pointer z-10"
                  aria-label="Close Landmark popup"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Glowing Achievement Badge */}
                <div className="relative mb-4 mt-2">
                  <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full scale-125 animate-pulse" />
                  <div className="w-14 h-14 bg-yellow-50 border-4 border-yellow-400 rounded-full flex items-center justify-center shadow-md relative animate-bounce">
                    <Compass className="w-7 h-7 text-yellow-500 animate-[spin_10s_linear_infinite]" />
                  </div>
                </div>

                {/* Title Header */}
                <div className="space-y-0.5 mb-4">
                  <span className="text-[10px] font-mono font-black text-yellow-600 uppercase tracking-[0.2em] block">🎉 榮耀解鎖 • 抵達里程碑 🏆</span>
                  <h2 className="text-xl sm:text-2xl font-display font-black text-slate-800 tracking-tight">
                    小隊成功抵達地點！
                  </h2>
                </div>

                {/* Scenery Photo Card */}
                <div className="w-full rounded-xl overflow-hidden border border-slate-150 shadow-sm relative h-28 sm:h-32 bg-slate-100 mb-4 group shrink-0">
                  <img 
                    src={displayImage} 
                    alt={currentLandmarkEventToShow.landmarkName} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1480497490787-505ec076689f?auto=format&fit=crop&q=80&w=800';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent p-3 flex flex-col justify-end text-left">
                    <span className="text-[9px] text-yellow-400 font-bold uppercase tracking-widest leading-none mb-0.5">
                      小隊累積：{currentLandmarkEventToShow.teamTotalScore} 積分
                    </span>
                    <h3 className="text-sm font-black text-white font-display">
                      {currentLandmarkEventToShow.landmarkName}
                    </h3>
                    <p className="text-[9px] text-slate-300 font-mono">
                      {displayEnName}
                    </p>
                  </div>
                </div>

                {/* Detail card (matching design) */}
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 w-full space-y-2 mb-4 text-slate-700 text-center">
                  <p className="text-xs font-sans font-medium text-slate-600 leading-relaxed">
                    在探險先鋒 <strong className="text-yellow-600 font-black text-xs sm:text-sm">{currentLandmarkEventToShow.realName}</strong> 的帶領與全體隊員的熱血奮鬥下，【<strong className="text-amber-600 font-black">{currentLandmarkEventToShow.teamName}</strong>】小隊順利通過挑戰，成功解鎖全新加拿大地標！
                  </p>
                  <div className="pt-1.5 border-t border-slate-150 flex items-center justify-center gap-1 text-[9px] text-yellow-600 font-black uppercase tracking-wider animate-pulse">
                    <span>🍁 共享卓越榮耀 • 邁向下一站 🤝</span>
                  </div>
                </div>

                {/* Call to action action button */}
                <button
                  onClick={handleCloseLandmarkPopup}
                  className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white rounded-xl text-xs sm:text-sm font-black transition cursor-pointer text-center shadow-md shadow-yellow-100 uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <span>致敬探險先鋒 ⚔️</span>
                </button>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
