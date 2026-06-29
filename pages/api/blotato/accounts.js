export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const apiKey = process.env.BLOTATO_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'BLOTATO_API_KEY not set in environment' });

  try {
    const r = await fetch('https://app.blotato.com/api/social-accounts', {
      headers: { 'blotato-api-key': apiKey },
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.message || 'Blotato error' });

    // Normalize into { platform: [{ accountId, name, pages }] }
    const accounts = { twitter: [], instagram: [], facebook: [], linkedin: [] };
    for (const acct of data?.data || data?.accounts || []) {
      const pl = acct.platform?.toLowerCase();
      if (accounts[pl]) {
        accounts[pl].push({
          accountId: acct.accountId || acct.id,
          name: acct.name || acct.username || acct.accountId,
          pages: acct.pages || [],
        });
      }
    }
    res.status(200).json({ accounts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
