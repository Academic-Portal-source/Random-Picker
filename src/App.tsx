import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sparkle from "./components/Sparkle";
import MagicBurst from "./components/MagicBurst";
import FloatingChars from "./components/FloatingChar";

/* ─── Types ─── */
type Student = {
  id: string;
  name: string;
  avatar: string;
  color: string;
  gradient: string;
  picks: number;
};
type AnimMode = "magic" | "crystal" | "stars" | "portal";
type CelebrationType = "fireworks" | "sparkle" | "rainbow";
type Settings = {
  pickCount: number;
  removeAfterPick: boolean;
  fairMode: boolean;
  sound: boolean;
  animation: AnimMode;
  celebration: CelebrationType;
};

/* ─── Data ─── */
const AVATARS = ["🦁","🐻","🦊","🐼","🐨","🐯","🦄","🐬","🐙","🦋","🦉","🐸","🐧","🐝","🦖","🐢","🐇","🦜","🐺","🦒","🐘","🦈","🦩","🐠","🐿️","🦔","🐾","🪼"];
const GRADIENTS = [
  "linear-gradient(135deg,#667eea,#764ba2)",
  "linear-gradient(135deg,#f093fb,#f5576c)",
  "linear-gradient(135deg,#4facfe,#00f2fe)",
  "linear-gradient(135deg,#43e97b,#38f9d7)",
  "linear-gradient(135deg,#fa709a,#fee140)",
  "linear-gradient(135deg,#a18cd1,#fbc2eb)",
  "linear-gradient(135deg,#fccb90,#d57eeb)",
  "linear-gradient(135deg,#e0c3fc,#8ec5fc)",
  "linear-gradient(135deg,#f6d365,#fda085)",
  "linear-gradient(135deg,#96fbc4,#f9f586)",
];
const BG_COLORS = ["#667eea","#f5576c","#4facfe","#43e97b","#fa709a","#a18cd1","#d57eeb","#8ec5fc","#fda085","#f9f586"];

const SAMPLE = ["Mia","Noah","Emma","Liam","Ava","Ethan","Sophia","Mason","Isabella","Lucas","Amelia","Oliver","Harper","Elijah","Luna","James","Evelyn","Benjamin","Aria","Henry"];

const chime = (freq = 660, dur = 0.12, vol = 0.15) => {
  try {
    const c = new AudioContext();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur);
    setTimeout(() => c.close(), dur * 1200);
  } catch {}
};
const magicChime = () => {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => chime(f, 0.25, 0.12), i * 100));
};

const mkStudent = (name: string, idx: number): Student => ({
  id: crypto.randomUUID(),
  name: name.trim(),
  avatar: AVATARS[idx % AVATARS.length],
  color: BG_COLORS[idx % BG_COLORS.length],
  gradient: GRADIENTS[idx % GRADIENTS.length],
  picks: 0,
});

/* ─── App ─── */
export default function App() {
  const [students, setStudents] = useState<Student[]>(() => {
    const s = localStorage.getItem("dp-students");
    return s ? JSON.parse(s) : SAMPLE.map((n, i) => mkStudent(n, i));
  });
  const [settings, setSettings] = useState<Settings>(() => {
    const s = localStorage.getItem("dp-settings");
    return s ? JSON.parse(s) : { pickCount: 1, removeAfterPick: false, fairMode: true, sound: true, animation: "magic", celebration: "fireworks" };
  });
  const [isPicking, setIsPicking] = useState(false);
  const [winners, setWinners] = useState<Student[]>([]);
  const [showWinners, setShowWinners] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [rollingName, setRollingName] = useState("");
  const [rollingAvatar, setRollingAvatar] = useState("");
  const [roundPicked, setRoundPicked] = useState<string[]>([]);
  const [burst, setBurst] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { localStorage.setItem("dp-students", JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem("dp-settings", JSON.stringify(settings)); }, [settings]);

  const pool = useMemo(() => {
    if (!settings.fairMode) return students;
    const avail = students.filter(s => !roundPicked.includes(s.id));
    return avail.length >= settings.pickCount ? avail : students;
  }, [students, settings.fairMode, settings.pickCount, roundPicked]);

  const pick = useCallback(() => {
    if (!students.length || isPicking) return;
    setIsPicking(true);
    setShowWinners(false);
    setWinners([]);
    setBurst(false);

    let t = 0;
    const max = 30;
    const iv = setInterval(() => {
      t++;
      const r = pool[Math.floor(Math.random() * pool.length)];
      setRollingName(r.name);
      setRollingAvatar(r.avatar);
      if (settings.sound && t % 2 === 0) chime(400 + t * 15, 0.06, 0.08);
      if (t >= max) {
        clearInterval(iv);
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        const sel = shuffled.slice(0, Math.min(settings.pickCount, pool.length));
        setWinners(sel);
        setShowWinners(true);
        setIsPicking(false);
        setRollingName("");
        setRollingAvatar("");
        setBurst(true);
        setTimeout(() => setBurst(false), 1500);
        if (settings.sound) magicChime();
        setStudents(p => p.map(s => sel.find(w => w.id === s.id) ? { ...s, picks: s.picks + 1 } : s));
        if (settings.fairMode) {
          const nr = [...roundPicked, ...sel.map(s => s.id)];
          setRoundPicked(nr.length >= students.length ? [] : nr);
        }
        if (settings.removeAfterPick) setTimeout(() => setStudents(p => p.filter(s => !sel.find(w => w.id === s.id))), 4000);
      }
    }, 70);
  }, [students, pool, isPicking, settings, roundPicked]);

  const importNames = (text: string) => {
    const names = [...new Set(text.split(/[\n,;\t]+/).map(n => n.trim()).filter(Boolean))];
    setStudents(names.map((n, i) => mkStudent(n, i)));
    setRoundPicked([]);
    setShowImport(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ fontFamily: "'Baloo 2', 'Nunito', system-ui, sans-serif" }}>
      {/* Background — rich layered gradients for Disney-like depth */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c0a2a] via-[#1a1145] to-[#2d1b69]" />
        {/* Aurora / castle glow layers */}
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(ellipse 80% 50% at 50% 120%, #6a3de8 0%, transparent 70%)" }} />
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(ellipse 60% 40% at 30% 20%, #ff69b4 0%, transparent 60%)" }} />
        <div className="absolute inset-0 opacity-15" style={{ background: "radial-gradient(ellipse 50% 35% at 75% 15%, #4facfe 0%, transparent 55%)" }} />
        <div className="absolute inset-0 opacity-25" style={{ background: "radial-gradient(ellipse 90% 40% at 50% 100%, #1a0a3e 0%, transparent 60%)" }} />
        {/* Starfield dots */}
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: `radial-gradient(1px 1px at 10% 20%, white, transparent),
            radial-gradient(1px 1px at 25% 45%, white, transparent),
            radial-gradient(1.5px 1.5px at 40% 10%, white, transparent),
            radial-gradient(1px 1px at 55% 65%, white, transparent),
            radial-gradient(1.5px 1.5px at 70% 30%, white, transparent),
            radial-gradient(1px 1px at 85% 55%, white, transparent),
            radial-gradient(1px 1px at 15% 80%, white, transparent),
            radial-gradient(1.5px 1.5px at 45% 85%, white, transparent),
            radial-gradient(1px 1px at 65% 75%, white, transparent),
            radial-gradient(1px 1px at 90% 15%, white, transparent),
            radial-gradient(1px 1px at 5% 50%, white, transparent),
            radial-gradient(1.5px 1.5px at 35% 35%, white, transparent),
            radial-gradient(1px 1px at 78% 88%, white, transparent),
            radial-gradient(1px 1px at 50% 50%, white, transparent),
            radial-gradient(1.5px 1.5px at 20% 92%, white, transparent),
            radial-gradient(1px 1px at 92% 42%, white, transparent)`,
        }} />
      </div>

      <FloatingChars />
      <Sparkle count={30} />

      {/* Header */}
      <header className="relative z-20 max-w-7xl mx-auto px-4 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <motion.div className="flex items-center gap-3" initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <motion.div
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="w-14 h-14 rounded-2xl grid place-items-center text-4xl"
              style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)", boxShadow: "0 4px 20px rgba(255,215,0,0.4)" }}
            >
              🪄
            </motion.div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-yellow-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent drop-shadow-lg leading-tight" style={{ WebkitTextStroke: "0.5px rgba(255,215,0,0.3)" }}>
                Pick-a-Pal
              </h1>
              <p className="text-[13px] font-semibold text-purple-200/70 -mt-1 tracking-wide">✨ Where every name is a star</p>
            </div>
          </motion.div>

          <motion.div className="flex items-center gap-2.5" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <HeaderBtn icon="📥" label="Import" onClick={() => setShowImport(true)} gradient="linear-gradient(135deg,#43e97b,#38f9d7)" />
            <HeaderBtn icon="⚙️" label="Settings" onClick={() => setShowSettings(true)} gradient="linear-gradient(135deg,#a18cd1,#fbc2eb)" />
          </motion.div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 pb-24 grid lg:grid-cols-[310px_1fr_280px] gap-5 mt-2">
        {/* Student List */}
        <motion.section initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="lg:sticky lg:top-4 self-start">
          <GlassCard>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <span className="text-xl">👑</span> Class Stars
              </h2>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-yellow-200 backdrop-blur">{students.length} students</span>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                id="add-name"
                onKeyDown={(e) => { if (e.key === "Enter") { const el = e.target as HTMLInputElement; if (el.value.trim()) { setStudents(p => [...p, mkStudent(el.value, p.length)]); el.value = ""; } } }}
                placeholder="Add a name..."
                className="flex-1 h-11 px-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 font-semibold outline-none focus:ring-2 focus:ring-yellow-300/50 focus:bg-white/15 transition-all backdrop-blur-sm"
              />
              <button onClick={() => { const el = document.getElementById("add-name") as HTMLInputElement; if (el.value.trim()) { setStudents(p => [...p, mkStudent(el.value, p.length)]); el.value = ""; } }} className="w-11 h-11 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-400 text-white font-black text-xl grid place-items-center shadow-lg shadow-orange-400/30 hover:scale-105 active:scale-95 transition-transform">+</button>
            </div>

            <div className="space-y-1.5 max-h-[420px] overflow-auto pr-1 custom-scroll">
              <AnimatePresence initial={false}>
                {students.map((s) => (
                  <motion.div key={s.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20, scale: 0.8 }}
                    className="group flex items-center gap-3 p-2 rounded-2xl hover:bg-white/10 transition-all cursor-default"
                  >
                    <div className="w-10 h-10 rounded-xl grid place-items-center text-xl shadow-md flex-shrink-0" style={{ background: s.gradient }}>{s.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white truncate text-[15px] leading-tight">{s.name}</div>
                      <div className="text-[11px] text-purple-200/60 font-semibold">
                        {s.picks === 0 ? "Not picked yet" : `Picked ${s.picks}×`}
                        {roundPicked.includes(s.id) && <span className="ml-1 text-yellow-300/80">• ✓ this round</span>}
                      </div>
                    </div>
                    <button onClick={() => setStudents(p => p.filter(x => x.id !== s.id))} className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-red-500/20 text-red-300 grid place-items-center text-sm font-bold hover:bg-red-500/40 transition-all">✕</button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {!students.length && (
                <div className="text-center py-14">
                  <div className="text-5xl mb-3">🌟</div>
                  <p className="font-bold text-white/80">No students yet!</p>
                  <p className="text-sm text-purple-200/60">Add names or import a list</p>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-white/10 flex gap-2">
              <button onClick={() => { setStudents(p => p.map(s => ({ ...s, picks: 0 }))); setRoundPicked([]); }} className="flex-1 h-9 rounded-xl bg-white/10 text-white/80 font-semibold text-[13px] hover:bg-white/15 transition-colors">Reset picks</button>
              <button onClick={() => { setStudents([]); setRoundPicked([]); }} className="h-9 px-3 rounded-xl bg-red-500/20 text-red-300 font-semibold text-[13px] hover:bg-red-500/30 transition-colors">Clear all</button>
            </div>
          </GlassCard>
        </motion.section>

        {/* Center Stage */}
        <motion.section initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="relative">
            {/* Glow behind stage */}
            <div className="absolute -inset-4 rounded-[40px] bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-pink-500/20 blur-2xl" />

            <div className="relative rounded-[32px] overflow-hidden" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
              {/* Stage header */}
              <div className="relative px-5 py-4 flex items-center justify-between overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(102,126,234,0.3), rgba(118,75,162,0.3))" }}>
                <div className="absolute inset-0 opacity-30"><Sparkle count={8} /></div>
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl grid place-items-center text-2xl" style={{ background: "linear-gradient(135deg,#FFD700,#FF8C00)", boxShadow: "0 3px 15px rgba(255,215,0,0.3)" }}>🎯</div>
                  <div>
                    <h2 className="font-extrabold text-xl text-white leading-tight">Magic Stage</h2>
                    <p className="text-[12px] text-purple-200/80 font-semibold">
                      Pick {settings.pickCount} {settings.pickCount > 1 ? "stars" : "star"} • {settings.animation} mode
                    </p>
                  </div>
                </div>
                <div className="relative z-10 flex gap-1.5">
                  {(["magic","crystal","stars","portal"] as const).map(a => (
                    <button key={a} onClick={() => setSettings(s => ({...s, animation: a}))}
                      className={`h-8 px-3 rounded-lg text-[11px] font-bold capitalize transition-all ${settings.animation === a ? "bg-yellow-400/90 text-purple-900 shadow-lg shadow-yellow-400/30" : "bg-white/10 text-white/70 hover:bg-white/20"}`}
                    >{a === "magic" ? "🪄" : a === "crystal" ? "🔮" : a === "stars" ? "⭐" : "🌀"} {a}</button>
                  ))}
                </div>
              </div>

              {/* Stage */}
              <div className="relative h-[400px] md:h-[440px] overflow-hidden" style={{ background: "radial-gradient(ellipse at center 40%, rgba(102,126,234,0.15) 0%, transparent 60%)" }}>
                <Sparkle count={15} />
                <MagicBurst active={burst} />

                <div className="absolute inset-0 grid place-items-center">
                  <AnimatePresence mode="wait">
                    {/* IDLE */}
                    {!isPicking && !showWinners && (
                      <motion.div key="idle" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center">
                        <motion.div animate={{ y: [0, -12, 0], rotate: [0, 3, -3, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="relative inline-block">
                          <div className="text-[100px] leading-none drop-shadow-2xl filter">🪄</div>
                          <Sparkle count={6} />
                        </motion.div>
                        <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }} className="mt-4 text-2xl font-extrabold bg-gradient-to-r from-yellow-200 to-amber-200 bg-clip-text text-transparent">
                          Ready to pick a star!
                        </motion.p>
                        <p className="text-purple-200/60 font-semibold mt-1">Wave the wand below ✨</p>
                      </motion.div>
                    )}

                    {/* PICKING */}
                    {isPicking && (
                      <motion.div key="picking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full grid place-items-center relative">
                        {settings.animation === "magic" && (
                          <>
                            {/* Swirling particles */}
                            {[...Array(16)].map((_, i) => (
                              <motion.div key={i} className="absolute left-1/2 top-1/2 text-2xl" animate={{
                                x: Math.cos((i / 16) * Math.PI * 2) * (80 + Math.sin(Date.now() / 500 + i) * 30),
                                y: Math.sin((i / 16) * Math.PI * 2) * (80 + Math.sin(Date.now() / 500 + i) * 30),
                                rotate: [0, 360],
                                scale: [0.8, 1.2, 0.8],
                              }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.1, ease: "linear" }}>
                                {AVATARS[i % AVATARS.length]}
                              </motion.div>
                            ))}
                            <motion.div className="relative z-10" animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
                              <div className="rounded-[28px] px-10 py-7 text-center" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 15px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)", backdropFilter: "blur(20px)" }}>
                                <div className="text-[13px] font-bold text-yellow-300/90 uppercase tracking-widest mb-1">✨ Casting spell...</div>
                                <motion.div key={rollingName} initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.05 }}>
                                  <span className="text-5xl mr-3">{rollingAvatar}</span>
                                  <span className="text-4xl font-extrabold text-white">{rollingName}</span>
                                </motion.div>
                              </div>
                            </motion.div>
                          </>
                        )}

                        {settings.animation === "crystal" && (
                          <div className="text-center relative">
                            <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                              <div className="text-[120px] leading-none drop-shadow-[0_0_40px_rgba(147,130,220,0.8)]">🔮</div>
                            </motion.div>
                            <motion.div animate={{ y: [2, -2, 2], opacity: [0.8, 1, 0.8] }} transition={{ duration: 0.8, repeat: Infinity }} className="mt-2">
                              <div className="inline-block rounded-2xl px-8 py-4" style={{ background: "linear-gradient(135deg, rgba(147,130,220,0.3), rgba(255,255,255,0.1))", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(15px)" }}>
                                <div className="text-[12px] text-purple-200/70 font-bold uppercase tracking-widest">The crystal reveals...</div>
                                <div className="text-3xl font-extrabold text-white mt-1">{rollingAvatar} {rollingName}</div>
                              </div>
                            </motion.div>
                          </div>
                        )}

                        {settings.animation === "stars" && (
                          <div className="relative">
                            {[...Array(20)].map((_, i) => {
                              const a = (i / 20) * Math.PI * 2;
                              const r = 100 + (i % 3) * 30;
                              return (
                                <motion.div key={i} className="absolute left-1/2 top-1/2 text-xl" animate={{ x: [Math.cos(a) * r, Math.cos(a + 0.5) * r], y: [Math.sin(a) * r, Math.sin(a + 0.5) * r], opacity: [0.3, 1, 0.3], scale: [0.6, 1.2, 0.6] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 }}>⭐</motion.div>
                              );
                            })}
                            <motion.div className="relative z-10 text-center" animate={{ scale: [0.98, 1.02, 0.98] }} transition={{ duration: 0.6, repeat: Infinity }}>
                              <div className="rounded-3xl px-10 py-6" style={{ background: "linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,255,255,0.05))", border: "1px solid rgba(255,215,0,0.3)", backdropFilter: "blur(15px)" }}>
                                <div className="text-sm font-bold text-yellow-300 uppercase tracking-widest">⭐ Shooting star...</div>
                                <div className="text-4xl font-extrabold text-white mt-2">{rollingAvatar} {rollingName}</div>
                              </div>
                            </motion.div>
                          </div>
                        )}

                        {settings.animation === "portal" && (
                          <div className="relative">
                            {[1, 2, 3].map(ring => (
                              <motion.div key={ring} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2" style={{ width: ring * 100, height: ring * 100, borderColor: `rgba(147,130,220,${0.5 / ring})`, boxShadow: `0 0 20px rgba(147,130,220,${0.2 / ring})` }} animate={{ rotate: ring % 2 === 0 ? 360 : -360, scale: [1, 1.05, 1] }} transition={{ duration: 3 / ring, repeat: Infinity, ease: "linear" }} />
                            ))}
                            <motion.div className="relative z-10 text-center" animate={{ scale: [0.95, 1.05, 0.95] }} transition={{ duration: 0.8, repeat: Infinity }}>
                              <div className="rounded-3xl px-10 py-6" style={{ background: "radial-gradient(circle, rgba(147,130,220,0.3), rgba(0,0,0,0.2))", border: "1px solid rgba(147,130,220,0.3)", backdropFilter: "blur(10px)" }}>
                                <div className="text-sm font-bold text-purple-300 uppercase tracking-widest">🌀 Summoning...</div>
                                <div className="text-4xl font-extrabold text-white mt-2">{rollingAvatar} {rollingName}</div>
                              </div>
                            </motion.div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* WINNERS */}
                    {showWinners && winners.length > 0 && (
                      <motion.div key="winners" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center px-4 w-full">
                        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }} className="inline-flex items-center gap-2 rounded-full px-6 py-2 mb-5 font-extrabold text-lg text-purple-900" style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)", boxShadow: "0 4px 25px rgba(255,215,0,0.5)" }}>
                          👑 {winners.length > 1 ? "WINNERS" : "WINNER"}!
                        </motion.div>

                        <div className="flex flex-wrap justify-center gap-5">
                          {winners.map((w, i) => (
                            <motion.div key={w.id} initial={{ y: 50, opacity: 0, rotate: -8 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ delay: i * 0.15, type: "spring", stiffness: 200, damping: 15 }}>
                              <div className="relative w-[170px] rounded-[28px] p-5 text-center" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))", border: "1px solid rgba(255,255,255,0.2)", boxShadow: `0 15px 40px rgba(0,0,0,0.3), 0 0 60px ${w.color}33` }}>
                                <Sparkle count={6} />
                                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }} className="w-[90px] h-[90px] rounded-2xl mx-auto mb-3 grid place-items-center text-[50px] shadow-xl" style={{ background: w.gradient }}>
                                  {w.avatar}
                                </motion.div>
                                <div className="font-extrabold text-xl text-white leading-tight">{w.name}</div>
                                <div className="mt-2 inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-yellow-400/20 text-yellow-200">✨ Picked {w.picks}×</div>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        <div className="mt-6 flex justify-center gap-3">
                          <GlassBtn onClick={() => { setShowWinners(false); setWinners([]); }}>Close</GlassBtn>
                          <GlassBtn primary onClick={pick}>🎲 Pick Again</GlassBtn>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="px-5 py-4 flex items-center justify-between gap-3" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="hidden md:flex items-center gap-2 text-[12px] font-semibold text-purple-200/60">
                  <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur">{settings.fairMode ? "⚖️ Fair" : "🎲 Random"}</span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur">Available: {pool.length}</span>
                </div>

                {/* Main pick button */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={pick}
                  disabled={isPicking || !students.length}
                  className="relative flex-1 md:flex-none md:w-[280px] h-[58px] rounded-2xl font-extrabold text-xl text-white disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #FFD700, #FF8C00)", boxShadow: "0 6px 30px rgba(255,165,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)" }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isPicking ? (
                      <><motion.span animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }} className="inline-block">🪄</motion.span> Casting...</>
                    ) : (
                      <>🪄 Pick {settings.pickCount > 1 ? `${settings.pickCount} Stars` : "a Star"}</>
                    )}
                  </span>
                  <motion.div className="absolute inset-0 opacity-20" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} style={{ background: "linear-gradient(90deg, transparent, white, transparent)", width: "50%" }} />
                </motion.button>

                {/* Count controls */}
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setSettings(s => ({...s, pickCount: Math.max(1, s.pickCount - 1)}))} className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 text-white font-bold text-lg hover:bg-white/15 active:scale-95 transition-all">−</button>
                  <div className="w-10 h-10 rounded-xl grid place-items-center font-extrabold text-lg" style={{ background: "linear-gradient(135deg,#667eea,#764ba2)", color: "white" }}>{settings.pickCount}</div>
                  <button onClick={() => setSettings(s => ({...s, pickCount: Math.min(5, s.pickCount + 1)}))} className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 text-white font-bold text-lg hover:bg-white/15 active:scale-95 transition-all">+</button>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Right: Quick Options & Stats */}
        <motion.section initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="lg:sticky lg:top-4 self-start space-y-4">
          <GlassCard>
            <h3 className="font-extrabold text-white flex items-center gap-2 mb-3"><span className="text-xl">🎛️</span> Quick Options</h3>
            <div className="space-y-3">
              <ToggleRow icon="⚖️" label="Fair Mode" desc="Everyone gets a turn" active={settings.fairMode} toggle={() => setSettings(s => ({...s, fairMode: !s.fairMode}))} />
              <ToggleRow icon="🗑️" label="Remove Winner" desc="Vanishes after picking" active={settings.removeAfterPick} toggle={() => setSettings(s => ({...s, removeAfterPick: !s.removeAfterPick}))} />
              <ToggleRow icon="🔊" label="Magic Sounds" desc="Dings & chimes" active={settings.sound} toggle={() => setSettings(s => ({...s, sound: !s.sound}))} />

              <div className="pt-3 border-t border-white/10">
                <div className="text-[13px] font-bold text-white/80 mb-2">🎉 Celebration</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["fireworks","sparkle","rainbow"] as const).map(c => (
                    <button key={c} onClick={() => setSettings(s => ({...s, celebration: c}))} className={`h-9 rounded-xl text-[11px] font-bold capitalize transition-all ${settings.celebration === c ? "bg-yellow-400/90 text-purple-900 shadow-lg" : "bg-white/10 text-white/70 hover:bg-white/15"}`}>{c === "fireworks" ? "🎆" : c === "sparkle" ? "✨" : "🌈"} {c}</button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-white/10">
                <div className="text-[13px] font-bold text-white/80 mb-2">👥 Quick Pick Count</div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setSettings(s => ({...s, pickCount: n}))} className={`h-9 rounded-xl font-extrabold transition-all ${settings.pickCount === n ? "bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/30" : "bg-white/10 text-white/70 hover:bg-white/15"}`}>{n}</button>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="font-extrabold text-white flex items-center gap-2 mb-3"><span className="text-xl">📊</span> Magic Stats</h3>
            <div className="space-y-2">
              <StatRow label="Total picks" value={String(students.reduce((a,b) => a+b.picks, 0))} />
              <StatRow label="Most picked" value={students.length ? [...students].sort((a,b) => b.picks - a.picks)[0].name : "—"} />
              <StatRow label="Fair round" value={`${roundPicked.length} / ${students.length}`} />
              <StatRow label="Remaining" value={String(pool.length)} />
            </div>
            <button onClick={() => { setStudents(p => [...p].sort(() => Math.random() - 0.5)); }} className="mt-3 w-full h-9 rounded-xl bg-white/10 text-white/80 text-[13px] font-bold hover:bg-white/15 transition-colors">🔀 Shuffle List</button>
          </GlassCard>
        </motion.section>
      </main>

      {/* Import Modal */}
      <Modal open={showImport} onClose={() => setShowImport(false)}>
        <div className="relative px-5 py-4 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(67,233,123,0.3), rgba(56,249,215,0.3))" }}>
          <Sparkle count={5} />
          <h3 className="relative z-10 text-2xl font-extrabold text-white flex items-center gap-2">📥 Import Students</h3>
          <p className="relative z-10 text-[13px] text-white/70 font-semibold mt-0.5">Bring your class list to life!</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="font-bold text-sm text-white/80 mb-1.5 block">Paste names below</label>
            <textarea id="import-text" rows={6} placeholder={"Mia\nNoah\nEmma\nLiam..."} className="w-full rounded-2xl p-4 bg-white/10 border border-white/20 text-white placeholder:text-white/30 font-semibold outline-none focus:ring-2 focus:ring-green-300/40 resize-none backdrop-blur-sm" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { const el = document.getElementById("import-text") as HTMLTextAreaElement; importNames(el.value); }} className="h-11 px-5 rounded-xl font-extrabold text-purple-900" style={{ background: "linear-gradient(135deg, #43e97b, #38f9d7)", boxShadow: "0 4px 15px rgba(67,233,123,0.3)" }}>✨ Import</button>
            <button onClick={() => fileRef.current?.click()} className="h-11 px-5 rounded-xl bg-white/10 border border-white/20 text-white font-bold hover:bg-white/15 transition-colors">📁 Upload File</button>
            <input ref={fileRef} type="file" accept=".txt,.csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) f.text().then(importNames); }} />
            <button onClick={() => { (document.getElementById("import-text") as HTMLTextAreaElement).value = SAMPLE.join("\n"); }} className="h-11 px-5 rounded-xl bg-white/10 border border-white/20 text-white font-bold hover:bg-white/15 transition-colors">📝 Sample</button>
          </div>
          <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
            <p className="font-bold text-white/80 text-[13px] mb-1">💡 Tips for teachers</p>
            <ul className="text-[12px] text-purple-200/60 font-semibold space-y-1 list-disc pl-4">
              <li>Paste from Google Sheets, Excel, or any list</li>
              <li>Separate names by line, comma, semicolon, or tab</li>
              <li>Duplicates are automatically removed</li>
              <li>Upload .csv or .txt files directly</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal open={showSettings} onClose={() => setShowSettings(false)}>
        <div className="relative px-5 py-4 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(161,140,209,0.3), rgba(251,194,235,0.3))" }}>
          <Sparkle count={5} />
          <h3 className="relative z-10 text-2xl font-extrabold text-white flex items-center gap-2">⚙️ Settings</h3>
          <p className="relative z-10 text-[13px] text-white/70 font-semibold mt-0.5">Customize your magic experience</p>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <label className="font-bold text-sm text-white/80 mb-2 block">🎭 Animation Style</label>
            <div className="grid grid-cols-2 gap-2">
              {(["magic","crystal","stars","portal"] as const).map(a => (
                <button key={a} onClick={() => setSettings(s => ({...s, animation: a}))} className={`h-12 rounded-2xl font-bold capitalize flex items-center justify-center gap-2 transition-all ${settings.animation === a ? "bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg" : "bg-white/10 text-white/70 hover:bg-white/15"}`}>
                  {a === "magic" ? "🪄" : a === "crystal" ? "🔮" : a === "stars" ? "⭐" : "🌀"} {a}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="font-bold text-sm text-white/80 mb-2 block">🎉 Celebration Effect</label>
            <div className="grid grid-cols-3 gap-2">
              {(["fireworks","sparkle","rainbow"] as const).map(c => (
                <button key={c} onClick={() => setSettings(s => ({...s, celebration: c}))} className={`h-12 rounded-2xl font-bold capitalize flex items-center justify-center gap-2 transition-all ${settings.celebration === c ? "bg-gradient-to-br from-yellow-400 to-orange-400 text-purple-900 shadow-lg" : "bg-white/10 text-white/70 hover:bg-white/15"}`}>
                  {c === "fireworks" ? "🎆" : c === "sparkle" ? "✨" : "🌈"} {c}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <ToggleRow icon="⚖️" label="Fair Mode" desc="Cycle through all students" active={settings.fairMode} toggle={() => setSettings(s => ({...s, fairMode: !s.fairMode}))} />
            <ToggleRow icon="🗑️" label="Remove After Pick" desc="Winner leaves the list" active={settings.removeAfterPick} toggle={() => setSettings(s => ({...s, removeAfterPick: !s.removeAfterPick}))} />
            <ToggleRow icon="🔊" label="Sound Effects" desc="Magical chimes & dings" active={settings.sound} toggle={() => setSettings(s => ({...s, sound: !s.sound}))} />
          </div>
        </div>
      </Modal>

      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 8px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        * { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.15) transparent; }
      `}</style>
    </div>
  );
}

/* ─── Shared Components ─── */
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[24px] p-4 ${className}`} style={{
      background: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)",
      border: "1px solid rgba(255,255,255,0.12)",
      boxShadow: "0 10px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
      backdropFilter: "blur(20px)",
    }}>
      {children}
    </div>
  );
}

function GlassBtn({ children, onClick, primary = false }: { children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button onClick={onClick} className={`h-11 px-5 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 ${primary ? "text-purple-900" : "text-white bg-white/10 border border-white/15 hover:bg-white/15"}`} style={primary ? { background: "linear-gradient(135deg, #FFD700, #FF8C00)", boxShadow: "0 4px 15px rgba(255,165,0,0.3)" } : {}}>
      {children}
    </button>
  );
}

function HeaderBtn({ icon, label, onClick, gradient }: { icon: string; label: string; onClick: () => void; gradient: string }) {
  return (
    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClick} className="h-11 px-4 rounded-2xl font-bold flex items-center gap-2 text-[14px]" style={{ background: gradient, color: "#1a1a2e", boxShadow: `0 4px 15px ${gradient.includes("43e97b") ? "rgba(67,233,123,0.3)" : "rgba(161,140,209,0.3)"}` }}>
      <span className="text-xl">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  );
}

function ToggleRow({ icon, label, desc, active, toggle }: { icon: string; label: string; desc: string; active: boolean; toggle: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-xl grid place-items-center text-lg bg-white/10 flex-shrink-0">{icon}</div>
        <div className="min-w-0">
          <div className="font-bold text-white text-[14px] leading-tight">{label}</div>
          <div className="text-[11px] text-purple-200/50 font-semibold">{desc}</div>
        </div>
      </div>
      <button onClick={toggle} className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${active ? "" : "bg-white/15"}`} style={active ? { background: "linear-gradient(135deg, #43e97b, #38f9d7)" } : {}}>
        <motion.div className="absolute top-[3px] w-[20px] h-[20px] rounded-full bg-white shadow-md" animate={{ left: active ? 24 : 3 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
      </button>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-purple-200/60 font-semibold">{label}</span>
      <span className="text-[13px] font-bold text-white/90 bg-white/10 px-2.5 py-0.5 rounded-lg truncate max-w-[120px]">{value}</span>
    </div>
  );
}

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center p-4" style={{ background: "rgba(10,8,32,0.7)", backdropFilter: "blur(8px)" }}>
          <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="w-full max-w-[560px] rounded-[28px] overflow-hidden" style={{ background: "linear-gradient(180deg, rgba(30,25,70,0.95), rgba(20,15,55,0.98))", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
            <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/10 text-white/70 grid place-items-center hover:bg-white/20 font-bold z-10 transition-colors">✕</button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
