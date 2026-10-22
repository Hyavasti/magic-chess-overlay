import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  RotateCcw, 
  Trash2, 
  Award, 
  Copy, 
  ExternalLink, 
  Check, 
  Sparkles, 
  Swords, 
  Layers, 
  Settings2, 
  SlidersHorizontal, 
  ArrowLeft, 
  ArrowRight 
} from 'lucide-react';
import { MCGG_COMMANDERS, findCommander } from '../data/commanders';
import { supabase } from '../supabase';

const WIDGET_LABELS: Record<string, string> = {
  currentRank: 'Current Rank',
  sessionRecord: 'Win/Lose Record',
  starDelta: 'Session Star Delta',
  winRate: 'Season Win Rate',
  championRate: 'Champion Rate',
  avgRank: 'Average Rank',
  historicalBest: 'Historical Best',
  topCommanders: 'Go-To Commanders',
};

const STAR_MAP: Record<number, number> = {
  1: 4,
  2: 3,
  3: 2,
  4: 1,
  5: -1,
  6: -2,
  7: -3,
  8: -4,
};

export default function Dashboard() {
  const [streamerId] = useState<string>('default_streamer');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'Hero' | 'Classic'>('all');
  const [selectedCommanderId, setSelectedCommanderId] = useState<string>('chou');
  const [selectedPlacement, setSelectedPlacement] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    rank_tier: 'Mythical Honor',
    rank_division: '',
    rank_points: 138,
    historical_tier: 'Mythical Honor',
    historical_stars: 145,
    total_matches: 166,
    season_win_rate: 71.69,
    champion_rate: 30.72,
    season_avg_rank: 3.34,
    star_delta: 0,
    top_commanders: ['layla', 'yuki', 'minotaur'],
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
    widget_order: ['currentRank', 'sessionRecord', 'starDelta', 'winRate', 'championRate', 'avgRank', 'historicalBest', 'topCommanders'],
  });

  useEffect(() => {
    async function loadRank() {
      const { data } = await supabase
        .from('streamer_profiles')
        .select('*')
        .eq('streamer_id', streamerId)
        .single();

      if (data) {
        setProfile((prev) => ({
          ...prev,
          rank_tier: data.rank_tier || prev.rank_tier,
          rank_division: data.rank_division || '',
          rank_points: data.rank_points ?? prev.rank_points,
          historical_tier: data.historical_tier || prev.historical_tier,
          historical_stars: data.historical_stars ?? prev.historical_stars,
          total_matches: data.total_matches ?? prev.total_matches,
          season_win_rate: data.season_win_rate ?? prev.season_win_rate,
          champion_rate: data.champion_rate ?? prev.champion_rate,
          season_avg_rank: data.season_avg_rank ?? prev.season_avg_rank,
          star_delta: data.star_delta ?? prev.star_delta,
          top_commanders: data.top_commanders || prev.top_commanders,
          enabled_widgets: data.enabled_widgets || prev.enabled_widgets,
          widget_order: data.widget_order || prev.widget_order,
        }));
      }
    }
    loadRank();
  }, [streamerId]);

  const overlayUrl = `${window.location.origin}/overlay/${streamerId}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(overlayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateProfileInSupabase = async (updated: Partial<typeof profile>) => {
    const next = { ...profile, ...updated };
    setProfile(next);
    await supabase.from('streamer_profiles').upsert({
      streamer_id: streamerId,
      ...next,
      updated_at: new Date().toISOString(),
    });
  };

  const toggleWidget = (key: string) => {
    const nextWidgets = {
      ...profile.enabled_widgets,
      [key]: !profile.enabled_widgets[key as keyof typeof profile.enabled_widgets],
    };
    updateProfileInSupabase({ enabled_widgets: nextWidgets });
  };

  const moveWidget = (index: number, direction: 'left' | 'right') => {
    const newOrder = [...profile.widget_order];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    updateProfileInSupabase({ widget_order: newOrder });
  };

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = findCommander(selectedCommanderId);
    if (!cmd) return;

    // 1. Insert match
    await supabase.from('stream_matches').insert({
      streamer_id: streamerId,
      placement: selectedPlacement,
      commander_id: cmd.id,
    });

    // 2. Automatically apply star delta
    const starChange = STAR_MAP[selectedPlacement] || 0;
    const newTotalStars = Math.max(0, profile.rank_points + starChange);
    const newSessionDelta = profile.star_delta + starChange;

    await updateProfileInSupabase({
      rank_points: newTotalStars,
      star_delta: newSessionDelta,
    });
  };

  // RESET 1: Reset Entire Stream Session (Matches & Star Delta)
  const handleResetSession = async () => {
    const confirmed = window.confirm(
      "Reset Stream Session?\n\n• Wipes all logged stream match cards\n• Resets session Star Delta to 0\n• Clears active match history on overlay\n\nYour season rank and career profile stats will NOT be changed."
    );
    if (!confirmed) return;

    setLoadingAction('session');
    try {
      // Delete all matches for this streamer
      const { error: delError } = await supabase
        .from('stream_matches')
        .delete()
        .eq('streamer_id', streamerId);

      if (delError) {
        console.error("Supabase delete failed:", delError);
        alert(`Delete failed: ${delError.message}`);
        return;
      }

      // Touch streamer_profiles to instantly trigger overlay re-fetch via Realtime
      await updateProfileInSupabase({
        star_delta: 0,
      });

      alert("Stream session reset! Overlay match history is now clean.");
    } catch (err) {
      console.error(err);
      alert("Failed to reset session. Check Supabase connection.");
    } finally {
      setLoadingAction(null);
    }
  };

  // RESET 2: Reset In-Game Rank / Season Baseline
  const handleResetRank = async () => {
    const confirmed = window.confirm(
      "Reset In-Game Season Rank?\n\n• Resets Current Stars / Points to 0\n• Sets Rank Tier back to 'Warrior'\n• Resets Session Star Delta to 0\n\nUse this when a new Magic Chess season begins."
    );
    if (!confirmed) return;

    setLoadingAction('rank');
    try {
      await updateProfileInSupabase({
        rank_tier: 'Warrior',
        rank_division: 'III',
        rank_points: 0,
        star_delta: 0,
      });
      alert("Season Rank successfully reset to baseline!");
    } catch (err) {
      console.error(err);
      alert("Failed to reset rank.");
    } finally {
      setLoadingAction(null);
    }
  };

  // RESET 3: Quick Reset for Career Rates
  const handleResetCareerStats = async () => {
    const confirmed = window.confirm("Reset career win rates and total match count to 0?");
    if (!confirmed) return;

    await updateProfileInSupabase({
      total_matches: 0,
      season_win_rate: 0,
      champion_rate: 0,
      season_avg_rank: 0,
    });
  };

  const filteredCommanders = selectedCategory === 'all'
    ? MCGG_COMMANDERS
    : MCGG_COMMANDERS.filter((c) => c.category === selectedCategory);

  return (
    <div className="min-h-screen w-full bg-[#040813] text-white p-6 font-sans relative overflow-y-auto selection:bg-amber-500 selection:text-black">
      <div className="max-w-4xl mx-auto space-y-6 pb-24 relative z-10">
        
        {/* Header */}
        <div className="border-b border-amber-500/20 pb-4 text-center">
          <div className="inline-flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-amber-400 drop-shadow" />
            <span className="text-[10px] tracking-[0.3em] uppercase text-cyan-300 font-extrabold">
              Magic Chess: Go Go
            </span>
            <Sparkles className="w-4 h-4 text-amber-400 drop-shadow" />
          </div>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-amber-500 drop-shadow">
            STREAMER STATS & HUD MANAGER
          </h1>
        </div>

        {/* OBS URL Box */}
        <div className="p-4 bg-[#070e1e] border border-amber-500/40 shadow-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Layers className="w-4 h-4 text-amber-400 shrink-0" />
            <input
              type="text"
              readOnly
              value={overlayUrl}
              className="w-full bg-[#050b16] border border-amber-500/30 px-3 py-1.5 text-xs font-mono text-cyan-300 outline-none select-all"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={copyUrl}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-black px-4 py-1.5 text-xs uppercase cursor-pointer transition hover:opacity-95"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy URL'}
            </button>
            <a
              href={overlayUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-cyan-300 hover:text-white flex items-center gap-1 ml-2"
            >
              Preview <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Action Controls / Reset Buttons */}
        <div className="p-4 bg-gradient-to-r from-[#0c1222] via-[#101b33] to-[#0c1222] border border-amber-500/30 shadow-xl flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> Pre-Stream Reset Controls
            </span>
            <p className="text-[11px] text-slate-400">
              Clear previous match sessions or prepare stats for a new season with one click.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={loadingAction === 'session'}
              onClick={handleResetSession}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/40 hover:bg-amber-500/20 active:scale-95 transition cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5 text-amber-400" />
              {loadingAction === 'session' ? 'Resetting...' : 'Reset Stream Session (0-0)'}
            </button>

            <button
              type="button"
              disabled={loadingAction === 'rank'}
              onClick={handleResetRank}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-rose-300 bg-rose-500/10 border border-rose-500/40 hover:bg-rose-500/20 active:scale-95 transition cursor-pointer disabled:opacity-50"
            >
              <Award className="w-3.5 h-3.5 text-rose-400" />
              {loadingAction === 'rank' ? 'Resetting...' : 'Reset Season Rank'}
            </button>
          </div>
        </div>

        {/* SECTION A: Stats Reordering Switchboard */}
        <div className="p-5 bg-gradient-to-r from-[#070e1e] via-[#0d1c3a] to-[#070e1e] border border-cyan-500/40 shadow-xl space-y-3">
          <span className="text-xs font-black uppercase tracking-widest text-cyan-300 flex items-center gap-1.5 drop-shadow">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" /> Stats Order & Display Switchboard
          </span>
          <p className="text-[11px] text-slate-400">
            Arrange the left-to-right order of stats on your overlay using the arrow buttons. Click ON/OFF to hide or show them.
          </p>

          <div className="space-y-2 pt-2">
            {profile.widget_order.map((key, index) => {
              const active = profile.enabled_widgets[key as keyof typeof profile.enabled_widgets];
              return (
                <div
                  key={key}
                  className={`p-2.5 border flex items-center justify-between transition ${
                    active
                      ? 'border-amber-500/40 bg-amber-950/20 text-amber-200'
                      : 'border-slate-800 bg-[#050b16]/80 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-500">#{index + 1}</span>
                    <span className="font-bold text-xs">{WIDGET_LABELS[key] || key}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveWidget(index, 'left')}
                      className="p-1.5 border border-slate-700 bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:border-amber-400 transition cursor-pointer"
                      title="Move Left"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={index === profile.widget_order.length - 1}
                      onClick={() => moveWidget(index, 'right')}
                      className="p-1.5 border border-slate-700 bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:border-amber-400 transition cursor-pointer"
                      title="Move Right"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleWidget(key)}
                      className={`text-[10px] font-mono px-3 py-1 font-black cursor-pointer transition ${
                        active ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
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

        {/* SECTION B: Career Stats Editor */}
        <div className="p-5 bg-gradient-to-r from-[#070e1e] via-[#0d1c3a] to-[#070e1e] border border-amber-500/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-amber-300 flex items-center gap-1.5 drop-shadow">
              <Settings2 className="w-3.5 h-3.5 text-amber-400" /> Career Profile Stats
            </span>
            <button
              type="button"
              onClick={handleResetCareerStats}
              className="text-[10px] text-slate-400 hover:text-rose-400 transition cursor-pointer underline"
            >
              Reset Career Rates to 0
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Total Matches</label>
              <input
                type="number"
                value={profile.total_matches}
                onChange={(e) => updateProfileInSupabase({ total_matches: Number(e.target.value) })}
                className="bg-[#050b16] border border-amber-500/30 px-3 py-1.5 text-white font-mono text-xs outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Win Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={profile.season_win_rate}
                onChange={(e) => updateProfileInSupabase({ season_win_rate: Number(e.target.value) })}
                className="bg-[#050b16] border border-amber-500/30 px-3 py-1.5 text-emerald-400 font-mono text-xs outline-none font-bold"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Champion Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={profile.champion_rate}
                onChange={(e) => updateProfileInSupabase({ champion_rate: Number(e.target.value) })}
                className="bg-[#050b16] border border-amber-500/30 px-3 py-1.5 text-amber-300 font-mono text-xs outline-none font-bold"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Average Rank</label>
              <input
                type="number"
                step="0.01"
                value={profile.season_avg_rank}
                onChange={(e) => updateProfileInSupabase({ season_avg_rank: Number(e.target.value) })}
                className="bg-[#050b16] border border-amber-500/30 px-3 py-1.5 text-cyan-300 font-mono text-xs outline-none font-bold"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Current Tier</label>
              <select
                value={profile.rank_tier}
                onChange={(e) => updateProfileInSupabase({ rank_tier: e.target.value })}
                className="bg-[#050b16] border border-amber-500/30 px-3 py-1.5 text-white text-xs outline-none"
              >
                <option value="Warrior">Warrior</option>
                <option value="Elite">Elite</option>
                <option value="Master">Master</option>
                <option value="Grandmaster">Grandmaster</option>
                <option value="Epic">Epic</option>
                <option value="Legend">Legend</option>
                <option value="Mythic">Mythic</option>
                <option value="Mythical Honor">Mythical Honor</option>
                <option value="Mythical Glory">Mythical Glory</option>
                <option value="Mythical Immortal">Mythical Immortal</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Historical Best Tier</label>
              <select
                value={profile.historical_tier}
                onChange={(e) => updateProfileInSupabase({ historical_tier: e.target.value })}
                className="bg-[#050b16] border border-amber-500/30 px-3 py-1.5 text-white text-xs outline-none"
              >
                <option value="Mythic">Mythic</option>
                <option value="Mythical Honor">Mythical Honor</option>
                <option value="Mythical Glory">Mythical Glory</option>
                <option value="Mythical Immortal">Mythical Immortal</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Historical Stars</label>
              <input
                type="number"
                value={profile.historical_stars}
                onChange={(e) => updateProfileInSupabase({ historical_stars: Number(e.target.value) })}
                className="bg-[#050b16] border border-amber-500/30 px-3 py-1.5 text-amber-300 font-mono text-xs outline-none font-bold"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Session Stars Delta</label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => updateProfileInSupabase({ star_delta: profile.star_delta - 1 })}
                  className="bg-rose-950 border border-rose-800 text-rose-300 px-2 py-1 text-xs font-black cursor-pointer"
                >
                  -1
                </button>
                <input
                  type="number"
                  value={profile.star_delta}
                  onChange={(e) => updateProfileInSupabase({ star_delta: Number(e.target.value) })}
                  className="w-14 text-center bg-[#050b16] border border-amber-500/30 py-1 text-amber-300 font-mono text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={() => updateProfileInSupabase({ star_delta: profile.star_delta + 1 })}
                  className="bg-emerald-950 border border-emerald-800 text-emerald-300 px-2 py-1 text-xs font-black cursor-pointer"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => updateProfileInSupabase({ star_delta: 0 })}
                  className="bg-slate-800 border border-slate-700 text-slate-400 px-1.5 py-1 text-[10px] hover:text-white"
                  title="Reset Delta to 0"
                >
                  0
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Current ⭐ Stars</label>
              <input
                type="number"
                value={profile.rank_points}
                onChange={(e) => updateProfileInSupabase({ rank_points: Number(e.target.value) })}
                className="bg-[#050b16] border border-amber-500/40 px-3 py-1.5 text-amber-300 font-mono font-bold outline-none text-xs"
              />
            </div>
          </div>
        </div>

        {/* SECTION C: Match Logger */}
        <form
          onSubmit={handleAddMatch}
          className="p-5 bg-gradient-to-r from-[#070e1e] via-[#0d1c3a] to-[#070e1e] border border-amber-500/40 shadow-xl space-y-3"
        >
          <span className="text-xs font-black uppercase tracking-widest text-amber-300 flex items-center gap-1.5 drop-shadow">
            <Swords className="w-3.5 h-3.5 text-amber-400" /> Log Match Result
          </span>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Filter</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as 'all' | 'Hero' | 'Classic')}
                className="bg-[#050b16] border border-amber-500/30 px-3 py-1.5 text-white outline-none text-xs"
              >
                <option value="all">All ({MCGG_COMMANDERS.length})</option>
                <option value="Hero">Hero Commanders</option>
                <option value="Classic">Classic Commanders</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 min-w-[190px]">
              <label className="text-[10px] uppercase font-bold text-slate-400">Commander</label>
              <select
                value={selectedCommanderId}
                onChange={(e) => setSelectedCommanderId(e.target.value)}
                className="bg-[#050b16] border border-amber-500/30 px-3 py-1.5 text-white outline-none text-xs"
              >
                {filteredCommanders.map((cmd) => (
                  <option key={cmd.id} value={cmd.id}>
                    [{cmd.category}] {cmd.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Placement</label>
              <select
                value={selectedPlacement}
                onChange={(e) => setSelectedPlacement(Number(e.target.value))}
                className="bg-[#050b16] border border-amber-500/30 px-3 py-1.5 text-white font-bold outline-none text-xs"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <option key={num} value={num}>
                    #{num}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col justify-end self-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 text-slate-950 font-black px-5 py-2 text-xs uppercase transition shadow-md cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Submit Game
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}