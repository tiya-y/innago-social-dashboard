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
    const rawList = Array.isArray(data) ? data : (data?.items || data?.data || data?.accounts || []);

    // For Facebook and LinkedIn, fetch subaccounts to get pageId
    await Promise.all(rawList.map(async (acct) => {
      const pl = (acct.platform || acct.type || '').toLowerCase();
      if (accounts[pl] === undefined) return;

      let pages = acct.subaccounts || acct.pages || [];
      if ((pl === 'facebook' || pl === 'linkedin') && pages.length === 0) {
        try {
          const sub = await fetch(`https://backend.blotato.com/v2/users/me/accounts/${acct.id}/subaccounts`, {
            headers: { 'blotato-api-key': apiKey },
          });
          if (sub.ok) {
            const subData = await sub.json();
            pages = Array.isArray(subData) ? subData : (subData?.items || subData?.data || []);
          }
        } catch {}
      }

      accounts[pl].push({
        accountId: acct.id || acct.accountId,
        fullname: acct.fullname || acct.name || acct.username || acct.id,
        username: acct.username || acct.name || acct.id,
        pages: pages.map(p => ({ pageId: p.id || p.pageId, name: p.name || p.fullname || p.id })),
      });
    }));

    res.status(200).json({ accounts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
