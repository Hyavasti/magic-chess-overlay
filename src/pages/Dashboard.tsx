import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  PlusCircle, 
  RotateCcw, 
  Copy, 
  ExternalLink, 
  Check, 
  Sparkles, 
  Swords, 
  SlidersHorizontal, 
  ArrowLeft, 
  ArrowRight,
  Search,
  Star,
  Volume2,
  VolumeX,
  Trophy,
  QrCode,
  LogOut,
  X
} from 'lucide-react';
import { MCGG_COMMANDERS, findCommander, type Commander } from '../data/commanders';
import { supabase } from '../supabase';

interface ProfileState {
  rank_tier: string;
  rank_division: string;
  rank_points: number;
  historical_tier: string;
  historical_stars: number;
  total_matches: number;
  season_win_rate: number;
  champion_rate: number;
  season_avg_rank: number;
  star_delta: number;
  top_commanders: string[];
  enabled_widgets: Record<string, boolean>;
  widget_order: string[];
}

const WIDGET_LABELS: Record<string, string> = {
  currentRank: 'Current Rank & Stars',
  sessionRecord: 'Session Record (W/L)',
  starDelta: 'Session Star Delta',
  winRate: 'Season Win Rate (%)',
  championRate: 'Champion (#1) Rate',
  avgRank: 'Average Rank Placement',
  historicalBest: 'Historical Peak Stars',
  topCommanders: 'Go-To Commanders Roster',
};

const STAR_MAP: Record<number, number> = {
  1: 4, 2: 3, 3: 2, 4: 1, 5: -1, 6: -2, 7: -3, 8: -4,
};

const RANK_TIERS = [
  'Warrior',
  'Elite',
  'Master',
  'Grandmaster',
  'Epic',
  'Legend',
  'Mythic',
  'Mythical Honor',
  'Mythical Glory',
  'Mythical Immortal',
];

function parseJSONField<T>(field: unknown, fallback: T): T {
  if (!field) return fallback;
  if (typeof field === 'string') {
    try {
      return JSON.parse(field) as T;
    } catch {
      return fallback;
    }
  }
  return field as T;
}

export default function Dashboard() {
  const [streamerId, setStreamerId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [loadingUser, setLoadingUser] = useState<boolean>(true);

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'Hero' | 'Classic'>('all');
  
  // No default commander selected
  const [selectedCommanderId, setSelectedCommanderId] = useState<string | null>(null);
  const [selectedPlacement, setSelectedPlacement] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Search filters
  const [matchSearch, setMatchSearch] = useState<string>('');
  const [gotoSearch, setGotoSearch] = useState<string>('');

  const [profile, setProfile] = useState<ProfileState>({
    rank_tier: 'Warrior',
    rank_division: 'III',
    rank_points: 0,
    historical_tier: 'Warrior',
    historical_stars: 0,
    total_matches: 0,
    season_win_rate: 0,
    champion_rate: 0,
    season_avg_rank: 0,
    star_delta: 0,
    top_commanders: [],
    enabled_widgets: {
      sessionRecord: true,
      currentRank: true,
      historicalBest: true,
      winRate: true,
      championRate: true,
      avgRank: true,
      starDelta: true,
      topCommanders: true,
    },
    widget_order: [
      'currentRank', 
      'sessionRecord', 
      'starDelta', 
      'winRate', 
      'championRate', 
      'avgRank', 
      'historicalBest', 
      'topCommanders'
    ],
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const playFeedbackSound = (type: 'click' | 'win' | 'lose') => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'click') {
        osc.frequency.setValueAtTime(520, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'win') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else {
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.25);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch {
      // AudioContext fallback
    }
  };

  // Load user session and corresponding isolated profile
  useEffect(() => {
    async function initUserAndLoadRank() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.user) {
          setLoadingUser(false);
          return;
        }

        // Clean username extraction
        const rawEmail = session.user.email || '';
        const parsedUsername = rawEmail.split('@')[0] || session.user.id;

        setUserEmail(parsedUsername);
        setStreamerId(parsedUsername);

        // Fetch profile using clean username
        const { data, error } = await supabase
          .from('streamer_profiles')
          .select('*')
          .eq('streamer_id', parsedUsername)
          .maybeSingle();

        if (error) {
          console.error('[Dashboard] Error fetching profile:', error);
        }

        if (data) {
          const parsedWidgets = parseJSONField<Record<string, boolean>>(
            data.enabled_widgets,
            profile.enabled_widgets
          );
          const parsedOrder = parseJSONField<string[]>(
            data.widget_order,
            profile.widget_order
          );
          const parsedCommanders = parseJSONField<string[]>(
            data.top_commanders,
            profile.top_commanders
          );

          setProfile((prev) => ({
            ...prev,
            rank_tier: typeof data.rank_tier === 'string' ? data.rank_tier : prev.rank_tier,
            rank_division: typeof data.rank_division === 'string' ? data.rank_division : prev.rank_division,
            rank_points: data.rank_points != null ? Number(data.rank_points) : prev.rank_points,
            historical_tier: typeof data.historical_tier === 'string' ? data.historical_tier : prev.historical_tier,
            historical_stars: data.historical_stars != null ? Number(data.historical_stars) : prev.historical_stars,
            total_matches: data.total_matches != null ? Number(data.total_matches) : prev.total_matches,
            season_win_rate: data.season_win_rate != null ? Number(data.season_win_rate) : prev.season_win_rate,
            champion_rate: data.champion_rate != null ? Number(data.champion_rate) : prev.champion_rate,
            season_avg_rank: data.season_avg_rank != null ? Number(data.season_avg_rank) : prev.season_avg_rank,
            star_delta: data.star_delta != null ? Number(data.star_delta) : prev.star_delta,
            top_commanders: Array.isArray(parsedCommanders) ? parsedCommanders : prev.top_commanders,
            enabled_widgets: parsedWidgets,
            widget_order: Array.isArray(parsedOrder) && parsedOrder.length > 0
              ? parsedOrder
              : prev.widget_order,
          }));
        }
      } catch (err) {
        console.error('[Dashboard] Network error during initialization:', err);
      } finally {
        setLoadingUser(false);
      }
    }

    initUserAndLoadRank();
  }, []);

  const overlayUrl = streamerId ? `${window.location.origin}/overlay/${streamerId}` : '';

  const copyUrl = () => {
    if (!overlayUrl) return;
    navigator.clipboard.writeText(overlayUrl);
    setCopied(true);
    playFeedbackSound('click');
    showToast('Personal overlay URL copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const updateProfileInSupabase = useCallback(async (updated: Partial<ProfileState>) => {
    if (!streamerId) return;

    const next: ProfileState = { ...profile, ...updated };
    setProfile(next);

    const payloadToSave = {
      streamer_id: streamerId,
      rank_tier: next.rank_tier,
      rank_division: next.rank_division,
      rank_points: next.rank_points,
      historical_tier: next.historical_tier,
      historical_stars: next.historical_stars,
      total_matches: next.total_matches,
      season_win_rate: next.season_win_rate,
      champion_rate: next.champion_rate,
      season_avg_rank: next.season_avg_rank,
      star_delta: next.star_delta,
      top_commanders: next.top_commanders,
      enabled_widgets: next.enabled_widgets,
      widget_order: next.widget_order,
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase
        .from('streamer_profiles')
        .upsert(payloadToSave, { onConflict: 'streamer_id' });

      if (error) {
        console.error('[Dashboard] Supabase save error:', error.message);
        showToast(`Save Error: ${error.message}`, 'error');
      }
    } catch (err) {
      console.error('[Dashboard] Exception saving profile:', err);
      showToast('Network error saving profile', 'error');
    }
  }, [streamerId, profile]);

  // Helper for number inputs so typing replaces 0 cleanly
  const handleNumericInput = (field: keyof ProfileState, rawValue: string) => {
    if (rawValue === '') {
      updateProfileInSupabase({ [field]: 0 });
    } else {
      const val = parseFloat(rawValue);
      updateProfileInSupabase({ [field]: isNaN(val) ? 0 : val });
    }
  };

  const toggleWidget = (key: string) => {
    playFeedbackSound('click');
    const nextWidgets = {
      ...profile.enabled_widgets,
      [key]: !profile.enabled_widgets[key],
    };
    updateProfileInSupabase({ enabled_widgets: nextWidgets });
  };

  const moveWidget = (index: number, direction: 'left' | 'right') => {
    playFeedbackSound('click');
    const newOrder = [...profile.widget_order];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    updateProfileInSupabase({ widget_order: newOrder });
  };

  const toggleTopCommander = (cmdId: string) => {
    playFeedbackSound('click');
    let current = [...(profile.top_commanders || [])];
    if (current.includes(cmdId)) {
      current = current.filter((id) => id !== cmdId);
    } else {
      if (current.length >= 3) {
        current.shift();
      }
      current.push(cmdId);
    }
    updateProfileInSupabase({ top_commanders: current });
  };

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamerId) return;

    if (!selectedCommanderId) {
      showToast('Please select a commander first!', 'error');
      return;
    }

    const cmd = findCommander(selectedCommanderId);
    if (!cmd) return;

    const isTop4 = selectedPlacement <= 4;
    playFeedbackSound(isTop4 ? 'win' : 'lose');

    try {
      await supabase.from('stream_matches').insert({
        streamer_id: streamerId,
        placement: selectedPlacement,
        commander_id: cmd.id,
      });

      const starChange = STAR_MAP[selectedPlacement] || 0;
      const newTotalStars = Math.max(0, profile.rank_points + starChange);
      const newSessionDelta = profile.star_delta + starChange;

      await updateProfileInSupabase({
        rank_points: newTotalStars,
        star_delta: newSessionDelta,
      });

      showToast(`Match logged: #${selectedPlacement} with ${cmd.name}`);
    } catch (err) {
      console.error('[Dashboard] Error logging match:', err);
      showToast('Failed to log match', 'error');
    }
  };

  const handleResetSession = async () => {
    if (!streamerId) return;
    const confirmed = window.confirm(
      "Reset Stream Session?\n\n• Wipes all your logged match cards\n• Resets session Star Delta to 0\n• Record resets to 0W 0L"
    );
    if (!confirmed) return;

    setLoadingAction('session');
    try {
      await supabase
        .from('stream_matches')
        .delete()
        .eq('streamer_id', streamerId);

      await updateProfileInSupabase({
        star_delta: 0,
      });

      showToast("Stream session reset successfully!");
    } catch (err) {
      console.error(err);
      showToast("Failed to reset session.", 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResetRank = async () => {
    if (!streamerId) return;
    const confirmed = window.confirm("Reset season rank to Warrior III with 0 stars?");
    if (!confirmed) return;

    setLoadingAction('rank');
    try {
      await updateProfileInSupabase({
        rank_tier: 'Warrior',
        rank_division: 'III',
        rank_points: 0,
        star_delta: 0,
      });
      showToast("Rank reset to Warrior baseline!");
    } catch (err) {
      console.error(err);
      showToast("Failed to reset rank.", 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // Alphabetically sorted commanders
  const filteredCommanders = useMemo(() => {
    return MCGG_COMMANDERS
      .filter((c) => {
        const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
        const matchesQuery = c.name.toLowerCase().includes(matchSearch.toLowerCase());
        return matchesCategory && matchesQuery;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedCategory, matchSearch]);

  const gotoFilteredCommanders = useMemo(() => {
    return MCGG_COMMANDERS
      .filter((c) => c.name.toLowerCase().includes(gotoSearch.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [gotoSearch]);

  const activeCommander: Commander | undefined = selectedCommanderId 
    ? findCommander(selectedCommanderId) 
    : undefined;

  if (loadingUser) {
    return (
      <div className="min-h-screen w-full bg-[#06080F] flex items-center justify-center font-mono text-xs text-amber-400">
        Connecting streamer session...
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#06080F] text-slate-100 p-4 md:p-8 font-sans selection:bg-amber-500 selection:text-black">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-lg shadow-2xl border text-xs font-bold flex items-center gap-2 animate-bounce ${
          toastMessage.type === 'error' 
            ? 'bg-rose-950/90 border-rose-500 text-rose-200' 
            : 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
        }`}>
          {toastMessage.text}
        </div>
      )}

      {/* QR Code Remote Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b101e] border border-amber-500/40 rounded-xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-black text-amber-300 uppercase tracking-wider flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5" /> Remote Control
            </h3>
            <p className="text-xs text-slate-400">
              Scan with your phone to open and control this match logger while streaming.
            </p>
            <div className="bg-white p-3 rounded-lg inline-block mx-auto shadow-inner">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.href)}`} 
                alt="Dashboard QR Code" 
                className="w-44 h-44"
              />
            </div>
            <p className="text-[11px] font-mono text-cyan-300 break-all select-all">
              {window.location.href}
            </p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Navbar */}
        <header className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#090e1c]/90 border border-amber-500/30 shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-700 p-0.5 shadow-md">
              <div className="w-full h-full bg-[#070b16] rounded-[7px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <span className="text-[10px] tracking-[0.25em] uppercase text-cyan-300 font-extrabold flex items-center gap-1.5">
                Magic Chess: Go Go
              </span>
              <h1 className="text-lg font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500">
                STREAMER STUDIO & HUD
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {userEmail && (
              <span className="hidden sm:inline-block text-[11px] font-mono text-amber-300 border border-amber-500/30 bg-[#060b18] px-2.5 py-1.5 rounded-lg font-bold">
                @{userEmail}
              </span>
            )}

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute SFX" : "Enable SFX"}
              className="p-2 rounded-lg bg-[#070b16] border border-amber-500/20 text-slate-300 hover:text-amber-300 transition cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            <button
              onClick={() => setShowQRModal(true)}
              title="Remote Mobile Deck"
              className="p-2 rounded-lg bg-[#070b16] border border-amber-500/20 text-slate-300 hover:text-cyan-300 transition cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 bg-[#050914] border border-amber-500/30 px-3 py-1.5 rounded-lg">
              <button
                onClick={copyUrl}
                className="flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-white transition uppercase tracking-wider cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Overlay'}
              </button>
              <span className="text-slate-600">|</span>
              <a
                href={overlayUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-cyan-300 hover:text-white flex items-center gap-1"
              >
                Preview <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/50 hover:text-white transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Fast Match Logger */}
          <div className="lg:col-span-7 space-y-6">
            
            <form
              onSubmit={handleAddMatch}
              className="p-6 rounded-xl bg-gradient-to-b from-[#090f21] via-[#070c1a] to-[#040812] border border-amber-500/30 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                <span className="text-xs font-black uppercase tracking-widest text-amber-300 flex items-center gap-2">
                  <Swords className="w-4 h-4 text-amber-400" /> Fast Match Logger
                </span>
                <span className="text-[11px] font-mono text-cyan-300">
                  Placement Delta: <strong className={STAR_MAP[selectedPlacement] > 0 ? 'text-amber-300' : 'text-rose-400'}>
                    {STAR_MAP[selectedPlacement] > 0 ? `+${STAR_MAP[selectedPlacement]}` : STAR_MAP[selectedPlacement]} Stars
                  </strong>
                </span>
              </div>

              {/* Step 1: Placement Selector (1 - 8) */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 block">
                  1. Select Match Placement
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                    const isSelected = selectedPlacement === num;
                    const isWin = num <= 4;
                    return (
                      <button
                        type="button"
                        key={num}
                        onClick={() => {
                          setSelectedPlacement(num);
                          playFeedbackSound('click');
                        }}
                        className={`h-11 rounded-lg font-black text-sm transition-all flex flex-col items-center justify-center border cursor-pointer ${
                          isSelected
                            ? isWin
                              ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 border-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.5)] scale-105'
                              : 'bg-gradient-to-b from-rose-500 to-rose-700 text-white border-rose-400 shadow-[0_0_14px_rgba(244,63,94,0.5)] scale-105'
                            : 'bg-[#091124] border-slate-800 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <span>#{num}</span>
                        <span className="text-[9px] font-mono opacity-80">
                          {STAR_MAP[num] > 0 ? `+${STAR_MAP[num]}` : STAR_MAP[num]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Commander Grid Selector (Alphabetical) */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    2. Select Commander ({filteredCommanders.length}) {activeCommander ? `• Selected: ${activeCommander.name}` : '• (None Selected)'}
                  </label>
                  
                  {/* Category Pills & Search */}
                  <div className="flex items-center gap-2">
                    <div className="inline-flex p-0.5 rounded-lg bg-[#050914] border border-amber-500/20 text-[10px] font-bold">
                      {(['all', 'Hero', 'Classic'] as const).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                            selectedCategory === cat
                              ? 'bg-amber-400 text-slate-950'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {cat === 'all' ? 'All' : cat}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
                      <input
                        type="text"
                        placeholder="Search A-Z..."
                        value={matchSearch}
                        onChange={(e) => setMatchSearch(e.target.value)}
                        className="bg-[#050914] border border-amber-500/30 pl-7 pr-2.5 py-1 text-xs text-white placeholder-slate-600 rounded-lg outline-none w-28"
                      />
                    </div>
                  </div>
                </div>

                {/* Commander Avatars Alphabetical Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-56 overflow-y-auto p-1 bg-[#050914]/80 rounded-xl border border-slate-800/80">
                  {filteredCommanders.map((cmd) => {
                    const isSelected = selectedCommanderId === cmd.id;
                    return (
                      <button
                        type="button"
                        key={cmd.id}
                        onClick={() => {
                          setSelectedCommanderId(cmd.id);
                          playFeedbackSound('click');
                        }}
                        className={`p-1.5 rounded-lg border flex flex-col items-center gap-1.5 transition text-center cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                            : 'bg-[#080e1c] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <img 
                          src={cmd.avatar} 
                          alt={cmd.name} 
                          className="w-10 h-10 rounded-full object-cover object-top border border-amber-400/40"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <span className={`text-[10px] font-bold truncate max-w-full ${isSelected ? 'text-amber-300' : 'text-slate-400'}`}>
                          {cmd.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-[0.99] transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> 
                {activeCommander 
                  ? `Log Game: #${selectedPlacement} with ${activeCommander.name}` 
                  : `Select a Commander to Log (#${selectedPlacement})`
                }
              </button>
            </form>

            {/* Career Profile Editor */}
            <div className="p-5 rounded-xl bg-[#080d1d] border border-amber-500/30 space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" /> Career Profile Stats Calibration
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                
                {/* Total Matches */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Total Matches</label>
                  <input
                    type="number"
                    value={profile.total_matches === 0 ? '' : profile.total_matches}
                    placeholder="0"
                    onChange={(e) => handleNumericInput('total_matches', e.target.value)}
                    className="w-full bg-[#050914] border border-amber-500/30 px-3 py-1.5 text-white font-mono rounded-lg outline-none"
                  />
                </div>

                {/* Win Rate */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Win Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={profile.season_win_rate === 0 ? '' : profile.season_win_rate}
                    placeholder="0.00"
                    onChange={(e) => handleNumericInput('season_win_rate', e.target.value)}
                    className="w-full bg-[#050914] border border-amber-500/30 px-3 py-1.5 text-emerald-400 font-mono font-bold rounded-lg outline-none"
                  />
                </div>

                {/* Champion Rate */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Champion Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={profile.champion_rate === 0 ? '' : profile.champion_rate}
                    placeholder="0.00"
                    onChange={(e) => handleNumericInput('champion_rate', e.target.value)}
                    className="w-full bg-[#050914] border border-amber-500/30 px-3 py-1.5 text-amber-300 font-mono font-bold rounded-lg outline-none"
                  />
                </div>

                {/* Average Rank */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Average Rank</label>
                  <input
                    type="number"
                    step="0.01"
                    value={profile.season_avg_rank === 0 ? '' : profile.season_avg_rank}
                    placeholder="0.00"
                    onChange={(e) => handleNumericInput('season_avg_rank', e.target.value)}
                    className="w-full bg-[#050914] border border-amber-500/30 px-3 py-1.5 text-cyan-300 font-mono font-bold rounded-lg outline-none"
                  />
                </div>

                {/* Current Tier */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Current Tier</label>
                  <select
                    value={profile.rank_tier}
                    onChange={(e) => updateProfileInSupabase({ rank_tier: e.target.value })}
                    className="w-full bg-[#050914] border border-amber-500/30 px-3 py-1.5 text-white text-xs rounded-lg outline-none"
                  >
                    {RANK_TIERS.map((tier) => (
                      <option key={tier} value={tier}>{tier}</option>
                    ))}
                  </select>
                </div>

                {/* Current Stars */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Current ⭐ Stars</label>
                  <input
                    type="number"
                    value={profile.rank_points === 0 ? '' : profile.rank_points}
                    placeholder="0"
                    onChange={(e) => handleNumericInput('rank_points', e.target.value)}
                    className="w-full bg-[#050914] border border-amber-500/30 px-3 py-1.5 text-amber-300 font-mono font-bold rounded-lg outline-none"
                  />
                </div>

                {/* Historical Tier */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Historical Tier</label>
                  <select
                    value={profile.historical_tier}
                    onChange={(e) => updateProfileInSupabase({ historical_tier: e.target.value })}
                    className="w-full bg-[#050914] border border-amber-500/30 px-3 py-1.5 text-white text-xs rounded-lg outline-none"
                  >
                    {RANK_TIERS.map((tier) => (
                      <option key={tier} value={tier}>{tier}</option>
                    ))}
                  </select>
                </div>

                {/* Historical Stars */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Historical Stars</label>
                  <input
                    type="number"
                    value={profile.historical_stars === 0 ? '' : profile.historical_stars}
                    placeholder="0"
                    onChange={(e) => handleNumericInput('historical_stars', e.target.value)}
                    className="w-full bg-[#050914] border border-amber-500/30 px-3 py-1.5 text-amber-300 font-mono font-bold rounded-lg outline-none"
                  />
                </div>

                {/* Session Stars Delta */}
                <div className="space-y-1 col-span-2 sm:col-span-4">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Session Stars Delta</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateProfileInSupabase({ star_delta: profile.star_delta - 1 })}
                      className="bg-rose-950/80 border border-rose-800 text-rose-300 px-3 py-1 text-xs font-black rounded cursor-pointer"
                    >
                      -1
                    </button>
                    <input
                      type="number"
                      value={profile.star_delta === 0 ? '' : profile.star_delta}
                      placeholder="0"
                      onChange={(e) => handleNumericInput('star_delta', e.target.value)}
                      className="w-20 text-center bg-[#050914] border border-amber-500/30 py-1 text-amber-300 font-mono text-xs rounded outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => updateProfileInSupabase({ star_delta: profile.star_delta + 1 })}
                      className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 px-3 py-1 text-xs font-black rounded cursor-pointer"
                    >
                      +1
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Session Clean & Reset Controls */}
            <div className="p-4 rounded-xl bg-[#080d1d] border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> Season & Stream Controls
                </span>
                <p className="text-[11px] text-slate-500">
                  Wipe recent session matches or reset season rank back to baseline.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={loadingAction === 'session'}
                  onClick={handleResetSession}
                  className="px-3 py-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 active:scale-95 transition cursor-pointer"
                >
                  Clear Session Matches
                </button>
                <button
                  type="button"
                  disabled={loadingAction === 'rank'}
                  onClick={handleResetRank}
                  className="px-3 py-1.5 text-xs font-bold text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg hover:bg-rose-500/20 active:scale-95 transition cursor-pointer"
                >
                  Reset Season Baseline
                </button>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Go-To Commanders & Switchboard */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Top 3 Go-To Commanders */}
            <div className="p-5 rounded-xl bg-gradient-to-b from-[#090f21] to-[#040812] border border-amber-500/30 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400" /> Top 3 Go-To Commanders
                </span>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
                  <input
                    type="text"
                    placeholder="Search A-Z..."
                    value={gotoSearch}
                    onChange={(e) => setGotoSearch(e.target.value)}
                    className="bg-[#050914] border border-amber-500/30 pl-7 pr-2 py-1 text-xs text-white placeholder-slate-600 rounded-lg outline-none w-28"
                  />
                </div>
              </div>

              {/* Selected 3 Preview Badges */}
              <div className="grid grid-cols-3 gap-2 p-2 bg-[#050914] border border-amber-500/20 rounded-lg">
                {[0, 1, 2].map((slotIdx) => {
                  const cmdId = profile.top_commanders?.[slotIdx];
                  const cmd = cmdId ? findCommander(cmdId) : undefined;
                  return (
                    <div 
                      key={slotIdx}
                      className="flex flex-col items-center justify-center p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center"
                    >
                      {cmd ? (
                        <>
                          <img 
                            src={cmd?.avatar || ''} 
                            alt={cmd?.name || cmdId} 
                            className="w-8 h-8 rounded-full object-cover object-top border border-amber-400 shadow-md mb-1"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <span className="text-[10px] font-bold text-amber-200 truncate max-w-full">
                            {cmd?.name || cmdId}
                          </span>
                        </>
                      ) : (
                        <div className="h-11 flex items-center justify-center text-[10px] text-slate-600 font-bold uppercase">
                          Empty
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Roster Pick Grid (Alphabetical) */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1 bg-[#050914]/80 rounded-xl border border-slate-800">
                {gotoFilteredCommanders.map((cmd) => {
                  const isSelected = (profile.top_commanders || []).includes(cmd.id);
                  return (
                    <button
                      type="button"
                      key={cmd.id}
                      onClick={() => toggleTopCommander(cmd.id)}
                      className={`p-1.5 rounded-lg border flex flex-col items-center gap-1 transition cursor-pointer ${
                        isSelected 
                          ? 'bg-amber-500/20 border-amber-400 shadow-sm' 
                          : 'bg-[#080e1c] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <img 
                        src={cmd.avatar} 
                        alt={cmd.name} 
                        className="w-7 h-7 rounded-full object-cover object-top" 
                      />
                      <span className={`text-[8.5px] font-bold truncate max-w-full ${isSelected ? 'text-amber-300' : 'text-slate-500'}`}>
                        {cmd.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* OBS Widget Switchboard */}
            <div className="p-5 rounded-xl bg-gradient-to-b from-[#090f21] to-[#040812] border border-cyan-500/30 shadow-xl space-y-3">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-cyan-300 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-cyan-400" /> OBS Widget Switchboard
                </span>
                <p className="text-[11px] text-slate-500">
                  Toggle on/off and reorder live widgets rendered on the overlay.
                </p>
              </div>

              <div className="space-y-1.5 pt-1">
                {profile.widget_order.map((key, index) => {
                  const active = profile.enabled_widgets[key];
                  return (
                    <div
                      key={key}
                      className={`p-2 rounded-lg border flex items-center justify-between transition ${
                        active 
                          ? 'border-amber-500/30 bg-[#0c1429] text-amber-200' 
                          : 'border-slate-800/80 bg-[#050914] text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] font-mono text-slate-600">#{index + 1}</span>
                        <span className="text-xs font-bold">{WIDGET_LABELS[key] || key}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveWidget(index, 'left')}
                          className="p-1 rounded bg-[#070b16] border border-slate-700 disabled:opacity-30 hover:border-amber-400 text-slate-300 transition cursor-pointer"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={index === profile.widget_order.length - 1}
                          onClick={() => moveWidget(index, 'right')}
                          className="p-1 rounded bg-[#070b16] border border-slate-700 disabled:opacity-30 hover:border-amber-400 text-slate-300 transition cursor-pointer"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleWidget(key)}
                          className={`text-[10px] font-mono px-2.5 py-0.5 rounded font-black cursor-pointer transition ${
                            active 
                              ? 'bg-amber-400 text-slate-950' 
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {active ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}