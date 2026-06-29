export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = process.env.BLOTATO_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'BLOTATO_API_KEY not set in environment' });

  const { postId } = req.body;
  if (!postId) return res.status(400).json({ error: 'postId required' });

  try {
    const r = await fetch(`https://app.blotato.com/api/posts/${postId}`, {
      method: 'DELETE',
      headers: { 'blotato-api-key': apiKey },
    });
    if (r.ok) return res.status(200).json({ ok: true });
    const data = await r.json().catch(() => ({}));
    res.status(r.status).json({ error: data?.message || 'Delete failed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
