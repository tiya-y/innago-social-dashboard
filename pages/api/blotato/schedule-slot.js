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

    // Build mediaUrls — Instagram and Facebook both need an attached image.
    // Facebook specifically must NOT also get target.link when it has an image:
    // a Facebook post with both an attached image and a link makes Facebook
    // discard the image and show the linked page's own og:image instead (which,
    // for innago.com, is currently a broken sitewide default) — so the URL stays
    // as plain text in the caption instead of becoming a clickable link-preview
    // card. If there's no hero image at all, fall back to the link card so the
    // post isn't left with neither an image nor a clickable link.
    const mediaUrls = [];
    if ((platform === 'instagram' || platform === 'facebook') && slot.image_url) {
      mediaUrls.push(slot.image_url);
    }

    // Extract the URL from the post text (last URL found wins), trimming
    // any trailing punctuation Claude may have appended after it — only
    // needed for Facebook's image-less fallback below
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
    if (platform === 'facebook' && !slot.image_url && postUrl) {
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
