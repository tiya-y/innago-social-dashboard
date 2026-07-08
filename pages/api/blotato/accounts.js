export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const apiKey = process.env.BLOTATO_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'BLOTATO_API_KEY not set in environment' });

  try {
    const r = await fetch('https://backend.blotato.com/v2/users/me/accounts', {
      headers: { 'blotato-api-key': apiKey },
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.message || 'Blotato error' });

    // Normalize into { platform: [{ accountId, name, pages }] }
    const accounts = { twitter: [], instagram: [], facebook: [], linkedin: [] };
    const rawList = Array.isArray(data) ? data : (data?.data || data?.accounts || []);
    for (const acct of rawList) {
      const pl = (acct.platform || acct.type || '').toLowerCase();
      if (accounts[pl] !== undefined) {
        accounts[pl].push({
          accountId: acct.id || acct.accountId,
          name: acct.name || acct.username || acct.id,
          pages: acct.subaccounts || acct.pages || [],
        });
      }
    }
    res.status(200).json({ accounts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
