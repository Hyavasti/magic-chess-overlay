import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Sparkles, Lock, User, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface AuthProps {
  onAuthSuccess?: () => void;
}

// Internal domain used to satisfy Supabase Auth requirements seamlessly
const AUTH_DOMAIN = 'mcgg.com';

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Normalize username: lowercase, alphanumeric + underscores only
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (cleanUsername.length < 3) {
      setErrorMsg('Username must be at least 3 alphanumeric characters.');
      return;
    }

    if (isSignUp) {
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }

      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
    }

    setLoading(true);

    // Synthetic email mapped from username
    const internalEmail = `${cleanUsername}@${AUTH_DOMAIN}`;

    try {
      if (isSignUp) {
        // 1. Check if streamer_id already exists in streamer_profiles
        const { data: existingUser, error: checkError } = await supabase
          .from('streamer_profiles')
          .select('streamer_id')
          .eq('streamer_id', cleanUsername)
          .maybeSingle();

        if (checkError) {
          throw new Error('Failed to verify username availability. Please try again.');
        }

        if (existingUser) {
          throw new Error(`Username "${cleanUsername}" is already taken. Please choose another.`);
        }

        // 2. Register user in Supabase Auth
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: internalEmail,
          password,
        });

        if (authErr) {
          if (authErr.message.toLowerCase().includes('already registered')) {
            throw new Error(`Username "${cleanUsername}" is already taken.`);
          }
          throw authErr;
        }

        if (authData.user) {
          // 3. Create initial profile row using the username as the primary streamer_id
          const { error: profileErr } = await supabase.from('streamer_profiles').insert({
            streamer_id: cleanUsername,
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
            widget_order: [
              'currentRank',
              'sessionRecord',
              'starDelta',
              'winRate',
              'championRate',
              'avgRank',
              'historicalBest',
              'topCommanders',
            ],
          });

          if (profileErr) {
            console.error('[Auth] Profile creation error:', profileErr);
          }

          if (onAuthSuccess) onAuthSuccess();
        }
      } else {
        // Sign in using mapped username
        const { error: loginErr } = await supabase.auth.signInWithPassword({
          email: internalEmail,
          password,
        });

        if (loginErr) {
          throw new Error('Invalid username or password.');
        }

        if (onAuthSuccess) onAuthSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#06080F] text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-amber-500 selection:text-black">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#090f21] via-[#070c1a] to-[#040812] border border-amber-500/30 shadow-[0_4px_30px_rgba(0,0,0,0.8)] space-y-6">
        
        {/* Branding */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-700 p-0.5 shadow-lg">
            <div className="w-full h-full bg-[#070b16] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <div>
            <span className="text-[10px] tracking-[0.25em] uppercase text-cyan-300 font-extrabold">
              Magic Chess: Go Go
            </span>
            <h1 className="text-xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500">
              {isSignUp ? 'REGISTER STREAMER' : 'STREAMER STUDIO LOGIN'}
            </h1>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-600/60 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Username Field */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="e.g. hyavasti"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="w-full bg-[#050914] border border-amber-500/30 rounded-lg pl-9 pr-3 py-2 text-white font-mono placeholder-slate-600 outline-none focus:border-amber-400"
              />
            </div>
            {isSignUp && (
              <span className="text-[10px] text-slate-500 block">
                Your overlay will be: <code className="text-amber-400">/overlay/{username || 'username'}</code>
              </span>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#050914] border border-amber-500/30 rounded-lg pl-9 pr-10 py-2 text-white placeholder-slate-600 outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-amber-300 transition cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field (Sign Up Only) */}
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#050914] border border-amber-500/30 rounded-lg pl-9 pr-10 py-2 text-white placeholder-slate-600 outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-amber-300 transition cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition cursor-pointer"
          >
            <span>{loading ? 'Authenticating...' : isSignUp ? 'Create Streamer Profile' : 'Enter Studio'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Mode Toggle */}
        <div className="pt-2 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg(null);
              setPassword('');
              setConfirmPassword('');
            }}
            className="text-xs text-amber-300 hover:text-white transition font-medium cursor-pointer"
          >
            {isSignUp ? 'Already registered? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>

      </div>
    </div>
  );
}