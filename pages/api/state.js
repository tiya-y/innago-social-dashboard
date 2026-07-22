import { getDb, ensureTable } from '../../lib/db';

export default async function handler(req, res) {
  try {
    await ensureTable();
    const sql = getDb();

    if (req.method === 'GET') {
      const rows = await sql`SELECT key, value FROM app_state`;
      const result = {};
      for (const row of rows) result[row.key] = row.value;
      return res.status(200).json(result);
    }

    if (req.method === 'POST') {
      const { key, value } = req.body;
      if (!key) return res.status(400).json({ error: 'key required' });
      await sql`
        INSERT INTO app_state (key, value, updated_at)
        VALUES (${key}, ${JSON.stringify(value)}::jsonb, NOW())
        ON CONFLICT (key) DO UPDATE
          SET value = EXCLUDED.value,
              updated_at = NOW()
      `;
      return res.status(200).json({ ok: true });
    }

    res.status(405).end();
  } catch (err) {
    console.error('state API error:', err);
    res.status(500).json({ error: err.message });
  }
}
