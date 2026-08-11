export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = process.env.BLOTATO_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'BLOTATO_API_KEY not set in environment' });

  const { slot, accountMapping, postingTime } = req.body;
  if (!slot || !accountMapping) return res.status(400).json({ error: 'slot and accountMapping required' });

  const POST_FIELD = {
    twitter:   'post_twitter_x',
    instagram: 'post_instagram',
    facebook:  'post_facebook',
    linkedin:  'post_linkedin',
  };

  // Platform → Blotato targetType
  const TARGET_TYPE = {
    twitter:   'twitter',
    instagram: 'instagram',
    facebook:  'facebook',
    linkedin:  'linkedin',
  };

  const results = {};

  for (const [platform, mapping] of Object.entries(accountMapping)) {
    if (!mapping?.accountId) continue;
    const text = slot[POST_FIELD[platform]] || slot.post || '';
    if (!text) continue;

    // Times from the UI are Eastern — add UTC-4 offset (EDT) so Blotato shows correct local time
    // 14:00 UTC = 10:00 AM EDT
    const rawTime = postingTime || slot.time || '14:00';
    const scheduledTime = `${slot.date}T${rawTime}:00-04:00`;

    // Build mediaUrls — Instagram needs an image
    const mediaUrls = [];
    if (platform === 'instagram' && slot.image_url) {
      mediaUrls.push(slot.image_url);
    }

    // Extract the URL from the post text (last URL found wins), trimming
    // any trailing punctuation Claude may have appended after it
    const urlMatch = text.match(/https?:\/\/\S+/g);
    const postUrl = urlMatch
      ? urlMatch[urlMatch.length - 1].replace(/[.,;:!?)\]}'"]+$/, '')
      : undefined;

    // Build target object per platform
    const target = { targetType: TARGET_TYPE[platform] };
    if ((platform === 'facebook' || platform === 'instagram') && mapping.pageId) {
      target.pageId = mapping.pageId;
    }
    if (platform === 'linkedin' && mapping.pageId) {
      target.pageId = mapping.pageId;
    }
    // Facebook's OG link-preview card comes from target.link (Blotato has no
    // equivalent field for LinkedIn — its card can only come from the bare
    // URL already present in the post text above)
    if (platform === 'facebook' && postUrl) {
      target.link = postUrl;
    }

    const body = {
      post: {
        accountId: mapping.accountId,
        content: {
          text,
          mediaUrls,
          platform: TARGET_TYPE[platform],
        },
        target,
      },
      scheduledTime,
    };

    try {
      const r = await fetch('https://backend.blotato.com/v2/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'blotato-api-key': apiKey },
        body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        results[platform] = { ok: true, postId: data?.id || data?.postId, scheduledTime };
      } else {
        results[platform] = { ok: false, error: data?.message || JSON.stringify(data) || 'Failed' };
      }
    } catch (err) {
      results[platform] = { ok: false, error: err.message };
    }
  }

  res.status(200).json(results);
}
