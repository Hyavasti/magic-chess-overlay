import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Crown, Sparkles, TrendingUp, Swords, Trophy, Award, Flame } from 'lucide-react';
import { MCGG_COMMANDERS, findCommander, type Commander } from '../data/commanders';
import { supabase } from '../supabase';

interface MatchRecord {
  id: string;
  placement: number;
  commander: Commander;
}

interface ProfileData {
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

function getPlacementTheme(placement: number) {
  switch (placement) {
    case 1:
      return {
        cardBorder: 'border-[#f6c042] shadow-[0_0_12px_rgba(246,192,66,0.65)]',
        cornerTrim: 'border-[#ffe58f]',
        badge: 'text-[#ffd768] border-[#f6c042]/90 bg-[#2b1b04]/90 shadow-[0_0_8px_rgba(246,192,66,0.5)]',
        bar: 'bg-gradient-to-r from-[#d99018] via-[#ffd768] to-[#d99018] shadow-[0_0_6px_rgba(246,192,66,0.8)]',
      };
    case 2:
      return {
        cardBorder: 'border-[#94a3b8] shadow-[0_0_8px_rgba(148,163,184,0.45)]',
        cornerTrim: 'border-[#cbd5e1]',
        badge: 'text-[#e2e8f0] border-[#94a3b8]/80 bg-[#0f172a]/90',
        bar: 'bg-gradient-to-r from-[#64748b] via-[#cbd5e1] to-[#64748b]',
      };
    case 3:
      return {
        cardBorder: 'border-[#b45309] shadow-[0_0_8px_rgba(180,83,9,0.45)]',
        cornerTrim: 'border-[#d97706]',
        badge: 'text-[#f59e0b] border-[#b45309]/80 bg-[#1c1208]/90',
        bar: 'bg-gradient-to-r from-[#78350f] via-[#d97706] to-[#78350f]',
      };
    case 4:
      return {
        cardBorder: 'border-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.45)]',
        cornerTrim: 'border-[#34d399]',
        badge: 'text-[#6ee7b7] border-[#10b981]/80 bg-[#022c22]/90',
        bar: 'bg-gradient-to-r from-[#047857] via-[#34d399] to-[#047857]',
      };
    default:
      return {
        cardBorder: 'border-[#881337]/80 opacity-80',
        cornerTrim: 'border-[#be123c]',
        badge: 'text-[#fda4af] border-[#881337]/70 bg-[#4c0519]/80',
        bar: 'bg-gradient-to-r from-[#4c0519] via-[#e11d48] to-[#4c0519]',
      };
  }
}

// Authentic MLBB Rank Tier Gradients
function getRankColor(tier: string) {
  switch (tier.toLowerCase()) {
    case 'mythical immortal':
      return 'from-[#f472b6] via-[#ec4899] to-[#fbbf24]';
    case 'mythical glory':
      return 'from-[#fef08a] via-[#f59e0b] to-[#ea580c]';
    case 'mythical honor':
      return 'from-[#7dd3fc] via-[#38bdf8] to-[#facc15]';
    case 'mythic':
      return 'from-[#fde047] via-[#eab308] to-[#ca8a04]';
    case 'legend':
      return 'from-[#fb923c] via-[#f59e0b] to-[#d97706]';
    case 'epic':
      return 'from-[#67e8f9] via-[#06b6d4] to-[#2563eb]';
    case 'grandmaster':
      return 'from-[#fcd34d] to-[#b45309]';
    case 'master':
      return 'from-[#cbd5e1] to-[#64748b]';
    case 'elite':
      return 'from-[#93c5fd] to-[#3b82f6]';
    default:
      return 'from-[#fed7aa] to-[#c2410c]';
  }
}

export default function Overlay() {
  const { streamerId = 'default_streamer' } = useParams();
  const [allSessionMatches, setAllSessionMatches] = useState<MatchRecord[]>([]);
  const [profile, setProfile] = useState<ProfileData>({
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
    top_commanders: ['chou', 'fanny', 'layla'],
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

  const loadMatches = async () => {
    const { data: matchData } = await supabase
      .from('stream_matches')
      .select('*')
      .eq('streamer_id', streamerId)
      .order('created_at', { ascending: false });

    if (matchData) {
      setAllSessionMatches(
        matchData.map((m) => ({
          id: m.id,
          placement: m.placement,
          commander: findCommander(m.commander_id) || MCGG_COMMANDERS[0],
        }))
      );
    } else {
      setAllSessionMatches([]);
    }
  };

  const loadProfile = async () => {
    const { data: profileData } = await supabase
      .from('streamer_profiles')
      .select('*')
      .eq('streamer_id', streamerId)
      .single();

    if (profileData) {
      setProfile((prev) => ({
        ...prev,
        rank_tier: profileData.rank_tier || prev.rank_tier,
        rank_division: profileData.rank_division || '',
        rank_points: profileData.rank_points ?? prev.rank_points,
        historical_tier: profileData.historical_tier || prev.historical_tier,
        historical_stars: profileData.historical_stars ?? prev.historical_stars,
        total_matches: profileData.total_matches ?? prev.total_matches,
        season_win_rate: profileData.season_win_rate ?? prev.season_win_rate,
        champion_rate: profileData.champion_rate ?? prev.champion_rate,
        season_avg_rank: profileData.season_avg_rank ?? prev.season_avg_rank,
        star_delta: profileData.star_delta ?? prev.star_delta,
        top_commanders: profileData.top_commanders && profileData.top_commanders.length > 0 ? profileData.top_commanders : prev.top_commanders,
        enabled_widgets: profileData.enabled_widgets || prev.enabled_widgets,
        widget_order: profileData.widget_order || prev.widget_order,
      }));
    }
  };

  useEffect(() => {
    loadMatches();
    loadProfile();

    const matchChannel = supabase
      .channel(`matches_${streamerId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stream_matches', filter: `streamer_id=eq.${streamerId}` }, () => {
        loadMatches();
      })
      .subscribe();

    const profileChannel = supabase
      .channel(`profile_${streamerId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'streamer_profiles', filter: `streamer_id=eq.${streamerId}` }, (payload) => {
        const u = payload.new as Partial<ProfileData>;
        setProfile((prev) => ({
          ...prev,
          ...u,
          enabled_widgets: u.enabled_widgets || prev.enabled_widgets,
          widget_order: u.widget_order || prev.widget_order,
        }));
        loadMatches();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(matchChannel);
      supabase.removeChannel(profileChannel);
    };
  }, [streamerId]);

  const top4Count = allSessionMatches.filter((m) => m.placement <= 4).length;
  const bottom4Count = allSessionMatches.length - top4Count;
  const displayAvatars = allSessionMatches.slice(0, 5);
  const widgets = profile.enabled_widgets || {};
  const order = profile.widget_order || [];

  const renderWidget = (key: string) => {
    if (!widgets[key]) return null;

    switch (key) {
      case 'currentRank':
        return (
          <div key={key} className="w-full flex items-center justify-between px-3 py-2 rounded-sm bg-gradient-to-r from-[#0d1e3d] via-[#09152b] to-[#0d1e3d] border border-[#c69848]/60 shadow-[inset_0_1px_0_rgba(255,229,143,0.2)]">
            <div className="flex items-center gap-2.5">
              <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#946c26] via-[#f7d672] to-[#c69848] rotate-45 rounded-[2px] shadow-[0_0_8px_rgba(247,214,114,0.4)]" />
                <div className="absolute inset-[1.5px] bg-[#070e1c] rotate-45 rounded-[1px]" />
                <Sparkles className="relative z-10 w-3.5 h-3.5 text-[#f5c842]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[8.5px] uppercase tracking-widest text-[#d8b467] font-black drop-shadow">CURRENT RANK</span>
                <span className={`text-[12px] font-black uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-r ${getRankColor(profile.rank_tier)} drop-shadow`}>
                  {profile.rank_tier} {profile.rank_division}
                </span>
              </div>
            </div>
            {profile.rank_points > 0 && (
              <span className="text-xs font-black text-[#fde047] font-mono bg-[#1f1708] border border-[#c69848]/70 px-2 py-0.5 rounded shadow-[0_0_6px_rgba(245,200,66,0.3)]">
                ⭐ {profile.rank_points}
              </span>
            )}
          </div>
        );

      case 'sessionRecord':
        return (
          <div key={key} className="flex-1 min-w-[130px] flex flex-col items-center justify-center p-2 rounded-sm bg-[#091326]/90 border border-[#c69848]/30 shadow-[inset_0_1px_0_rgba(255,229,143,0.1)]">
            <div className="flex items-center gap-1">
              <Swords className="w-3.5 h-3.5 text-[#f5c842] drop-shadow" />
              <span className="text-[9.5px] tracking-wider text-[#d8b467] uppercase font-black">RECORD</span>
            </div>
            <div className="text-sm font-black font-mono mt-0.5">
              <span className="text-[#34d399] drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]">{top4Count}W</span>
              <span className="text-[#c69848]/40 mx-1.5 font-sans">|</span>
              <span className="text-[#f43f5e] drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]">{bottom4Count}L</span>
            </div>
          </div>
        );

      case 'starDelta':
        return (
          <div key={key} className="flex-1 min-w-[130px] flex flex-col items-center justify-center p-2 rounded-sm bg-[#091326]/90 border border-[#c69848]/30 shadow-[inset_0_1px_0_rgba(255,229,143,0.1)]">
            <span className="text-[9.5px] tracking-wider text-[#d8b467] uppercase font-black flex items-center gap-1">
              <Flame className="w-3 h-3 text-[#f5c842]" /> SESSION ⭐
            </span>
            <span className={`text-sm font-black font-mono mt-0.5 ${
              profile.star_delta > 0 
                ? 'text-[#facc15] drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]' 
                : profile.star_delta < 0 
                ? 'text-[#fb7185] drop-shadow-[0_0_8px_rgba(251,113,133,0.6)]' 
                : 'text-slate-300'
            }`}>
              {profile.star_delta > 0 ? `+${profile.star_delta}` : profile.star_delta < 0 ? `${profile.star_delta}` : '±0'} ⭐
            </span>
          </div>
        );

      case 'winRate':
        return (
          <div key={key} className="flex-1 min-w-[130px] flex flex-col items-center justify-center p-2 rounded-sm bg-[#091326]/90 border border-[#c69848]/30 shadow-[inset_0_1px_0_rgba(255,229,143,0.1)]">
            <span className="text-[9.5px] tracking-wider text-[#d8b467] uppercase font-black">WIN RATE</span>
            <span className="text-sm font-black text-[#38bdf8] font-mono mt-0.5 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]">
              {profile.season_win_rate}%
            </span>
          </div>
        );

      case 'championRate':
        return (
          <div key={key} className="flex-1 min-w-[130px] flex flex-col items-center justify-center p-2 rounded-sm bg-[#091326]/90 border border-[#c69848]/30 shadow-[inset_0_1px_0_rgba(255,229,143,0.1)]">
            <span className="text-[9.5px] tracking-wider text-[#d8b467] uppercase font-black flex items-center gap-1">
              <Trophy className="w-3 h-3 text-[#f5c842]" /> TOP 1 RATE
            </span>
            <span className="text-sm font-black text-[#fbbf24] font-mono mt-0.5 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">
              {profile.champion_rate}%
            </span>
          </div>
        );

      case 'avgRank':
        return (
          <div key={key} className="flex-1 min-w-[130px] flex flex-col items-center justify-center p-2 rounded-sm bg-[#091326]/90 border border-[#c69848]/30 shadow-[inset_0_1px_0_rgba(255,229,143,0.1)]">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-[#38bdf8]" />
              <span className="text-[9.5px] tracking-wider text-[#d8b467] uppercase font-black">AVG RANK</span>
            </div>
            <span className="text-sm font-black text-[#7dd3fc] font-mono mt-0.5 drop-shadow-[0_0_8px_rgba(125,211,252,0.5)]">
              {profile.season_avg_rank}
            </span>
          </div>
        );

      case 'historicalBest':
        return (
          <div key={key} className="flex-1 min-w-[130px] flex flex-col items-center justify-center p-2 rounded-sm bg-[#091326]/90 border border-[#c69848]/30 shadow-[inset_0_1px_0_rgba(255,229,143,0.1)]">
            <span className="text-[9.5px] tracking-wider text-[#d8b467] uppercase font-black flex items-center gap-1">
              <Award className="w-3 h-3 text-[#38bdf8]" /> HISTORICAL
            </span>
            <div className="text-xs font-black font-mono mt-0.5 flex items-center gap-1.5 flex-wrap justify-center text-center">
              {/* Full tier name without truncation */}
              <span className={`text-[11px] font-black uppercase text-transparent bg-clip-text bg-gradient-to-r ${getRankColor(profile.historical_tier)}`}>
                {profile.historical_tier}
              </span>
              <span className="text-[#fde047] font-bold">⭐ {profile.historical_stars}</span>
            </div>
          </div>
        );

      case 'topCommanders':
        return (
          <div key={key} className="w-full flex items-center justify-between px-3 py-1.5 rounded-sm bg-[#091326]/90 border border-[#c69848]/30">
            <span className="text-[9px] tracking-wider text-[#d8b467] uppercase font-black">
              GO-TO COMMANDERS
            </span>
            <div className="flex items-center gap-2">
              {(profile.top_commanders || []).slice(0, 3).map((cmdId) => {
                const cmd = findCommander(cmdId);
                return (
                  <div
                    key={cmdId}
                    className="w-7 h-7 rounded-full border border-[#c69848] overflow-hidden bg-[#070e1c] flex items-center justify-center shadow-md relative"
                    title={cmd?.name || cmdId}
                  >
                    {cmd?.avatar ? (
                      <img
                        src={cmd.avatar}
                        alt={cmd.name}
                        className="w-full h-full object-cover object-top z-10"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : null}
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-[#f5c842] bg-[#070e1c]">
                      {(cmd?.name || cmdId).slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-3 inline-flex flex-col select-none font-sans bg-transparent w-[380px]">
      {/* 1. MATCH CARDS STRIP */}
      {displayAvatars.length > 0 && (
        <div className="flex items-center gap-1.5 mb-2.5">
          {displayAvatars.map((match) => {
            const theme = getPlacementTheme(match.placement);
            const isFirst = match.placement === 1;

            return (
              <div key={match.id} className="flex flex-col items-center flex-1">
                <div
                  className={`relative w-full aspect-[4/5] rounded-sm overflow-hidden bg-gradient-to-b from-[#0d182e] via-[#091224] to-[#040812] border-2 transition-all flex items-center justify-center ${theme.cardBorder}`}
                >
                  <img
                    src={match.commander.avatar}
                    alt={match.commander.name}
                    className="w-full h-full object-cover object-top z-10"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span className="absolute text-xs font-black text-[#d8b467]/40 pointer-events-none">
                    {match.commander.name.slice(0, 2).toUpperCase()}
                  </span>

                  <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 ${theme.cornerTrim} z-20 pointer-events-none`} />

                  {isFirst && (
                    <div className="absolute top-0 right-0 bg-gradient-to-br from-[#fde047] to-[#d97706] text-slate-950 p-0.5 rounded-bl shadow-md z-20">
                      <Crown className="w-3 h-3 drop-shadow" />
                    </div>
                  )}
                </div>

                <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 mt-1 rounded-sm border ${theme.badge}`}>
                  #{match.placement}
                </span>
                <div className={`w-full h-0.5 mt-0.5 rounded-full ${theme.bar}`} />
              </div>
            );
          })}
        </div>
      )}

      {/* 2. AUTHENTIC MLBB THEMED SQUARE HUD PANEL */}
      <div className="relative p-2.5 rounded-md border-2 border-[#c69848] bg-gradient-to-b from-[#081226]/98 via-[#060d1c]/98 to-[#03060d]/98 shadow-[0_10px_35px_rgba(0,0,0,0.95)] backdrop-blur-md">
        {/* MLBB Ornate Corner Accents */}
        <div className="absolute -top-[2px] -left-[2px] w-3 h-3 border-t-2 border-l-2 border-[#ffe58f] drop-shadow-[0_0_6px_rgba(255,229,143,0.8)] pointer-events-none" />
        <div className="absolute -top-[2px] -right-[2px] w-3 h-3 border-t-2 border-r-2 border-[#ffe58f] drop-shadow-[0_0_6px_rgba(255,229,143,0.8)] pointer-events-none" />
        <div className="absolute -bottom-[2px] -left-[2px] w-3 h-3 border-b-2 border-l-2 border-[#ffe58f] drop-shadow-[0_0_6px_rgba(255,229,143,0.8)] pointer-events-none" />
        <div className="absolute -bottom-[2px] -right-[2px] w-3 h-3 border-b-2 border-r-2 border-[#ffe58f] drop-shadow-[0_0_6px_rgba(255,229,143,0.8)] pointer-events-none" />

        {/* Adaptive Layout Container */}
        <div className="flex flex-wrap gap-1.5">
          {order.map((key) => renderWidget(key))}
        </div>
      </div>
    </div>
  );
}