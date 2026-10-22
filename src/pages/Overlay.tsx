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
        cardBorder: 'border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]',
        cornerTrim: 'border-amber-300',
        badge: 'text-amber-300 border-amber-400/80 bg-amber-950/90',
        bar: 'bg-amber-400',
      };
    case 2:
      return {
        cardBorder: 'border-slate-300 shadow-[0_0_6px_rgba(203,213,225,0.4)]',
        cornerTrim: 'border-slate-200',
        badge: 'text-slate-200 border-slate-300/80 bg-slate-800/90',
        bar: 'bg-slate-300',
      };
    case 3:
      return {
        cardBorder: 'border-amber-700 shadow-[0_0_6px_rgba(180,83,9,0.4)]',
        cornerTrim: 'border-amber-600',
        badge: 'text-amber-400 border-amber-700/80 bg-stone-900/90',
        bar: 'bg-amber-700',
      };
    case 4:
      return {
        cardBorder: 'border-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]',
        cornerTrim: 'border-emerald-300',
        badge: 'text-emerald-300 border-emerald-500/80 bg-emerald-950/90',
        bar: 'bg-emerald-500',
      };
    default:
      return {
        cardBorder: 'border-rose-900/70 opacity-75',
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
        top_commanders: profileData.top_commanders || prev.top_commanders,
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
      case 'sessionRecord':
        return (
          <div key={key} className="flex flex-col items-center justify-center px-2 py-0.5 border-r border-amber-500/20 last:border-r-0">
            <span className="text-[8px] tracking-wider text-amber-200/80 uppercase font-black flex items-center gap-0.5">
              <Swords className="w-2.5 h-2.5 text-amber-400" /> REC
            </span>
            <div className="text-xs font-black font-mono tracking-tight mt-0.5">
              <span className="text-emerald-400">{top4Count}W</span>
              <span className="text-amber-500/30 mx-0.5">/</span>
              <span className="text-rose-400">{bottom4Count}L</span>
            </div>
          </div>
        );

      case 'starDelta':
        return (
          <div key={key} className="flex flex-col items-center justify-center px-2 py-0.5 border-r border-amber-500/20 last:border-r-0">
            <span className="text-[8px] tracking-wider text-amber-200/80 uppercase font-black flex items-center gap-0.5">
              <Flame className="w-2.5 h-2.5 text-amber-400" /> SES ⭐
            </span>
            <span className={`text-xs font-black font-mono mt-0.5 ${profile.star_delta >= 0 ? 'text-amber-300' : 'text-rose-400'}`}>
              {profile.star_delta > 0 ? `+${profile.star_delta}` : profile.star_delta}
            </span>
          </div>
        );

      case 'currentRank':
        return (
          <div key={key} className="flex items-center gap-2 px-2.5 py-0.5 border-r border-amber-500/20 last:border-r-0">
            <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-600 to-amber-200 rotate-45 rounded-[2px]" />
              <div className="absolute inset-[1px] bg-[#070e1e] rotate-45 rounded-[1px]" />
              <Sparkles className="relative z-10 w-2.5 h-2.5 text-amber-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-[7.5px] uppercase tracking-wider text-amber-300/70 font-black leading-none">RANK</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`text-[11px] font-black uppercase text-transparent bg-clip-text bg-gradient-to-r ${getRankColor(profile.rank_tier)} whitespace-nowrap`}>
                  {profile.rank_tier} {profile.rank_division}
                </span>
                {profile.rank_points > 0 && (
                  <span className="text-[10px] font-black text-amber-300 font-mono">
                    ⭐{profile.rank_points}
                  </span>
                )}
              </div>
            </div>
          </div>
        );

      case 'historicalBest':
        return (
          <div key={key} className="flex flex-col items-center justify-center px-2 py-0.5 border-r border-amber-500/20 last:border-r-0">
            <span className="text-[8px] tracking-wider text-cyan-300/80 uppercase font-black flex items-center gap-0.5">
              <Award className="w-2.5 h-2.5 text-cyan-400" /> BEST
            </span>
            <span className="text-[10.5px] font-black text-cyan-200 font-mono mt-0.5">
              ⭐ {profile.historical_stars}
            </span>
          </div>
        );

      case 'winRate':
        return (
          <div key={key} className="flex flex-col items-center justify-center px-2 py-0.5 border-r border-amber-500/20 last:border-r-0">
            <span className="text-[8px] tracking-wider text-amber-200/80 uppercase font-black">WIN%</span>
            <span className="text-xs font-black text-emerald-400 font-mono mt-0.5">
              {profile.season_win_rate}%
            </span>
          </div>
        );

      case 'championRate':
        return (
          <div key={key} className="flex flex-col items-center justify-center px-2 py-0.5 border-r border-amber-500/20 last:border-r-0">
            <span className="text-[8px] tracking-wider text-amber-200/80 uppercase font-black flex items-center gap-0.5">
              <Trophy className="w-2.5 h-2.5 text-amber-400" /> TOP 1
            </span>
            <span className="text-xs font-black text-amber-300 font-mono mt-0.5">
              {profile.champion_rate}%
            </span>
          </div>
        );

      case 'avgRank':
        return (
          <div key={key} className="flex flex-col items-center justify-center px-2 py-0.5 border-r border-amber-500/20 last:border-r-0">
            <span className="text-[8px] tracking-wider text-amber-200/80 uppercase font-black flex items-center gap-0.5">
              <TrendingUp className="w-2.5 h-2.5 text-cyan-400" /> AVG
            </span>
            <span className="text-xs font-black text-cyan-300 font-mono mt-0.5">
              {profile.season_avg_rank}
            </span>
          </div>
        );

      case 'topCommanders':
        return (
          <div key={key} className="flex flex-col items-center justify-center px-2 py-0.5 last:border-r-0">
            <span className="text-[8px] tracking-wider text-amber-200/80 uppercase font-black mb-0.5">GO-TO</span>
            <div className="flex items-center gap-1">
              {(profile.top_commanders || []).slice(0, 3).map((cmdId) => {
                const cmd = findCommander(cmdId);
                return (
                  <div
                    key={cmdId}
                    className="w-5 h-5 rounded-full border border-amber-400/80 overflow-hidden bg-slate-900 flex items-center justify-center shadow-sm"
                    title={cmd?.name || cmdId}
                  >
                    {cmd?.avatar ? (
                      <img
                        src={cmd.avatar}
                        alt={cmd.name}
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-[7px] font-black text-amber-300">
                        {cmdId.slice(0, 2).toUpperCase()}
                      </span>
                    )}
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
    <div className="p-2 inline-flex flex-col items-start select-none font-sans bg-transparent">
      {/* 1. MATCH CARDS STRIP (Max 5, neatly grouped) */}
      {displayAvatars.length > 0 && (
        <div className="flex items-center gap-1.5 mb-1.5">
          {displayAvatars.map((match) => {
            const theme = getPlacementTheme(match.placement);
            const isFirst = match.placement === 1;

            return (
              <div key={match.id} className="flex flex-col items-center">
                <div
                  className={`relative w-8 h-10 rounded-[2px] overflow-hidden bg-[#060c18] border transition-all flex items-center justify-center ${theme.cardBorder}`}
                >
                  <img
                    src={match.commander.avatar}
                    alt={match.commander.name}
                    className="w-full h-full object-cover object-top z-10"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span className="absolute text-[8px] font-black text-amber-200/40 pointer-events-none">
                    {match.commander.name.slice(0, 2).toUpperCase()}
                  </span>

                  <div className={`absolute top-0 left-0 w-1.5 h-1.5 border-t border-l ${theme.cornerTrim} z-20 pointer-events-none`} />

                  {isFirst && (
                    <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 p-0.5 rounded-bl z-20">
                      <Crown className="w-2 h-2" />
                    </div>
                  )}
                </div>

                <span className={`text-[8px] font-black uppercase tracking-wider px-1 py-0 mt-0.5 rounded-[1px] border ${theme.badge}`}>
                  #{match.placement}
                </span>
                <div className={`w-full h-0.5 mt-0.5 ${theme.bar}`} />
              </div>
            );
          })}
        </div>
      )}

      {/* 2. COMPACT ESPORTS STATS BAR (Stream-fitted width) */}
      <div className="inline-flex items-center px-2 py-1 border border-amber-500/40 rounded bg-[#070e1ee6] shadow-lg backdrop-blur-md">
        {order.map((key) => renderWidget(key))}
      </div>
    </div>
  );
}