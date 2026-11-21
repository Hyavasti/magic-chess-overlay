/// <reference types="node" />
import { neon } from '@neondatabase/serverless';

export default async function handler(req: any, res: any) {
  const sql = neon(process.env.DATABASE_URL!);
  const streamerId = (req.query.streamerId || req.body?.streamer_id || 'default_streamer') as string;

  try {
    if (req.method === 'GET') {
      const rows = await sql`
        SELECT * FROM stream_matches 
        WHERE streamer_id = ${streamerId} 
        ORDER BY created_at DESC
      `;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { placement, commander_id } = req.body;
      const rows = await sql`
        INSERT INTO stream_matches (streamer_id, placement, commander_id)
        VALUES (${streamerId}, ${placement}, ${commander_id})
        RETURNING *
      `;
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'DELETE') {
      await sql`
        DELETE FROM stream_matches 
        WHERE streamer_id = ${streamerId}
      `;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Matches API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}