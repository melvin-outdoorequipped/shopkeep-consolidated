'use client';

import React, {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Command,
  Download,
  FileText,
  GitBranch,
  Gamepad2,
  Home,
  Loader2,
  Lock,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  User,
  X,
  ArrowRight,
} from 'lucide-react';

import SkuProcessor from './components/SkuProcessor';
import AsinConflictChecker from './components/AsinConflictChecker';
import BasecampGenerator from './components/BasecampGenerator';
import Dashboard from './components/dashboard';
import Documentation from './components/documentation';
import Terms from './components/terms';
import DownloadPage from './components/download';
import { supabase } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────
type Theme = 'light' | 'dark';
type ToolId = 'sku' | 'asin' | 'basecamp';
type MainMenuId = 'Dashboard' | 'Tools' | 'Downloads' | 'Documentation' | 'Terms';

// Renamed from User to avoid conflict with Lucide's User icon
interface AuthUser {
  id: string;
  email: string;
}

interface MenuItem {
  id: MainMenuId;
  label: string;
  icon: ReactNode;
  shortcut?: string;
}

interface ToolItem {
  id: ToolId;
  name: string;
  description: string;
  icon: ReactNode;
  accent: 'emerald' | 'cyan' | 'violet';
  comingSoon?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_THEME_KEY = 'theme';

const toolsSubItems: ToolItem[] = [
  {
    id: 'sku',
    name: 'Shopkeep Consolidated Tool',
    description: 'Process and consolidate SKU data.',
    icon: <Search className="h-4 w-4" />,
    accent: 'cyan',
  },
  {
    id: 'asin',
    name: 'Multiple Parent ASIN Checker',
    description: 'Detect styles with multiple parent ASINs.',
    icon: <GitBranch className="h-4 w-4" />,
    accent: 'emerald',
  },
  {
    id: 'basecamp',
    name: 'Basecamp Response Generator',
    description: 'Generate formatted Basecamp messages.',
    icon: <MessageSquare className="h-4 w-4" />,
    accent: 'violet',
  },
];

const ALL_COMMANDS = [
  { label: 'Go to Dashboard',          menuId: 'Dashboard'     as MainMenuId, toolId: null },
  { label: 'Go to Downloads',          menuId: 'Downloads'     as MainMenuId, toolId: null },
  { label: 'Go to Documentation',      menuId: 'Documentation' as MainMenuId, toolId: null },
  { label: 'Go to Terms & Conditions', menuId: 'Terms'         as MainMenuId, toolId: null },
  { label: 'Open Shopkeep Tool',       menuId: 'Tools'         as MainMenuId, toolId: 'sku'      as ToolId },
  { label: 'Open ASIN Checker',        menuId: 'Tools'         as MainMenuId, toolId: 'asin'     as ToolId },
  { label: 'Open Basecamp Generator',  menuId: 'Tools'         as MainMenuId, toolId: 'basecamp' as ToolId },
];

function applyTheme(theme: Theme) {
  if (theme === 'light') {
    document.documentElement.classList.add('light-mode');
    document.documentElement.classList.remove('dark-mode', 'dark');
  } else {
    document.documentElement.classList.add('dark-mode', 'dark');
    document.documentElement.classList.remove('light-mode');
  }
}

// ─── Dino Game ────────────────────────────────────────────────────────────────
function DinoGame({ theme, onClose }: { theme: Theme; onClose: () => void }) {
  const isDark = theme === 'dark';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  // All mutable game state lives in a single ref — no React state inside the loop
  const G = useRef({
    state: 'idle' as 'idle' | 'run' | 'dead',
    score: 0,
    frame: 0,
    speed: 5,
    dinoTop: 0,   // set properly after canvas dimensions known
    dinoVY: 0,
    jumps: 0,
    obstacles: [] as { x: number; w: number; h: number }[],
    groundOff: 0,
    clouds: [{ x: 200, y: 35 }, { x: 450, y: 20 }, { x: 600, y: 45 }],
    highScore: parseInt(typeof window !== 'undefined' ? localStorage.getItem('dinoHS3') ?? '0' : '0'),
    retryBtn: null as null | { x: number; y: number; w: number; h: number },
  });

  // React display state (only for score readout above canvas)
  const [displayScore, setDisplayScore] = useState(0);
  const [displayBest,  setDisplayBest]  = useState(G.current.highScore);
  const [displaySpeed, setDisplaySpeed] = useState('1.0×');

  const W = 660, H = 200;
  const GROUND_Y  = H - 30;
  const DINO_X    = 60;
  const DINO_W    = 26;
  const DINO_H    = 32;
  const GRAVITY   = 0.55;
  const JUMP_V    = -11; // negative = upward

  const colors = useCallback(() => {
    const d = isDark;
    return {
      bg:        d ? '#141824' : '#f5f4f0',
      ground:    d ? '#2e3347' : '#d0cdc6',
      groundTex: d ? '#3d4260' : '#bab7af',
      dinoBody:  d ? '#5dcaa5' : '#1d9e75',
      dinoDark:  d ? '#1d9e75' : '#0f6e56',
      eye:       d ? '#e1f5ee' : '#04342c',
      pupil:     d ? '#04342c' : '#e1f5ee',
      cactus:    d ? '#f09595' : '#993c1d',
      cactDark:  d ? '#a32d2d' : '#711b0c',
      cloud:     d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
      txt:       d ? '#d3d1c7' : '#2c2c2a',
      muted:     d ? '#5f5e5a' : '#888780',
      overlay:   d ? 'rgba(20,24,36,0.87)' : 'rgba(245,244,240,0.90)',
      green:     '#1d9e75',
    };
  }, [isDark]);

  const doJump = useCallback(() => {
    const g = G.current;
    if (g.state === 'dead')  { g.state = 'idle'; return; }
    if (g.state === 'idle')  { g.state = 'run';  return; }
    if (g.jumps < 2) { g.dinoVY = JUMP_V; g.jumps++; }
  }, []);

  const resetGame = useCallback(() => {
    const g = G.current;
    g.score = 0; g.frame = 0; g.speed = 5;
    g.dinoTop  = GROUND_Y - DINO_H;
    g.dinoVY   = 0; g.jumps = 0;
    g.obstacles = []; g.groundOff = 0;
    setDisplayScore(0);
    setDisplaySpeed('1.0×');
  }, [GROUND_Y, DINO_H]);

  // ── draw ──────────────────────────────────────────────────────────────────
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const g  = G.current;
    const c  = colors();

    ctx.clearRect(0, 0, W, H);

    // sky
    ctx.fillStyle = c.bg;
    ctx.fillRect(0, 0, W, H);

    // clouds
    for (const cl of g.clouds) {
      ctx.fillStyle = c.cloud;
      ctx.beginPath(); ctx.arc(cl.x,      cl.y,     16, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cl.x + 16, cl.y - 7, 12, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cl.x + 30, cl.y,     14, 0, Math.PI * 2); ctx.fill();
    }

    // ground
    ctx.fillStyle = c.ground;
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    ctx.strokeStyle = c.groundTex;
    ctx.lineWidth = 1;
    ctx.setLineDash([18, 22]);
    ctx.lineDashOffset = g.groundOff;
    ctx.beginPath(); ctx.moveTo(0, GROUND_Y + 1); ctx.lineTo(W, GROUND_Y + 1); ctx.stroke();
    ctx.setLineDash([]);

    // cacti
    for (const o of g.obstacles) {
      const bx = o.x + o.w / 2 - 5;
      const by = GROUND_Y - o.h;
      ctx.fillStyle = c.cactus;
      ctx.beginPath(); ctx.roundRect(bx, by, 10, o.h, 3); ctx.fill();
      ctx.beginPath(); ctx.roundRect(o.x, GROUND_Y - o.h * 0.68 - 14, 8, 18, 3); ctx.fill();
      ctx.fillRect(o.x, GROUND_Y - o.h * 0.68, o.w / 2 - 3, 7);
      ctx.beginPath(); ctx.roundRect(o.x + o.w - 8, GROUND_Y - o.h * 0.55 - 12, 8, 16, 3); ctx.fill();
      ctx.fillRect(o.x + o.w / 2 + 3, GROUND_Y - o.h * 0.55, o.w / 2 - 3, 7);
      ctx.fillStyle = c.cactDark;
      ctx.fillRect(bx, by, 4, o.h);
    }

    // dino
    const top  = g.dinoTop;
    const onGr = top >= GROUND_Y - DINO_H - 1;
    const leg  = onGr ? (g.frame % 10 < 5 ? 3 : 0) : 0;

    // legs (drawn first so body covers top)
    ctx.fillStyle = c.dinoDark;
    ctx.fillRect(DINO_X + 4,  top + DINO_H, 7, 7 - leg);
    ctx.fillRect(DINO_X + 14, top + DINO_H, 7, 7 + leg);

    // body
    ctx.fillStyle = c.dinoBody;
    ctx.beginPath(); ctx.roundRect(DINO_X, top, DINO_W, DINO_H, 4); ctx.fill();

    // shade
    ctx.fillStyle = c.dinoDark;
    ctx.fillRect(DINO_X + 2, top + 6, 7, DINO_H - 12);

    // head
    ctx.fillStyle = c.dinoBody;
    ctx.beginPath(); ctx.roundRect(DINO_X + 7, top - 10, DINO_W - 4, 13, 4); ctx.fill();

    // spikes
    ctx.fillStyle = c.dinoDark;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(DINO_X + 6  + i * 6, top);
      ctx.lineTo(DINO_X + 9  + i * 6, top - 7);
      ctx.lineTo(DINO_X + 12 + i * 6, top);
      ctx.fill();
    }

    // eye
    ctx.fillStyle = c.eye;
    ctx.beginPath(); ctx.arc(DINO_X + DINO_W - 4, top - 3, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c.pupil;
    ctx.beginPath(); ctx.arc(DINO_X + DINO_W - 3, top - 3, 2, 0, Math.PI * 2); ctx.fill();

    // overlays / text
    ctx.textAlign = 'center';
    if (g.state === 'idle' && g.score === 0) {
      ctx.fillStyle = c.muted;
      ctx.font = '400 14px monospace';
      ctx.fillText('click or press SPACE / ↑ to start', W / 2, GROUND_Y / 2 + 6);
    }

    if (g.state === 'dead') {
      ctx.fillStyle = c.overlay;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = c.txt;
      ctx.font = '500 20px monospace';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 24);
      ctx.fillStyle = c.muted;
      ctx.font = '400 13px monospace';
      ctx.fillText(`score: ${Math.floor(g.score / 10)}  ·  best: ${g.highScore}`, W / 2, H / 2 + 2);

      const bw = 130, bh = 34, bx = W / 2 - 65, by = H / 2 + 18;
      ctx.fillStyle = c.green;
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 8); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '500 13px monospace';
      ctx.fillText('PLAY AGAIN', W / 2, by + 22);
      g.retryBtn = { x: bx, y: by, w: bw, h: bh };
    } else {
      g.retryBtn = null;
    }

    ctx.textAlign = 'left';
  }, [colors, GROUND_Y, DINO_H, DINO_W, DINO_X, W, H]);

  // ── update ────────────────────────────────────────────────────────────────
  const update = useCallback(() => {
    const g = G.current;
    if (g.state !== 'run') return;

    g.frame++;
    g.score++;
    g.speed = 5 + Math.floor(g.score / 350) * 0.7;

    // Update display every 10 frames to avoid too many re-renders
    if (g.frame % 10 === 0) {
      setDisplayScore(Math.floor(g.score / 10));
      setDisplaySpeed((1 + Math.floor(g.score / 350) * 0.14).toFixed(1) + '×');
    }

    // Physics — dinoTop is the Y coordinate of dino's top edge
    // Smaller Y = higher on screen (canvas coords)
    g.dinoVY  += GRAVITY;
    g.dinoTop += g.dinoVY;

    const groundLevel = GROUND_Y - DINO_H;
    if (g.dinoTop >= groundLevel) {
      g.dinoTop = groundLevel;
      g.dinoVY  = 0;
      g.jumps   = 0;
    }

    // Spawn obstacles
    const interval = Math.max(52, 88 - Math.floor(g.score / 400) * 4);
    if (g.frame % interval === 0) {
      g.obstacles.push({ x: W + 10, w: 20 + Math.random() * 10, h: 30 + Math.random() * 18 });
    }
    for (const o of g.obstacles) o.x -= g.speed;
    g.obstacles = g.obstacles.filter(o => o.x + o.w > 0);

    // Collision (shrunken hitbox)
    const dx = DINO_X + 5, dw = DINO_W - 10;
    const dy = g.dinoTop + 5, dh = DINO_H - 10;
    for (const o of g.obstacles) {
      const cx = o.x + 4, cw = o.w - 8;
      const cy = GROUND_Y - o.h;
      if (dx < cx + cw && dx + dw > cx && dy < cy + o.h && dy + dh > cy) {
        g.state = 'dead';
        const s = Math.floor(g.score / 10);
        if (s > g.highScore) {
          g.highScore = s;
          localStorage.setItem('dinoHS3', String(s));
          setDisplayBest(s);
        }
        return;
      }
    }

    // Clouds
    for (const cl of g.clouds) { cl.x -= 0.35; if (cl.x < -80) cl.x = W + 80; }
    g.groundOff = (g.groundOff - g.speed) % 40;
  }, [GROUND_Y, DINO_H, DINO_W, DINO_X, W]);

  // ── main loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    // Initialise dinoTop now that we have H / DINO_H
    G.current.dinoTop = GROUND_Y - DINO_H;

    const loop = () => {
      update();
      draw(ctx);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [update, draw, GROUND_Y, DINO_H]);

  // ── input handlers ────────────────────────────────────────────────────────
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top)  * scaleY;

    const g = G.current;
    if (g.state === 'dead' && g.retryBtn) {
      const b = g.retryBtn;
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        resetGame();
        g.state = 'idle';
        return;
      }
    }
    doJump();
  }, [doJump, resetGame, W, H]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); doJump(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [doJump]);

  return (
    <div className="w-full">
      <div className={`flex items-center justify-between border-b px-4 py-3 ${isDark ? 'border-slate-700/60' : 'border-gray-100'}`}>
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-4 w-4 text-emerald-400" />
          <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Dino Game — jump over the cacti!
          </span>
        </div>
        <button onClick={onClose} className={`rounded-lg p-1 transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}>
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4">
        {/* Score pills */}
        <div className="mb-3 flex gap-2">
          {[
            { label: 'Score', value: displayScore },
            { label: 'Best',  value: displayBest  },
            { label: 'Speed', value: displaySpeed },
          ].map(pill => (
            <div key={pill.label} className={`rounded-lg border px-3 py-1 text-xs ${isDark ? 'border-slate-700 bg-slate-800 text-slate-400' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
              {pill.label} <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{pill.value}</span>
            </div>
          ))}
        </div>

        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className={`w-full cursor-pointer rounded-lg border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}
          onClick={handleCanvasClick}
        />
        <p className={`mt-2 text-center text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
          Click · Space · ↑ to jump &nbsp;|&nbsp; Double-jump supported
        </p>
      </div>
    </div>
  );
}

// ─── PIN Entry ────────────────────────────────────────────────────────────────
function PinEntry({ onSuccess, onCancel, theme }: { onSuccess: () => void; onCancel: () => void; theme: Theme }) {
  const [pin, setPin]     = useState('');
  const [error, setError] = useState(false);
  const isDark = theme === 'dark';
  const CORRECT_PIN = '321';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === CORRECT_PIN) { setError(false); onSuccess(); }
    else { setError(true); setPin(''); }
  };

  return (
    <div className="w-full">
      <div className={`flex items-center justify-between border-b px-4 py-3 ${isDark ? 'border-slate-700/60' : 'border-gray-100'}`}>
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-emerald-400" />
          <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Enter PIN to access game</span>
        </div>
        <button onClick={onCancel} className={`rounded-lg p-1 transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}>
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`mb-2 block text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Enter 3-digit PIN</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={3}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ''))}
              className={`w-full rounded-lg border px-4 py-2 text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-gray-300 bg-white text-gray-900'
              } ${error ? 'border-red-500 ring-1 ring-red-500' : ''}`}
              placeholder="***"
              autoFocus
            />
            {error && <p className="mt-2 text-sm text-red-400">Invalid PIN. Try again.</p>}
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 rounded-lg bg-emerald-600 py-2 font-semibold text-white transition-colors hover:bg-emerald-500">
              Unlock Game
            </button>
            <button
              type="button"
              onClick={onCancel}
              className={`flex-1 rounded-lg border px-4 py-2 transition-colors ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
            >
              Cancel
            </button>
          </div>
          <p className={`text-center text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Hint: The PIN is 3 digits</p>
        </form>
      </div>
    </div>
  );
}

// ─── Game Modal (PIN + Game) ───────────────────────────────────────────────────
function GameModal({ theme, onClose }: { theme: Theme; onClose: () => void }) {
  const [unlocked, setUnlocked] = useState(false);
  const isDark = theme === 'dark';

  return (
    <div className={`rounded-2xl border shadow-2xl ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}
         style={{ width: unlocked ? 580 : 380 }}>
      {unlocked
        ? <DinoGame theme={theme} onClose={onClose} />
        : <PinEntry theme={theme} onSuccess={() => setUnlocked(true)} onCancel={onClose} />
      }
    </div>
  );
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────
function AuthModal({ theme, onSuccess }: { theme: Theme; onSuccess: () => void }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [mode,     setMode]     = useState<'signin' | 'signup'>('signin');
  const isDark = theme === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for a verification link!');
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl border p-8 shadow-2xl ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500">
            <span className="text-2xl font-bold text-white">T</span>
          </div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Welcome to TARA</h2>
          <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            {mode === 'signin' ? 'Sign in to access tools' : 'Create an account to get started'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(['Email', 'Password'] as const).map(field => (
            <div key={field}>
              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{field}</label>
              <input
                type={field === 'Password' ? 'password' : 'email'}
                value={field === 'Email' ? email : password}
                onChange={e => field === 'Email' ? setEmail(e.target.value) : setPassword(e.target.value)}
                required
                minLength={field === 'Password' ? 6 : undefined}
                className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
              />
            </div>
          ))}

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? 'Loading…' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setMode(m => m === 'signin' ? 'signup' : 'signin')}
            className={`text-sm ${isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-500'}`}
          >
            {mode === 'signin' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  return (
    <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
      {collapsed ? <span className="mx-auto block h-1 w-1 rounded-full bg-slate-600" /> : label}
    </div>
  );
}

function SidebarButton({
  label, icon, shortcut, active, collapsed, theme, onClick,
}: {
  label: string; icon: ReactNode; shortcut?: string;
  active: boolean; collapsed: boolean; theme: Theme; onClick: () => void;
}) {
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all duration-150 ${
        active
          ? 'border-emerald-500/50 bg-emerald-500/10 text-white shadow-lg shadow-emerald-500/5'
          : isDark
            ? 'border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-white'
            : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <span className={`flex-shrink-0 transition-colors ${active ? 'text-emerald-400' : 'group-hover:text-emerald-400'}`}>
        {icon}
      </span>
      <span className={`${collapsed ? 'hidden' : 'block'} min-w-0 flex-1 truncate font-medium`}>{label}</span>
      {!collapsed && shortcut && (
        <kbd className={`hidden rounded px-1.5 py-0.5 text-[10px] font-semibold lg:block ${isDark ? 'bg-slate-800 text-slate-500' : 'bg-gray-100 text-gray-400'}`}>
          {shortcut}
        </kbd>
      )}
      {active && !collapsed && <span className="ml-1 h-7 w-1 rounded-full bg-emerald-400" />}
      {collapsed && (
        <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
          {label}
        </span>
      )}
    </button>
  );
}

function ToolSidebarButton({ tool, active, theme, onClick }: { tool: ToolItem; active: boolean; theme: Theme; onClick: () => void }) {
  const isDark = theme === 'dark';
  const activeClass  = tool.accent === 'violet' ? 'border-violet-500/40 bg-violet-500/10'  : tool.accent === 'cyan' ? 'border-cyan-500/40 bg-cyan-500/10'    : 'border-emerald-500/40 bg-emerald-500/10';
  const activeText   = tool.accent === 'violet' ? 'text-violet-300'                          : tool.accent === 'cyan' ? 'text-cyan-300'                          : 'text-emerald-300';
  const iconBg       = tool.accent === 'violet'
    ? isDark ? 'bg-violet-500/15 text-violet-400'   : 'bg-violet-50 text-violet-600'
    : tool.accent === 'cyan'
      ? isDark ? 'bg-cyan-500/15 text-cyan-400'     : 'bg-cyan-50 text-cyan-600'
      : isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={tool.comingSoon}
      className={`group w-full rounded-xl border px-2.5 py-2 text-left transition-all duration-150 ${
        tool.comingSoon ? 'cursor-not-allowed opacity-50'
        : active ? `${activeClass} shadow-sm`
        : isDark ? 'border-transparent hover:bg-slate-800/50'
        : 'border-transparent hover:bg-gray-50'
      }`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
          active ? iconBg : isDark ? 'bg-slate-800 text-slate-500 group-hover:text-slate-300' : 'bg-gray-100 text-gray-400 group-hover:text-gray-600'
        }`}>
          {tool.icon}
        </span>
        <div className="min-w-0 flex-1">
          <span className={`block truncate text-xs font-semibold transition-colors ${active ? activeText : isDark ? 'text-slate-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'}`}>
            {tool.name}
          </span>
          <span className={`mt-0.5 block truncate text-[11px] leading-tight ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            {tool.description}
          </span>
        </div>
        {active && (
          <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${tool.accent === 'violet' ? 'bg-violet-400' : tool.accent === 'cyan' ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
        )}
        {tool.comingSoon && (
          <span className="ml-auto rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-semibold text-orange-400">Soon</span>
        )}
      </div>
    </button>
  );
}

function CollapsedToolButton({ tool, active, theme, onClick }: { tool: ToolItem; active: boolean; theme: Theme; onClick: () => void }) {
  const isDark = theme === 'dark';
  const activeColor = tool.accent === 'violet' ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
    : tool.accent === 'cyan' ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
    : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={tool.comingSoon}
      title={tool.comingSoon ? `${tool.name} (Coming Soon)` : tool.name}
      className={`group relative mx-auto flex h-11 w-11 items-center justify-center rounded-xl border transition-colors duration-150 ${
        active ? activeColor
        : isDark ? 'border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-white'
        : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      } ${tool.comingSoon ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      {tool.icon}
      <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
        {tool.name}{tool.comingSoon ? ' (Coming Soon)' : ''}
      </span>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [activeTool,          setActiveTool]          = useState<ToolId>('sku');
  const [activeMainMenu,      setActiveMainMenu]      = useState<MainMenuId>('Dashboard');
  const [isSidebarCollapsed,  setIsSidebarCollapsed]  = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [theme,               setTheme]               = useState<Theme>('dark');
  const [user,                setUser]                = useState<AuthUser | null>(null);
  const [isAuthLoading,       setIsAuthLoading]       = useState(true);
  const [showAuthModal,       setShowAuthModal]       = useState(false);
  const [showGameModal,       setShowGameModal]       = useState(false);

  const [cmdOpen,   setCmdOpen]   = useState(false);
  const [cmdQuery,  setCmdQuery]  = useState('');
  const [userOpen,  setUserOpen]  = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const cmdInputRef = useRef<HTMLInputElement>(null);
  const prevMenuRef = useRef<MainMenuId>('Dashboard');
  const isDark = theme === 'dark';

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      setIsAuthLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUser({ id: user.id, email: user.email ?? '' });
      else      setShowAuthModal(true);
      setIsAuthLoading(false);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? '' });
        setShowAuthModal(false);
      } else {
        setUser(null);
        setShowAuthModal(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowAuthModal(true);
    setUserOpen(false);
  };

  // ── Theme ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_THEME_KEY) as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const init: Theme = saved === 'light' || saved === 'dark' ? saved : prefersDark ? 'dark' : 'light';
    setTheme(init);
    applyTheme(init);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(cur => {
      const next: Theme = cur === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_THEME_KEY, next);
      applyTheme(next);
      return next;
    });
  }, []);

  // ── Navigation ────────────────────────────────────────────────────────────
  const navigateTo = useCallback((menuId: MainMenuId, toolId?: ToolId) => {
    if (menuId === 'Tools' && activeMainMenu === 'Tools' && !toolId) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveMainMenu(menuId);
      if (toolId) setActiveTool(toolId);
      prevMenuRef.current = menuId;
      setIsTransitioning(false);
    }, 120);
  }, [activeMainMenu]);

  const handleMainMenuClick = (id: MainMenuId) => { navigateTo(id); setIsMobileSidebarOpen(false); };

  const handleToolClick = (toolId: ToolId, comingSoon?: boolean) => {
    if (comingSoon) return;
    if (activeMainMenu !== 'Tools') {
      setIsTransitioning(true);
      setTimeout(() => { setActiveMainMenu('Tools'); setActiveTool(toolId); prevMenuRef.current = 'Tools'; setIsTransitioning(false); }, 120);
    } else {
      setActiveTool(toolId);
    }
    setIsMobileSidebarOpen(false);
  };

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(p => !p); }
      if (e.key === 'Escape') { setIsMobileSidebarOpen(false); setCmdOpen(false); setUserOpen(false); setShowGameModal(false); }
      if ((e.metaKey || e.ctrlKey) && e.key === '1') { e.preventDefault(); navigateTo('Dashboard'); }
      if ((e.metaKey || e.ctrlKey) && e.key === '2') { e.preventDefault(); navigateTo('Tools'); }
      if ((e.metaKey || e.ctrlKey) && e.key === '3') { e.preventDefault(); navigateTo('Downloads'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigateTo]);

  useEffect(() => {
    if (cmdOpen) { setCmdQuery(''); setTimeout(() => cmdInputRef.current?.focus(), 50); }
  }, [cmdOpen]);

  // ── External tool navigation event ───────────────────────────────────────
  useEffect(() => {
    const handler = (event: Event) => {
      const e = event as CustomEvent<{ toolId: ToolId }>;
      const toolId = e.detail?.toolId;
      if (!['sku', 'asin', 'basecamp'].includes(toolId)) return;
      const found = toolsSubItems.find(t => t.id === toolId);
      if (found?.comingSoon) return;
      navigateTo('Tools', toolId);
      setIsMobileSidebarOpen(false);
    };
    window.addEventListener('navigateToTool', handler);
    return () => window.removeEventListener('navigateToTool', handler);
  }, [navigateTo]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const mainMenuItems = useMemo<MenuItem[]>(() => [
    { id: 'Dashboard', label: 'Dashboard', icon: <Home      className="h-5 w-5" />, shortcut: '⌘1' },
    { id: 'Tools',     label: 'Tools',     icon: <Settings  className="h-5 w-5" />, shortcut: '⌘2' },
    { id: 'Downloads', label: 'Downloads', icon: <Download  className="h-5 w-5" />, shortcut: '⌘3' },
  ], []);

  const resourceMenuItems = useMemo<MenuItem[]>(() => [
    { id: 'Documentation', label: 'Documentation',    icon: <BookOpen  className="h-5 w-5" /> },
    { id: 'Terms',         label: 'Terms & Conditions', icon: <FileText className="h-5 w-5" /> },
  ], []);

  const filteredCmds = ALL_COMMANDS.filter(c => c.label.toLowerCase().includes(cmdQuery.toLowerCase()));

  const selectedTool = toolsSubItems.find(t => t.id === activeTool);

  const pageMeta = useMemo(() => {
    if (activeMainMenu === 'Dashboard')     return { title: 'Dashboard',     breadcrumb: 'Overview / Dashboard',             description: 'Monitor operation tools and launch listing workflows.' };
    if (activeMainMenu === 'Downloads')     return { title: 'Downloads',     breadcrumb: 'Files / Downloads',                description: 'Download generated files from completed tool runs.' };
    if (activeMainMenu === 'Documentation') return { title: 'Documentation', breadcrumb: 'Resources / Documentation',        description: 'Simple guide for using TARA tools.' };
    if (activeMainMenu === 'Terms')         return { title: 'Terms & Conditions', breadcrumb: 'Resources / Terms & Conditions', description: 'Simple usage terms and reminders.' };
    const t = toolsSubItems.find(t => t.id === activeTool);
    return { title: t?.name ?? 'Tools', breadcrumb: `Tools / ${t?.name ?? 'Selected Tool'}`, description: t?.description ?? '' };
  }, [activeMainMenu, activeTool]);

  const renderContent = () => {
    if (!user) return null;
    if (activeMainMenu === 'Dashboard')     return <Dashboard     theme={theme} />;
    if (activeMainMenu === 'Downloads')     return <DownloadPage  theme={theme} />;
    if (activeMainMenu === 'Documentation') return <Documentation theme={theme} />;
    if (activeMainMenu === 'Terms')         return <Terms         theme={theme} />;
    if (activeMainMenu === 'Tools') {
      if (activeTool === 'sku')      return <SkuProcessor        theme={theme} />;
      if (activeTool === 'asin')     return <AsinConflictChecker theme={theme} />;
      if (activeTool === 'basecamp') return <BasecampGenerator   theme={theme} />;
    }
    return null;
  };

  // ── Loading / auth gates ──────────────────────────────────────────────────
  if (isAuthLoading) {
    return (
      <div className={`flex h-screen items-center justify-center ${isDark ? 'bg-[#0F172A]' : 'bg-gray-100'}`}>
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user) return <AuthModal theme={theme} onSuccess={() => setShowAuthModal(false)} />;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={`relative flex h-screen overflow-hidden transition-colors duration-200 ${isDark ? 'bg-[#0F172A] text-slate-100' : 'bg-gray-100 text-gray-900'}`}>
      {showAuthModal && <AuthModal theme={theme} onSuccess={() => setShowAuthModal(false)} />}

      {/* Game Modal */}
      {showGameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <GameModal theme={theme} onClose={() => setShowGameModal(false)} />
        </div>
      )}

      {/* Command Palette */}
      {cmdOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
          <button
            type="button"
            aria-label="Close command palette"
            onClick={() => setCmdOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className={`relative z-10 w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
            <div className={`flex items-center gap-3 border-b px-4 py-3 ${isDark ? 'border-slate-700/60' : 'border-gray-200'}`}>
              <Search className={`h-4 w-4 flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
              <input
                ref={cmdInputRef}
                type="text"
                placeholder="Search commands…"
                value={cmdQuery}
                onChange={e => setCmdQuery(e.target.value)}
                className={`flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500 ${isDark ? 'text-white' : 'text-gray-900'}`}
              />
              <kbd className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>ESC</kbd>
            </div>
            <div className="max-h-64 overflow-y-auto py-2">
              {filteredCmds.length === 0
                ? <p className={`px-4 py-3 text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>No commands found.</p>
                : filteredCmds.map((cmd, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        if (cmd.toolId) {
                          const tool = toolsSubItems.find(t => t.id === cmd.toolId);
                          if (tool?.comingSoon) { setCmdOpen(false); return; }
                        }
                        navigateTo(cmd.menuId, cmd.toolId ?? undefined);
                        setCmdOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <Command className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
                      {cmd.label}
                    </button>
                  ))
              }
            </div>
            <div className={`border-t px-4 py-2 ${isDark ? 'border-slate-700/60' : 'border-gray-100'}`}>
              <p className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
                Press <kbd className="rounded bg-slate-800 px-1 py-0.5 text-[10px] font-semibold text-slate-400">⌘K</kbd> to toggle
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile overlay */}
      <button
        type="button"
        aria-label="Close sidebar overlay"
        onClick={() => setIsMobileSidebarOpen(false)}
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity duration-200 ease-out lg:hidden ${isMobileSidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
      />

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 z-40 flex h-full w-80 max-w-[85vw] flex-col border-r shadow-2xl transition-transform duration-200 ease-out
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:transition-[width] lg:duration-200 lg:ease-out
        ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-80'}
        ${isDark ? 'border-slate-700/60 bg-[#172235]' : 'border-gray-200 bg-white'}`}
      >
        {/* Sidebar header */}
        <div className={`border-b p-4 sm:p-5 ${isDark ? 'border-slate-700/60' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between gap-3">
            <div className={`min-w-0 overflow-hidden transition-[width,opacity] duration-200 ease-out ${isSidebarCollapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'}`}>
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500 shadow-lg">
                  <span className="text-lg font-bold text-white">T</span>
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#172235] bg-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h1 className={`truncate text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>TARA</h1>
                  <p className={`truncate text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Listing Operations Tools</p>
                </div>
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(c => !c)}
                className={`hidden rounded-lg p-2 transition-colors lg:block ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
              >
                {isSidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className={`rounded-lg p-2 transition-colors lg:hidden ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Command hint */}
        {!isSidebarCollapsed && (
          <div className="px-4 pt-4">
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${isDark ? 'border-slate-700/60 bg-slate-800/50 text-slate-500 hover:border-slate-600 hover:text-slate-300' : 'border-gray-200 bg-gray-50 text-gray-400 hover:text-gray-600'}`}
            >
              <Search className="h-3.5 w-3.5" />
              <span className="flex-1 text-left">Search commands…</span>
              <kbd className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${isDark ? 'bg-slate-900 text-slate-500' : 'bg-white text-gray-400'}`}>⌘K</kbd>
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <SectionLabel collapsed={isSidebarCollapsed} label="MAIN MENU" />
          <div className="space-y-0.5">
            {mainMenuItems.map(item => (
              <React.Fragment key={item.id}>
                <SidebarButton
                  label={item.label} icon={item.icon} shortcut={item.shortcut}
                  active={activeMainMenu === item.id} collapsed={isSidebarCollapsed}
                  theme={theme} onClick={() => handleMainMenuClick(item.id)}
                />
                {item.id === 'Tools' && activeMainMenu === 'Tools' && !isSidebarCollapsed && (
                  <div className={`my-1 ml-3 space-y-0.5 border-l-2 pl-2 ${isDark ? 'border-emerald-500/25' : 'border-emerald-500/30'}`}>
                    {toolsSubItems.map(tool => (
                      <ToolSidebarButton key={tool.id} tool={tool} active={activeTool === tool.id} theme={theme} onClick={() => handleToolClick(tool.id, tool.comingSoon)} />
                    ))}
                  </div>
                )}
                {item.id === 'Tools' && activeMainMenu === 'Tools' && isSidebarCollapsed && (
                  <div className="my-1 hidden space-y-0.5 lg:block">
                    {toolsSubItems.map(tool => (
                      <CollapsedToolButton key={tool.id} tool={tool} active={activeTool === tool.id} theme={theme} onClick={() => handleToolClick(tool.id, tool.comingSoon)} />
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="mt-7">
            <SectionLabel collapsed={isSidebarCollapsed} label="RESOURCES" />
            <div className="space-y-0.5">
              {resourceMenuItems.map(item => (
                <SidebarButton key={item.id} label={item.label} icon={item.icon} active={activeMainMenu === item.id} collapsed={isSidebarCollapsed} theme={theme} onClick={() => handleMainMenuClick(item.id)} />
              ))}
            </div>
          </div>
        </nav>

        {/* Status */}
        <div className={`border-t p-4 ${isDark ? 'border-slate-700/60' : 'border-gray-200'}`}>
          {!isSidebarCollapsed ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">Tools ready</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">Beta v1.0 · Auto-refreshes every 60s</p>
            </div>
          ) : (
            <div className="mx-auto h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
          )}
        </div>
      </aside>

      {/* Main area */}
      <div className={`ml-0 flex h-full min-w-0 flex-1 flex-col transition-[margin] duration-200 ease-out ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80'}`}>
        {/* Header */}
        <header className={`sticky top-0 z-20 border-b px-4 py-3 shadow-lg backdrop-blur-md sm:px-6 lg:px-8 ${isDark ? 'border-slate-700/50 bg-[#172235]/85' : 'border-gray-200 bg-white/85'}`}>
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className={`flex-shrink-0 rounded-lg p-2 transition-colors lg:hidden ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-xs text-slate-400">{pageMeta.breadcrumb}</p>
                <h2 className={`truncate text-lg font-semibold sm:text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{pageMeta.title}</h2>
                <p className="hidden truncate text-sm text-slate-500 sm:block">{pageMeta.description}</p>
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
              {user && (
                <span className="hidden rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400 md:inline-flex">
                  {user.email}
                </span>
              )}
              {activeMainMenu === 'Tools' && selectedTool && (
                <span className={`hidden rounded-full border px-3 py-1 text-xs font-semibold md:inline-flex ${
                  selectedTool.accent === 'violet' ? 'border-violet-500/30 bg-violet-500/10 text-violet-300'
                  : selectedTool.accent === 'cyan'   ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                }`}>
                  {selectedTool.name}
                </span>
              )}

              <button
                type="button"
                onClick={() => setCmdOpen(true)}
                title="Command Palette (⌘K)"
                className={`rounded-lg border p-2 text-sm font-medium transition-colors ${isDark ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                <Command className="h-4 w-4" />
              </button>

              {/* Game button */}
              <button
                type="button"
                onClick={() => { setShowGameModal(true); setUserOpen(false); }}
                className={`relative rounded-lg border p-2 transition-colors ${isDark ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                <Gamepad2 className="h-4 w-4" />
                <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white">!</span>
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setUserOpen(o => !o); setShowGameModal(false); }}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${isDark ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'}`}
                >
                  <User className="h-4 w-4" />
                </button>

                {userOpen && (
                  <div className={`absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border shadow-2xl ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
                    <div className={`border-b px-4 py-3 ${isDark ? 'border-slate-700/60' : 'border-gray-100'}`}>
                      <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.email ?? 'TARA User'}</p>
                      <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Beta Access · v1.0</p>
                    </div>
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        {isDark ? '☀️' : '🌙'} Switch to {isDark ? 'Light' : 'Dark'} Mode
                      </button>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isDark ? 'text-red-400 hover:bg-slate-800' : 'text-red-600 hover:bg-gray-50'}`}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className={`w-full max-w-full p-4 transition-opacity duration-150 sm:p-6 lg:p-8 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}