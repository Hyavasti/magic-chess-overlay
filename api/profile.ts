/// <reference types="node" />
import { neon } from '@neondatabase/serverless';

function toPgArray(arr: unknown): string {
  if (!Array.isArray(arr) || arr.length === 0) return '{}';
  const escaped = arr.map((item) => `"${String(item).replace(/"/g, '\\"')}"`);
  return `{${escaped.join(',')}}`;
}

export default async function handler(req: any, res: any) {
  const sql = neon(process.env.DATABASE_URL!);
  const streamerId = (req.query.streamerId || req.body?.streamer_id || 'default_streamer') as string;

  try {
    if (req.method === 'GET') {
      const rows = await sql`
        SELECT * FROM streamer_profiles 
        WHERE streamer_id = ${streamerId} 
        LIMIT 1
      `;
      return res.status(200).json(rows[0] || null);
    }

    if (req.method === 'POST') {
      const p = req.body;
      const topCommandersPg = toPgArray(p.top_commanders);
      const widgetOrderPg = toPgArray(p.widget_order);

      const rows = await sql`
        INSERT INTO streamer_profiles (
          streamer_id, rank_tier, rank_division, rank_points,
          historical_tier, historical_stars, total_matches,
          season_win_rate, champion_rate, season_avg_rank,
          star_delta, top_commanders, enabled_widgets, widget_order, updated_at
        ) VALUES (
          ${streamerId}, ${p.rank_tier}, ${p.rank_division || ''}, ${p.rank_points},
          ${p.historical_tier}, ${p.historical_stars}, ${p.total_matches},
          ${p.season_win_rate}, ${p.champion_rate}, ${p.season_avg_rank},
          ${p.star_delta}, ${topCommandersPg}::text[],
          ${JSON.stringify(p.enabled_widgets)}::jsonb, ${widgetOrderPg}::text[], now()
        )
        ON CONFLICT (streamer_id) DO UPDATE SET
          rank_tier = EXCLUDED.rank_tier,
          rank_division = EXCLUDED.rank_division,
          rank_points = EXCLUDED.rank_points,
          historical_tier = EXCLUDED.historical_tier,
          historical_stars = EXCLUDED.historical_stars,
          total_matches = EXCLUDED.total_matches,
          season_win_rate = EXCLUDED.season_win_rate,
          champion_rate = EXCLUDED.champion_rate,
          season_avg_rank = EXCLUDED.season_avg_rank,
          star_delta = EXCLUDED.star_delta,
          top_commanders = EXCLUDED.top_commanders,
          enabled_widgets = EXCLUDED.enabled_widgets,
          widget_order = EXCLUDED.widget_order,
          updated_at = now()
        RETURNING *
      `;
      return res.status(200).json(rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Profile API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}