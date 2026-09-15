"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Gamepad2,
  MessageCircle,
  Search,
  Settings,
  Users,
  UserPlus,
  Send,
  Menu,
  X,
  LogIn,
  User,
  LogOut,
  Image as ImageIcon,
  Save,
  Check,
  Volume2,
} from "lucide-react";

const gamesList = [
  "VALORANT",
  "League of Legends",
  "CS2",
  "Minecraft",
  "PUBG",
  "Fortnite",
  "Apex Legends",
  "Rainbow Six Siege",
];

const gameRanks: Record<string, string[]> = {
  VALORANT: [
    "Iron 1", "Iron 2", "Iron 3",
    "Bronze 1", "Bronze 2", "Bronze 3",
    "Silver 1", "Silver 2", "Silver 3",
    "Gold 1", "Gold 2", "Gold 3",
    "Platinum 1", "Platinum 2", "Platinum 3",
    "Diamond 1", "Diamond 2", "Diamond 3",
    "Ascendant 1", "Ascendant 2", "Ascendant 3",
    "Immortal 1", "Immortal 2", "Immortal 3",
    "Radiant",
  ],
  "League of Legends": [
    "Iron", "Bronze", "Silver", "Gold", "Platinum",
    "Emerald", "Diamond", "Master", "Grandmaster", "Challenger",
  ],
  CS2: [
    "Premier 0-4K", "Premier 5-9K", "Premier 10-14K",
    "Premier 15-19K", "Premier 20-24K", "Premier 25K+",
    "Faceit Level 1", "Faceit Level 2", "Faceit Level 3", "Faceit Level 4",
    "Faceit Level 5", "Faceit Level 6", "Faceit Level 7", "Faceit Level 8",
    "Faceit Level 9", "Faceit Level 10",
  ],
  Minecraft: ["Başlangıç", "Orta", "İleri", "Uzman"],
  PUBG: ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Crown", "Ace", "Master"],
  Fortnite: ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Elite", "Champion", "Unreal"],
  "Apex Legends": ["Rookie", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Predator"],
  "Rainbow Six Siege": ["Copper", "Bronze", "Silver", "Gold", "Platinum", "Emerald", "Diamond", "Champion"],
};

const gameRoles: Record<string, string[]> = {
  VALORANT: ["Duelist", "Controller", "Initiator", "Sentinel", "Flex"],
  "League of Legends": ["Top", "Jungle", "Mid", "ADC", "Support"],
  CS2: ["Entry", "AWPer", "IGL", "Support", "Lurker", "Rifler"],
  Minecraft: ["Survival", "PvP", "Builder", "Redstone", "Explorer"],
  PUBG: ["IGL", "Rusher", "Sniper", "Support", "Fragger"],
  Fortnite: ["Builder", "Fighter", "Support", "IGL"],
  "Apex Legends": ["Fragger", "Support", "Controller", "IGL"],
  "Rainbow Six Siege": ["Entry", "Support", "Flex", "Anchor", "Roamer"],
};

type GameInfo = { game: string; rank: string; role: string };
type UserType = {
  id: string;
  username: string;
  email: string;
  avatar: string;
  cover: string;
  bio: string;
  games: GameInfo[];
  friends: string[];
};
type Player = { id: string; username: string; avatar: string; bio: string; games: GameInfo[] };
type NotificationType = {
  id: string;
  type: "friend" | "message" | "invite";
  from: string;
  fromUsername: string;
  text: string;
  createdAt: string;
  read: boolean;
  inviteId?: string;
};
type View = "Oyuncu Bul" | "Oyunlar" | "Mesajlar" | "Arkadaşlar" | "Davetler" | "Ayarlar";

function playNotificationSound() {
  try {
    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) return;
    const ctx = new AudioContextCtor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
    window.setTimeout(() => ctx.close().catch(() => undefined), 600);
  } catch {
    // Ses desteklenmezse uygulama çalışmaya devam eder.
  }
}

async function showBrowserNotification(title: string, body: string) {
  try {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    }
  } catch {
    // Bildirim izni yoksa uygulama çalışmaya devam eder.
  }
}

export default function GamerHub() {
  const [me, setMe] = useState<UserType | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [directory, setDirectory] = useState<Player[]>([]);
  const [q, setQ] = useState("");
  const [game, setGame] = useState("");
  const [view, setView] = useState<View>("Oyuncu Bul");
  const [menu, setMenu] = useState(false);
  const [auth, setAuth] = useState<"login" | "register" | null>(null);
  const [selected, setSelected] = useState<Player | null>(null);
  const [toast, setToast] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [profile, setProfile] = useState(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());

  const loadMe = async () => {
    try {
      const r = await fetch("/api/me", { cache: "no-store" });
      const x = await r.json();
      setMe(x.user || null);
    } catch {
      setMe(null);
    }
  };

  const loadPlayers = async () => {
    try {
      const r = await fetch(`/api/players?search=${encodeURIComponent(q)}&game=${encodeURIComponent(game)}`, { cache: "no-store" });
      const x = await r.json();
      setPlayers(x.players || []);
    } catch {
      setPlayers([]);
    }
  };

  const loadDirectory = async () => {
    try {
      const r = await fetch("/api/players", { cache: "no-store" });
      const x = await r.json();
      setDirectory(x.players || []);
    } catch {
      setDirectory([]);
    }
  };

  const loadNotifications = async (initial = false) => {
    if (!me) return;
    try {
      const r = await fetch("/api/notifications", { cache: "no-store" });
      if (!r.ok) return;
      const x = await r.json();
      const list: NotificationType[] = x.notifications || [];
      setNotifications(list);

      const incoming = initial ? [] : list.filter((n) => !n.read && !seenNotificationIdsRef.current.has(n.id));
      if (incoming.length) {
        const latest = incoming[incoming.length - 1];
        playNotificationSound();
        await showBrowserNotification("GamerHub", latest.text);
        setToast(latest.text);
      }

      list.slice(0, 100).forEach((n) => seenNotificationIdsRef.current.add(n.id));
    } catch {
      // Bildirimler yüklenemezse diğer özellikler çalışır.
    }
  };

  useEffect(() => { loadMe(); loadDirectory(); }, []);
  useEffect(() => { loadPlayers(); }, [q, game]);

  useEffect(() => {
    if (!me) {
      setNotifications([]);
      return;
    }
    loadNotifications(true);
    const timer = setInterval(() => loadNotifications(false), 3000);
    return () => clearInterval(timer);
  }, [me?.id]);

  useEffect(() => {
    if (selected && me) {
      fetch(`/api/messages?to=${selected.id}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((x) => setMessages(x.messages || []))
        .catch(() => setMessages([]));
    } else {
      setMessages([]);
    }
  }, [selected, me]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const act = async (url: string, body: any, method = "POST") => {
    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const x = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(x.error || "Hata");
    return x;
  };

  const invite = async (p: Player) => {
    if (!me) return setAuth("login");
    try {
      await act("/api/invites", { to: p.id, game: p.games[0]?.game || game || "Oyun" });
      setToast(`${p.username} oyuncusuna davet gönderildi.`);
    } catch (e: any) {
      setToast(e.message || "Davet gönderilemedi.");
    }
  };

  const addFriend = async (p: Player) => {
    if (!me) return setAuth("login");
    try {
      await act("/api/friends", { userId: p.id });
      setToast(`${p.username} arkadaşlara eklendi.`);
      await loadMe();
      await loadDirectory();
    } catch (e: any) {
      setToast(e.message || "Arkadaş eklenemedi.");
    }
  };

  const send = async () => {
    if (!me) return setAuth("login");
    if (!selected || !text.trim()) return;
    try {
      await act("/api/messages", { to: selected.id, text });
      setText("");
      const r = await fetch(`/api/messages?to=${selected.id}`, { cache: "no-store" });
      setMessages((await r.json()).messages || []);
    } catch (e: any) {
      setToast(e.message || "Mesaj gönderilemedi.");
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setMe(null);
    setNotifications([]);
    setSelected(null);
    setMessages([]);
    setView("Oyuncu Bul");
  };

  const markNotificationsRead = async () => {
    if (!notifications.length) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: notifications.filter((n) => !n.read).map((n) => n.id) }),
    }).catch(() => undefined);
    setNotifications((items) => items.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const changeView = (newView: View) => {
    setView(newView);
    setMenu(false);
    if (newView === "Ayarlar") markNotificationsRead();
  };

  return (
    <div className="min-h-screen">
      <header className="fixed top-0 z-30 h-16 w-full border-b border-line bg-bg/90 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-[1500px] items-center gap-4 px-4">
          <button className="lg:hidden" onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
          <button className="flex items-center gap-2 font-black text-xl" onClick={() => changeView("Oyuncu Bul")}>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent">G</div>
            Gamer<span className="text-accent">Hub</span>
          </button>

          <div className="relative hidden max-w-xl flex-1 md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input className="input pl-10" placeholder="Oyuncu, oyun veya rank ara..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {me && (
              <button
                className="relative btn-secondary"
                title="Bildirimler"
                onClick={() => changeView("Ayarlar")}
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            )}

            {me ? (
              <>
                <span className="hidden text-sm text-slate-400 sm:block">Merhaba, {me.username}</span>
                <button className="btn-secondary" onClick={() => setProfile(true)} title="Profil"><User size={17} /></button>
                <button className="btn-secondary" onClick={logout} title="Çıkış"><LogOut size={17} /></button>
              </>
            ) : (
              <button className="btn-primary" onClick={() => setAuth("login")}>
                <LogIn size={17} className="mr-1 inline" /> Giriş
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px] pt-16">
        <aside className={`${menu ? "translate-x-0" : "-translate-x-full"} fixed top-16 z-20 h-[calc(100vh-4rem)] w-64 border-r border-line bg-bg p-4 transition lg:sticky lg:translate-x-0`}>
          <NavButton name="Oyuncu Bul" icon={Users} active={view === "Oyuncu Bul"} onClick={() => changeView("Oyuncu Bul")} />
          <NavButton name="Oyunlar" icon={Gamepad2} active={view === "Oyunlar"} onClick={() => changeView("Oyunlar")} />
          <NavButton name="Mesajlar" icon={MessageCircle} active={view === "Mesajlar"} onClick={() => { if (!me) return setAuth("login"); changeView("Mesajlar"); }} />
          <NavButton name="Arkadaşlar" icon={UserPlus} active={view === "Arkadaşlar"} onClick={() => { if (!me) return setAuth("login"); changeView("Arkadaşlar"); }} />
          <NavButton name="Davetler" icon={Send} active={view === "Davetler"} onClick={() => { if (!me) return setAuth("login"); changeView("Davetler"); }} />
          <button className={`mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${view === "Ayarlar" ? "bg-accent/15 text-violet-300" : "text-slate-400 hover:bg-panel hover:text-white"}`} onClick={() => changeView("Ayarlar")}>
            <Settings size={19} /> Ayarlar
          </button>
        </aside>

        <main className="min-w-0 flex-1 p-4 lg:p-7">
          <div className="mb-5 block md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input className="input pl-10" placeholder="Oyuncu ara..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>

          {view === "Oyuncu Bul" && (
            <section className="mb-7 rounded-3xl border border-line bg-gradient-to-br from-violet-900/35 via-panel to-cyan-900/10 p-7 shadow-glow">
              <div className="mb-3 inline-flex rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-300">● GamerHub</div>
              <h1 className="text-3xl font-black md:text-5xl">Takımını bul.<br /><span className="text-violet-300">Oyuna birlikte gir.</span></h1>
              <p className="mt-4 max-w-2xl text-slate-400">Kayıt ol, profilini oluştur, oyuncu bul, arkadaş ekle, mesajlaş ve oyun daveti gönder.</p>
              <div className="mt-6 flex gap-3">
                <button className="btn-primary" onClick={() => me ? setProfile(true) : setAuth("register")}>{me ? "Profilimi Düzenle" : "Ücretsiz Kayıt Ol"}</button>
                <button className="btn-secondary" onClick={() => changeView("Oyunlar")}>Oyunlara Göz At</button>
              </div>
            </section>
          )}

          {(view === "Oyuncu Bul" || view === "Oyunlar") && (
            <div className="mb-6 flex gap-2 overflow-auto pb-1">
              {gamesList.map((g) => (
                <button key={g} onClick={() => { setGame(game === g ? "" : g); setView("Oyuncu Bul"); }} className={`whitespace-nowrap rounded-xl border px-3 py-2 text-sm ${game === g ? "border-accent bg-accent/15 text-violet-300" : "border-line bg-panel text-slate-400"}`}>🎮 {g}</button>
              ))}
            </div>
          )}

          {view === "Ayarlar" && (
            <SettingsView
              me={me}
              notifications={notifications}
              notificationEnabled={notificationEnabled}
              onEnableNotifications={async () => {
                if (!("Notification" in window)) {
                  setToast("Bu tarayıcı bildirimleri desteklemiyor.");
                  return;
                }
                const permission = await Notification.requestPermission();
                const enabled = permission === "granted";
                setNotificationEnabled(enabled);
                if (enabled) {
                  playNotificationSound();
                  setToast("Sesli ve tarayıcı bildirimleri aktif.");
                } else {
                  setToast("Bildirim izni verilmedi.");
                }
              }}
              onMarkRead={markNotificationsRead}
              onProfile={() => setProfile(true)}
              onLogin={() => setAuth("login")}
              onLogout={logout}
            />
          )}

          {(view === "Oyuncu Bul" || view === "Oyunlar") && (
            <>
              <div className="mb-4"><h2 className="text-xl font-black">{game || "Oyuncular"}</h2><p className="text-sm text-slate-500">{players.length} sonuç</p></div>
              {players.length === 0 ? (
                <div className="card p-8 text-center"><Users className="mx-auto text-slate-600" size={42} /><h3 className="mt-4 text-lg font-bold">Oyuncu bulunamadı</h3><p className="mt-2 text-sm text-slate-500">Arama veya oyun filtresini değiştirerek tekrar deneyebilirsin.</p></div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {players.map((p) => (
                    <div className="card p-4" key={p.id}>
                      <div className="flex gap-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 font-black">{p.avatar ? <img src={p.avatar} className="h-full w-full object-cover" alt={p.username} /> : p.username[0]}</div>
                        <div className="min-w-0"><b>{p.username}</b><p className="mt-1 truncate text-xs text-slate-400">{p.bio || "Henüz bio eklenmemiş."}</p></div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">{p.games.map((g, i) => <span className="rounded-lg bg-panel2 px-2 py-1 text-xs" key={i}>🎮 {g.game} · {g.rank} · {g.role}</span>)}</div>
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <button className="btn-secondary text-xs" onClick={() => { if (!me) return setAuth("login"); setSelected(p); }}>💬 Mesaj</button>
                        <button className="btn-secondary text-xs" onClick={() => addFriend(p)}>👥 Ekle</button>
                        <button className="rounded-xl bg-accent px-2 py-2 text-xs font-bold" onClick={() => invite(p)}>🎮 Davet</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {view === "Mesajlar" && me && (
            <MessagesView
              me={me}
              players={directory}
              onOpenChat={(player) => setSelected(player)}
              onGoPlayers={() => changeView("Oyuncu Bul")}
            />
          )}

          {view === "Arkadaşlar" && me && (
            <FriendsView
              me={me}
              players={directory}
              onOpenChat={(player) => setSelected(player)}
              onGoPlayers={() => changeView("Oyuncu Bul")}
            />
          )}

          {view === "Davetler" && me && (
            <InvitesView
              me={me}
              players={directory}
              onToast={setToast}
            />
          )}
        </main>
      </div>

      {toast && <div className="fixed bottom-5 right-5 z-[70] max-w-sm rounded-xl border border-line bg-panel px-4 py-3 shadow-xl"><div className="flex items-center gap-3"><span className="text-sm">{toast}</span><button className="text-slate-500" onClick={() => setToast("")}>×</button></div></div>}
      {auth && <AuthModal mode={auth} close={() => setAuth(null)} switchMode={setAuth} done={() => { setAuth(null); loadMe(); }} />}
      {profile && me && <ProfileModal me={me} close={() => setProfile(false)} saved={() => { setProfile(false); loadMe(); loadPlayers(); setToast("Profil başarıyla güncellendi."); }} />}
      {selected && <ChatModal me={me} player={selected} messages={messages} text={text} setText={setText} send={send} close={() => { setSelected(null); setText(""); }} />}
    </div>
  );
}

function NavButton({ name, icon: Icon, active, onClick }: { name: string; icon: any; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${active ? "bg-accent/15 text-violet-300" : "text-slate-400 hover:bg-panel hover:text-white"}`}><Icon size={19} />{name}</button>;
}

function FriendsView({
  me,
  players,
  onOpenChat,
  onGoPlayers,
}: {
  me: UserType;
  players: Player[];
  onOpenChat: (player: Player) => void;
  onGoPlayers: () => void;
}) {
  const friends = players.filter((player) => me.friends?.includes(player.id));

  return (
    <div>
      <div className="mb-7">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/15 text-violet-300">
            <UserPlus size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-black">Arkadaşlar</h1>
            <p className="text-sm text-slate-500">Arkadaş listen ve hızlı mesajlaşma.</p>
          </div>
        </div>
      </div>

      {friends.length === 0 ? (
        <div className="card p-8 text-center">
          <UserPlus size={44} className="mx-auto text-slate-600" />
          <h2 className="mt-4 text-xl font-bold">Henüz arkadaşın yok</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Oyuncu Bul bölümünden bir oyuncu seçip arkadaş ekleyebilirsin.
          </p>
          <button className="btn-primary mt-5" onClick={onGoPlayers}>Oyuncu Bul</button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {friends.map((friend) => (
            <div key={friend.id} className="card p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 font-black">
                  {friend.avatar ? (
                    <img src={friend.avatar} alt={friend.username} className="h-full w-full object-cover" />
                  ) : (
                    friend.username[0]?.toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold">{friend.username}</p>
                  <p className="truncate text-xs text-slate-500">{friend.bio || "Bio eklenmemiş."}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {friend.games.slice(0, 3).map((g, i) => (
                  <span key={i} className="rounded-lg bg-panel2 px-2 py-1 text-xs">
                    🎮 {g.game} · {g.rank}
                  </span>
                ))}
              </div>

              <button className="btn-secondary mt-4 w-full" onClick={() => onOpenChat(friend)}>
                <MessageCircle size={16} className="mr-2 inline" /> Mesaj Gönder
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MessagesView({
  me,
  players,
  onOpenChat,
  onGoPlayers,
}: {
  me: UserType;
  players: Player[];
  onOpenChat: (player: Player) => void;
  onGoPlayers: () => void;
}) {
  const [allMessages, setAllMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const r = await fetch("/api/messages", { cache: "no-store" });
      const x = await r.json();
      setAllMessages(x.messages || []);
    } catch {
      setAllMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [me.id]);

  const conversationIds = Array.from(
    new Set(
      allMessages.map((message) =>
        message.from === me.id ? message.to : message.from
      )
    )
  );

  const conversations = conversationIds
    .map((id) => {
      const player = players.find((item) => item.id === id);
      const msgs = allMessages.filter(
        (message) =>
          (message.from === me.id && message.to === id) ||
          (message.from === id && message.to === me.id)
      );
      const last = msgs[msgs.length - 1];
      return player ? { player, last } : null;
    })
    .filter(Boolean) as { player: Player; last: any }[];

  conversations.sort((a, b) =>
    String(b.last?.createdAt || "").localeCompare(String(a.last?.createdAt || ""))
  );

  return (
    <div>
      <div className="mb-7">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/15 text-violet-300">
            <MessageCircle size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-black">Mesajlar</h1>
            <p className="text-sm text-slate-500">Tüm konuşmalarını buradan yönet.</p>
          </div>
        </div>
      </div>

      {loading && !allMessages.length ? (
        <div className="card p-8 text-center text-sm text-slate-500">Mesajlar yükleniyor...</div>
      ) : conversations.length === 0 ? (
        <div className="card p-8 text-center">
          <MessageCircle size={44} className="mx-auto text-slate-600" />
          <h2 className="mt-4 text-xl font-bold">Henüz konuşman yok</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Oyuncu Bul bölümünden bir oyuncuya mesaj göndererek ilk konuşmanı başlat.
          </p>
          <button className="btn-primary mt-5" onClick={onGoPlayers}>Oyuncu Bul</button>
        </div>
      ) : (
        <div className="max-w-3xl space-y-3">
          {conversations.map(({ player, last }) => (
            <button
              key={player.id}
              onClick={() => onOpenChat(player)}
              className="card flex w-full items-center gap-4 p-4 text-left transition hover:border-accent/40"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 font-black">
                {player.avatar ? (
                  <img src={player.avatar} alt={player.username} className="h-full w-full object-cover" />
                ) : (
                  player.username[0]?.toUpperCase()
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-bold">{player.username}</p>
                <p className="mt-1 truncate text-sm text-slate-400">{last?.text || "Mesaj"}</p>
              </div>

              <div className="shrink-0 text-xs text-slate-500">
                {last?.createdAt ? new Date(last.createdAt).toLocaleString("tr-TR") : ""}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function InvitesView({
  me,
  players,
  onToast,
}: {
  me: UserType;
  players: Player[];
  onToast: (message: string) => void;
}) {
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const r = await fetch("/api/invites", { cache: "no-store" });
      const x = await r.json();
      setInvites(x.invites || []);
    } catch {
      setInvites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [me.id]);

  const updateInvite = async (id: string, status: "accepted" | "rejected") => {
    try {
      const r = await fetch("/api/invites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const x = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(x.error || "Davet güncellenemedi.");
      setInvites((items) =>
        items.map((item) => (item.id === id ? { ...item, status } : item))
      );
      onToast(status === "accepted" ? "Davet kabul edildi." : "Davet reddedildi.");
    } catch (e: any) {
      onToast(e.message || "Davet güncellenemedi.");
    }
  };

  const incoming = invites.filter((invite) => invite.to === me.id);
  const outgoing = invites.filter((invite) => invite.from === me.id);

  const playerName = (id: string) =>
    players.find((player) => player.id === id)?.username || "Bilinmeyen oyuncu";

  return (
    <div className="max-w-4xl">
      <div className="mb-7">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/15 text-violet-300">
            <Send size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-black">Davetler</h1>
            <p className="text-sm text-slate-500">Oyun davetlerini kabul et veya reddet.</p>
          </div>
        </div>
      </div>

      {loading && !invites.length ? (
        <div className="card p-8 text-center text-sm text-slate-500">Davetler yükleniyor...</div>
      ) : (
        <>
          <div>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-lg font-black">Gelen Davetler</h2>
              <span className="rounded-full bg-accent/15 px-2 py-1 text-xs font-bold text-violet-300">{incoming.length}</span>
            </div>

            {incoming.length === 0 ? (
              <div className="card p-5 text-sm text-slate-500">Gelen oyun davetin yok.</div>
            ) : (
              <div className="space-y-3">
                {incoming.map((invite) => (
                  <div key={invite.id} className="card p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-bold">🎮 {playerName(invite.from)}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          Seni <b className="text-white">{invite.game}</b> oyununa davet etti.
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(invite.createdAt).toLocaleString("tr-TR")}
                        </p>
                      </div>

                      {invite.status === "pending" ? (
                        <div className="flex gap-2">
                          <button className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold hover:bg-emerald-700" onClick={() => updateInvite(invite.id, "accepted")}>
                            Kabul Et
                          </button>
                          <button className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold hover:bg-red-700" onClick={() => updateInvite(invite.id, "rejected")}>
                            Reddet
                          </button>
                        </div>
                      ) : (
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${invite.status === "accepted" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                          {invite.status === "accepted" ? "Kabul edildi" : "Reddedildi"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-lg font-black">Gönderdiğim Davetler</h2>
              <span className="rounded-full bg-panel2 px-2 py-1 text-xs font-bold text-slate-400">{outgoing.length}</span>
            </div>

            {outgoing.length === 0 ? (
              <div className="card p-5 text-sm text-slate-500">Henüz oyun daveti göndermedin.</div>
            ) : (
              <div className="space-y-3">
                {outgoing.map((invite) => (
                  <div key={invite.id} className="card flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-bold">🎮 {playerName(invite.to)}</p>
                      <p className="text-sm text-slate-400">{invite.game}</p>
                    </div>
                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${invite.status === "accepted" ? "bg-emerald-500/10 text-emerald-400" : invite.status === "rejected" ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                      {invite.status === "accepted" ? "Kabul edildi" : invite.status === "rejected" ? "Reddedildi" : "Bekliyor"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SettingsView({ me, notifications, notificationEnabled, onEnableNotifications, onMarkRead, onProfile, onLogin, onLogout }: { me: UserType | null; notifications: NotificationType[]; notificationEnabled: boolean; onEnableNotifications: () => void; onMarkRead: () => void; onProfile: () => void; onLogin: () => void; onLogout: () => void; }) {
  return <div className="max-w-3xl">
    <div className="mb-7 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/15 text-violet-300"><Settings size={22} /></div><div><h1 className="text-3xl font-black">Ayarlar</h1><p className="text-sm text-slate-500">Hesap, bildirim ve profil tercihlerini yönet.</p></div></div>

    <div className="card mb-4 p-5"><div className="flex items-center gap-3"><User className="text-violet-300" /><div><h2 className="font-bold">Hesap</h2><p className="text-xs text-slate-500">Profil bilgileri</p></div></div>
      {me ? <div className="mt-5 rounded-2xl border border-line bg-panel2 p-4"><div className="flex items-center gap-4"><div className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 text-lg font-black">{me.avatar ? <img src={me.avatar} alt={me.username} className="h-full w-full object-cover" /> : me.username[0]}</div><div><h3 className="font-bold">{me.username}</h3><p className="text-sm text-slate-500">{me.email}</p></div></div><button className="btn-secondary mt-4" onClick={onProfile}><User size={16} className="mr-2 inline" />Profili Düzenle</button></div> : <div className="mt-5 rounded-2xl border border-line bg-panel2 p-4"><p className="text-sm text-slate-400">Bildirimleri ve hesabı yönetmek için giriş yap.</p><button className="btn-primary mt-4" onClick={onLogin}><LogIn size={16} className="mr-2 inline" />Giriş Yap</button></div>}
    </div>

    <div className="card mb-4 p-5"><div className="flex items-center gap-3"><Bell className="text-violet-300" /><div><h2 className="font-bold">Bildirimler</h2><p className="text-xs text-slate-500">Mesaj, arkadaşlık ve oyun davetleri.</p></div></div>
      <button className="btn-secondary mt-5" onClick={onEnableNotifications}><Volume2 size={16} className="mr-2 inline" />{notificationEnabled ? "Bildirimler Aktif" : "Sesli Bildirimleri Aktifleştir"}</button>
      <div className="mt-5 space-y-2">{notifications.length ? notifications.slice(0, 8).map((n) => <div key={n.id} className={`rounded-2xl border border-line bg-panel2 p-4 ${n.read ? "opacity-70" : ""}`}><div className="flex items-start justify-between gap-4"><div><p className="font-semibold">{n.text}</p><p className="mt-1 text-xs text-slate-500">{new Date(n.createdAt).toLocaleString("tr-TR")}</p></div>{n.read ? <Check size={16} className="text-emerald-400" /> : <span className="rounded-full bg-accent px-2 py-1 text-[10px] font-bold">Yeni</span>}</div></div>) : <p className="rounded-2xl border border-dashed border-line p-4 text-sm text-slate-500">Henüz bildirimin yok.</p>}</div>
      {notifications.some((n) => !n.read) && <button className="btn-secondary mt-4" onClick={onMarkRead}>Tümünü okundu işaretle</button>}
    </div>

    <div className="card p-5"><div className="flex items-center gap-3"><LogOut className="text-violet-300" /><div><h2 className="font-bold">Oturum</h2><p className="text-xs text-slate-500">Hesabından güvenli şekilde çıkış yap.</p></div></div>{me && <button className="mt-5 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold hover:bg-red-700" onClick={onLogout}><LogOut size={16} className="mr-2 inline" />Çıkış Yap</button>}</div>
  </div>;
}

function AuthModal({ mode, close, done, switchMode }: { mode: "login" | "register"; close: () => void; done: () => void; switchMode: (mode: "login" | "register") => void; }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true); setErr("");
    try {
      const r = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mode === "login" ? { email, password } : { username, email, password }) });
      const x = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(x.error || "İşlem başarısız.");
      done();
    } catch (e: any) { setErr(e.message || "İşlem başarısız."); } finally { setLoading(false); }
  };
  return <Modal close={close}><h2 className="text-2xl font-black">{mode === "login" ? "Giriş Yap" : "Hesap Oluştur"}</h2><p className="mt-1 text-sm text-slate-500">{mode === "login" ? "GamerHub hesabına giriş yap." : "Oyuncu topluluğuna katıl."}</p>{mode === "register" && <input className="input mt-5" placeholder="Kullanıcı adı" value={username} onChange={(e) => setUsername(e.target.value)} /> }<input className="input mt-3" placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} /><input className="input mt-3" type="password" placeholder="Şifre (en az 6 karakter)" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />{err && <p className="mt-3 text-sm text-red-400">{err}</p>}<button className="btn-primary mt-5 w-full" disabled={loading} onClick={submit}>{loading ? "Bekle..." : mode === "login" ? "Giriş Yap" : "Kayıt Ol"}</button><div className="mt-4 text-center text-sm text-slate-500">{mode === "login" ? "Hesabın yok mu?" : "Zaten hesabın var mı?"}<button className="ml-2 font-bold text-violet-300" onClick={() => switchMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Kayıt Ol" : "Giriş Yap"}</button></div></Modal>;
}

function ProfileModal({ me, close, saved }: { me: UserType; close: () => void; saved: () => void; }) {
  const [bio, setBio] = useState(me.bio || "");
  const [games, setGames] = useState<GameInfo[]>(Array.isArray(me.games) ? me.games : []);
  const [selectedGame, setSelectedGame] = useState("");
  const [selectedRank, setSelectedRank] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const addGame = () => {
    setErr("");
    if (!selectedGame || !selectedRank || !selectedRole) return setErr("Oyun, rank ve rol seçmelisin.");
    if (games.some((g) => g.game === selectedGame)) return setErr("Bu oyunu zaten ekledin.");
    setGames([...games, { game: selectedGame, rank: selectedRank, role: selectedRole }]);
    setSelectedGame(""); setSelectedRank(""); setSelectedRole("");
  };

  const uploadFile = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const r = await fetch("/api/upload", { method: "POST", body: form });
    const x = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(x.error || "Dosya yüklenemedi.");
    return x.url as string;
  };

  const save = async () => {
    setErr(""); setLoading(true);
    try {
      let avatar = me.avatar || "";
      let cover = me.cover || "";
      if (avatarFile) avatar = await uploadFile(avatarFile);
      if (coverFile) cover = await uploadFile(coverFile);
      const r = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bio: bio.slice(0, 500), avatar, cover, games }) });
      const x = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(x.error || "Profil güncellenemedi.");
      saved();
    } catch (e: any) { setErr(e.message || "Profil kaydedilemedi."); } finally { setLoading(false); }
  };

  return <Modal close={close}><div className="pr-8"><h2 className="text-2xl font-black">Profilimi Düzenle</h2><p className="mt-1 text-sm text-slate-500">@{me.username}</p></div>
    <div className="mt-6"><label className="block text-sm font-bold">Bio</label><textarea className="input mt-2 min-h-28 resize-none" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} placeholder="Kendinden bahset..." /><div className="mt-1 text-right text-xs text-slate-600">{bio.length}/500</div></div>
    <div className="mt-6"><label className="block text-sm font-bold">Profil Fotoğrafı</label><div className="mt-3 flex items-center gap-4"><div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 font-black">{avatarFile ? <img src={URL.createObjectURL(avatarFile)} className="h-full w-full object-cover" alt="Yeni avatar" /> : me.avatar ? <img src={me.avatar} className="h-full w-full object-cover" alt={me.username} /> : me.username[0]}</div><label className="btn-secondary cursor-pointer"><ImageIcon size={16} className="mr-2 inline" /> Fotoğraf seç<input hidden type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} /></label></div></div>
    <div className="mt-6"><label className="block text-sm font-bold">Kapak Fotoğrafı</label><label className="btn-secondary mt-3 cursor-pointer"><ImageIcon size={16} className="mr-2 inline" /> Kapak seç<input hidden type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} /></label>{coverFile && <p className="mt-2 text-xs text-slate-500">{coverFile.name}</p>}</div>
    <div className="mt-7"><h3 className="font-bold">Oyunlarım</h3><p className="mt-1 text-xs text-slate-500">Oyun, rank ve rol seçerek profilini oluştur.</p><div className="mt-4 space-y-3"><select className="input" value={selectedGame} onChange={(e) => { setSelectedGame(e.target.value); setSelectedRank(""); setSelectedRole(""); setErr(""); }}><option value="">Oyun seç...</option>{gamesList.map((g) => <option key={g} value={g}>{g}</option>)}</select><select className="input" value={selectedRank} disabled={!selectedGame} onChange={(e) => setSelectedRank(e.target.value)}><option value="">{selectedGame ? "Rank seç..." : "Önce oyun seç"}</option>{(gameRanks[selectedGame] || []).map((rank) => <option key={rank} value={rank}>{rank}</option>)}</select><select className="input" value={selectedRole} disabled={!selectedGame} onChange={(e) => setSelectedRole(e.target.value)}><option value="">{selectedGame ? "Rol seç..." : "Önce oyun seç"}</option>{(gameRoles[selectedGame] || []).map((role) => <option key={role} value={role}>{role}</option>)}</select></div><button type="button" className="btn-secondary mt-3 w-full" onClick={addGame}>+ Oyunu Ekle</button></div>
    <div className="mt-5 space-y-2">{games.length ? games.map((g, i) => <div key={`${g.game}-${i}`} className="flex items-center justify-between rounded-2xl border border-line bg-panel2 p-3"><div><p className="font-bold">🎮 {g.game}</p><p className="mt-1 text-xs text-slate-400">🏆 {g.rank} · 👤 {g.role}</p></div><button className="text-xs font-bold text-red-400" onClick={() => setGames(games.filter((_, idx) => idx !== i))}>Sil</button></div>) : <p className="rounded-2xl border border-dashed border-line p-4 text-sm text-slate-500">Henüz oyun eklemedin.</p>}</div>
    {err && <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{err}</div>}
    <div className="mt-6 flex gap-3"><button className="btn-secondary flex-1" onClick={close}>İptal</button><button className="btn-primary flex-1" disabled={loading} onClick={save}>{loading ? "Kaydediliyor..." : <><Save size={16} className="mr-2 inline" />Kaydet</>}</button></div>
  </Modal>;
}

function ChatModal({ player, messages, text, setText, send, close }: { me: UserType | null; player: Player; messages: any[]; text: string; setText: (s: string) => void; send: () => void; close: () => void; }) {
  return <Modal close={close}><h2 className="text-xl font-black">💬 {player.username}</h2><div className="my-4 h-64 space-y-2 overflow-auto rounded-xl border border-line bg-bg p-3">{messages.length ? messages.map((m) => <div key={m.id} className="rounded-xl bg-panel2 p-2 text-sm">{m.text}<div className="mt-1 text-[10px] text-slate-500">{new Date(m.createdAt).toLocaleString("tr-TR")}</div></div>) : <p className="text-sm text-slate-500">Henüz mesaj yok.</p>}</div><div className="flex gap-2"><input className="input" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Mesaj yaz..." /><button className="btn-primary" onClick={send}>Gönder</button></div></Modal>;
}

function Modal({ children, close }: { children: React.ReactNode; close: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onMouseDown={(e) => e.target === e.currentTarget && close()}><div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-line bg-panel p-6 shadow-2xl"><button className="absolute right-4 top-4 text-slate-500 hover:text-white" onClick={close}><X /></button>{children}</div></div>;
}
