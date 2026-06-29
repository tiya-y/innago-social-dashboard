export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = process.env.BLOTATO_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'BLOTATO_API_KEY not set in environment' });

  const { slot, accountMapping, postingTime } = req.body;
  if (!slot || !accountMapping) return res.status(400).json({ error: 'slot and accountMapping required' });

  const POST_FIELD = {
    twitter: 'post_twitter_x',
    instagram: 'post_instagram',
    facebook: 'post_facebook',
    linkedin: 'post_linkedin',
  };

  const results = {};

  for (const [platform, mapping] of Object.entries(accountMapping)) {
    if (!mapping?.accountId) continue;
    const text = slot[POST_FIELD[platform]] || slot.post || '';
    if (!text) continue;

    const scheduledTime = `${slot.date}T${postingTime || '09:00'}:00`;

    const body = {
      accountId: mapping.accountId,
      ...(mapping.pageId ? { pageId: mapping.pageId } : {}),
      platform,
      scheduledTime,
      post: { text },
    };

    if (platform === 'instagram' && slot.image_url) {
      body.post.mediaUrls = [slot.image_url];
    }

    try {
      const r = await fetch('https://app.blotato.com/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'blotato-api-key': apiKey },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (r.ok) {
        results[platform] = { ok: true, postId: data?.id || data?.postId, scheduledTime, accountId: mapping.accountId };
      } else {
        results[platform] = { ok: false, error: data?.message || 'Failed' };
      }
    } catch (err) {
      results[platform] = { ok: false, error: err.message };
    }
  }

  res.status(200).json(results);
}
