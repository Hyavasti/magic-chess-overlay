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
        cardBorder: 'border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.55)]',
        cornerTrim: 'border-amber-300',
        badge: 'text-amber-300 border-amber-400/80 bg-amber-950/90',
        bar: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]',
      };
    case 2:
      return {
        cardBorder: 'border-slate-300 shadow-[0_0_8px_rgba(203,213,225,0.45)]',
        cornerTrim: 'border-slate-200',
        badge: 'text-slate-200 border-slate-300/80 bg-slate-800/90',
        bar: 'bg-slate-300',
      };
    case 3:
      return {
        cardBorder: 'border-amber-700 shadow-[0_0_8px_rgba(180,83,9,0.45)]',
        cornerTrim: 'border-amber-600',
        badge: 'text-amber-400 border-amber-700/80 bg-stone-900/90',
        bar: 'bg-amber-700',
      };
    case 4:
      return {
        cardBorder: 'border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.45)]',
        cornerTrim: 'border-emerald-300',
        badge: 'text-emerald-300 border-emerald-500/80 bg-emerald-950/90',
        bar: 'bg-emerald-500',
      };
    default:
      return {
        cardBorder: 'border-rose-900/80 opacity-80',
        cornerTrim: 'border-rose-800',
        badge: 'text-rose-300 border-rose-900/70 bg-rose-950/80',
        bar: 'bg-rose-700',
      };
  }
}

function getRankColor(tier: string) {
  switch (tier.toLowerCase()) {
    case 'mythical immortal':
      return 'from-purple-300 via-pink-400 to-amber-300';
    case 'mythical glory':
      return 'from-amber-200 via-orange-400 to-yellow-300';
    case 'mythical honor':
      return 'from-sky-300 via-cyan-400 to-amber-300';
    case 'mythic':
      return 'from-amber-200 via-yellow-300 to-amber-400';
    case 'legend':
      return 'from-orange-400 via-amber-300 to-yellow-500';
    case 'epic':
      return 'from-teal-300 via-cyan-400 to-blue-500';
    default:
      return 'from-purple-300 to-amber-400';
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
          <div key={key} className="w-full flex items-center justify-between px-3 py-2 rounded bg-gradient-to-r from-[#0a1630] to-[#070e1e] border border-amber-500/40 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-600 to-amber-200 rotate-45 rounded-[2px]" />
                <div className="absolute inset-[1px] bg-[#070e1e] rotate-45 rounded-[1px]" />
                <Sparkles className="relative z-10 w-3.5 h-3.5 text-amber-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-[8.5px] uppercase tracking-wider text-amber-300/80 font-black">CURRENT RANK</span>
                <span className={`text-xs font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r ${getRankColor(profile.rank_tier)}`}>
                  {profile.rank_tier} {profile.rank_division}
                </span>
              </div>
            </div>
            {profile.rank_points > 0 && (
              <span className="text-xs font-black text-amber-300 font-mono bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded">
                ⭐ {profile.rank_points}
              </span>
            )}
          </div>
        );

      case 'sessionRecord':
        return (
          <div key={key} className="flex-1 min-w-[140px] flex flex-col items-center justify-center p-2 rounded bg-[#070e1e]/90 border border-amber-500/20">
            <div className="flex items-center gap-1">
              <Swords className="w-3.5 h-3.5 text-amber-400 drop-shadow" />
              <span className="text-[9.5px] tracking-wider text-amber-200/90 uppercase font-black">RECORD</span>
            </div>
            <div className="text-sm font-black font-mono mt-0.5">
              <span className="text-emerald-400">{top4Count}W</span>
              <span className="text-amber-500/40 mx-1">|</span>
              <span className="text-rose-400">{bottom4Count}L</span>
            </div>
          </div>
        );

      case 'starDelta':
        return (
          <div key={key} className="flex-1 min-w-[140px] flex flex-col items-center justify-center p-2 rounded bg-[#070e1e]/90 border border-amber-500/20">
            <span className="text-[9.5px] tracking-wider text-amber-200/90 uppercase font-black flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" /> SESSION ⭐
            </span>
            <span className={`text-sm font-black font-mono mt-0.5 ${profile.star_delta >= 0 ? 'text-amber-300 drop-shadow' : 'text-rose-400'}`}>
              {profile.star_delta > 0 ? `+${profile.star_delta}` : profile.star_delta} ⭐
            </span>
          </div>
        );

      case 'winRate':
        return (
          <div key={key} className="flex-1 min-w-[140px] flex flex-col items-center justify-center p-2 rounded bg-[#070e1e]/90 border border-amber-500/20">
            <span className="text-[9.5px] tracking-wider text-amber-200/90 uppercase font-black">WIN RATE</span>
            <span className="text-sm font-black text-emerald-400 font-mono mt-0.5">
              {profile.season_win_rate}%
            </span>
          </div>
        );

      case 'championRate':
        return (
          <div key={key} className="flex-1 min-w-[140px] flex flex-col items-center justify-center p-2 rounded bg-[#070e1e]/90 border border-amber-500/20">
            <span className="text-[9.5px] tracking-wider text-amber-200/90 uppercase font-black flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-400" /> TOP 1 RATE
            </span>
            <span className="text-sm font-black text-amber-300 font-mono mt-0.5">
              {profile.champion_rate}%
            </span>
          </div>
        );

      case 'avgRank':
        return (
          <div key={key} className="flex-1 min-w-[140px] flex flex-col items-center justify-center p-2 rounded bg-[#070e1e]/90 border border-amber-500/20">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-cyan-400" />
              <span className="text-[9.5px] tracking-wider text-amber-200/90 uppercase font-black">AVG RANK</span>
            </div>
            <span className="text-sm font-black text-cyan-300 font-mono mt-0.5">
              {profile.season_avg_rank}
            </span>
          </div>
        );

      case 'historicalBest':
        return (
          <div key={key} className="flex-1 min-w-[140px] flex flex-col items-center justify-center p-2 rounded bg-[#070e1e]/90 border border-amber-500/20">
            <span className="text-[9.5px] tracking-wider text-cyan-300 uppercase font-black flex items-center gap-1">
              <Award className="w-3 h-3 text-cyan-400" /> HISTORICAL
            </span>
            <div className="text-xs font-black text-cyan-200 font-mono mt-0.5 flex items-center gap-1">
              <span className="text-[10px]">{profile.historical_tier.slice(0, 8)}</span>
              <span className="text-amber-300">⭐{profile.historical_stars}</span>
            </div>
          </div>
        );

      case 'topCommanders':
        return (
          <div key={key} className="w-full flex items-center justify-between px-3 py-1.5 rounded bg-[#070e1e]/90 border border-amber-500/20">
            <span className="text-[9px] tracking-wider text-amber-200/90 uppercase font-black">
              GO-TO COMMANDERS
            </span>
            <div className="flex items-center gap-2">
              {(profile.top_commanders || []).slice(0, 3).map((cmdId) => {
                const cmd = findCommander(cmdId);
                return (
                  <div
                    key={cmdId}
                    className="w-7 h-7 rounded-full border border-amber-400/80 overflow-hidden bg-slate-900 flex items-center justify-center shadow-md relative"
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
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-amber-300 bg-slate-950">
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
                  className={`relative w-full aspect-[4/5] rounded overflow-hidden bg-gradient-to-b from-slate-900 via-[#0d1527] to-[#080d1a] border-2 transition-all flex items-center justify-center ${theme.cardBorder}`}
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
                  <span className="absolute text-xs font-black text-amber-200/40 pointer-events-none">
                    {match.commander.name.slice(0, 2).toUpperCase()}
                  </span>

                  <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 ${theme.cornerTrim} z-20 pointer-events-none`} />

                  {isFirst && (
                    <div className="absolute top-0 right-0 bg-gradient-to-br from-amber-300 to-yellow-600 text-slate-950 p-0.5 rounded-bl shadow-md z-20">
                      <Crown className="w-3 h-3 drop-shadow" />
                    </div>
                  )}
                </div>

                <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 mt-1 rounded border ${theme.badge}`}>
                  #{match.placement}
                </span>
                <div className={`w-full h-0.5 mt-0.5 rounded-full ${theme.bar}`} />
              </div>
            );
          })}
        </div>
      )}

      {/* 2. ADAPTIVE AUTO-FLOW HUD PANEL: Auto-expands and fills all gaps */}
      <div className="relative p-3 rounded-lg border-2 border-amber-500/50 bg-[#040814]/95 shadow-[0_8px_32px_rgba(0,0,0,0.9)] backdrop-blur-md">
        {/* Glowing corner trim */}
        <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-300 pointer-events-none" />
        <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-300 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-300 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-300 pointer-events-none" />

        <div className="flex flex-wrap gap-2">
          {order.map((key) => renderWidget(key))}
        </div>
      </div>
    </div>
  );
}