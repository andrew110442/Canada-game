import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { User, ActivityReport, ActivityType, ACTIVITY_RULES, ShoutMessage, FycEvent, LandmarkUnlockEvent, getAdventurerTitle, BADGE_RULES, BadgeUnlockEvent, STORE_ITEMS } from "./src/types";

// Standard file path for simple persistent storage
const DB_FILE = path.join(process.cwd(), "db_storage.json");

interface PromotionEvent {
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

interface TeamRedemption {
  id: string;
  team: string;
  cost: number;
  reward: string;
  timestamp: string;
  captainName: string;
}

interface ItemRedemption {
  id: string;
  userId: string;
  realName: string;
  team: string;
  itemId: string;
  itemName: string;
  cost: number;
  timestamp: string;
}

interface DatabaseSchema {
  users: User[];
  activities: ActivityReport[];
  shouts?: ShoutMessage[];
  promotions?: PromotionEvent[];
  fycEvents?: FycEvent[];
  landmarkEvents?: LandmarkUnlockEvent[];
  teamRedemptions?: TeamRedemption[];
  itemRedemptions?: ItemRedemption[];
  badgeEvents?: any[];
  bulletin?: string;
}

// Initial demo data to make the app immediate, rich, and engaging
const INITIAL_DB: DatabaseSchema = {
  users: [
    { id: "u-admin", username: "andrew110442", password: "123", realName: "Andrew (大隊長)", avatar: "bg-red-500", role: "admin", totalScore: 0, team: "極光小隊", fyc: 0 }
  ],
  activities: [],
  shouts: [],
  promotions: [],
  fycEvents: [],
  landmarkEvents: [],
  teamRedemptions: [],
  itemRedemptions: [],
  bulletin: "歡迎來到加拿大冒險國度！"
};

function getTitleRank(score: number): number {
  if (score <= 50) return 1;
  if (score <= 100) return 2;
  if (score <= 200) return 3;
  if (score <= 300) return 4;
  if (score <= 400) return 5;
  if (score <= 600) return 6;
  if (score <= 900) return 7;
  if (score <= 1200) return 8;
  if (score <= 2000) return 9;
  if (score <= 3000) return 10;
  if (score <= 5000) return 11;
  return 12;
}

function getTitleName(score: number): string {
  if (score <= 50) return '初始勇者 🍁';
  if (score <= 100) return '楓林行者 🌲';
  if (score <= 200) return '落磯山獵手 🏔️';
  if (score <= 300) return '黃刀守衛 🛡️';
  if (score <= 400) return '尼加拉騎士 ⚔️';
  if (score <= 600) return '荒野大開拓家 🪓';
  if (score <= 900) return '芬迪潮汐領主 🐋';
  if (score <= 1200) return '勞倫斯破冰船長 ⚓';
  if (score <= 2000) return '極地無畏戰神 ❄️';
  if (score <= 3000) return '極光聖域智者 🌌';
  if (score <= 5000) return '冰川不滅巨擘 🧊';
  return '極境至尊 👑';
}

function checkAndLogBadgeUnlock(db: DatabaseSchema, user: User, preActivities: ActivityReport[], postActivities: ActivityReport[]) {
  if (!db.badgeEvents) db.badgeEvents = [];
  if (!db.shouts) db.shouts = [];

  const getBadgeUnlocks = (activities: ActivityReport[]) => {
    const counts: Record<string, number> = {};
    for (const act of activities) {
      if (act.userId === user.id) {
        counts[act.type] = (counts[act.type] || 0) + act.count;
      }
    }
    const unlockedIds = new Set<string>();
    for (const rule of BADGE_RULES) {
      const current = counts[rule.type] || 0;
      if (current >= rule.min) {
        unlockedIds.add(rule.id);
      }
    }
    return unlockedIds;
  };

  const preUnlocks = getBadgeUnlocks(preActivities);
  const postUnlocks = getBadgeUnlocks(postActivities);

  for (const rule of BADGE_RULES) {
    if (!preUnlocks.has(rule.id) && postUnlocks.has(rule.id)) {
      const event: BadgeUnlockEvent = {
        id: `badge-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        userId: user.id,
        realName: user.realName,
        username: user.username,
        avatar: user.avatar,
        team: user.team || "極光小隊",
        badgeId: rule.id,
        badgeTitle: rule.title,
        badgeIcon: rule.icon,
        badgeDesc: rule.desc,
        timestamp: new Date().toISOString(),
      };
      db.badgeEvents.push(event);

      const shoutText = `🎉 恭喜解鎖徽章【${rule.icon} ${rule.title}】！${rule.desc}`;
      const newShout: ShoutMessage = {
        id: `shout-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        userId: user.id,
        username: user.username,
        realName: user.realName,
        avatar: user.avatar,
        team: user.team || "極光小隊",
        text: shoutText,
        timestamp: new Date().toISOString(),
      };
      db.shouts.push(newShout);
    }
  }
}

function checkAndLogPromotion(db: DatabaseSchema, user: User, oldScore: number, newScore: number) {
  const oldRank = getTitleRank(oldScore);
  const newRank = getTitleRank(newScore);
  if (newRank > oldRank) {
    const oldTitle = getTitleName(oldScore);
    const newTitle = getTitleName(newScore);
    const event: PromotionEvent = {
      id: `promo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId: user.id,
      realName: user.realName,
      username: user.username,
      avatar: user.avatar,
      team: user.team || "極光小隊",
      oldTitle,
      newTitle,
      newRank,
      timestamp: new Date().toISOString()
    };
    if (!db.promotions) {
      db.promotions = [];
    }
    db.promotions.push(event);
    
    // Also post a system shout message automatically so others can see it in real-time
    const newDesc = getAdventurerTitle(newScore).description;
    const shoutText = `🎉 賀！我成功晉升為 【${newTitle}】 啦！${newDesc}`;
    const newShout: ShoutMessage = {
      id: `shout-promo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId: user.id,
      username: user.username,
      realName: user.realName,
      avatar: user.avatar,
      team: user.team || "極光小隊",
      text: shoutText,
      timestamp: new Date().toISOString()
    };
    if (!db.shouts) {
      db.shouts = [];
    }
    db.shouts.push(newShout);
  }
}

const LANDMARKS_MINIMAL = [
  { id: 'victoria', name: '維多利亞內港', nameEn: 'Victoria Inner Harbour', pointsRequired: 50, image: 'https://images.unsplash.com/photo-1501446529957-6226bd447c46?auto=format&fit=crop&q=80&w=600' },
  { id: 'vancouver', name: '溫哥華史丹利公園', nameEn: 'Stanley Park, Vancouver', pointsRequired: 100, image: 'https://images.unsplash.com/photo-1501446529957-6226bd447c46?auto=format&fit=crop&q=80&w=600' },
  { id: 'banff', name: '落磯山路易斯湖', nameEn: 'Lake Louise, Banff', pointsRequired: 200, image: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&q=80&w=600' },
  { id: 'yellowknife', name: '黃刀鎮極光', nameEn: 'Yellowknife Aurora', pointsRequired: 350, image: 'https://images.unsplash.com/photo-1501446529957-6226bd447c46?auto=format&fit=crop&q=80&w=600' },
  { id: 'churchill', name: '邱吉爾鎮北極熊', nameEn: 'Churchill Polar Bears', pointsRequired: 500, image: 'https://images.unsplash.com/photo-1501446529957-6226bd447c46?auto=format&fit=crop&q=80&w=600' },
  { id: 'niagara', name: '尼加拉大瀑布', nameEn: 'Niagara Falls', pointsRequired: 700, image: 'https://images.unsplash.com/photo-1501446529957-6226bd447c46?auto=format&fit=crop&q=80&w=600' },
  { id: 'cntower', name: '多倫多電視塔', nameEn: 'CN Tower', pointsRequired: 900, image: 'https://images.unsplash.com/photo-1501446529957-6226bd447c46?auto=format&fit=crop&q=80&w=600' },
  { id: 'quebec', name: '魁北克老城', nameEn: 'Old Quebec Castle', pointsRequired: 1100, image: 'https://images.unsplash.com/photo-1501446529957-6226bd447c46?auto=format&fit=crop&q=80&w=600' },
  { id: 'hopewell', name: '芬迪灣霍普威爾岩', nameEn: 'Hopewell Rocks, Bay of Fundy', pointsRequired: 1300, image: 'https://images.unsplash.com/photo-1501446529957-6226bd447c46?auto=format&fit=crop&q=80&w=600' },
  { id: 'peggys', name: '佩姬灣燈塔', nameEn: "Peggy's Cove Lighthouse", pointsRequired: 1500, image: 'https://images.unsplash.com/photo-1501446529957-6226bd447c46?auto=format&fit=crop&q=80&w=600' }
];

function checkAndLogLandmarkUnlock(db: DatabaseSchema, user: User, oldSquadTotalScore: number, newSquadTotalScore: number) {
  LANDMARKS_MINIMAL.forEach(lm => {
    if (oldSquadTotalScore < lm.pointsRequired && newSquadTotalScore >= lm.pointsRequired) {
      const event: LandmarkUnlockEvent = {
        id: `landmark-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        landmarkId: lm.id,
        landmarkName: lm.name,
        landmarkNameEn: lm.nameEn,
        landmarkImage: lm.image,
        teamName: user.team || "極光小隊",
        realName: user.realName,
        teamTotalScore: newSquadTotalScore,
        timestamp: new Date().toISOString()
      };
      if (!db.landmarkEvents) {
        db.landmarkEvents = [];
      }
      db.landmarkEvents.push(event);

      // Also post a system shout message automatically so others can see it in real-time
      const shoutText = `🏆 賀！【${event.teamName}】已成功抵達 ${event.landmarkName}！在探險家 ${event.realName} 的帶領下，小隊成功解鎖此著名地標！🎉🍁`;
      const newShout: ShoutMessage = {
        id: `shout-landmark-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        userId: "system",
        username: "system",
        realName: "系統廣播",
        avatar: "bg-red-650",
        team: "探險總部",
        text: shoutText,
        timestamp: new Date().toISOString()
      };
      if (!db.shouts) {
        db.shouts = [];
      }
      db.shouts.push(newShout);
    }
  });
}

const keyMap: Record<string, string> = {
  '约访': '約訪',
  '实体拜访': '實體拜訪',
  '递送建议书': '遞送建議書',
  '成交签约': '成交壽險件',
  '成交簽約': '成交壽險件',
  '保全变更': '保全變更',
  '邀约转介绍': '邀約轉介紹',
  '成交产团险': '成交產團險',
  '开增员议题': '開增員議題',
  '增员绑定': '增員綁定',
};

// TaskQueue for serializing concurrent database modifying requests to avoid race conditions and disk I/O conflicts
class TaskQueue {
  private queue: (() => Promise<any>)[] = [];
  private running = false;

  async add<T>(task: () => Promise<T> | T): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
      this.runNext();
    });
  }

  private async runNext() {
    if (this.running || this.queue.length === 0) return;
    this.running = true;
    const task = this.queue.shift();
    if (task) {
      try {
        await task();
      } catch (err) {
        console.error("Queue task error:", err);
      }
    }
    this.running = false;
    this.runNext();
  }
}
const dbQueue = new TaskQueue();

// Helper functions to read/write persistent database
let memoryDb: DatabaseSchema | null = null;

function loadDatabase(): DatabaseSchema {
  if (memoryDb) {
    return memoryDb;
  }
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const db = JSON.parse(data) as DatabaseSchema;
      let changed = false;

      // Handle activities map key updates
      db.activities.forEach(act => {
        const mapped = keyMap[act.type];
        if (mapped && mapped !== act.type) {
          act.type = mapped as any;
          changed = true;
        }
      });

      // Delete test users cleanup removed - keep all accounts unless manually deleted by admin

      // Migrate roles: ensure andrew110442 (or andrew) is the ONLY administrator
      let hasAndrew = false;
      db.users.forEach(u => {
        // Migration: Ensure everyone has a password and fyc
        if (!u.password) {
          u.password = "123";
          changed = true;
        }
        if (u.fyc === undefined) {
          u.fyc = 0;
          changed = true;
        }
        if (!u.items) {
          u.items = [];
          changed = true;
        }
        if (u.mapleCoins === undefined) {
          u.mapleCoins = u.totalScore;
          changed = true;
        }

        const isAndrew = u.username.toLowerCase() === "andrew110442" || u.username.toLowerCase() === "andrew";
        if (isAndrew) {
          if (u.role !== "admin") {
            u.role = "admin";
            changed = true;
          }
          hasAndrew = true;
        } else {
          if (u.role === "admin") {
            u.role = "user";
            changed = true;
          }
        }
      });

      if (!hasAndrew) {
        db.users.push({
          id: "u-admin",
          username: "andrew110442",
          password: "123",
          realName: "Andrew (大隊長)",
          avatar: "bg-red-500",
          role: "admin",
          totalScore: 0,
          mapleCoins: 0,
          team: "極光小隊",
          fyc: 0
        });
        changed = true;
      }

      if (!db.shouts) {
        db.shouts = [];
        changed = true;
      } else {
        const now = Date.now();
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        const activeShouts = db.shouts.filter((shout: any) => {
          if (shout.content && !shout.text) {
            shout.text = shout.content;
            delete shout.content;
            changed = true;
          }
          return new Date(shout.timestamp).getTime() >= oneDayAgo;
        });
        
        if (activeShouts.length !== db.shouts.length) {
          db.shouts = activeShouts;
          changed = true;
        }
      }

      if (!db.promotions) {
        db.promotions = [];
        changed = true;
      }

      if (!db.fycEvents) {
        db.fycEvents = [];
        changed = true;
      }

      if (!db.landmarkEvents) {
        db.landmarkEvents = [];
        changed = true;
      }

      if (changed) {
        saveDatabase(db);
      } else {
        memoryDb = db;
      }
      return memoryDb;
    }
  } catch (err) {
    console.error("Error reading database file, using fallback:", err);
  }
  // If file doesn't exist or is corrupted, write initial data and return it
  saveDatabase(INITIAL_DB);
  return memoryDb!;
}

function saveDatabase(data: DatabaseSchema) {
  memoryDb = data;
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error("Error writing database file:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // API - Get Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API - Shoutbox: Post a new shout
  app.post("/api/shouts", async (req, res) => {
    try {
      await dbQueue.add(async () => {
        const { userId, text } = req.body;
        if (!userId || !text || !text.trim()) {
          return res.status(400).json({ error: "內容不能為空" });
        }

        const db = loadDatabase();
    const user = db.users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "找不到該探險家" });
    }

    const newShout: ShoutMessage = {
      id: `shout-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: user.id,
      username: user.username,
      realName: user.realName,
      avatar: user.avatar,
      team: user.team || "極光小隊",
      text: text.trim().slice(0, 100),
      timestamp: new Date().toISOString()
    };

    if (!db.shouts) {
      db.shouts = [];
    }
    db.shouts.push(newShout);

    // Keep only shouts from the last 24 hours
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    db.shouts = db.shouts.filter(shout => new Date(shout.timestamp).getTime() >= oneDayAgo);

    saveDatabase(db);
    res.json({ success: true, shout: newShout });
      });
    } catch (err: any) {
      console.error("Queue shout submit error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "系統忙碌中，請稍後重試！" });
      }
    }
  });

  // API - Shoutbox: Get the latest shout
  app.get("/api/shouts/latest", (req, res) => {
    const db = loadDatabase();
    if (!db.shouts || db.shouts.length === 0) {
      return res.json(null);
    }
    const latest = db.shouts[db.shouts.length - 1];
    res.json(latest);
  });

  // API - Shoutbox: Get all active shouts from past 24 hours
  app.get("/api/shouts", (req, res) => {
    const db = loadDatabase();
    if (!db.shouts) {
      db.shouts = [];
    }
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const activeShouts = db.shouts.filter(shout => {
      const ts = new Date(shout.timestamp).getTime();
      return ts >= oneDayAgo;
    });
    // Limit to latest 100 shouts to prevent browser lag
    res.json(activeShouts.slice(-100));
  });

  // API - Shoutbox: Delete a shout
  app.delete("/api/shouts/:id", (req, res) => {
    const { id } = req.params;
    const db = loadDatabase();
    if (!db.shouts) {
      db.shouts = [];
    }
    const index = db.shouts.findIndex(shout => shout.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "找不到該嗆聲留言" });
    }
    const deletedShout = db.shouts.splice(index, 1)[0];
    saveDatabase(db);
    res.json({ success: true, shout: deletedShout });
  });

  // API - Get all users
  app.get("/api/users", (req, res) => {
    const db = loadDatabase();
    res.json(db.users);
  });

  // API - Get all promotion events
  app.get("/api/promotions", (req, res) => {
    const db = loadDatabase();
    res.json(db.promotions || []);
  });

  // API - Get all badge events
  app.get("/api/badge-events", (req, res) => {
    const db = loadDatabase();
    res.json(db.badgeEvents || []);
  });

  // API - Get all FYC events
  app.get("/api/fyc-events", (req, res) => {
    const db = loadDatabase();
    res.json(db.fycEvents || []);
  });

  // API - Get all Landmark Unlock events
  app.get("/api/landmark-events", (req, res) => {
    const db = loadDatabase();
    res.json(db.landmarkEvents || []);
  });

  // API - Get bulletin
  app.get("/api/bulletin", (req, res) => {
    const db = loadDatabase();
    res.json({ bulletin: db.bulletin || "" });
  });

  // API - Update bulletin
  app.post("/api/bulletin", (req, res) => {
    const { bulletin, userId } = req.body;
    const db = loadDatabase();
    const user = db.users.find(u => u.id === userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "只有大隊長可以更新佈告欄" });
    }
    
    db.bulletin = bulletin;

    // Send a shout message for the update
    const shoutId = "s-" + Date.now();
    const newShout: ShoutMessage = {
      id: shoutId,
      userId: user.id,
      username: user.username,
      realName: user.realName,
      avatar: user.avatar,
      team: user.team || "",
      text: "大隊長更新佈告欄訊息",
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // Valid for 2 hours
    };

    if (!db.shouts) db.shouts = [];
    db.shouts.push(newShout);

    // cleanup expired shouts
    db.shouts = db.shouts.filter(s => !s.expiresAt || new Date(s.expiresAt).getTime() > Date.now());

    saveDatabase(db);
    res.json({ bulletin: db.bulletin, shout: newShout });
  });

  // API - Login with Username and Password
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "請填寫帳號與密碼" });
    }

    const db = loadDatabase();
    const cleanUsername = username.trim().toLowerCase();

    // Find user
    const user = db.users.find(u => u.username.toLowerCase() === cleanUsername);
    if (!user) {
      return res.status(401).json({ error: "該帳號不存在，請先註冊新探險角色！" });
    }

    // Verify password
    if (String(user.password).trim() !== String(password).trim()) {
      return res.status(401).json({ error: "密碼不正確，請重新輸入！" });
    }

    const isAdmin = cleanUsername === "andrew110442" || cleanUsername === "andrew";
    if (isAdmin && user.role !== "admin") {
      user.role = "admin";
      saveDatabase(db);
    }

    res.json(user);
  });

  // API - Register new character
  app.post("/api/register", (req, res) => {
    const { username, password, realName, avatar, team, role } = req.body;
    if (!username || !password || !realName) {
      return res.status(400).json({ error: "請填寫完整註冊欄位 (帳號、密碼與真實姓名)" });
    }

    const db = loadDatabase();
    const cleanUsername = username.trim().toLowerCase();

    // Check if user already exists
    const exists = db.users.find(u => u.username.toLowerCase() === cleanUsername);
    if (exists) {
      return res.status(400).json({ error: "此帳號已存在，請更換其他帳號！" });
    }

    const isAdmin = cleanUsername === "andrew110442" || cleanUsername === "andrew";
    let finalRole: 'admin' | 'captain' | 'user' = "user";
    if (isAdmin) {
      finalRole = "admin";
    } else if (role === "captain" || role === "captain") {
      finalRole = "captain";
    }

    const user: User = {
      id: `u-${Date.now()}`,
      username: cleanUsername,
      password: String(password).trim(),
      realName: realName.trim(),
      avatar: avatar || "bg-indigo-500",
      role: finalRole,
      totalScore: 0,
      mapleCoins: 0,
      team: team || "極光小隊",
      fyc: 0
    };

    db.users.push(user);
    saveDatabase(db);

    res.json(user);
  });

  // API - Update user's real name
  app.put("/api/users/:id/name", (req, res) => {
    const { id } = req.params;
    const { realName } = req.body;
    if (!realName || !realName.trim()) {
      return res.status(400).json({ error: "真實姓名不能為空" });
    }

    const db = loadDatabase();
    const user = db.users.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ error: "找不到使用者" });
    }

    const trimmedName = realName.trim();
    user.realName = trimmedName;

    // Also update realName in activities that this user submitted
    db.activities.forEach(act => {
      if (act.userId === id) {
        act.realName = trimmedName;
      }
    });

    saveDatabase(db);
    res.json({ success: true, updatedUser: user });
  });

  // API - Update user's profile (name and/or password and/or avatar)
  app.put("/api/users/:id/profile", (req, res) => {
    const { id } = req.params;
    const { realName, password, avatar } = req.body;

    const db = loadDatabase();
    const user = db.users.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ error: "找不到使用者" });
    }

    if (realName !== undefined) {
      const trimmedName = realName.trim();
      if (!trimmedName) {
        return res.status(400).json({ error: "真實姓名不能為空" });
      }
      user.realName = trimmedName;
      // Also update realName in activities that this user submitted
      db.activities.forEach(act => {
        if (act.userId === id) {
          act.realName = trimmedName;
        }
      });
      // Also update realName in shouts
      if (db.shouts) {
        db.shouts.forEach(shout => {
          if (shout.userId === id) {
            shout.realName = trimmedName;
          }
        });
      }
    }

    if (password !== undefined) {
      const trimmedPassword = String(password).trim();
      if (!trimmedPassword) {
        return res.status(400).json({ error: "密碼不能為空" });
      }
      user.password = trimmedPassword;
    }

    if (avatar !== undefined) {
      user.avatar = avatar;
      // Also update avatar in shouts
      if (db.shouts) {
        db.shouts.forEach(shout => {
          if (shout.userId === id) {
            shout.avatar = avatar;
          }
        });
      }
    }

    saveDatabase(db);
    res.json({ success: true, updatedUser: user });
  });

  // API - Get all activity logs
  app.get("/api/activities", (req, res) => {
    const db = loadDatabase();
    // Sort activities by timestamp descending
    const sorted = [...db.activities].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(sorted);
  });

  // API - Post business report activity
  app.post("/api/activities", async (req, res) => {
    try {
      await dbQueue.add(async () => {
        const { userId, type, count, note } = req.body;
        
        if (!userId || !type || !ACTIVITY_RULES[type as ActivityType]) {
          return res.status(400).json({ error: "Invalid userId or activity type" });
        }

        const db = loadDatabase();
    const user = db.users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const oldSquadTotalScore = db.users.filter(u => u.team === user.team).reduce((sum, u) => sum + u.totalScore, 0);

    const rule = ACTIVITY_RULES[type as ActivityType];
    const multiplier = type === '受理FYC' ? Math.max(0, parseInt(count) || 0) : Math.max(1, parseInt(count) || 1);
    let addedPoints = rule.points * (type === '受理FYC' ? 1 : multiplier);

    if (user.items && user.items.length > 0) {
      if (type === '約訪' && user.items.includes('item_0')) {
        addedPoints *= 3;
      }
      if (type === '成交壽險件' && user.items.includes('item_1')) {
        addedPoints = Math.ceil(addedPoints * 1.5);
      }
      if (type === '遞送建議書' && user.items.includes('item_5')) {
        addedPoints = Math.round(addedPoints * 1.5);
      }
      if (type === '準時出席早會' && user.items.includes('item_2')) {
        addedPoints *= 4;
      }
      if (type === '客戶拜訪' && user.items.includes('item_3')) {
        addedPoints *= 2;
      }
      if (type === '增員活動邀約' && user.items.includes('item_4')) {
        addedPoints *= 2;
      }
      if (type === '理賠' && user.items.includes('item_6')) {
        addedPoints *= 4;
      }
    }

    if (note && note.trim().length > 0 && type !== '受理FYC') {
      addedPoints += 5;
    }

    // Create the new activity report
    const newReport: ActivityReport = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId: user.id,
      username: user.username,
      realName: user.realName,
      type: type as ActivityType,
      points: addedPoints,
      count: multiplier,
      note: note ? note.trim() : undefined,
      timestamp: new Date().toISOString()
    };

    // Update score and FYC of user
    const oldScore = user.totalScore;
    user.totalScore += addedPoints;
    user.mapleCoins = (user.mapleCoins || 0) + addedPoints;
    if (type === '受理FYC') {
      const oldFyc = user.fyc || 0;
      user.fyc = oldFyc + multiplier;
      user.fycAllTime = (user.fycAllTime ?? oldFyc) + multiplier;

      // Log FYC Event for global push notifications
      const fycEvent: FycEvent = {
        id: `fyc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        userId: user.id,
        realName: user.realName,
        username: user.username,
        avatar: user.avatar,
        team: user.team || "極光小隊",
        amount: multiplier,
        note: note ? note.trim() : undefined,
        timestamp: new Date().toISOString()
      };
      if (!db.fycEvents) {
        db.fycEvents = [];
      }
      db.fycEvents.push(fycEvent);
      
      // Check for Diamond Status
      if (user.fyc < 25000) {
        user.hasDiamond = false;
      } else if (user.fyc >= 25000 && !user.hasDiamond) {
        user.hasDiamond = true;
        
        const diamondEvent: PromotionEvent = {
          id: `promo-diamond-${Date.now()}`,
          userId: user.id,
          realName: user.realName,
          username: user.username,
          avatar: user.avatar,
          team: user.team || "極光小隊",
          oldTitle: getTitleName(user.totalScore), // Use real current title
          newTitle: "鑽石業務",
          newRank: 99,
          timestamp: new Date().toISOString()
        };
        
        if (!db.promotions) {
          db.promotions = [];
        }
        db.promotions.push(diamondEvent);
        
        // Push a shout message for Diamond
        const shoutText = `🎉 太狂啦！我已完成 25,000 FYC，成為【鑽石業務】💎！`;
        const newShout: ShoutMessage = {
          id: `shout-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          userId: user.id,
          username: user.username,
          realName: user.realName,
          avatar: user.avatar,
          team: user.team || "極光小隊",
          text: shoutText,
          timestamp: new Date().toISOString(),
        };
        if (!db.shouts) db.shouts = [];
        db.shouts.push(newShout);
      }
    }

    const preActivities = [...db.activities];
    db.activities.push(newReport);
    const postActivities = db.activities;

    const newSquadTotalScore = db.users.filter(u => u.team === user.team).reduce((sum, u) => sum + u.totalScore, 0);

    // Check if the user advanced to the next title
    checkAndLogPromotion(db, user, oldScore, user.totalScore);
    
    // Check if user unlocked a badge
    checkAndLogBadgeUnlock(db, user, preActivities, postActivities);

    // Check if team unlocked a landmark
    checkAndLogLandmarkUnlock(db, user, oldSquadTotalScore, newSquadTotalScore);

    saveDatabase(db);

    res.json({ success: true, activity: newReport, updatedUser: user });
      });
    } catch (err: any) {
      console.error("Queue activity submit error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "系統忙碌中，請稍候重試！" });
      }
    }
  });

  // API - Update an activity (mostly for FYC editing)
  app.put("/api/activities/:id", (req, res) => {
    const { id } = req.params;
    const { count } = req.body;
    
    if (typeof count !== 'number') {
      return res.status(400).json({ error: "Invalid count value" });
    }

    const db = loadDatabase();
    
    const activityIndex = db.activities.findIndex(act => act.id === id);
    if (activityIndex === -1) {
      return res.status(404).json({ error: "Activity not found" });
    }

    const activity = db.activities[activityIndex];
    
    // For now we only support editing FYC count
    if (activity.type !== '受理FYC') {
      return res.status(400).json({ error: "Only FYC activities can be edited" });
    }

    const user = db.users.find(u => u.id === activity.userId);
    if (user) {
      // Adjust user's FYC based on the difference
      const diff = count - activity.count;
      user.fycAllTime = Math.max(0, (user.fycAllTime ?? user.fyc ?? 0) + diff);
      user.fyc = Math.max(0, (user.fyc || 0) + diff);
      
      // Check for Diamond Status
      if (user.fyc < 25000) {
        user.hasDiamond = false;
      } else if (user.fyc >= 25000 && !user.hasDiamond) {
        user.hasDiamond = true;
        
        const diamondEvent: PromotionEvent = {
          id: `promo-diamond-${Date.now()}`,
          userId: user.id,
          realName: user.realName,
          username: user.username,
          avatar: user.avatar,
          team: user.team || "極光小隊",
          oldTitle: getTitleName(user.totalScore),
          newTitle: "鑽石業務",
          newRank: 99,
          timestamp: new Date().toISOString()
        };
        
        if (!db.promotions) {
          db.promotions = [];
        }
        db.promotions.push(diamondEvent);
        
        const shoutText = `🎉 太狂啦！我已完成 25,000 FYC，成為【鑽石業務】💎！`;
        const newShout: ShoutMessage = {
          id: `shout-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          userId: user.id,
          username: user.username,
          realName: user.realName,
          avatar: user.avatar,
          team: user.team || "極光小隊",
          text: shoutText,
          timestamp: new Date().toISOString(),
        };
        if (!db.shouts) db.shouts = [];
        db.shouts.push(newShout);
      }
    }

    // Update the activity itself
    activity.count = count;
    
    saveDatabase(db);
    res.json({ success: true, activity, updatedUser: user });
  });

  // API - Delete/Retract an activity
  app.delete("/api/activities/:id", (req, res) => {
    const { id } = req.params;
    const db = loadDatabase();
    
    const activityIndex = db.activities.findIndex(act => act.id === id);
    if (activityIndex === -1) {
      return res.status(404).json({ error: "Activity not found" });
    }

    const activity = db.activities[activityIndex];
    const user = db.users.find(u => u.id === activity.userId);
    
    if (user) {
      // Deduct the points from the user's total score
      user.totalScore = Math.max(0, user.totalScore - activity.points);
      user.mapleCoins = Math.max(0, (user.mapleCoins || 0) - activity.points);
      
      // If activity is '受理FYC', deduct from fyc as well
      if (activity.type === '受理FYC') {
        user.fycAllTime = Math.max(0, (user.fycAllTime ?? user.fyc ?? 0) - activity.count);
        user.fyc = Math.max(0, (user.fyc || 0) - activity.count);
        if (user.fyc < 25000) {
          user.hasDiamond = false;
        }
      }
    }

    // Remove the activity
    db.activities.splice(activityIndex, 1);
    saveDatabase(db);

    res.json({ success: true, message: "Activity retracted successfully", updatedUser: user });
  });

  // API - Admin: Update any user details
  app.put("/api/admin/users/:id", (req, res) => {
    const { id } = req.params;
    const { realName, team, totalScore, mapleCoins, fyc, role, avatar, password } = req.body;
    
    const db = loadDatabase();
    const user = db.users.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ error: "找不到該使用者" });
    }

    const oldSquadTotalScore = db.users.filter(u => u.team === user.team).reduce((sum, u) => sum + u.totalScore, 0);
    const oldScore = user.totalScore;

    if (realName !== undefined) user.realName = realName.trim();
    if (team !== undefined) user.team = team;
    if (totalScore !== undefined) user.totalScore = parseInt(totalScore) || 0;
    if (mapleCoins !== undefined) user.mapleCoins = Math.max(0, parseInt(mapleCoins) || 0);
    if (fyc !== undefined) {
      user.fyc = parseInt(fyc) || 0;
      if (user.fyc < 25000) {
        user.hasDiamond = false;
      } else if (user.fyc >= 25000 && !user.hasDiamond) {
        user.hasDiamond = true;
        
        const diamondEvent: PromotionEvent = {
          id: `promo-diamond-${Date.now()}`,
          userId: user.id,
          realName: user.realName,
          username: user.username,
          avatar: user.avatar,
          team: user.team || "極光小隊",
          oldTitle: getTitleName(user.totalScore), // Use real current title
          newTitle: "鑽石業務",
          newRank: 99,
          timestamp: new Date().toISOString()
        };
        
        if (!db.promotions) {
          db.promotions = [];
        }
        db.promotions.push(diamondEvent);
        
        // Push a shout message for Diamond
        const shoutText = `🎉 太狂啦！我已完成 25,000 FYC，成為【鑽石業務】💎！`;
        const newShout: ShoutMessage = {
          id: `shout-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          userId: user.id,
          username: user.username,
          realName: user.realName,
          avatar: user.avatar,
          team: user.team || "極光小隊",
          text: shoutText,
          timestamp: new Date().toISOString(),
        };
        if (!db.shouts) db.shouts = [];
        db.shouts.push(newShout);
      }
    }
    if (password !== undefined && password.trim() !== "") user.password = password.trim();
    if (role !== undefined) {
      const isAndrew = user.username.toLowerCase() === "andrew110442" || user.username.toLowerCase() === "andrew";
      if (isAndrew) {
        user.role = "admin";
      } else {
        user.role = role;
      }
    }
    if (avatar !== undefined) user.avatar = avatar;

    if (realName !== undefined) {
      db.activities.forEach(act => {
        if (act.userId === id) {
          act.realName = realName.trim();
        }
      });
    }

    const newSquadTotalScore = db.users.filter(u => u.team === user.team).reduce((sum, u) => sum + u.totalScore, 0);

    if (totalScore !== undefined) {
      checkAndLogPromotion(db, user, oldScore, user.totalScore);
      checkAndLogLandmarkUnlock(db, user, oldSquadTotalScore, newSquadTotalScore);
    }

    saveDatabase(db);
    res.json({ success: true, user });
  });

  // API - Admin: Create a new user manually
  app.post("/api/admin/users", (req, res) => {
    const { username, password, realName, team, totalScore, mapleCoins, role, avatar } = req.body;
    if (!username || !realName) {
      return res.status(400).json({ error: "使用者帳號與真實姓名為必填" });
    }

    const db = loadDatabase();
    const cleanUsername = username.trim().toLowerCase();
    
    const exists = db.users.find(u => u.username.toLowerCase() === cleanUsername);
    if (exists) {
      return res.status(400).json({ error: "此使用者帳號已存在" });
    }

    const initialScore = parseInt(totalScore) || 0;
    const initialCoins = mapleCoins !== undefined ? (parseInt(mapleCoins) || 0) : initialScore;

    const newUser: User = {
      id: `u-${Date.now()}`,
      username: cleanUsername,
      password: password || "123",
      realName: realName.trim(),
      team: team || "極光小隊",
      totalScore: initialScore,
      mapleCoins: Math.max(0, initialCoins),
      role: role || "user",
      avatar: avatar || "bg-indigo-500"
    };

    db.users.push(newUser);
    saveDatabase(db);
    res.json({ success: true, user: newUser });
  });

  // API - Admin: Delete a user and their activities
  app.delete("/api/admin/users/:id", (req, res) => {
    const { id } = req.params;
    const db = loadDatabase();

    const userIndex = db.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ error: "找不到該使用者" });
    }

    const user = db.users[userIndex];
    const isAndrew = user.username.toLowerCase() === "andrew110442" || user.username.toLowerCase() === "andrew";
    if (isAndrew) {
      return res.status(400).json({ error: "不允許刪除大隊長帳號" });
    }

    db.users.splice(userIndex, 1);
    db.activities = db.activities.filter(act => act.userId !== id);

    saveDatabase(db);
    res.json({ success: true, message: "使用者及其活動紀錄已成功刪除" });
  });

  // API - Get redemptions
  // API - Admin: Revert team purchase
  app.post("/api/admin/revert-team-purchase", (req, res) => {
    const { redemptionId } = req.body;
    const db = loadDatabase();
    const redemption = db.teamRedemptions?.find(r => r.id === redemptionId);
    if (!redemption) return res.status(404).json({ error: "找不到紀錄" });
    const squadUsers = db.users.filter(u => u.team === redemption.team);
    const costPerMember = Math.round(redemption.cost / (squadUsers.length || 1));
    squadUsers.forEach(u => u.mapleCoins = (u.mapleCoins || 0) + costPerMember);
    db.teamRedemptions = db.teamRedemptions?.filter(r => r.id !== redemptionId);
    saveDatabase(db);
    res.json({ success: true });
  });

  // API - Admin: Revert item purchase
  app.post("/api/admin/revert-item-purchase", (req, res) => {
    const { redemptionId } = req.body;
    const db = loadDatabase();
    const redemption = db.itemRedemptions?.find(r => r.id === redemptionId);
    if (!redemption) return res.status(404).json({ error: "找不到紀錄" });
    const user = db.users.find(u => u.id === redemption.userId);
    if (user) {
      if (user.items) user.items = user.items.filter(id => id !== redemption.itemId);
      user.mapleCoins = (user.mapleCoins || 0) + redemption.cost;
      const itemToTypeMap: Record<string, string> = {
        "item_0": "約訪",
        "item_1": "成交壽險件",
        "item_2": "準時出席早會",
        "item_3": "客戶拜訪",
        "item_4": "增員活動邀約",
        "item_5": "遞送建議書",
        "item_6": "理賠"
      };
      const typeAffected = itemToTypeMap[redemption.itemId];
      let totalPointsReverted = 0;
      if (typeAffected && db.activities) {
        for (const act of db.activities) {
          if (act.userId === user.id && act.type === typeAffected) {
            const actTime = new Date(act.timestamp).getTime();
            const redTime = new Date(redemption.timestamp).getTime();
            if (actTime > redTime) {
              const rule = ACTIVITY_RULES[typeAffected as ActivityType];
              const multiplier = Math.max(1, act.count || 1);
              let basePoints = rule.points * multiplier;
              if (act.note && act.note.trim().length > 0) basePoints += 5;
              let boostedPoints = rule.points * multiplier;
              if (redemption.itemId === "item_0") boostedPoints *= 3;
              if (redemption.itemId === "item_1") boostedPoints = Math.ceil(boostedPoints * 1.5);
              if (redemption.itemId === "item_5") boostedPoints = Math.round(boostedPoints * 1.5);
              if (redemption.itemId === "item_2") boostedPoints *= 4;
              if (redemption.itemId === "item_3") boostedPoints *= 2;
              if (redemption.itemId === "item_4") boostedPoints *= 2;
              if (redemption.itemId === "item_6") boostedPoints *= 4;
              if (act.note && act.note.trim().length > 0) boostedPoints += 5;
              const difference = boostedPoints - basePoints;
              act.points -= difference;
              user.totalScore -= difference;
              user.mapleCoins -= difference;
            }
          }
        }
      }
    }
    db.itemRedemptions = db.itemRedemptions?.filter(r => r.id !== redemptionId);
    saveDatabase(db);
    res.json({ success: true });
  });

  app.get("/api/redemptions", (req, res) => {
    const db = loadDatabase();
    res.json({
      teamRedemptions: db.teamRedemptions || [],
      itemRedemptions: db.itemRedemptions || []
    });
  });

  // API - Create redemption
  app.post("/api/redemptions", (req, res) => {
    const { userId, cost, reward } = req.body;
    const db = loadDatabase();
    const user = db.users.find(u => u.id === userId);
    
    if (!user || (user.role !== 'admin' && user.role !== 'captain')) {
      return res.status(403).json({ error: "只有小隊長及大隊長可以兌換" });
    }

    const team = user.team || "無小隊";
    const squadUsers = db.users.filter(u => u.team === team);
    const squadTotalScore = squadUsers.reduce((sum, u) => sum + (u.mapleCoins !== undefined ? u.mapleCoins : u.totalScore), 0);
    
    const teamRedemptions = db.teamRedemptions || [];
    
    // Squad available score is exactly the sum of its members' current maple coins.
    const availableScore = squadTotalScore;

    if (availableScore < cost) {
      return res.status(400).json({ error: `小隊剩餘楓葉幣不足 (${availableScore} < ${cost})` });
    }

    // Deduct the cost evenly from all squad members' personal maple coins (rounded)
    const costPerMember = Math.round(cost / (squadUsers.length || 1));
    
    const memberWithInsufficientFunds = squadUsers.find(u => {
      const currentCoins = u.mapleCoins !== undefined ? u.mapleCoins : u.totalScore;
      return currentCoins < costPerMember;
    });

    if (memberWithInsufficientFunds) {
      return res.status(400).json({ error: `小隊成員 ${memberWithInsufficientFunds.realName} 楓葉幣不足，無法平均扣除 ${costPerMember} 幣，禁止兌換。` });
    }

    squadUsers.forEach(u => {
      const currentCoins = u.mapleCoins !== undefined ? u.mapleCoins : u.totalScore;
      u.mapleCoins = currentCoins - costPerMember;
    });

    const redemption = {
      id: `red-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      team,
      cost,
      reward,
      timestamp: new Date().toISOString(),
      captainName: user.realName
    };

    db.teamRedemptions = teamRedemptions;
    db.teamRedemptions.push(redemption);
    saveDatabase(db);
    res.json({ success: true, redemption });
  });

  // API - Purchase individual item
  app.post("/api/purchase-item", (req, res) => {
    const { userId, itemId } = req.body;
    const db = loadDatabase();
    const user = db.users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const item = STORE_ITEMS.find(i => i.id === itemId);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const currentCoins = user.mapleCoins !== undefined ? user.mapleCoins : user.totalScore;
    if (currentCoins < item.cost) {
      return res.status(400).json({ error: `個人楓葉幣不足 (${currentCoins} < ${item.cost})` });
    }

    if (user.items && user.items.includes(item.id)) {
      return res.status(400).json({ error: "已經擁有此道具" });
    }

    user.mapleCoins = currentCoins - item.cost;
    if (!user.items) user.items = [];
    user.items.push(item.id);

    // Broadcast purchase event
    const shoutText = `🛍️ 賀！成功兌換了超強道具【${item.icon} ${item.name}】！`;
    const newShout: ShoutMessage = {
      id: `shout-item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId: user.id,
      username: user.username,
      realName: user.realName,
      avatar: user.avatar,
      team: user.team || "極光小隊",
      text: shoutText,
      timestamp: new Date().toISOString()
    };
    if (!db.shouts) db.shouts = [];
    db.shouts.push(newShout);

    const itemRedemption: ItemRedemption = {
      id: `ired-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId: user.id,
      realName: user.realName,
      team: user.team || "無小隊",
      itemId: item.id,
      itemName: item.name,
      cost: item.cost,
      timestamp: new Date().toISOString()
    };
    if (!db.itemRedemptions) db.itemRedemptions = [];
    db.itemRedemptions.push(itemRedemption);

    saveDatabase(db);
    res.json({ success: true, updatedUser: user });
  });

  // API - Admin: List Backups
  app.get("/api/admin/backups", (req, res) => {
    try {
      const BACKUP_DIR = path.join(process.cwd(), "backups");
      if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
      }
      const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json'));
      const backups = files.map(filename => {
        const stats = fs.statSync(path.join(BACKUP_DIR, filename));
        return {
          filename,
          size: stats.size,
          timestamp: stats.mtime.toISOString()
        };
      }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      res.json(backups);
    } catch (error) {
      console.error("Failed to list backups", error);
      res.status(500).json({ error: "無法讀取備份列表" });
    }
  });

  // API - Admin: Create Backup
  app.post("/api/admin/backups", (req, res) => {
    try {
      const { userId } = req.body;
      const db = loadDatabase();
      
      // Verify user is admin
      const user = db.users.find(u => u.id === userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "只有大隊長可以執行此操作" });
      }
      
      const BACKUP_DIR = path.join(process.cwd(), "backups");
      if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup_${timestamp}.json`;
      const filepath = path.join(BACKUP_DIR, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(db, null, 2), "utf-8");
      res.json({ success: true, message: `備份成功建立: ${filename}`, filename });
    } catch (error) {
      console.error("Failed to create backup", error);
      res.status(500).json({ error: "備份建立失敗" });
    }
  });

  // API - Admin: Restore Backup
  app.post("/api/admin/backups/restore", (req, res) => {
    try {
      const { userId, filename } = req.body;
      const db = loadDatabase();
      
      // Verify user is admin
      const user = db.users.find(u => u.id === userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "只有大隊長可以執行此操作" });
      }
      
      const BACKUP_DIR = path.join(process.cwd(), "backups");
      const filepath = path.join(BACKUP_DIR, filename);
      
      if (!fs.existsSync(filepath)) {
        return res.status(404).json({ error: "找不到指定的備份檔案" });
      }
      
      const backupData = fs.readFileSync(filepath, "utf-8");
      const parsedBackup = JSON.parse(backupData);
      
      saveDatabase(parsedBackup);
      res.json({ success: true, message: `成功從備份恢復: ${filename}` });
    } catch (error) {
      console.error("Failed to restore backup", error);
      res.status(500).json({ error: "備份恢復失敗" });
    }
  });

  // API - Admin: Delete Backup
  app.delete("/api/admin/backups/:filename", (req, res) => {
    try {
      const { filename } = req.params;
      const { userId } = req.body;
      const db = loadDatabase();
      
      // Verify user is admin
      const user = db.users.find(u => u.id === userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "只有大隊長可以執行此操作" });
      }
      
      const BACKUP_DIR = path.join(process.cwd(), "backups");
      const filepath = path.join(BACKUP_DIR, filename);
      
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        res.json({ success: true, message: "備份已刪除" });
      } else {
        res.status(404).json({ error: "找不到指定的備份檔案" });
      }
    } catch (error) {
      console.error("Failed to delete backup", error);
      res.status(500).json({ error: "備份刪除失敗" });
    }
  });

  // API - Admin: Clear all gameplay values
  app.post("/api/admin/clear-game-data", (req, res) => {
    const { userId } = req.body;
    const db = loadDatabase();
    
    // Verify user is admin
    const user = db.users.find(u => u.id === userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "只有大隊長可以執行此操作" });
    }

    // Reset user stats
    db.users.forEach(u => {
      u.totalScore = 0;
      u.mapleCoins = 0;
      u.fyc = 0;
      u.fycAllTime = 0;
      u.hasDiamond = false;
      u.items = [];
    });

    // Clear gameplay activity and events records
    db.activities = [];
    db.teamRedemptions = [];
    db.itemRedemptions = [];
    db.badgeEvents = [];
    db.promotions = [];
    db.fycEvents = [];
    db.landmarkEvents = [];
    db.shouts = [];

    // Reset bulletin message with a clear indicator
    db.bulletin = "歡迎來到加拿大冒險國度！活動數值已由大隊長重設，開始新一輪挑戰吧！🍁";

    saveDatabase(db);
    res.json({ success: true, message: "所有遊戲數值（包含徽章、積分、道具、楓葉幣、FYC、稱號）及歷史紀錄已成功清空！已註冊隊員帳號皆已保留。" });
  });

  app.post("/api/admin/clear-fyc", (req, res) => {
    const { userId } = req.body;
    const db = loadDatabase();
    
    // Verify user is admin
    const user = db.users.find(u => u.id === userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "只有大隊長可以執行此操作" });
    }

    // Reset user FYC stats
    db.users.forEach(u => {
      // Ensure fycAllTime is set to at least their historical fyc before we clear
      u.fycAllTime = u.fycAllTime ?? u.fyc ?? 0;
      u.fyc = 0;
      u.hasDiamond = false;
    });

    // Clear FYC activity and events records
    db.activities = db.activities.filter(a => a.type !== '受理FYC');
    db.fycEvents = [];

    // Archive specific rankings
    db.activities.forEach(a => {
      if (a.type === '約訪' || a.type === '客戶拜訪' || a.type === '成交壽險件') {
        a.isArchived = true;
      }
    });

    saveDatabase(db);
    res.json({ success: true, message: "所有玩家申報受理之FYC、相關排名、鑽石業務以及三大次數排行已成功清空！" });
  });

  // API - Reset the state (Demo convenience)
  app.post("/api/reset", (req, res) => {
    // Disabled as per retention requirements
    res.status(403).json({ error: "System reset is disabled to prevent accidental data loss." });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
