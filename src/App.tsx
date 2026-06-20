import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Gamepad2, 
  RotateCcw, 
  Maximize2, 
  Plus, 
  Info, 
  X, 
  Flame, 
  Trash2, 
  Volume2, 
  VolumeX, 
  Cpu, 
  Tv, 
  CircleDot, 
  ExternalLink,
  Sparkles,
  Bookmark,
  Activity,
  Coins,
  Music,
  Share2,
  ListRestart
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import gamesData from "./games.json";
import { Game } from "./types";

export default function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [view, setView] = useState<"home" | "play">("home");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Custom game maker state
  const [customTitle, setCustomTitle] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customEmoji, setCustomEmoji] = useState("🎮");
  const [showAddModal, setShowAddModal] = useState(false);
  const [customError, setCustomError] = useState("");

  // Physical cabinet settings
  const [scanlinesActive, setScanlinesActive] = useState(true);
  const [muted, setMuted] = useState(false);
  const [synthPitch, setSynthPitch] = useState<number>(330); // in Hz
  const [cabinetColor, setCabinetColor] = useState<"cyan" | "magenta" | "amber" | "emerald">("cyan");
  const [cabinetState, setCabinetState] = useState<"ONLINE" | "SYSTEM_IDLE" | "LOADED">("ONLINE");
  const [coinsInserted, setCoinsInserted] = useState<number>(3);
  const [highScore, setHighScore] = useState<number>(99);

  // Ratings simulator
  const [likes, setLikes] = useState<Record<string, number>>({ flappybird: 147 });
  const [likedList, setLikedList] = useState<string[]>([]);

  // Refs
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Web Audio Context for retro sound generation
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Load static preset games (Flappy Bird only)
    const presets: Game[] = [...gamesData];
    
    // Load custom slots
    const savedCustom = localStorage.getItem("unlocked_custom_games_v2");
    let parsedCustom: Game[] = [];
    if (savedCustom) {
      try {
        parsedCustom = JSON.parse(savedCustom);
      } catch (e) {
        console.error("Failed to load local custom games", e);
      }
    }

    const merged = [...presets, ...parsedCustom];
    setGames(merged);
    
    // Set Flappy Bird as default active game immediately
    const flappy = merged.find(g => g.id === "flappybird") || merged[0];
    if (flappy) {
      setActiveGame(flappy);
    }

    // Load High score & coins
    const savedHighScore = localStorage.getItem("unlocked_highscore");
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore) || 99);
    }

    const savedFavs = localStorage.getItem("unlocked_favorites_v2");
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (_) {}
    }

    // Initialize random likes count
    const initialLikes: Record<string, number> = { flappybird: 284 };
    parsedCustom.forEach(cg => {
      initialLikes[cg.id] = 12;
    });
    setLikes(initialLikes);
  }, []);

  // Web Audio Synthesizer: Play gorgeous 8-bit sound retro effects directly in browser
  const playRetroSound = (type: "coin" | "jump" | "click" | "powerup" | "laser") => {
    if (muted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === "coin") {
        // Double tone bleep
        osc.type = "square";
        osc.frequency.setValueAtTime(synthPitch, now);
        osc.frequency.setValueAtTime(synthPitch * 1.5, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === "jump") {
        // Quick upward sweep
        osc.type = "sine";
        osc.frequency.setValueAtTime(synthPitch / 1.5, now);
        osc.frequency.exponentialRampToValueAtTime(synthPitch * 2, now + 0.15);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === "click") {
        // Micro frequency pop
        osc.type = "triangle";
        osc.frequency.setValueAtTime(120, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === "powerup") {
        // Fast ascending retro chord
        osc.type = "square";
        osc.frequency.setValueAtTime(synthPitch / 2, now);
        osc.frequency.setValueAtTime(synthPitch * 0.75, now + 0.06);
        osc.frequency.setValueAtTime(synthPitch, now + 0.12);
        osc.frequency.setValueAtTime(synthPitch * 1.25, now + 0.18);
        osc.frequency.setValueAtTime(synthPitch * 1.5, now + 0.24);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === "laser") {
        // Classic descending pitch sweep
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(synthPitch * 3, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      console.warn("Audio synthesizer blocked by browser policy until gesture interaction.", e);
    }
  };

  const handleInsertCoin = () => {
    setCoinsInserted(prev => prev + 1);
    playRetroSound("coin");
  };

  const handleInteractivePlay = (game: Game) => {
    playRetroSound("click");
    setActiveGame(game);
    setView("play");
    setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.src = game.iframeUrl;
      }
    }, 50);
  };

  // Toggle favorite list
  const handleToggleFavorite = (id: string) => {
    playRetroSound("jump");
    let next: string[];
    if (favorites.includes(id)) {
      next = favorites.filter(f => f !== id);
    } else {
      next = [...favorites, id];
    }
    setFavorites(next);
    localStorage.setItem("unlocked_favorites_v2", JSON.stringify(next));
  };

  // Simulated upvote system
  const handleUpvote = (id: string) => {
    if (likedList.includes(id)) {
      playRetroSound("click");
      setLikes(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) }));
      setLikedList(prev => prev.filter(x => x !== id));
    } else {
      playRetroSound("powerup");
      setLikes(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
      setLikedList(prev => [...prev, id]);
    }
  };

  // Safe manual link registration
  const handleRegisterCustom = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError("");

    if (!customTitle.trim() || !customUrl.trim()) {
      setCustomError("Please input both a title and iframe source URL.");
      return;
    }

    try {
      new URL(customUrl);
    } catch (_) {
      setCustomError("Malformed link format. Must start with http:// or https://");
      return;
    }

    const cleanId = "custom_" + Date.now();
    const newCustomGame: Game = {
      id: cleanId,
      title: customTitle.trim(),
      description: customDesc.trim() || "User loaded custom retro cartridge emulator.",
      category: "Custom Slot",
      iframeUrl: customUrl.trim(),
      author: "Local Host",
      emoji: customEmoji,
      instructions: "Enjoy this manually linked emulator. Warning: Emulators require the target secure iframe server to permit embedding (No SAMEORIGIN restrictions).",
      controls: ["Mouse clicks & WASD keyboard inputs"],
      popular: false
    };

    const saved = localStorage.getItem("unlocked_custom_games_v2");
    let list: Game[] = [];
    if (saved) {
      try {
        list = JSON.parse(saved);
      } catch (_) {}
    }

    const nextList = [...list, newCustomGame];
    localStorage.setItem("unlocked_custom_games_v2", JSON.stringify(nextList));
    
    setGames(prev => [...prev, newCustomGame]);
    setActiveGame(newCustomGame);
    
    // Clear state inputs
    setCustomTitle("");
    setCustomUrl("");
    setCustomDesc("");
    setCustomEmoji("🎮");
    setShowAddModal(false);
    
    // Play powerup tone
    playRetroSound("powerup");
  };

  // Delete linked customized card
  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to remove this linked game cartridge?")) return;

    playRetroSound("laser");

    setGames(prev => prev.filter(g => g.id !== id));
    
    const saved = localStorage.getItem("unlocked_custom_games_v2");
    if (saved) {
      try {
        const list = JSON.parse(saved) as Game[];
        const filtered = list.filter(g => g.id !== id);
        localStorage.setItem("unlocked_custom_games_v2", JSON.stringify(filtered));
      } catch (_) {}
    }

    if (activeGame?.id === id) {
      const defaultOne = games.find(g => g.id === "flappybird") || games[0];
      if (defaultOne) {
        setActiveGame(defaultOne);
      }
    }
  };

  // Hardware Diagnostic Stats simulation
  const diagnosticCode = useMemo(() => {
    return `PORT_3000 // CORE_EMU_ACTIVE // COINS_LEFT_${coinsInserted} // SYNTH_PITCH_${synthPitch}HZ // HI_SCR_${highScore}`;
  }, [coinsInserted, synthPitch, highScore]);

  // Compute unique categories from available games list
  const categories = useMemo(() => {
    const list = new Set<string>();
    games.forEach(g => {
      if (g.category) list.add(g.category);
    });
    return ["All", ...Array.from(list), "Favorites"];
  }, [games]);

  // Filtered games based on search query text and active category selector
  const filteredGames = useMemo(() => {
    return games.filter(g => {
      const titleMatch = g.title.toLowerCase().includes(searchQuery.toLowerCase());
      const catMatch = g.category.toLowerCase().includes(searchQuery.toLowerCase());
      const descMatch = (g.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSearch = titleMatch || catMatch || descMatch;
      
      if (selectedCategory === "All") {
        return matchesSearch;
      } else if (selectedCategory === "Favorites") {
        return favorites.includes(g.id) && matchesSearch;
      } else {
        return g.category === selectedCategory && matchesSearch;
      }
    });
  }, [games, selectedCategory, searchQuery, favorites]);

  // Handle Fullscreen of frame
  const triggerCabinetFullscreen = () => {
    playRetroSound("powerup");
    const viewport = document.getElementById("arcade-screen-box");
    if (viewport) {
      if (!document.fullscreenElement) {
        viewport.requestFullscreen().catch(() => {
          // Fallback if rejected
          alert("Fullscreen access blocked by sandbox permission rules. Try playing in standard full page view.");
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  // Accent mapping helper
  const getAccentStyles = () => {
    switch (cabinetColor) {
      case "magenta":
        return {
          glow: "shadow-[0_0_25px_rgba(244,63,94,0.3)]",
          border: "border-rose-500",
          text: "text-rose-400",
          bg: "bg-rose-500",
          gColor: "from-rose-500 to-indigo-600",
          gradient: "from-rose-500/10 via-slate-900 to-slate-950",
          led: "bg-rose-500"
        };
      case "amber":
        return {
          glow: "shadow-[0_0_25px_rgba(245,158,11,0.3)]",
          border: "border-amber-500",
          text: "text-amber-400",
          bg: "bg-amber-500",
          gColor: "from-amber-400 to-yellow-600",
          gradient: "from-amber-500/10 via-slate-900 to-slate-950",
          led: "bg-amber-400"
        };
      case "emerald":
        return {
          glow: "shadow-[0_0_25px_rgba(16,185,129,0.3)]",
          border: "border-emerald-500",
          text: "text-emerald-400",
          bg: "bg-emerald-500",
          gColor: "from-emerald-400 to-teal-600",
          gradient: "from-emerald-500/10 via-slate-900 to-slate-950",
          led: "bg-emerald-500"
        };
      default: // cyan
        return {
          glow: "shadow-[0_0_25px_rgba(6,182,212,0.3)]",
          border: "border-cyan-500",
          text: "text-cyan-400",
          bg: "bg-cyan-500",
          gColor: "from-cyan-400 to-blue-600",
          gradient: "from-cyan-500/10 via-slate-900 to-slate-950",
          led: "bg-cyan-400"
        };
    }
  };

  const currentStyles = getAccentStyles();

  return (
    <div className="min-h-screen bg-[#070b13] text-zinc-100 font-sans selection:bg-rose-500 selection:text-white pb-12 overflow-x-hidden relative">
      
      {/* Background Synthwave Sun & Sky Glow */}
      <div className="absolute top-0 inset-x-0 h-[600px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-250px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-indigo-900/20 via-violet-950/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-sky-500/5 rounded-full blur-2xl" />
        {/* Retro Grid background */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}
        />
      </div>

      {/* Modern Retro Scan-Line Filter Toggle Area */}
      {scanlinesActive && (
        <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.04] bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] bg-[length:100%_4px,_3px_100%]" />
      )}

      {/* Main Header */}
      <header className="relative z-10 max-w-7xl mx-auto px-4 pt-6 pb-2">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-zinc-800/60 pb-5">
          <div className="flex items-center gap-3.5 text-center md:text-left">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-400 rounded-lg blur-md opacity-25 animate-pulse" />
              <div className="relative p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center">
                <Gamepad2 className="w-7 h-7 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-200 to-rose-400">
                  Unlocked Games Hub
                </h1>
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  v3.0 Neon Arcade
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">SANDBOXED HTML5 FLAPPY RE-ENGINE &amp; CUSTOM LINK COMPILER</p>
            </div>
          </div>

          {/* Core controls & quick actions */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            
            {/* Ambient Accent Color Selector */}
            <div className="flex items-center gap-1.5 bg-zinc-950/80 px-2.5 py-1.5 rounded-lg border border-zinc-800/80 text-xs">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mr-1">Neon Accent:</span>
              <button 
                onClick={() => { playRetroSound("click"); setCabinetColor("cyan"); }}
                className={`w-3.5 h-3.5 rounded-full bg-cyan-400 transition-transform ${cabinetColor === "cyan" ? "ring-2 ring-white scale-110" : "opacity-50 hover:opacity-100"}`}
                title="Cyan Light"
              />
              <button 
                onClick={() => { playRetroSound("click"); setCabinetColor("magenta"); }}
                className={`w-3.5 h-3.5 rounded-full bg-rose-500 transition-transform ${cabinetColor === "magenta" ? "ring-2 ring-white scale-110" : "opacity-50 hover:opacity-100"}`}
                title="Rose Light"
              />
              <button 
                onClick={() => { playRetroSound("click"); setCabinetColor("amber"); }}
                className={`w-3.5 h-3.5 rounded-full bg-amber-400 transition-transform ${cabinetColor === "amber" ? "ring-2 ring-white scale-110" : "opacity-50 hover:opacity-100"}`}
                title="Amber Amber Light"
              />
              <button 
                onClick={() => { playRetroSound("click"); setCabinetColor("emerald"); }}
                className={`w-3.5 h-3.5 rounded-full bg-emerald-400 transition-transform ${cabinetColor === "emerald" ? "ring-2 ring-white scale-110" : "opacity-50 hover:opacity-100"}`}
                title="Emerald Green Light"
              />
            </div>

            {/* Load Custom Game action */}
            <button 
              onClick={() => { playRetroSound("click"); setShowAddModal(true); }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg border border-indigo-500/30 transition shadow-lg shadow-indigo-600/15"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Link Emulator URL</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      {view === "home" ? (
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 md:py-10 space-y-10">
          
          {/* Main Hero Title Area with premium vintage visual hierarchy */}
          <div className="text-center space-y-3 sm:space-y-4 max-w-3xl mx-auto py-6 sm:py-10 relative">
            <div className="absolute inset-0 bg-cyan-500/5 blur-3xl rounded-full" />
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold uppercase tracking-widest rounded-full font-mono mb-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explore Retro Cartridges Vault</span>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 }}
              className="text-4xl sm:text-5xl font-black tracking-tight"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-200 to-rose-400 drop-shadow-sm">
                Neon Arcade Universe
              </span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed"
            >
              Select an official cartridge disk or link your custom emulation slots. Enjoy clean, high-performance web cabinet playthroughs under zero local latency.
            </motion.p>
          </div>

          {/* Interactive Catalog Controls: Search bar & Categories filter */}
          <div className="bg-[#0b0e17]/90 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-zinc-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
            {/* Search Input bar */}
            <div className="relative flex-1 max-w-md w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-500">
                <Gamepad2 className="w-4 h-4 text-zinc-500 group-focus-within:text-cyan-400" />
              </span>
              <input 
                type="text"
                placeholder="Search games, categories, authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm py-2.5 sm:py-3 pl-10 pr-4 rounded-xl bg-black border border-zinc-800/80 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 placeholder-zinc-650 transition"
              />
            </div>

            {/* Displaying Categories tags */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      playRetroSound("click");
                      setSelectedCategory(cat);
                    }}
                    className={`px-3 py-1.5 text-[10px] sm:text-xs font-bold font-mono uppercase tracking-wider rounded-lg border transition duration-150 ${
                      isActive 
                        ? `bg-cyan-400 text-black border-cyan-400 shadow-md shadow-cyan-400/10` 
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Multi-column Game Grid layout */}
          {filteredGames.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredGames.map((g, idx) => {
                const isFav = favorites.includes(g.id);
                return (
                  <motion.div 
                    key={g.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.04, 0.3) }}
                    onClick={() => handleInteractivePlay(g)}
                    className="group relative bg-[#0b0e17]/85 hover:bg-zinc-950/95 border border-zinc-800/80 hover:border-cyan-400 rounded-2xl p-5 flex flex-col justify-between h-56 transition duration-300 cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(6,182,212,0.1)] overflow-hidden"
                  >
                    {/* Retro radial visual element on card hover */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="space-y-3.5">
                      {/* Emoji disk icon and category pill block */}
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 bg-black rounded-lg border border-zinc-800 flex items-center justify-center text-xl relative shadow-inner">
                          <span>{g.emoji}</span>
                          <span className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-zinc-900 border border-zinc-800" />
                        </div>
                        <span className="text-[9px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 border border-cyan-500/20 uppercase font-mono tracking-wider font-bold rounded">
                          {g.category}
                        </span>
                      </div>

                      {/* Title & Description metadata */}
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-sm text-zinc-100 group-hover:text-cyan-400 transition truncate">
                          {g.title}
                        </h4>
                        <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                          {g.description}
                        </p>
                      </div>
                    </div>

                    {/* Likes & Bookmarks metrics bottom section */}
                    <div className="pt-3 border-t border-zinc-900/60 flex items-center justify-between">
                      <span className="text-[9px] text-zinc-600 font-mono">
                        BY {g.author ? g.author.toUpperCase() : "CLASSIC"}
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Favorite button toggle icon representer */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(g.id);
                          }}
                          className="p-1 rounded text-zinc-500 hover:text-rose-500 transition-colors"
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isFav ? "fill-rose-500 text-rose-500" : ""}`} />
                        </button>
                        
                        {/* Rating likes tally */}
                        <div className="flex items-center gap-1 text-[10px] tracking-wider font-mono text-zinc-500">
                          <Flame className="w-3.5 h-3.5 text-amber-500 fill-current" />
                          <span>{likes[g.id] ?? 20}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 text-center bg-[#0b0e17]/30 border border-zinc-900 rounded-3xl space-y-4 max-w-sm mx-auto shadow-2xl">
              <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-zinc-500">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-zinc-300">No Cartridges Found</p>
                <p className="text-[11px] text-zinc-500 leading-normal">
                  No preset classic or linked customized cartridges matched the query "{searchQuery}". Try searching another title.
                </p>
              </div>
              <button 
                onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
                className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:text-white rounded-xl text-xs font-mono font-bold text-zinc-400 transition"
              >
                Clear Filters
              </button>
            </div>
          )}

        </div>
      ) : (
        <main className="relative z-10 max-w-7xl mx-auto px-4 py-4 md:py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: ARCADE CABINET EMULATOR CONSOLE (9-cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Quick action header block to exit play viewport back home */}
            <div className="flex items-center justify-between bg-zinc-950/80 p-3.5 rounded-2xl border border-zinc-800/80">
              <button 
                onClick={() => { playRetroSound("click"); setView("home"); }}
                className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 hover:text-cyan-400 text-zinc-300 border border-zinc-800 hover:border-cyan-500/30 transition shadow-inner font-mono tracking-wider"
              >
                <span>← EXIT TO CATALOG GATEWAY</span>
              </button>
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 bg-black/40 px-3 py-1.5 rounded-lg border border-zinc-900">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>CAB_ONLINE</span>
              </div>
            </div>

            {/* Main Simulated Physical Cabinet Frame */}
            <div className={`relative rounded-3xl overflow-hidden bg-black border-4 ${currentStyles.border} ${currentStyles.glow} transition-all duration-500`}>
              
              {/* Wood Grain/Plastic Retro Sideboards Visual Accents */}
              <div className="absolute top-0 bottom-0 left-0 w-3 bg-[#111] border-r border-zinc-800 pointer-events-none" />
              <div className="absolute top-0 bottom-0 right-0 w-3 bg-[#111] border-l border-zinc-800 pointer-events-none" />

              {/* Cabinet Top Marquee Bar */}
              <div className="bg-[#111] px-6 py-4 flex items-center justify-between border-b-4 border-zinc-800 text-zinc-100 select-none relative overflow-hidden">
                {/* Marquee back glow */}
                <div className={`absolute inset-0 bg-gradient-to-r ${currentStyles.gColor} opacity-5 mix-blend-color-dodge`} />
                
                <div className="flex items-center gap-2.5 relative z-10">
                  <span className={`w-2.5 h-2.5 rounded-full ${currentStyles.led} animate-ping`} />
                  <h2 className="text-sm font-black uppercase font-mono tracking-widest text-shadow">
                    ★ {activeGame?.title || "Retro Arcade Platform"} ★
                  </h2>
                </div>

                {/* Cabinet LEDs/Indicators */}
                <div className="flex items-center gap-3 text-xs font-mono relative z-10">
                  <div className="hidden sm:flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-md border border-zinc-900">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] text-zinc-400 uppercase">Credits:</span>
                    <span className="text-amber-400 font-bold">{coinsInserted}</span>
                  </div>
                  <div className="bg-black/60 px-3 py-1.5 rounded-md border border-zinc-900 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-[10px] text-zinc-400">STATE:</span>
                    <span className="text-emerald-400 font-bold">{cabinetState}</span>
                  </div>
                </div>
              </div>

              {/* Simulated Glass Screen & Frame Viewport */}
              <div id="arcade-screen-box" className="relative bg-[#000] aspect-video w-full flex items-center justify-center p-0.5 overflow-hidden">
                
                {/* Retro CRT Scanlines glass effect */}
                <div className="absolute inset-0 pointer-events-none z-20 bg-gradient-to-tr from-white/[0.01] to-white/0" />
                
                {/* Main Game Sandbox Iframe */}
                <iframe 
                  ref={iframeRef}
                  src={activeGame?.iframeUrl || "about:blank"}
                  className="w-full h-full min-h-[420px] sm:min-h-[480px] lg:min-h-[510px] border-0 outline-none select-none bg-black relative z-10"
                  referrerPolicy="no-referrer"
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  title={activeGame?.title || "Unlocked Game Playback"}
                />

                {/* No Signal Simulator screen overlay if iframe is unloaded */}
                {!activeGame && (
                  <div className="absolute inset-0 bg-[#0c0d12] flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <Gamepad2 className="w-16 h-16 text-zinc-700 animate-bounce" />
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg font-mono">SYSTEM READY</h3>
                      <p className="text-xs text-zinc-500">Select a classic cartridge from the vault below to begin</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Physical Control Board & Buttons Drawer */}
              <div className="bg-[#10121a] p-4 border-t-4 border-zinc-800 relative z-10 space-y-4">
                
                {/* Control Switches ribbon */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-4 text-xs font-mono">
                    
                    {/* Scanlines on/off dial switch */}
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <span className="text-zinc-500">Scanlines Filter:</span>
                      <button 
                        onClick={() => { playRetroSound("click"); setScanlinesActive(!scanlinesActive); }}
                        className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${scanlinesActive ? "bg-cyan-500" : "bg-zinc-800"}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${scanlinesActive ? "transform translate-x-5" : ""}`} />
                      </button>
                      <span className={`font-bold ${scanlinesActive ? "text-cyan-400" : "text-zinc-600"}`}>
                        {scanlinesActive ? "CRT_ON" : "OFF"}
                      </span>
                    </label>

                    {/* Volume audio mute indicator */}
                    <button 
                      onClick={() => { setMuted(!muted); playRetroSound("click"); }}
                      className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition"
                    >
                      {muted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                      <span>Sound effects: {muted ? "MUTED" : "SYNTH_ACTIVE"}</span>
                    </button>

                  </div>

                  {/* Simulated Analog Hardware Pitch Slider Dial for Synth sound effects */}
                  <div className="flex items-center gap-3.5 text-xs font-mono">
                    <span className="text-zinc-550">FX Pitch Osc:</span>
                    <input 
                      type="range" 
                      min="150" 
                      max="650" 
                      value={synthPitch}
                      onChange={(e) => setSynthPitch(Number(e.target.value))}
                      className="w-24 accent-cyan-400 bg-zinc-950 h-1.5 rounded-lg border border-zinc-800"
                      title="Synthesizer oscillator base tune frequency"
                    />
                    <span className="text-cyan-400 font-semibold w-12 text-right">{synthPitch}Hz</span>
                  </div>
                </div>

                {/* Simulated Arcade Cabinet Button Controls */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  
                  {/* Physical Joystick controller simulation */}
                  <div className="md:col-span-4 flex items-center justify-center gap-4 bg-black/60 p-3 rounded-2xl border border-zinc-800/80">
                    <div className="relative w-14 h-14 bg-zinc-950 rounded-full border-2 border-zinc-800 flex items-center justify-center p-2 shadow-inner">
                      {/* Glowing Joystick Nob ball */}
                      <motion.div 
                        whileTap={{ x: [-2, 10, -10, 0], y: [-2, -8, 8, 0] }}
                        onClick={() => playRetroSound("jump")}
                        className={`w-5 h-5 rounded-full ${currentStyles.bg} filter drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] cursor-pointer hover:scale-105 active:scale-95 transition-all`}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-bold block">Physical Control</span>
                      <p className="text-xs text-zinc-300 font-bold font-mono">JOYSTICK SPRING</p>
                    </div>
                  </div>

                  {/* Big Tactile Bumping Push Buttons */}
                  <div className="md:col-span-8 flex flex-wrap justify-between md:justify-end items-center gap-3">
                    
                    {/* Pitch Generator Chomp Button */}
                    <motion.button 
                      whileTap={{ scale: 0.92 }}
                      onClick={() => playRetroSound("jump")}
                      className="flex-1 min-w-[90px] p-3 text-center bg-rose-600/10 hover:bg-rose-600/25 border-2 border-rose-500/40 text-rose-400 font-mono text-xs font-bold rounded-xl transition duration-150 flex flex-col items-center gap-1 group"
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-pulse" />
                      <span>JUMP TONE</span>
                    </motion.button>

                    {/* Zap Sound tone button */}
                    <motion.button 
                      whileTap={{ scale: 0.92 }}
                      onClick={() => playRetroSound("laser")}
                      className="flex-1 min-w-[90px] p-3 text-center bg-violet-600/10 hover:bg-violet-600/25 border-2 border-violet-500/40 text-violet-400 font-mono text-xs font-bold rounded-xl transition duration-150 flex flex-col items-center gap-1"
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-violet-500" />
                      <span>ZAP LASER</span>
                    </motion.button>

                    {/* Insert 25c coin credit button */}
                    <motion.button 
                      whileTap={{ scale: 0.92 }}
                      onClick={handleInsertCoin}
                      className="flex-1 min-w-[95px] p-2.5 text-center bg-amber-500/15 hover:bg-amber-500/25 border-2 border-amber-500/40 text-amber-400 font-mono text-xs font-bold rounded-xl transition duration-150 flex items-center justify-center gap-2"
                    >
                      <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="flex flex-col text-left">
                        <span className="text-[9px] leading-3 text-zinc-550 block">INSERT COIN</span>
                        <span className="text-[11px] leading-3 text-zinc-200 block">+1 CREDIT</span>
                      </span>
                    </motion.button>

                    {/* Refresh active cabinet emulator */}
                    <motion.button 
                      whileTap={{ scale: 0.92 }}
                      onClick={() => {
                        playRetroSound("click");
                        if (iframeRef.current) {
                          iframeRef.current.src = activeGame?.iframeUrl || "about:blank";
                        }
                      }}
                      className="p-3 text-zinc-400 hover:text-white bg-zinc-950 border border-zinc-800 rounded-xl transition"
                      title="Reset/Re-boot Game Cabinet Engine"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </motion.button>

                    {/* Expand Screen view */}
                    <motion.button 
                      whileTap={{ scale: 0.92 }}
                      onClick={triggerCabinetFullscreen}
                      className="p-3 text-zinc-400 hover:text-white bg-zinc-950 border border-zinc-800 rounded-xl transition"
                      title="Fullscreen Cabinet Viewport"
                    >
                      <Maximize2 className="w-5 h-5" />
                    </motion.button>

                  </div>
                </div>

                {/* Hardware diagnostics footer strip */}
                <div className="bg-black/80 px-3.5 py-1.5 rounded-xl border border-zinc-900 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-cyan-500" />
                    <span>{diagnosticCode}</span>
                  </span>
                  <span className="hidden sm:inline text-right uppercase text-cyan-500/60 font-bold">ARCADE_PLAYGROUND_OK ✓</span>
                </div>

              </div>
            </div>

            {/* Quick Active Game Instructions Panel block */}
            {activeGame && (
              <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">ℹ️</span>
                    <div>
                      <h3 className="font-bold text-sm text-zinc-100">Controls &amp; Instructions</h3>
                      <p className="text-[11px] text-zinc-500">Active Game Manual: {activeGame.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                    <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
                    <span className="font-mono">{likes[activeGame.id] ?? 20} Players Loved This</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">How to Play:</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed bg-black/40 p-3 rounded-xl border border-zinc-800">
                      {activeGame.instructions}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">Standard Cabinet Inputs:</h4>
                    <ul className="space-y-1.5 bg-black/40 p-3 rounded-xl border border-zinc-800 font-mono text-[11px] text-zinc-400">
                      {activeGame.controls.map((control, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          <span>{control}</span>
                        </li>
                      ))}
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                        <span>F5 - Reboot console and clear cookies</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: CARTRIDGES SELECTOR VAULT (4-cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="p-5 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 space-y-4">
              
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3.5">
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-sm tracking-wide text-zinc-100 flex items-center gap-2">
                    <Tv className="w-4 h-4 text-cyan-400" />
                    <span>CARTRIDGE DISK VAULT</span>
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-mono">INSERT DISK INTO ACTIVE SLOT</p>
                </div>
                
                <span className="text-[11px] font-mono bg-zinc-900 text-zinc-400 px-2 py-1 rounded border border-zinc-800">
                  {games.length} AVAILABLE
                </span>
              </div>

              {/* Simulated game slot selection layout */}
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                
                {games.map((g) => {
                  const isActive = activeGame?.id === g.id;
                  const isFav = favorites.includes(g.id);
                  const isCustom = g.id.startsWith("custom_");

                  return (
                    <div 
                      key={g.id}
                      onClick={() => handleInteractivePlay(g)}
                      className={`group relative p-3.5 rounded-xl border cursor-pointer select-none transition-all duration-200 flex items-start justify-between gap-3 ${isActive ? `border-[#00f0ff] bg-cyan-500/5 ${currentStyles.glow}` : "border-zinc-800/80 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/60"}`}
                    >
                      {/* Active inserted floppy/disk indicator flag */}
                      {isActive && (
                        <div className="absolute left-[-2px] inset-y-3.5 w-1 bg-cyan-400 rounded-r" />
                      )}

                      <div className="flex items-start gap-3">
                        
                        {/* Cozy game visual disk block */}
                        <div className="p-2.5 bg-black rounded-lg border border-zinc-800 font-mono text-center flex flex-col items-center justify-center shrink-0 w-11 h-11 relative">
                          <span className="text-xl">{g.emoji}</span>
                          {/* Interactive miniature hole representing floppy coin slot */}
                          <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-zinc-900 border border-zinc-800" />
                        </div>

                        <div className="space-y-0.5 max-w-[170px]">
                          <h4 className="font-bold text-xs group-hover:text-cyan-400 transition text-zinc-100 leading-tight truncate">
                            {g.title}
                          </h4>
                          <p className="text-[10px] text-zinc-500 leading-normal line-clamp-2">
                            {g.description}
                          </p>
                          <div className="text-[9px] text-zinc-400 uppercase font-mono tracking-widest pt-1 flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isCustom ? "bg-indigo-500" : "bg-cyan-500"}`} />
                            <span>{g.category}</span>
                          </div>
                        </div>

                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        
                        {/* Heart favoriting click */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(g.id);
                          }}
                          className="text-zinc-500 hover:text-rose-500 transition-colors p-1 rounded hover:bg-zinc-800"
                          title="Add to Favorite Disk Cartridges list"
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isFav ? "fill-rose-500 text-rose-500" : ""}`} />
                        </button>

                        {/* Micro upvote thumb clicker */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpvote(g.id);
                          }}
                          className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 hover:border-zinc-700"
                          title="Give retro arcade rating"
                        >
                          <Flame className="w-3 h-3 text-amber-500" />
                          <span>{likes[g.id] ?? 20}</span>
                        </button>

                        {/* Remove custom registered cartridges */}
                        {isCustom && (
                          <button 
                            onClick={(e) => handleDeleteCustom(g.id, e)}
                            className="text-zinc-650 hover:text-rose-450 p-1 rounded hover:bg-rose-500/10 transition-colors mt-0.5"
                            title="Eject & delete custom cabinet"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

              </div>

              {/* Quick clean state indicator */}
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-500">Local Bookmarks:</span>
                <span className="text-zinc-300 font-bold">{favorites.length} Pinned</span>
              </div>

            </div>

            {/* Quick interactive retro diagnostic screen board */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/20 to-zinc-950/40 border border-zinc-800/80 space-y-3.5 shadow-xl">
              <h4 className="font-extrabold text-xs text-indigo-400 uppercase tracking-widest font-mono">Arcade Diagnostics</h4>
              
              <div className="space-y-2 text-xs leading-relaxed text-zinc-400">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
                  <span>Core Sandbox Port:</span>
                  <span className="font-mono text-cyan-400 font-bold">PORT: 3000</span>
                </div>
                <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
                  <span>Host Engine State:</span>
                  <span className="font-mono text-emerald-400">OPERATIONAL</span>
                </div>
                <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
                  <span>Active Disk Source:</span>
                  <span className="font-mono text-zinc-400 overflow-hidden text-right max-w-[140px] truncate block" title={activeGame?.iframeUrl}>
                    {activeGame?.iframeUrl || "NONE"}
                  </span>
                </div>
              </div>

              {/* Quick Share Link button */}
              <button 
                onClick={() => {
                  playRetroSound("powerup");
                  navigator.clipboard.writeText(window.location.href);
                  alert("Development Unlocked URL copied to clipboard! Share it with local players.");
                }}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-inner"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Copy Hub Share Link</span>
              </button>
            </div>

          </div>

        </main>
      )}

      {/* FOOTER */}
      <footer className="relative z-10 max-w-7xl mx-auto px-4 mt-12 pt-6 border-t border-zinc-900 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
        <div>
          <p>© 2026 Unlocked Games Hub. Clean Arcade Sandbox Emulator Vault.</p>
          <p className="text-[10px] text-zinc-700 mt-1">
            Running isolated under secure sandbox flags. Preserving classic web-game history clean &amp; responsive.
          </p>
        </div>
        <div className="flex items-center gap-4 text-zinc-500 font-mono text-[10px]">
          <span>ENG: NEON_CAB v3.0</span>
          <span>•</span>
          <span>LATENCY: ZERO_LOCAL</span>
        </div>
      </footer>

      {/* MODAL: Register Custom Emulator URL Cartridge */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-[#020306]/95 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-[#0e111a] rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 p-6 space-y-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-extrabold text-sm text-zinc-100 uppercase tracking-wider">Compile Custom Game Cartridge</h3>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {customError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs font-semibold text-rose-500 leading-relaxed">
                  ⚠️ {customError}
                </div>
              )}

              <form onSubmit={handleRegisterCustom} className="space-y-4">
                
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Game/Emulator Title <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Classic Pacman, Retro Tetris clone..."
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full text-xs p-3 rounded-lg border border-zinc-800 bg-black text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>

                {/* URL */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Iframe Source URL <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="url"
                    required
                    placeholder="https://example.github.io/my-retro-game/"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="w-full text-xs p-3 rounded-lg border border-zinc-800 bg-black text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono"
                  />
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    Cartridges load the target webpage inside our sandboxed block. Verify the target site does not have high secure embedding headers policies enabled.
                  </p>
                </div>

                {/* Emoji Select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Cartridge Retro Icon</label>
                  <select 
                    value={customEmoji}
                    onChange={(e) => setCustomEmoji(e.target.value)}
                    className="w-full text-xs p-3 rounded-lg border border-zinc-800 bg-black text-zinc-300 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  >
                    <option value="🎮">🎮 Standard Gamepad</option>
                    <option value="🕹️">🕹️ Arcade Joystick</option>
                    <option value="🚀">🚀 Space invader</option>
                    <option value="🧩">🧩 Logical puzzle</option>
                    <option value="🔥">🔥 Flame retro</option>
                    <option value="🏰">🏰 Castel quest</option>
                    <option value="⚡">⚡ Lightning fast</option>
                    <option value="🎲">🎲 Game pieces</option>
                  </select>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Short Description</label>
                  <textarea 
                    rows={2}
                    placeholder="Enter a brief description of this emulation cartridge..."
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                    className="w-full text-xs p-3 rounded-lg border border-zinc-800 bg-black text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3.5">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 text-xs font-bold bg-cyan-400 text-black hover:bg-cyan-300 rounded-lg transition"
                  >
                    Insert Into Vault Catalog
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
