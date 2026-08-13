import { useState, useRef, useEffect } from 'react';
import { CATEGORIES, ALL_ARTICLES } from '../lib/articles';
import { RG_CATEGORIES, RG_ALL_ARTICLES } from '../lib/reigrove-articles';

// ── Design tokens ─────────────────────────────────────────────
const BLUE = '#2676FF';
const BLUE_BG = '#EFF4FF';
const BG = '#F7F9FF';
const BORDER = '#DDE3F0';
const TEXT = '#1a2340';
const MUTED = '#6b7280';
const GREEN = '#16a34a';
const RED = '#dc2626';
const YELLOW = '#ca8a04';

const PLATFORM_LABELS = { twitter: 'Twitter/X', instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn' };
const PLATFORM_COLORS = { twitter: '#000', instagram: '#E1306C', facebook: '#1877F2', linkedin: '#0A66C2' };
const POST_FIELD = { twitter: 'post_twitter_x', instagram: 'post_instagram', facebook: 'post_facebook', linkedin: 'post_linkedin' };
const CHAR_LIMITS = { twitter: 280, instagram: 2200, facebook: 63206, linkedin: 3000, universal: null };
const PLATFORMS_LIST = ['linkedin', 'twitter', 'instagram', 'facebook'];
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_OPTIONS = [
  '06:00','06:30','07:00','07:30','08:00','08:30','09:00','09:30',
  '10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30',
  '14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00',
];

function today() { return new Date().toISOString().slice(0, 10); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); }

// ── Calendar helpers ──────────────────────────────────────────
function getMonthGrid(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const y = d.getFullYear(), m = d.getMonth();
  const firstWd = (new Date(y, m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = Array(firstWd).fill(null);
  for (let i = 1; i <= daysInMonth; i++)
    cells.push(`${y}-${String(m+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`);
  return cells;
}
function getWeekDates(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - (d.getDay() + 6) % 7);
  return Array.from({length:7}, () => { const s = d.toISOString().slice(0,10); d.setDate(d.getDate()+1); return s; });
}
function shiftMonth(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00'); d.setMonth(d.getMonth() + n); d.setDate(1);
  return d.toISOString().slice(0,10);
}
function monthLabel(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleString('default', { month:'long', year:'numeric' });
}
function weekLabel(dateStr) {
  const days = getWeekDates(dateStr);
  const s = new Date(days[0]+'T00:00:00'), e = new Date(days[6]+'T00:00:00');
  return `${s.toLocaleString('default',{month:'short',day:'numeric'})} – ${e.toLocaleString('default',{month:'short',day:'numeric',year:'numeric'})}`;
}
function dayNameFromStr(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][d.getDay()===0?6:d.getDay()-1];
}
function shortDay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return DAY_NAMES[d.getDay()===0?6:d.getDay()-1];
}
function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2,'0')} ${period}`;
}
/** Best display label for a slot — topic override > single category > first of multi > first article > fallback */
function slotLabel(slot) {
  if (slot.topicOverride) return slot.topicOverride;
  if (slot.category)      return slot.category;
  if (slot.categories && slot.categories.length > 0 && slot.categories.length < Object.keys(CATEGORIES).length)
    return slot.categories.length === 1 ? slot.categories[0] : slot.categories[0];
  if (slot.articleUrl) {
    const slug = slot.articleUrl.replace(/^https?:\/\/innago\.com\//, '').replace(/\/$/, '');
    return slug.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()).slice(0,30);
  }
  return 'Innago Post';
}

/** ISO week key — e.g. "2026-W23" — used for per-week image assignment */
function isoWeekKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const weekStart = new Date(jan4);
  weekStart.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const week = Math.floor((d - weekStart) / (7 * 864e5)) + 1;
  return `${d.getFullYear()}-W${week}`;
}
let _uid = 0;
function uid() { return `slot-${Date.now()}-${++_uid}`; }

// ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [tab, setTab] = useState('config');
  const [brand, setBrand] = useState('innago'); // 'innago' | 'reigrove'

  // ── Custom slot builder ──────────────────────
  // A slot: { id, date, time, platforms: string[], category: string, topicOverride: string, articleUrl: string }
  const [customSlots, setCustomSlots] = useState([]);
  const [slotForm, setSlotForm] = useState({
    date: today(), time: '09:00', platforms: ['linkedin'], category: '', topicOverride: '', articleUrl: '',
  });
  const [recurForm, setRecurForm] = useState({
    startDate: today(), endDate: addDays(today(), 14),
    time: '11:00', days: [0,1,2,3],
    platforms: ['linkedin','twitter','facebook','instagram'],
    topicKeyword: '',
  });
  const [specificUrls, setSpecificUrls] = useState(['']);
  const [libraryOpen, setLibraryOpen] = useState(false);
  // ── Slot list filters ────────────────────────
  const [slotFilterFrom, setSlotFilterFrom] = useState('');
  const [slotFilterTo, setSlotFilterTo] = useState('');
  const [openCategory, setOpenCategory] = useState(null);
  const [scheduleView, setScheduleView] = useState('calendar');
  const [clearPostsConfirm, setClearPostsConfirm] = useState(false);
  const [calendarMode, setCalendarMode] = useState('month');
  const [calendarFocus, setCalendarFocus] = useState(today);
  const [reviewView, setReviewView] = useState('list');
  const [reviewCalMode, setReviewCalMode] = useState('month');
  const [reviewCalFocus, setReviewCalFocus] = useState(today);
  const [highlightedSlotId, setHighlightedSlotId] = useState(null);

  // ── Live article library ─────────────────────
  const [scrapedArticles, setScrapedArticles] = useState([]);  // from /api/scrape-articles
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [scrapeSource, setScrapeSource] = useState('');        // 'rss' | 'sitemap' | 'seed'

  // ── Generated images (per slot) ─────────────
  const [generatedImages, setGeneratedImages] = useState({});  // slotId → { html, loading }


  // Load all persisted data — Neon first, fall back to localStorage cache
  useEffect(() => {
    async function loadState() {
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          const db = await res.json();
          const set = (key, fn) => { if (db[key] != null) try { fn(db[key]); } catch {} };
          set('innago-custom-slots',    v => setCustomSlots(v));
          set('innago-schedule',        v => setSchedule(v));
          set('innago-posts',           v => setPosts(v));
          set('innago-schedule-status', v => setScheduleStatus(v));
          set('innago-account-mapping', v => setAccountMapping(v));
          set('innago-custom-articles', v => setCustomArticles(v));
          set('innago-approved-posts',  v => setApprovedPosts(v));
          set('innago-linkedin-manual', v => setLinkedinManual(v));
          set('innago-image-feedback',  v => setImageFeedbackHistory(v));
          set('innago-twitter-hooks',   v => setTwitterHooks(v));
          set('innago-used-articles',   v => setUsedArticleUrls(new Set(v)));
          set('social-studio-brand',    v => { if (v === 'reigrove' || v === 'innago') setBrand(v); });
          dbLoaded.current = true;
          return; // loaded from Neon — skip localStorage fallback
        }
      } catch {}
      // Fallback: localStorage (offline or DB unavailable)
      try {
        const slots    = localStorage.getItem('innago-custom-slots');
        const sched    = localStorage.getItem('innago-schedule');
        const postsStr = localStorage.getItem('innago-posts');
        const statStr  = localStorage.getItem('innago-schedule-status');
        const acctMap  = localStorage.getItem('innago-account-mapping');
        if (slots)    { try { setCustomSlots(JSON.parse(slots));        } catch {} }
        if (sched)    { try { setSchedule(JSON.parse(sched));            } catch {} }
        if (postsStr) { try { setPosts(JSON.parse(postsStr));            } catch {} }
        if (statStr)  { try { setScheduleStatus(JSON.parse(statStr));    } catch {} }
        if (acctMap)  { try { setAccountMapping(JSON.parse(acctMap));    } catch {} }
        const customArts  = localStorage.getItem('innago-custom-articles');
        if (customArts)  { try { setCustomArticles(JSON.parse(customArts));        } catch {} }
        const approvedStr = localStorage.getItem('innago-approved-posts');
        if (approvedStr) { try { setApprovedPosts(JSON.parse(approvedStr));        } catch {} }
        const linkedinManualStr = localStorage.getItem('innago-linkedin-manual');
        if (linkedinManualStr) { try { setLinkedinManual(JSON.parse(linkedinManualStr)); } catch {} }
        const imgFbStr    = localStorage.getItem('innago-image-feedback');
        if (imgFbStr)    { try { setImageFeedbackHistory(JSON.parse(imgFbStr));    } catch {} }
        const hooksStr    = localStorage.getItem('innago-twitter-hooks');
        if (hooksStr)    { try { setTwitterHooks(JSON.parse(hooksStr));            } catch {} }
        const usedStr     = localStorage.getItem('innago-used-articles');
        if (usedStr)     { try { setUsedArticleUrls(new Set(JSON.parse(usedStr))); } catch {} }
        const brandStr    = localStorage.getItem('social-studio-brand');
        if (brandStr === 'reigrove' || brandStr === 'innago') setBrand(brandStr);
      } catch {}
      dbLoaded.current = true;
    }
    loadState();
  }, []);

  const [accounts, setAccounts] = useState(null);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState('');
  const [accountMapping, setAccountMapping] = useState({
    twitter:   { accountId: '', pageId: '' },
    instagram: { accountId: '', pageId: '' },
    facebook:  { accountId: '', pageId: '' },
    linkedin:  { accountId: '', pageId: '' },
  });
  const [autoSchedule, setAutoSchedule] = useState(false);

  // ── Generation + review state ────────────────
  const [schedule, setSchedule] = useState(null);
  const [posts, setPosts] = useState({});
  const [scheduleStatus, setScheduleStatus] = useState({});
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [activePlatform, setActivePlatform] = useState('universal');
  const [approvedPosts, setApprovedPosts] = useState({});
  // LinkedIn is posted manually (Blotato has no reliable link-preview/scheduling
  // path for it) — this tracks per-slot confirmation that the post was copied
  // into LinkedIn's own scheduler. slotId -> { confirmedAt }
  const [linkedinManual, setLinkedinManual] = useState({});
  const [editingKey, setEditingKey] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);
  const [regeneratingId, setRegeneratingId] = useState(null);
  const [swapArticleSlotId, setSwapArticleSlotId] = useState(null);
  const abortRef = useRef(false);
  const dbLoaded = useRef(false); // guard: don't write to Neon until initial load completes

  // ── Custom articles (manually added to library) ──────────────
  const [newArticleUrl, setNewArticleUrl] = useState('');
  const [newArticleCategory, setNewArticleCategory] = useState('');
  const [customArticles, setCustomArticles] = useState([]);

  // ── Approved posts ───────────────────────────────────────────
  // (state declared above alongside activePlatform)

  // ── Image feedback loop ──────────────────────────────────────
  const [imgFeedbackSlotId, setImgFeedbackSlotId] = useState(null);
  const [imgFeedbackText, setImgFeedbackText] = useState('');
  const [imageFeedbackHistory, setImageFeedbackHistory] = useState([]);

  // ── Library ──────────────────────────────────────────────────
  const [libraryQuery, setLibraryQuery] = useState('');
  const [libraryExpandedId, setLibraryExpandedId] = useState(null);

  // ── Twitter hook variety tracking ───────────────────────────
  const [twitterHooks, setTwitterHooks] = useState([]);

  // ── Used articles tracking ───────────────────────────────────
  const [usedArticleUrls, setUsedArticleUrls] = useState(new Set());

  // ── Derived ──────────────────────────────────
  const doneCount = Object.keys(posts).length;
  const scheduledCount = Object.values(scheduleStatus).filter((s) =>
    s && !s._loading && Object.keys(s).length > 0 && Object.values(s).every((v) => v?.ok)
  ).length;
  const totalSlots = schedule?.length || 0;
  const blotatoReady = accounts && hasValidMapping();

  // ── Per-platform "done" status — LinkedIn is manual, everything else is Blotato ──
  const isPlatformDone = (slot, pl) =>
    pl === 'linkedin'
      ? !!linkedinManual[slot.id]?.confirmedAt
      : !!scheduleStatus[slot.id]?.[pl]?.ok;
  const allPlatformsDone = (slot) =>
    (slot.platforms || PLATFORMS_LIST).every(pl => isPlatformDone(slot, pl));

  // ── Blotato account loading ──────────────────
  const loadAccounts = async () => {
    setAccountsLoading(true);
    setAccountsError('');
    try {
      const res = await fetch('/api/blotato/accounts', {
        headers: {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load accounts');
      setAccounts(data.accounts);
      setAccounts(data.accounts);
      setAccountMapping(prev => {
        const mapping = { ...prev };
        for (const [platform, items] of Object.entries(data.accounts)) {
          if (items.length > 0 && !mapping[platform]?.accountId) {
            mapping[platform] = { accountId: items[0].accountId, pageId: items[0].pages?.[0]?.pageId || '' };
          }
        }
        return mapping;
      });
    } catch (e) {
      setAccountsError(e.message);
    } finally {
      setAccountsLoading(false);
    }
  };

  // ── Live article refresh ─────────────────────
  const refreshArticles = async () => {
    setIsRefreshing(true);
    setScrapeSource('');
    try {
      const res = await fetch('/api/scrape-articles?max=40');
      const data = await res.json();
      if (data.articles?.length > 0) {
        setScrapedArticles(data.articles);
        setScrapeSource(data.source);
      } else {
        setScrapeSource('seed');
      }
    } catch {
      setScrapeSource('seed');
    } finally {
      setIsRefreshing(false);
    }
  };


  // ── Add custom article to library ────────────
  const addCustomArticle = () => {
    const url = newArticleUrl.trim();
    if (!url) return;
    const slug = url.replace(/^https?:\/\/[^/]+\//, '').replace(/\/$/, '');
    const displayTitle = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const article = { url, displayTitle, category: newArticleCategory, slug, custom: true };
    setCustomArticles(prev => {
      const next = [...prev.filter(a => a.url !== url), article];
      try { localStorage.setItem('innago-custom-articles', JSON.stringify(next)); } catch {}
      return next;
    });
    setNewArticleUrl('');
  };

  // ── Slot management ──────────────────────────
  const addSlot = () => {
    if (!slotForm.date || !slotForm.platforms.length) return;
    setCustomSlots(p => [...p, { ...slotForm, id: uid() }]);
    setSlotForm(f => ({ ...f, topicOverride: '', articleUrl: '' }));
  };

  const removeSlot = (id) => setCustomSlots(p => p.filter(s => s.id !== id));

  const addRecurring = () => {
    const { startDate, endDate, time, days, platforms, topicKeyword } = recurForm;
    if (!startDate || !endDate || !days.length || !platforms.length) return;
    const cur = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const newSlots = [];
    let guard = 0;
    while (cur <= end && guard++ < 500) {
      const wd = cur.getDay() === 0 ? 6 : cur.getDay() - 1;
      if (days.includes(wd)) {
        newSlots.push({ id: uid(), date: cur.toISOString().slice(0,10), time, platforms: [...platforms], topicOverride: topicKeyword || '' });
      }
      cur.setDate(cur.getDate() + 1);
    }
    setCustomSlots(p => [...p, ...newSlots]);
  };

  const addSpecificSlots = () => {
    const urls = specificUrls.filter(u => u.trim());
    if (!urls.length) return;
    const newSlots = [];
    let cur = new Date(recurForm.startDate + 'T00:00:00');
    const usedDates = new Set();
    for (const url of urls) {
      // Find next Mon–Thu not already used by this batch
      let guard = 0;
      while (guard++ < 60) {
        const wd = cur.getDay(); // 0=Sun,1=Mon,...,6=Sat
        const dateStr = cur.toISOString().slice(0, 10);
        if (wd >= 1 && wd <= 4 && !usedDates.has(dateStr)) {
          usedDates.add(dateStr);
          newSlots.push({ id: uid(), date: dateStr, time: recurForm.time, platforms: [...recurForm.platforms], topicOverride: '', articleUrl: url });
          cur.setDate(cur.getDate() + 1);
          break;
        }
        cur.setDate(cur.getDate() + 1);
      }
    }
    setCustomSlots(p => [...p, ...newSlots]);
    setSpecificUrls(['']);
  };

  const toggleSlotPlatform = (setter, platforms, p) =>
    setter(f => ({ ...f, platforms: f.platforms.includes(p) ? f.platforms.filter(x=>x!==p) : [...f.platforms, p] }));

  // ── Generate ─────────────────────────────────
  // IDs already in the schedule (already generated or pending)
  const existingSlotIds = new Set((schedule || []).map(s => s.id));

  // Slots that haven't been generated yet
  const newCustomSlots = customSlots.filter(s => !existingSlotIds.has(s.id));

  const handleGenerate = async () => {
    if (!newCustomSlots.length) return;
    setGenerating(true);
    abortRef.current = false;
    setTab('review');

    // Sort only the NEW slots by date + time
    const sorted = [...newCustomSlots].sort((a, b) => (a.date+a.time).localeCompare(b.date+b.time));

    // No-repeat cycling: load previously used URLs from localStorage
    let prevUsed = new Set();
    try { prevUsed = new Set(JSON.parse(localStorage.getItem('innago-used-articles') || '[]')); } catch {}
    const usedThisRun = new Set();

    // ISO week tracking — seed with weeks already in the existing schedule
    const weeksSeen = new Set((schedule || []).map(s => isoWeekKey(s.date)));
    const igWeeksSeen = new Set(
      (schedule || [])
        .filter(s => !s.platforms || s.platforms.includes('instagram'))
        .map(s => isoWeekKey(s.date))
    );

    const newPlan = sorted.map((slot, i) => {
      let article;
      if (slot.articleUrl) {
        article = allArticles.find(a => a.url === slot.articleUrl) || {
          url: slot.articleUrl,
          category: slot.category || 'Custom',
          slug: slot.articleUrl.replace(/^https?:\/\/innago\.com\//, '').replace(/\/$/, ''),
          displayTitle: slot.articleUrl.replace(/^https?:\/\/innago\.com\//, '').replace(/\/$/, '').replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),
        };
      } else {
        const pool = slot.topicOverride
          ? (() => {
              const kw = slot.topicOverride.toLowerCase();
              const matched = allArticles.filter(a =>
                a.url.toLowerCase().includes(kw) ||
                (a.displayTitle || '').toLowerCase().includes(kw) ||
                (a.category || '').toLowerCase().includes(kw)
              );
              return matched.length >= 3 ? [...matched, ...allArticles].slice(0, Math.max(matched.length * 2, 20)) : allArticles;
            })()
          : slot.category && CATEGORIES[slot.category]
            ? allArticles.filter(a => a.category === slot.category)
            : allArticles;
        const fresh = pool.filter(a => !prevUsed.has(a.url) && !usedThisRun.has(a.url));
        const source = fresh.length > 0 ? fresh : pool.filter(a => !usedThisRun.has(a.url));
        const finalPool = source.length > 0 ? source : pool;
        article = finalPool[Math.floor(Math.random() * finalPool.length)];
      }
      usedThisRun.add(article.url);

      const wk = isoWeekKey(slot.date);
      const isFirstOfWeek = !weeksSeen.has(wk);
      if (isFirstOfWeek) weeksSeen.add(wk);

      // Enforce Instagram once per week
      let platforms = slot.platforms || ['linkedin', 'twitter', 'instagram', 'facebook'];
      const slotWk = isoWeekKey(slot.date);
      if (platforms.includes('instagram')) {
        if (igWeeksSeen.has(slotWk)) {
          platforms = platforms.filter(p => p !== 'instagram');
        } else {
          igWeeksSeen.add(slotWk);
        }
      }

      return { ...slot, platforms, day: dayNameFromStr(slot.date), article, boostedTopic: slot.topicOverride || '', isFirstOfWeek };
    });

    // Save used URLs
    try {
      const allUsed = [...new Set([...prevUsed, ...usedThisRun])];
      if (allUsed.length < allArticles.length * 0.8) {
        syncToDb('innago-used-articles', allUsed);
        setUsedArticleUrls(new Set(allUsed));
      } else {
        syncToDb('innago-used-articles', null);
        setUsedArticleUrls(new Set());
      }
    } catch {}

    // Merge new plan into existing schedule (sorted by date+time)
    const mergedSchedule = [...(schedule || []), ...newPlan]
      .sort((a, b) => (a.date+a.time).localeCompare(b.date+b.time));
    setSchedule(mergedSchedule);
    setProgress({ done: 0, total: newPlan.length });

    for (let i = 0; i < newPlan.length; i++) {
      if (abortRef.current) break;
      const slot = newPlan[i];
      let postData = null;
      try {
        const r = await fetch('/api/generate-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: slot.article.url, displayTitle: slot.article.displayTitle, description: slot.article.description || undefined, date: slot.date, boostedTopic: slot.boostedTopic || undefined, recentTwitterHooks: twitterHooks, brand }),
        });
        postData = await r.json();
        if (postData?.error) {
          setPosts(p => ({ ...p, [slot.id]: { error: postData.error, detail: postData.detail } }));
          setProgress({ done: i + 1, total: newPlan.length });
          continue;
        }
        setPosts(p => ({ ...p, [slot.id]: postData }));
        // Extract Twitter hook for variety tracking
        if (postData?.post_twitter_x) {
          const hook = postData.post_twitter_x.trim().split(/\s+/).slice(0, 5).join(' ').toLowerCase();
          setTwitterHooks(prev => {
            const next = [...prev, { hook, date: slot.date }];
            try { localStorage.setItem('innago-twitter-hooks', JSON.stringify(next)); } catch {}
            return next;
          });
        }
      } catch (err) {
        setPosts(p => ({ ...p, [slot.id]: { error: 'Network error', detail: err?.message || '' } }));
        setProgress({ done: i + 1, total: newPlan.length });
        continue;
      }
      // Auto-generate image for Instagram slots
      const needsImage = postData && !postData.error &&
        (!slot.platforms || slot.platforms.includes('instagram'));
      if (needsImage) {
        setGeneratedImages(prev => ({ ...prev, [slot.id]: { html: '', loading: true } }));
        try {
          const imgR = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: postData.title || slot.article?.displayTitle,
              summary: slot.article?.summary || '',
              content_type: slot.article?.content_type || 'blog post',
              url: slot.article?.url,
              templateIndex: i,
            }),
          });
          const imgData = await imgR.json();
          setGeneratedImages(prev => ({ ...prev, [slot.id]: { html: imgData.html || '', loading: false, template: imgData.template } }));
        } catch {
          setGeneratedImages(prev => ({ ...prev, [slot.id]: { html: '', loading: false, error: true } }));
        }
      }

      if (autoSchedule && hasValidMapping() && postData && !postData.error) {
        const statusRes = await scheduleSlot(slot.id, postData, mergedSchedule);
        setScheduleStatus(p => ({ ...p, [slot.id]: statusRes }));
      }
      setProgress({ done: i + 1, total: newPlan.length });
    }
    setGenerating(false);
  };
  // ensure generating always resets on unexpected throw
  const handleGenerateSafe = () => handleGenerate().catch(() => setGenerating(false));

  function hasValidMapping() {
    return Object.values(accountMapping).some((m) => m.accountId);
  }

  // ── Schedule a single slot ───────────────────
  const scheduleSlot = async (slotId, postData, planOverride) => {
    const src = planOverride || schedule;
    const slot = src?.find((s) => s.id === slotId);
    if (!slot || !postData) return {};
    try {
      const res = await fetch('/api/blotato/schedule-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot: { date: slot.date, ...postData },
          // LinkedIn is posted manually — never send it to Blotato
          accountMapping: Object.fromEntries(
            Object.entries(accountMapping).filter(([p, v]) =>
              p !== 'linkedin' && v.accountId && (!slot.platforms || slot.platforms.includes(p))
            )
          ),
          postingTime: slot.time || '09:00',
        }),
      });
      return await res.json();
    } catch (e) {
      return { error: e.message };
    }
  };

  const scheduleAll = async () => {
    if (!schedule) return;
    for (const slot of schedule) {
      const postData = posts[slot.id];
      if (!postData || postData.error) continue;
      setScheduleStatus(p => ({ ...p, [slot.id]: { _loading: true } }));
      const result = await scheduleSlot(slot.id, postData);
      setScheduleStatus(p => ({ ...p, [slot.id]: result }));
    }
  };

  // ── Unschedule a single platform post from Blotato ──
  const unschedulePost = async (slotId, platform) => {
    const platformStatus = scheduleStatus[slotId]?.[platform];
    if (!platformStatus) return;
    setScheduleStatus(p => ({ ...p, [slotId]: { ...p[slotId], [platform]: { ...platformStatus, _deleting: true } } }));
    try {
      const res = await fetch('/api/blotato/delete-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: platformStatus.postId || undefined,
          scheduledTime: platformStatus.scheduledTime || undefined,
          accountId: platformStatus.accountId || undefined,
          platform,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setScheduleStatus(p => ({ ...p, [slotId]: { ...p[slotId], [platform]: { ok: false, deleted: true } } }));
      } else {
        alert(`Could not remove from Blotato: ${data.error}\n\nPlease remove it manually at my.blotato.com`);
        setScheduleStatus(p => ({ ...p, [slotId]: { ...p[slotId], [platform]: { ...platformStatus, _deleting: false } } }));
      }
    } catch (e) {
      setScheduleStatus(p => ({ ...p, [slotId]: { ...p[slotId], [platform]: { ...platformStatus, _deleting: false } } }));
    }
  };

  // ── Unschedule all Blotato posts for a slot, then run callback ──
  const unscheduleSlotFromBlotato = async (slotId) => {
    const status = scheduleStatus[slotId];
    if (!status) return;
    const scheduled = Object.entries(status).filter(([, r]) => r?.ok && r?.postId);
    await Promise.all(scheduled.map(async ([platform, platformStatus]) => {
      try {
        await fetch('/api/blotato/delete-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId: platformStatus.postId,
            scheduledTime: platformStatus.scheduledTime,
            platform,
          }),
        });
      } catch {}
    }));
  };

  // ── Edit ─────────────────────────────────────
  const startEdit = (slotId, field) => { setEditingKey(`${slotId}::${field}`); setEditDraft(posts[slotId]?.[field] || ''); };
  const saveEdit = (slotId, field) => { setPosts(p => ({ ...p, [slotId]: { ...p[slotId], [field]: editDraft } })); setEditingKey(null); };

  const copyPost = (slotId, field, text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(`${slotId}::${field}`);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const regenerateSingle = async (slot) => {
    setRegeneratingId(slot.id);
    try {
      const r = await fetch('/api/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: slot.article.url, displayTitle: slot.article.displayTitle, description: slot.article.description || undefined, date: slot.date, boostedTopic: slot.boostedTopic || undefined, recentTwitterHooks: twitterHooks, brand }),
      });
      const postData = await r.json();
      setPosts(p => ({ ...p, [slot.id]: postData }));
      setScheduleStatus(p => ({ ...p, [slot.id]: undefined }));
      if (postData?.post_twitter_x) {
        const hook = postData.post_twitter_x.trim().split(/\s+/).slice(0, 5).join(' ').toLowerCase();
        setTwitterHooks(prev => {
          const next = [...prev, { hook, date: slot.date }];
          try { localStorage.setItem('innago-twitter-hooks', JSON.stringify(next)); } catch {}
          return next;
        });
      }
    } catch { /* keep existing */ } finally {
      setRegeneratingId(null);
    }
  };

  // ── Swap article on a slot ───────────────────
  const swapArticleAndRegenerate = async (slotId, newArticle) => {
    setSwapArticleSlotId(null);
    setSchedule(prev => prev.map(s => s.id === slotId ? { ...s, article: newArticle } : s));
    // Wait one tick for schedule state to settle, then regenerate with the updated slot
    const updatedSlot = schedule.find(s => s.id === slotId);
    if (!updatedSlot) return;
    const slotWithNewArticle = { ...updatedSlot, article: newArticle };
    setRegeneratingId(slotId);
    try {
      const r = await fetch('/api/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newArticle.url, displayTitle: newArticle.displayTitle, description: newArticle.description || undefined, date: slotWithNewArticle.date, boostedTopic: slotWithNewArticle.boostedTopic || undefined, recentTwitterHooks: twitterHooks, brand }),
      });
      const postData = await r.json();
      setPosts(p => ({ ...p, [slotId]: postData }));
      setScheduleStatus(p => ({ ...p, [slotId]: undefined }));
      if (postData?.post_twitter_x) {
        const hook = postData.post_twitter_x.trim().split(/\s+/).slice(0, 5).join(' ').toLowerCase();
        setTwitterHooks(prev => {
          const next = [...prev, { hook, date: slotWithNewArticle.date }];
          try { localStorage.setItem('innago-twitter-hooks', JSON.stringify(next)); } catch {}
          return next;
        });
      }
    } catch {} finally {
      setRegeneratingId(null);
    }
  };

  // ── Approve post ─────────────────────────────
  const approvePost = (slotId, platforms) => {
    const slot = schedule?.find(s => s.id === slotId);
    const articleUrl = slot?.article?.url;
    setApprovedPosts(prev => {
      const next = { ...prev, [slotId]: { platforms, approvedAt: new Date().toISOString() } };
      try { localStorage.setItem('innago-approved-posts', JSON.stringify(next)); } catch {}
      return next;
    });
    // Mark article as used when approved
    if (articleUrl) {
      try {
        const used = new Set(JSON.parse(localStorage.getItem('innago-used-articles') || '[]'));
        used.add(articleUrl);
        localStorage.setItem('innago-used-articles', JSON.stringify([...used]));
        setUsedArticleUrls(new Set(used));
      } catch {}
    }
  };

  // ── LinkedIn manual posting confirmation ─────
  // LinkedIn is copy/pasted into LinkedIn's own scheduler by hand, so a slot's
  // LinkedIn post is only "done" once this is explicitly confirmed here.
  const confirmLinkedinCopied = (slotId) => {
    setLinkedinManual(prev => {
      const next = { ...prev, [slotId]: { confirmedAt: new Date().toISOString() } };
      try { localStorage.setItem('innago-linkedin-manual', JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const unconfirmLinkedinCopied = (slotId) => {
    setLinkedinManual(prev => {
      const next = { ...prev };
      delete next[slotId];
      try { localStorage.setItem('innago-linkedin-manual', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // ── AI Image generation ──────────────────────
  const generateImage = async (slot) => {
    const p = posts[slot.id];
    if (!p) return;
    setGeneratedImages(prev => ({ ...prev, [slot.id]: { html: '', loading: true } }));
    try {
      const r = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: p.title || slot.article?.displayTitle,
          summary: slot.article?.summary || '',
          content_type: slot.article?.content_type || 'blog post',
          url: slot.article?.url,
          templateIndex: schedule ? schedule.findIndex(s => s.id === slot.id) : undefined,
        }),
      });
      const data = await r.json();
      setGeneratedImages(prev => ({ ...prev, [slot.id]: { html: data.html || '', loading: false, template: data.template } }));
    } catch {
      setGeneratedImages(prev => ({ ...prev, [slot.id]: { html: '', loading: false, error: true } }));
    }
  };

  // ── AI Image generation with feedback ────────
  const generateImageWithFeedback = async (slot, feedback) => {
    const p = posts[slot.id];
    if (!p) return;
    setGeneratedImages(prev => ({ ...prev, [slot.id]: { html: '', loading: true } }));
    try {
      const r = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: p.title || slot.article?.displayTitle,
          summary: slot.article?.summary || '',
          content_type: slot.article?.content_type || 'blog post',
          url: slot.article?.url,
          templateIndex: schedule ? schedule.findIndex(s => s.id === slot.id) : undefined,
          feedback: feedback || undefined,
          feedbackHistory: imageFeedbackHistory.length > 0 ? imageFeedbackHistory : undefined,
        }),
      });
      const data = await r.json();
      setGeneratedImages(prev => ({ ...prev, [slot.id]: { html: data.html || '', loading: false, template: data.template } }));
    } catch {
      setGeneratedImages(prev => ({ ...prev, [slot.id]: { html: '', loading: false, error: true } }));
    }
  };

  // ── Export CSV ───────────────────────────────
  const exportCSV = () => {
    if (!schedule) return;
    const headers = ['date','day','time','platforms','boosted_topic','category','source_title','source_url',
      'post','post_linkedin','post_facebook','post_twitter_x','post_instagram'];
    const rows = schedule.map((slot) => {
      const p = posts[slot.id] || {};
      return [
        slot.date, slot.day, slot.time||'', (slot.platforms||[]).join(';'),
        slot.boostedTopic||'', slot.article.category,
        p.title||slot.article.displayTitle, slot.article.url,
        p.post||'', p.post_linkedin||'', p.post_facebook||'', p.post_twitter_x||'', p.post_instagram||'',
      ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(',');
    });
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `innago-social-${schedule[0]?.date||'export'}.csv` });
    a.click();
  };

  // ── LinkedIn batch — approved LinkedIn posts not yet copied over, for manual scheduling ──
  const linkedinBatchRows = (schedule || [])
    .filter(slot => (slot.platforms || PLATFORMS_LIST).includes('linkedin'))
    .filter(slot => approvedPosts[slot.id]?.platforms?.includes('linkedin'))
    .filter(slot => !linkedinManual[slot.id]?.confirmedAt)
    .filter(slot => posts[slot.id] && !posts[slot.id].error)
    .sort((a, b) => a.date.localeCompare(b.date));

  const exportLinkedinBatchCSV = () => {
    if (linkedinBatchRows.length === 0) return;
    const headers = ['date', 'time', 'article_title', 'article_url', 'linkedin_post'];
    const rows = linkedinBatchRows.map(slot => {
      const p = posts[slot.id] || {};
      return [
        slot.date, slot.time || '',
        p.title || slot.article?.displayTitle || '', slot.article?.url || '',
        p.post_linkedin || p.post || '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `linkedin-batch-${linkedinBatchRows[0]?.date || today()}.csv`,
    });
    a.click();
  };

  // ── Scroll to highlighted slot in Review tab ─
  useEffect(() => {
    if (!highlightedSlotId || tab !== 'review') return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`slot-card-${highlightedSlotId}`);
      if (el) {
        el.scrollIntoView({ behavior:'smooth', block:'center' });
        el.style.transition = 'box-shadow 0.3s';
        el.style.boxShadow = `0 0 0 3px ${BLUE}`;
        setTimeout(() => { el.style.boxShadow = ''; setHighlightedSlotId(null); }, 2000);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [highlightedSlotId, tab]);

  // ── Persist state — write to Neon + localStorage cache ────────
  const syncToDb = (key, value) => {
    if (!dbLoaded.current) return; // block writes until initial load finishes
    // localStorage cache (instant, works offline)
    try {
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {}
    // Neon (async, authoritative)
    fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    }).catch(() => {});
  };

  useEffect(() => { syncToDb('innago-custom-slots', customSlots); }, [customSlots]);

  useEffect(() => {
    syncToDb('innago-schedule', schedule);
    syncToDb('innago-posts', posts);
    syncToDb('innago-schedule-status', scheduleStatus);
  }, [schedule, posts, scheduleStatus]);

  useEffect(() => { syncToDb('innago-account-mapping', accountMapping); }, [accountMapping]);
  useEffect(() => { syncToDb('innago-custom-articles', customArticles); }, [customArticles]);
  useEffect(() => { syncToDb('innago-approved-posts', approvedPosts); }, [approvedPosts]);
  useEffect(() => { syncToDb('innago-linkedin-manual', linkedinManual); }, [linkedinManual]);
  useEffect(() => { syncToDb('innago-image-feedback', imageFeedbackHistory); }, [imageFeedbackHistory]);
  useEffect(() => { syncToDb('innago-twitter-hooks', twitterHooks); }, [twitterHooks]);
  useEffect(() => { syncToDb('social-studio-brand', brand); }, [brand]);

  // ── Calendar label — uses article category from generated schedule if available ──
  const calendarLabel = (slot) => {
    const schedSlot = schedule?.find(s => s.id === slot.id);
    if (schedSlot?.article?.category) return schedSlot.article.category;
    if (schedSlot?.boostedTopic)      return schedSlot.boostedTopic;
    return slotLabel(slot);
  };

  // ── Sorted slot list for display ─────────────
  const sortedCustomSlots = [...customSlots].sort((a, b) => (a.date+a.time).localeCompare(b.date+b.time));

  // ── Brand tokens (switches on toggle) ────────
  const isRG = brand === 'reigrove';
  const P    = isRG ? '#57823C' : BLUE;       // primary color
  const PBG  = isRG ? '#EAF0E8' : BLUE_BG;   // primary light bg
  const PBORDER = isRG ? '#C8E0B8' : BORDER;  // primary border tint
  const PAGE_BG  = isRG ? '#F5F7F5' : BG;
  const pBtn = { padding:'9px 20px', borderRadius:8, border:'none', background:P, color:'#fff', fontWeight:600, fontSize:14, cursor:'pointer' };

  // ── Brand-aware article sources ───────────────
  const ACTIVE_CATEGORIES = isRG ? RG_CATEGORIES : CATEGORIES;
  const ACTIVE_ALL_ARTICLES = isRG ? RG_ALL_ARTICLES : ALL_ARTICLES;
  // For REI Grove, scraped articles are not applicable — use seed + custom only
  const activeScrapped = isRG ? [] : scrapedArticles;
  const allArticles = (() => {
    const seen = new Set(activeScrapped.map(a => a.url));
    const staticFallback = ACTIVE_ALL_ARTICLES.filter(a => !seen.has(a.url));
    const customFiltered = customArticles.filter(a => !seen.has(a.url) && !ACTIVE_ALL_ARTICLES.some(s => s.url === a.url));
    return [...activeScrapped, ...customFiltered, ...staticFallback];
  })();

  return (
    <div style={{ minHeight: '100vh', background: PAGE_BG, fontFamily: "'Inter',-apple-system,sans-serif" }}>

      {/* ── Header ─────────────────────────────── */}
      <header style={{ background:'#fff', borderBottom:`1px solid ${BORDER}`, padding:'0 28px',
        display:'flex', alignItems:'center', height:58, position:'sticky', top:0, zIndex:100, gap:12 }}>
        <Logo />
        <span style={{ fontWeight:700, fontSize:15, color:TEXT }}>Social Studio</span>

        <nav style={{ display:'flex', gap:2, marginLeft:32 }}>
          {[
            ['config', `Input${customSlots.length > 0 ? ` (${customSlots.length})` : ''}`],
            ['review', `Approve${schedule ? ` (${doneCount}/${totalSlots})` : ''}`],
            ['library', `History${Object.keys(approvedPosts).length > 0 ? ` (${Object.keys(approvedPosts).length})` : ''}`],
            ['blotato', 'Settings'],
          ].map(([t, label]) => (
            <TabBtn key={t} active={tab===t} onClick={() => { setTab(t); setClearPostsConfirm(false); }} color={P}>{label}</TabBtn>
          ))}
        </nav>

        <div style={{ marginLeft:'auto', display:'flex', gap:10, alignItems:'center' }}>
          {/* Brand toggle */}
          <div style={{ display:'flex', alignItems:'center', background:'#f1f3f5', borderRadius:999, padding:3, gap:2, border:`1px solid ${BORDER}` }}>
            <button onClick={()=>setBrand('innago')}
              style={{ padding:'5px 14px', borderRadius:999, border:'none', cursor:'pointer', fontWeight:600, fontSize:12, transition:'all 0.15s',
                background: !isRG ? BLUE : 'transparent',
                color: !isRG ? '#fff' : MUTED }}>
              Innago
            </button>
            <button onClick={()=>setBrand('reigrove')}
              style={{ padding:'5px 14px', borderRadius:999, border:'none', cursor:'pointer', fontWeight:600, fontSize:12, transition:'all 0.15s',
                background: isRG ? '#57823C' : 'transparent',
                color: isRG ? '#fff' : MUTED }}>
              REI Grove
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth:1160, margin:'0 auto', padding:'28px 24px' }}>

        {/* ══ CONFIGURE TAB ═════════════════════ */}
        {tab==='config' && (
          <div style={{ display:'flex', flexDirection:'column', gap:22 }}>

            {/* ── Slot list / Calendar ── */}
            <div style={{ background:'#fff', border:`1px solid ${BORDER}`, borderRadius:12, padding:24 }}>
              {/* Header with view toggles */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <h3 style={{ margin:0, fontSize:15, fontWeight:600, color:TEXT }}>
                  Your Schedule {customSlots.length > 0 && `(${customSlots.length} slot${customSlots.length!==1?'s':''})`}
                </h3>
                <div style={{ display:'flex', gap:4 }}>
                  {['list','calendar'].map(v=>(
                    <button key={v} onClick={()=>setScheduleView(v)}
                      style={{ padding:'5px 12px', borderRadius:6, cursor:'pointer', fontSize:12,
                        border:`1px solid ${scheduleView===v?P:BORDER}`,
                        background:scheduleView===v?PBG:'#fff',
                        color:scheduleView===v?P:MUTED, fontWeight:scheduleView===v?600:400 }}>
                      {v==='list'?'List':'Calendar'}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── LIST VIEW ── */}
              {scheduleView === 'list' && (
                <>
                  {customSlots.length > 0 && (
                    <div style={{ display:'flex', gap:8, marginBottom:12, alignItems:'center' }}>
                      <span style={{ fontSize:12, color:MUTED, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', flexShrink:0 }}>Filter:</span>
                      <input type="date" value={slotFilterFrom} onChange={e=>setSlotFilterFrom(e.target.value)}
                        style={{ ...input, fontSize:12, padding:'5px 8px' }} />
                      <span style={{ color:MUTED, fontSize:13 }}>–</span>
                      <input type="date" value={slotFilterTo} onChange={e=>setSlotFilterTo(e.target.value)}
                        style={{ ...input, fontSize:12, padding:'5px 8px' }} />
                      {(slotFilterFrom || slotFilterTo) && (
                        <button onClick={()=>{setSlotFilterFrom('');setSlotFilterTo('');}}
                          style={{ background:'none', border:'none', cursor:'pointer', color:MUTED, fontSize:18, padding:'0 2px', lineHeight:1 }}>×</button>
                      )}
                    </div>
                  )}
                  {customSlots.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'48px 0', color:MUTED }}>
                      <div style={{ fontSize:36, marginBottom:10 }}>📅</div>
                      <p style={{ fontSize:14, margin:0, lineHeight:1.6 }}>No slots yet.<br/>Use Quick Add below to build your schedule.</p>
                    </div>
                  ) : (() => {
                    const filtered = sortedCustomSlots.filter(s =>
                      (!slotFilterFrom || s.date >= slotFilterFrom) &&
                      (!slotFilterTo   || s.date <= slotFilterTo)
                    );
                    return (
                      <div style={{ display:'flex', flexDirection:'column', gap:5, maxHeight:400, overflowY:'auto', paddingRight:4 }}>
                        {filtered.length === 0 && <p style={{ fontSize:13, color:MUTED, textAlign:'center', padding:'24px 0' }}>No slots match that date range.</p>}
                        {filtered.map(slot => (
                          <div key={slot.id} style={{ display:'flex', alignItems:'center', gap:8,
                            padding:'8px 10px', borderRadius:8, background:BG, fontSize:13 }}>
                            <span style={{ fontWeight:600, color:TEXT, minWidth:80 }}>{slot.date}</span>
                            <span style={{ color:MUTED, minWidth:70 }}>{formatTime(slot.time)}</span>
                            <span style={{ color:MUTED, fontSize:12, minWidth:28 }}>{shortDay(slot.date)}</span>
                            <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                              {slot.platforms.map(p=>(
                                <span key={p} title={PLATFORM_LABELS[p]}
                                  style={{ width:8, height:8, borderRadius:'50%', background:PLATFORM_COLORS[p], display:'inline-block' }} />
                              ))}
                            </div>
                            <span style={{ color:MUTED, fontSize:12, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {slot.category || <em>any</em>}
                            </span>
                            {slot.articleUrl && (
                              <span title={allArticles.find(a=>a.url===slot.articleUrl)?.displayTitle || slot.articleUrl}
                                style={{ fontSize:11, background:'#f0fdf4', color:GREEN, padding:'1px 7px', borderRadius:8, flexShrink:0, maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                📄 {allArticles.find(a=>a.url===slot.articleUrl)?.displayTitle || 'Pinned'}
                              </span>
                            )}
                            {slot.topicOverride && (
                              <span style={{ fontSize:11, background:BLUE_BG, color:BLUE, padding:'1px 7px', borderRadius:8, flexShrink:0 }}>
                                {slot.topicOverride}
                              </span>
                            )}
                            <button onClick={()=>removeSlot(slot.id)}
                              style={{ background:'none', border:'none', cursor:'pointer', color:MUTED, fontSize:18, padding:'0 4px', lineHeight:1 }}>×</button>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </>
              )}

              {/* ── CALENDAR VIEW ── */}
              {scheduleView === 'calendar' && (
                <>
                  {/* Nav + mode toggle */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <button onClick={()=>setCalendarFocus(f => calendarMode==='month' ? shiftMonth(f,-1) : addDays(f,-7))}
                        style={{ ...outlineBtn, padding:'4px 10px', fontSize:15 }}>‹</button>
                      <span style={{ fontWeight:600, fontSize:14, minWidth:200, textAlign:'center' }}>
                        {calendarMode==='month' ? monthLabel(calendarFocus) : weekLabel(calendarFocus)}
                      </span>
                      <button onClick={()=>setCalendarFocus(f => calendarMode==='month' ? shiftMonth(f,1) : addDays(f,7))}
                        style={{ ...outlineBtn, padding:'4px 10px', fontSize:15 }}>›</button>
                    </div>
                    <div style={{ display:'flex', gap:4 }}>
                      {['month','week'].map(m=>(
                        <button key={m} onClick={()=>setCalendarMode(m)}
                          style={{ padding:'4px 12px', borderRadius:6, cursor:'pointer', fontSize:12,
                            border:`1px solid ${calendarMode===m?BLUE:BORDER}`,
                            background:calendarMode===m?BLUE_BG:'#fff',
                            color:calendarMode===m?BLUE:MUTED, fontWeight:calendarMode===m?600:400 }}>
                          {m==='month'?'Month':'Week'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Month grid — headers are row 1 of the same grid so they always align */}
                  {calendarMode === 'month' && (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
                      {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>(
                        <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:600, color:MUTED, padding:'4px 0 6px' }}>{d}</div>
                      ))}
                      {getMonthGrid(calendarFocus).map((dateStr, i) => {
                        if (!dateStr) return <div key={`e${i}`} style={{ minHeight:60 }} />;
                        const daySlots = sortedCustomSlots.filter(s => s.date === dateStr);
                        const isToday = dateStr === today();
                        const uniquePlatforms = [...new Set(daySlots.flatMap(s=>s.platforms||[]))];
                        return (
                          <div key={dateStr}
                            onClick={daySlots.length > 0 ? ()=>{
                              setHighlightedSlotId(daySlots[0].id);
                              if (schedule) setTab('review');
                            } : undefined}
                            style={{ minHeight:60, borderRadius:6, padding:'4px 6px',
                              border:`1px solid ${isToday?BLUE:daySlots.length>0?BORDER:'#f3f4f6'}`,
                              background: isToday?BLUE_BG : daySlots.length>0?'#fff':'#fafafa',
                              cursor: daySlots.length>0?'pointer':'default' }}>
                            <div style={{ fontSize:11, fontWeight:isToday?700:400, color:isToday?BLUE:'#9ca3af', textAlign:'right' }}>
                              {new Date(dateStr+'T00:00:00').getDate()}
                            </div>
                            {daySlots.map(slot => {
                              const chipColor = slot.platforms?.[0] ? PLATFORM_COLORS[slot.platforms[0]] : BLUE;
                              const label = calendarLabel(slot);
                              return (
                                <div key={slot.id} style={{ display:'flex', alignItems:'center', gap:2,
                                  marginTop:2, padding:'2px 4px', borderRadius:3,
                                  background:chipColor+'15', border:`1px solid ${chipColor}33` }}>
                                  <span style={{ fontSize:9, color:chipColor, fontWeight:600,
                                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, lineHeight:1.3 }}>
                                    {label}
                                  </span>
                                  <button onClick={e=>{e.stopPropagation(); removeSlot(slot.id);}}
                                    style={{ background:'none', border:'none', cursor:'pointer',
                                      color:chipColor, fontSize:11, padding:0, lineHeight:1, flexShrink:0, opacity:0.8 }}>
                                    ×
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Week grid — headers are row 1 of the same grid so they always align */}
                  {calendarMode === 'week' && (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
                      {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>(
                        <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:600, color:MUTED, padding:'4px 0 6px' }}>{d}</div>
                      ))}
                      {getWeekDates(calendarFocus).map(dateStr => {
                        const daySlots = sortedCustomSlots.filter(s => s.date === dateStr);
                        const isToday = dateStr === today();
                        const d = new Date(dateStr+'T00:00:00');
                        return (
                          <div key={dateStr} style={{ minHeight:110, borderRadius:8, padding:'6px 8px',
                            border:`1px solid ${isToday?BLUE:BORDER}`,
                            background: isToday?BLUE_BG:'#fafafa' }}>
                            <div style={{ fontSize:11, fontWeight:600, color:isToday?BLUE:MUTED,
                              marginBottom:6, textAlign:'center' }}>
                              {d.toLocaleString('default',{month:'short'})} {d.getDate()}
                            </div>
                            {daySlots.flatMap(slot =>
                              (slot.platforms || [PLATFORMS_LIST[0]]).map(platform => ({
                                slotId: slot.id, platform, time: slot.time,
                                label: calendarLabel(slot),
                                color: PLATFORM_COLORS[platform],
                              }))
                            ).map((item) => (
                              <div key={`${item.slotId}-${item.platform}`}
                                onClick={()=>{ setHighlightedSlotId(item.slotId); if (schedule) setTab('review'); }}
                                style={{ position:'relative', borderRadius:5, marginBottom:3, cursor:'pointer',
                                  padding:'4px 20px 4px 7px',
                                  border:`1.5px solid ${item.color}`,
                                  background: item.color + '12' }}>
                                <div style={{ fontSize:10, fontWeight:700, color:item.color,
                                  textTransform:'uppercase', letterSpacing:'0.04em', lineHeight:1.2, marginBottom:1 }}>
                                  {PLATFORM_LABELS[item.platform]}
                                </div>
                                <div style={{ fontSize:11, fontWeight:600, color:'#1a2340',
                                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.3 }}>
                                  {item.label}
                                </div>
                                <div style={{ fontSize:10, color:MUTED }}>{formatTime(item.time)}</div>
                                <button onClick={e=>{e.stopPropagation(); removeSlot(item.slotId);}}
                                  style={{ position:'absolute', top:3, right:4, background:'none', border:'none',
                                    cursor:'pointer', color:item.color, fontSize:13, padding:0, lineHeight:1, opacity:0.8 }}>
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {customSlots.length > 0 && (
                <button onClick={()=>setCustomSlots([])}
                  style={{ ...outlineBtn, marginTop:12, width:'100%', fontSize:13, color:RED, borderColor:RED }}>
                  Clear all slots
                </button>
              )}
            </div>

            {/* ── Article Library (collapsible panel) ── */}
            <div style={{ background:'#fff', border:`1px solid ${isRG ? '#C8E0B8' : BORDER}`, borderRadius:12, overflow:'hidden',
              boxShadow: isRG ? `0 0 0 2px ${PBG}` : 'none' }}>
              {/* Branded library header bar */}
              <div style={{ background: isRG ? 'linear-gradient(135deg,#26463D,#1E4D37)' : BLUE, padding:'8px 18px',
                display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#fff', letterSpacing:'0.07em', textTransform:'uppercase', opacity:0.85 }}>
                  {isRG ? '🌿 REI Grove' : '🏠 Innago'} Article Library
                </span>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.65)', marginLeft:'auto' }}>
                  {allArticles.length} articles
                </span>
              </div>
              {/* Header row */}
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 18px', flexWrap:'wrap' }}>
                <span style={{ fontSize:14, fontWeight:600, color:TEXT }}>
                  {isRG ? 'REI Grove Content' : 'Innago Blog'}
                </span>
                <span style={{ fontSize:13, color:MUTED }}>
                  {activeScrapped.length > 0
                    ? `${allArticles.length} articles (${activeScrapped.length} live + ${ACTIVE_ALL_ARTICLES.length - (allArticles.length - activeScrapped.length)} seed)`
                    : `${ACTIVE_ALL_ARTICLES.length} seed articles`}
                </span>
                {/* Used/remaining cycle counter */}
                {(() => {
                  const total = allArticles.length;
                  const used = allArticles.filter(a => usedArticleUrls.has(a.url)).length;
                  const remaining = total - used;
                  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
                  return (
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:4 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, background: used > 0 ? '#fff7ed' : BLUE_BG,
                        border:`1px solid ${used > 0 ? '#fed7aa' : BORDER}`, borderRadius:999,
                        padding:'3px 10px', fontSize:12 }}>
                        <span style={{ color: used > 0 ? '#c2410c' : MUTED }}>
                          {used} used
                        </span>
                        <span style={{ color:BORDER }}>·</span>
                        <span style={{ color: remaining < 20 ? RED : GREEN, fontWeight:600 }}>
                          {remaining} left
                        </span>
                        <span style={{ color:MUTED }}>/ {total}</span>
                      </div>
                      {used > 0 && (
                        <div style={{ width:64, height:6, background:BORDER, borderRadius:999, overflow:'hidden' }}>
                          <div style={{ width:`${pct}%`, height:'100%', background: pct > 80 ? RED : pct > 50 ? YELLOW : GREEN, borderRadius:999, transition:'width 0.3s' }} />
                        </div>
                      )}
                      {used > 0 && (
                        <button onClick={() => {
                          localStorage.removeItem('innago-used-articles');
                          setUsedArticleUrls(new Set());
                        }} style={{ background:'none', border:'none', cursor:'pointer', color:MUTED, fontSize:11, padding:0, textDecoration:'underline' }}>
                          reset
                        </button>
                      )}
                    </div>
                  );
                })()}
                <button onClick={() => setLibraryOpen(o => !o)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:MUTED, fontSize:13, padding:'2px 6px', marginLeft:4 }}>
                  {libraryOpen ? '▲' : '▼'}
                </button>
                <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                  {scrapedArticles.length > 0 && (
                    <button onClick={()=>{setScrapedArticles([]);setScrapeSource('');}}
                      style={{ ...outlineBtn, fontSize:12, padding:'5px 12px' }}>
                      Clear Live
                    </button>
                  )}
                  <button onClick={refreshArticles} disabled={isRefreshing}
                    style={{ ...outlineBtn, color:P, borderColor:P, opacity:isRefreshing?0.6:1, fontSize:12, padding:'5px 12px' }}>
                    {isRefreshing ? 'Scraping…' : '↻ Refresh Articles'}
                  </button>
                </div>
              </div>
              {/* Expanded content */}
              {libraryOpen && (
                <div style={{ borderTop:`1px solid ${BORDER}`, padding:'12px 18px 16px' }}>
                  {/* Add article form */}
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:14, padding:'10px 14px',
                    background:PBG, borderRadius:8, border:`1px solid ${PBORDER}` }}>
                    <input
                      type="url"
                      placeholder="https://innago.com/your-article/"
                      value={newArticleUrl}
                      onChange={e => setNewArticleUrl(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addCustomArticle()}
                      style={{ ...input, flex:1, fontSize:13, padding:'7px 10px' }}
                    />
                    <select
                      value={newArticleCategory}
                      onChange={e => setNewArticleCategory(e.target.value)}
                      style={{ ...input, width:'auto', fontSize:13, padding:'7px 10px', flexShrink:0 }}
                    >
                      {Object.keys(ACTIVE_CATEGORIES).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <button onClick={addCustomArticle}
                      style={{ ...pBtn, fontSize:13, padding:'7px 18px', flexShrink:0 }}>
                      Add
                    </button>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                    {Object.entries(ACTIVE_CATEGORIES).map(([cat, urls]) => {
                      const catArticles = allArticles.filter(a => a.category === cat);
                      const displayArticles = catArticles.length > 0 ? catArticles : urls.map(url => {
                        const slug = url.replace(/^https?:\/\/[^/]+\//, '').replace(/\/$/, '');
                        return { url, category: cat, displayTitle: slug.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) };
                      });
                      const isOpen = openCategory === cat;
                      return (
                        <div key={cat} style={{ borderRadius:8, border:`1px solid ${BORDER}`, overflow:'hidden' }}>
                          <button onClick={() => setOpenCategory(isOpen ? null : cat)}
                            style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                              padding:'9px 14px', background:isOpen?PBG:'#fff', border:'none', cursor:'pointer',
                              fontSize:13, fontWeight:isOpen?600:400, color:isOpen?P:TEXT }}>
                            <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <span style={{ width:7, height:7, borderRadius:'50%', background:isOpen?P:MUTED, display:'inline-block', flexShrink:0 }} />
                              {cat}
                            </span>
                            <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                              {(() => {
                                const usedInCat = displayArticles.filter(a => usedArticleUrls.has(a.url)).length;
                                return (
                                  <span style={{ fontSize:11, color:isOpen?BLUE:MUTED, fontWeight:400 }}>
                                    {displayArticles.length} articles{usedInCat > 0 ? ` · ${usedInCat} used` : ''}
                                  </span>
                                );
                              })()}
                              <span style={{ fontSize:12, color:isOpen?BLUE:MUTED }}>{isOpen ? '▲' : '▼'}</span>
                            </span>
                          </button>
                          {isOpen && (
                            <div style={{ padding:'8px 14px 12px', background:BG,
                              display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 16px' }}>
                              {displayArticles.map(a => {
                                const isUsed = usedArticleUrls.has(a.url);
                                return (
                                <a key={a.url} href={a.url} target="_blank" rel="noreferrer"
                                  style={{ fontSize:12, color: isUsed ? MUTED : BLUE, textDecoration: isUsed ? 'line-through' : 'none',
                                    lineHeight:1.5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                                    opacity: isUsed ? 0.5 : 1 }}
                                  title={`${a.displayTitle}${isUsed ? ' (used)' : ''}`}>
                                  {a.displayTitle}
                                </a>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Custom articles section */}
                  {customArticles.length > 0 && (
                    <div style={{ marginTop:12 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:MUTED, textTransform:'uppercase',
                        letterSpacing:'0.05em', marginBottom:8 }}>Custom Articles ({customArticles.length})</div>
                      {(() => {
                        const grouped = {};
                        customArticles.forEach(a => {
                          if (!grouped[a.category]) grouped[a.category] = [];
                          grouped[a.category].push(a);
                        });
                        return Object.entries(grouped).map(([cat, arts]) => (
                          <div key={cat} style={{ marginBottom:8 }}>
                            <div style={{ fontSize:11, fontWeight:600, color:MUTED, marginBottom:4 }}>{cat}</div>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 16px' }}>
                              {arts.map(a => (
                                <div key={a.url} style={{ display:'flex', alignItems:'center', gap:6 }}>
                                  <a href={a.url} target="_blank" rel="noreferrer"
                                    style={{ fontSize:12, color:BLUE, textDecoration:'none', lineHeight:1.5,
                                      flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                                    title={a.displayTitle}>
                                    {a.displayTitle}
                                  </a>
                                  <button onClick={() => setCustomArticles(prev => prev.filter(x => x.url !== a.url))}
                                    style={{ background:'none', border:'none', cursor:'pointer', color:MUTED, fontSize:14, padding:0, lineHeight:1, flexShrink:0 }}>×</button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Quick Add Recurring ── */}
            <div>
              <Card title="Schedule Posts">
                <p style={{ margin:'0 0 16px', fontSize:13, color:MUTED }}>
                  Add many slots at once across a date range — pick the days, time, platforms, and category.
                </p>

                {/* Date / time row */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:14 }}>
                  <Field label="Start date">
                    <input type="date" value={recurForm.startDate}
                      onChange={e => setRecurForm(f => ({ ...f, startDate: e.target.value, endDate: addDays(e.target.value, 14) }))}
                      style={input} />
                  </Field>
                  <Field label="End date">
                    <input type="date" value={recurForm.endDate} onChange={e=>setRecurForm(f=>({...f,endDate:e.target.value}))} style={input} />
                  </Field>
                  <Field label="Time (ET)">
                    <input type="time" value={recurForm.time} onChange={e=>setRecurForm(f=>({...f,time:e.target.value}))} style={input} />
                  </Field>
                </div>

                <Field label="Focus topic (optional)">
                  <input
                    type="text"
                    placeholder="e.g. taxes, finding tenants, lease signing…"
                    value={recurForm.topicKeyword || ''}
                    onChange={e => setRecurForm(f => ({ ...f, topicKeyword: e.target.value }))}
                    style={input}
                  />
                  <div style={{ fontSize:12, color:MUTED, marginTop:6 }}>
                    About half the posts will focus on articles matching this topic. Leave blank to pull from all categories.
                  </div>
                </Field>

                <Field label="Platforms">
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:4 }}>
                    {PLATFORMS_LIST.map(p => {
                      const on = recurForm.platforms.includes(p);
                      return (
                        <label key={p} style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer',
                          padding:'5px 12px', borderRadius:20, fontSize:13,
                          border:`1.5px solid ${on ? PLATFORM_COLORS[p] : BORDER}`,
                          background: on ? PLATFORM_COLORS[p]+'18' : '#fff',
                          color: on ? PLATFORM_COLORS[p] : '#374151', fontWeight: on ? 600 : 400 }}>
                          <input type="checkbox" checked={on}
                            onChange={()=>toggleSlotPlatform(setRecurForm, recurForm.platforms, p)}
                            style={{ display:'none' }} />
                          <span style={{ width:7, height:7, borderRadius:'50%', background:PLATFORM_COLORS[p], display:'inline-block', flexShrink:0 }} />
                          {PLATFORM_LABELS[p]}
                        </label>
                      );
                    })}
                  </div>
                </Field>

                {/* ── Specific articles ── */}
                <Field label="Include specific articles (optional)">
                  <p style={{ margin:'0 0 10px', fontSize:12, color:MUTED }}>
                    Each URL becomes one dedicated post slot in this batch, scheduled on the next available date.
                  </p>
                  {specificUrls.map((url, idx) => (
                    <div key={idx} style={{ display:'flex', gap:8, marginBottom:6, alignItems:'center' }}>
                      <input
                        type="url"
                        placeholder="https://innago.com/your-article/"
                        value={url}
                        onChange={e => setSpecificUrls(u => u.map((v, i) => i === idx ? e.target.value : v))}
                        style={{ ...input, flex:1 }}
                      />
                      {specificUrls.length > 1 && (
                        <button onClick={() => setSpecificUrls(u => u.filter((_, i) => i !== idx))}
                          style={{ background:'none', border:'none', cursor:'pointer', color:MUTED, fontSize:20, lineHeight:1 }}>×</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setSpecificUrls(u => [...u, ''])}
                    style={{ ...outlineBtn, fontSize:12, padding:'4px 12px', marginTop:2 }}>+ Add another URL</button>
                </Field>

                <div style={{ marginTop:16, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                  <button onClick={()=>{ addRecurring(); if (specificUrls.some(u=>u.trim())) addSpecificSlots(); }}
                    disabled={!recurForm.startDate||!recurForm.endDate||!recurForm.days.length||!recurForm.platforms.length}
                    style={{ ...pBtn,
                      opacity:(!recurForm.startDate||!recurForm.endDate||!recurForm.days.length||!recurForm.platforms.length)?0.5:1 }}>
                    Add to Schedule
                  </button>
                  {!generating ? (
                    <button onClick={handleGenerateSafe}
                      disabled={newCustomSlots.length === 0}
                      style={{ ...primaryBtn, background: newCustomSlots.length === 0 ? MUTED : GREEN,
                        opacity: newCustomSlots.length === 0 ? 0.5 : 1 }}>
                      {newCustomSlots.length === 0
                        ? 'All slots generated'
                        : `Generate ${newCustomSlots.length} New Slot${newCustomSlots.length !== 1 ? 's' : ''}`}
                    </button>
                  ) : (
                    <button onClick={() => { abortRef.current=true; }} style={{ ...primaryBtn, background:RED }}>Stop</button>
                  )}
                  {recurForm.startDate && recurForm.endDate && recurForm.days.length > 0 && (() => {
                    const cur = new Date(recurForm.startDate+'T00:00:00');
                    const end = new Date(recurForm.endDate+'T00:00:00');
                    let count = 0, guard = 0;
                    while (cur <= end && guard++ < 500) {
                      const wd = cur.getDay()===0?6:cur.getDay()-1;
                      if (recurForm.days.includes(wd)) count++;
                      cur.setDate(cur.getDate()+1);
                    }
                    const specific = specificUrls.filter(u=>u.trim()).length;
                    const total = count + specific;
                    return total > 0 ? <span style={{ fontSize:13, color:MUTED }}>{count} recurring{specific > 0 ? ` + ${specific} specific` : ''} = {total} slot{total!==1?'s':''}</span> : null;
                  })()}
                </div>
              </Card>
            </div>

          </div>
        )}

        {/* ══ LIBRARY TAB ══════════════════════════ */}
        {tab==='library' && (() => {
          // Build rows from ALL slots that have generated post copy
          const rows = (schedule || []).map(slot => {
            const post = posts[slot.id];
            if (!post || post.error) return null;
            const approval = approvedPosts[slot.id];
            const status = scheduleStatus[slot.id];
            const scheduledPlatforms = [
              ...(status ? Object.entries(status).filter(([,r]) => r?.ok && !r?.deleted).map(([pl]) => pl) : []),
              ...(linkedinManual[slot.id]?.confirmedAt ? ['linkedin'] : []),
            ];
            const isScheduled = scheduledPlatforms.length > 0;
            const isApproved  = !!approval;
            return { slotId: slot.id, slot, post, approval, status, scheduledPlatforms, isScheduled, isApproved };
          }).filter(Boolean).sort((a, b) => a.slot.date.localeCompare(b.slot.date));

          const q = libraryQuery.toLowerCase();
          const filtered = q
            ? rows.filter(r =>
                (r.slot.article?.displayTitle || '').toLowerCase().includes(q) ||
                (r.slot.article?.category || '').toLowerCase().includes(q) ||
                (r.slot.date || '').includes(q) ||
                (r.post.post_linkedin || r.post.post || '').toLowerCase().includes(q)
              )
            : rows;

          const scheduledCount = filtered.filter(r => r.isScheduled).length;
          const approvedCount  = filtered.filter(r => r.isApproved).length;
          const thisMonth = filtered.filter(r => r.slot.date?.startsWith(today().slice(0,7))).length;

          // CSV export
          const exportLibraryCSV = () => {
            const header = ['Date','Article','Category','Status','Scheduled Platforms','Approved At','Scheduled Time','LinkedIn','Twitter','Facebook','Instagram'];
            const csvRows = filtered.map(r => {
              const scheduledTime = r.scheduledPlatforms.length > 0
                ? Object.values(r.status).find(v => v?.scheduledTime)?.scheduledTime || ''
                : '';
              return [
                r.slot.date,
                r.post.title || r.slot.article?.displayTitle || '',
                r.slot.article?.category || '',
                r.isScheduled ? 'Scheduled' : r.isApproved ? 'Approved' : 'Generated',
                r.scheduledPlatforms.join(' | '),
                r.approval?.approvedAt ? new Date(r.approval.approvedAt).toLocaleString() : '',
                scheduledTime,
                r.post.post_linkedin || '',
                r.post.post_twitter_x || '',
                r.post.post_facebook || '',
                r.post.post_instagram || '',
              ].map(v => `"${String(v).replace(/"/g,'""')}"`);
            });
            const csv = [header.join(','), ...csvRows.map(r => r.join(','))].join('\n');
            const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
            a.download = 'social-history.csv'; a.click();
          };

          const StatusBadge = ({ row }) => {
            if (row.isScheduled) return (
              <span style={{ fontSize:11, padding:'2px 8px', borderRadius:999, fontWeight:600,
                background:'#eff6ff', color:BLUE, border:'1px solid #bfdbfe' }}>
                Scheduled
              </span>
            );
            if (row.isApproved) return (
              <span style={{ fontSize:11, padding:'2px 8px', borderRadius:999, fontWeight:600,
                background:'#f0fdf4', color:GREEN, border:'1px solid #bbf7d0' }}>
                Approved
              </span>
            );
            return (
              <span style={{ fontSize:11, padding:'2px 8px', borderRadius:999, fontWeight:600,
                background:'#F9FAFB', color:MUTED, border:`1px solid ${BORDER}` }}>
                Generated
              </span>
            );
          };

          return (
            <div>
              {/* Header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div>
                  <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:TEXT }}>History</h2>
                  <p style={{ margin:'4px 0 0', fontSize:13, color:MUTED }}>
                    {filtered.length} posts total
                    {scheduledCount > 0 && ` · ${scheduledCount} scheduled to Blotato`}
                    {approvedCount > 0 && ` · ${approvedCount} approved`}
                    {thisMonth > 0 && ` · ${thisMonth} this month`}
                    {q && ` matching "${libraryQuery}"`}
                  </p>
                </div>
                <button onClick={exportLibraryCSV} style={{ ...outlineBtn, fontSize:13 }}>Export CSV</button>
              </div>

              {/* Search */}
              <input
                value={libraryQuery}
                onChange={e => setLibraryQuery(e.target.value)}
                placeholder="Search by article, category, date, or post text…"
                style={{ ...input, marginBottom:16, maxWidth:420 }}
              />

              {/* Empty state */}
              {filtered.length === 0 && (
                <div style={{ textAlign:'center', padding:80, color:MUTED }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>🗂️</div>
                  <p style={{ fontSize:15, fontWeight:600, color:TEXT, margin:'0 0 6px' }}>
                    {q ? 'No posts match your search.' : 'No posts generated yet.'}
                  </p>
                  <p style={{ fontSize:13, margin:'0 0 18px' }}>
                    {q ? 'Try a different search term.' : 'Generate posts in the Input tab to see them here.'}
                  </p>
                  {!q && <button onClick={()=>setTab('config')} style={primaryBtn}>Go to Input</button>}
                </div>
              )}

              {/* Table */}
              {filtered.length > 0 && (
                <div style={{ background:'#fff', border:`1px solid ${BORDER}`, borderRadius:12, overflow:'hidden' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'110px 1fr 120px 110px 130px 80px',
                    background:'#F9FAFB', borderBottom:`1px solid ${BORDER}`,
                    padding:'10px 16px', gap:12 }}>
                    {['Date','Article','Category','Status','Platforms',''].map(h => (
                      <span key={h} style={{ fontSize:11, fontWeight:700, color:MUTED,
                        textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</span>
                    ))}
                  </div>

                  {filtered.map((row) => {
                    const { slotId, slot, post, approval, scheduledPlatforms, isScheduled } = row;
                    const isExpanded = libraryExpandedId === slotId;
                    const displayPlatforms = isScheduled
                      ? scheduledPlatforms
                      : (approval?.platforms || slot.platforms || []);
                    const scheduledTime = isScheduled
                      ? Object.values(row.status).find(v => v?.scheduledTime)?.scheduledTime
                      : null;

                    return (
                      <div key={slotId} style={{ borderBottom:`1px solid ${BORDER}` }}>
                        <div style={{ display:'grid', gridTemplateColumns:'110px 1fr 120px 110px 130px 80px',
                          padding:'12px 16px', gap:12, alignItems:'center',
                          background: isExpanded ? PBG : '#fff', cursor:'pointer' }}
                          onClick={() => setLibraryExpandedId(isExpanded ? null : slotId)}>

                          <div>
                            <div style={{ fontSize:13, color:TEXT }}>{slot.date}</div>
                            {scheduledTime && (
                              <div style={{ fontSize:11, color:MUTED }}>
                                {new Date(scheduledTime).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                              </div>
                            )}
                          </div>

                          <div style={{ overflow:'hidden' }}>
                            <a href={slot.article?.url} target="_blank" rel="noreferrer"
                              onClick={e=>e.stopPropagation()}
                              style={{ fontSize:13, color:P, fontWeight:500, textDecoration:'none',
                                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block' }}>
                              {post.title || slot.article?.displayTitle}
                            </a>
                            {approval?.approvedAt && (
                              <span style={{ fontSize:11, color:MUTED }}>
                                Approved {new Date(approval.approvedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          <span style={{ fontSize:12, color:MUTED }}>{slot.article?.category}</span>

                          <StatusBadge row={row} />

                          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                            {displayPlatforms.map(pl => (
                              <span key={pl} style={{ fontSize:10, padding:'2px 6px', borderRadius:8, fontWeight:600,
                                background: PLATFORM_COLORS[pl]+'18', color:PLATFORM_COLORS[pl] }}>
                                {PLATFORM_LABELS[pl]}
                              </span>
                            ))}
                          </div>

                          <span style={{ fontSize:12, color:P, textAlign:'right' }}>
                            {isExpanded ? '▲ Hide' : '▼ View'}
                          </span>
                        </div>

                        {isExpanded && (
                          <div style={{ padding:'0 16px 16px', borderTop:`1px solid ${BORDER}` }}>
                            {[
                              ['LinkedIn', 'post_linkedin', 'linkedin'],
                              ['Twitter/X', 'post_twitter_x', 'twitter'],
                              ['Facebook', 'post_facebook', 'facebook'],
                              ['Instagram', 'post_instagram', 'instagram'],
                            ].filter(([,field]) => post[field]).map(([label, field, pl]) => (
                              <div key={field} style={{ marginTop:14 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                                  <span style={{ fontSize:11, fontWeight:700, color:PLATFORM_COLORS[pl],
                                    textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</span>
                                  {isScheduled && row.status?.[pl]?.scheduledTime && (
                                    <span style={{ fontSize:11, color:MUTED }}>
                                      · {new Date(row.status[pl].scheduledTime).toLocaleString()}
                                    </span>
                                  )}
                                  <button onClick={()=>navigator.clipboard.writeText(post[field])}
                                    style={{ background:'none', border:'none', cursor:'pointer',
                                      fontSize:11, color:MUTED, textDecoration:'underline', padding:0 }}>
                                    Copy
                                  </button>
                                </div>
                                <p style={{ margin:0, fontSize:13, lineHeight:1.65, color:'#374151',
                                  whiteSpace:'pre-wrap', background:'#F9FAFB', padding:'10px 14px',
                                  borderRadius:8, border:`1px solid ${BORDER}` }}>
                                  {post[field]}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ══ SETTINGS TAB ════════════════════════ */}
        {tab==='blotato' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:22 }}>

            <Card title="Blotato Connection">
              <p style={{ margin:'0 0 14px', fontSize:13, color:MUTED }}>
                API keys (Anthropic, Blotato, Bitly) are configured as Vercel environment variables — no manual entry needed.
              </p>
              <div style={{ padding:'8px 12px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, fontSize:13, color:GREEN, marginBottom:14 }}>
                ✓ Keys loaded from environment — generation and scheduling are ready
              </div>
              <p style={{ margin:'0 0 14px', fontSize:12, color:MUTED }}>
                Post times are set per-slot in the Schedule tab. This fallback only applies if a slot has no time set.
              </p>
              <Field label="Auto-schedule after generation">
                <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', marginTop:4 }}>
                  <input type="checkbox" checked={autoSchedule} onChange={e=>setAutoSchedule(e.target.checked)}
                    style={{ accentColor:BLUE, width:18, height:18 }} />
                  <span style={{ fontSize:14 }}>Automatically schedule each post to Blotato as it's generated</span>
                </label>
              </Field>
              <button onClick={loadAccounts} disabled={accountsLoading}
                style={{ ...primaryBtn, marginTop:16, width:'100%', opacity:accountsLoading?0.6:1 }}>
                {accountsLoading ? 'Loading accounts...' : 'Connect & Load Accounts'}
              </button>
              {accountsError && <p style={{ color:RED, fontSize:13, marginTop:8 }}>{accountsError}</p>}
            </Card>

            <Card title="Account Mapping">
              <p style={{ margin:'0 0 4px', fontSize:13, color:MUTED }}>
                Paste your Blotato Account ID and Page ID for each platform. Find these in Blotato → Settings → Social Accounts.
              </p>
              <p style={{ margin:'0 0 16px', fontSize:12, color:MUTED }}>
                LinkedIn and Facebook require a <strong>Page ID</strong> to post as a company page.
              </p>
              {PLATFORMS_LIST.map(platform => {
                const items = accounts?.[platform] || [];
                const mapping = accountMapping[platform] || {};
                const color = PLATFORM_COLORS[platform];
                const needsPage = platform === 'facebook' || platform === 'linkedin';
                return (
                  <div key={platform} style={{ marginBottom:20, padding:'14px 16px', borderRadius:10,
                    border:`1px solid ${mapping.accountId ? BORDER : BORDER}`, background:'#fafafa' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                      <PlatformDot color={color} />
                      <span style={{ fontWeight:600, fontSize:14 }}>{PLATFORM_LABELS[platform]}</span>
                      {mapping.accountId && (!needsPage || mapping.pageId) && (
                        <span style={{ fontSize:11, color:GREEN, background:'#f0fdf4', border:'1px solid #bbf7d0',
                          borderRadius:999, padding:'1px 8px', marginLeft:'auto' }}>✓ ready</span>
                      )}
                      {mapping.accountId && needsPage && !mapping.pageId && (
                        <span style={{ fontSize:11, color:YELLOW, background:'#fefce8', border:'1px solid #fde68a',
                          borderRadius:999, padding:'1px 8px', marginLeft:'auto' }}>needs page ID</span>
                      )}
                    </div>

                    {/* Dropdown if accounts were loaded via Connect button */}
                    {items.length > 0 && (
                      <select value={mapping.accountId}
                        onChange={e => {
                          const acct = items.find(a => a.accountId === e.target.value);
                          setAccountMapping(p => ({ ...p, [platform]: { accountId: e.target.value, pageId: acct?.pages?.[0]?.pageId || '' } }));
                        }}
                        style={{ ...input, marginBottom:8, fontSize:13 }}>
                        <option value="">— select account —</option>
                        {items.map(a => <option key={a.accountId} value={a.accountId}>{a.fullname} (@{a.username})</option>)}
                      </select>
                    )}

                    {/* Manual account ID input */}
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      <div>
                        <label style={{ fontSize:11, fontWeight:600, color:MUTED, textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:3 }}>
                          Account ID
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 98432"
                          value={mapping.accountId || ''}
                          onChange={e => setAccountMapping(p => ({ ...p, [platform]: { ...p[platform], accountId: e.target.value.trim() } }))}
                          style={{ ...input, fontSize:13, fontFamily:'monospace' }}
                        />
                      </div>
                      {needsPage && (
                        <div>
                          <label style={{ fontSize:11, fontWeight:600, color:MUTED, textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:3 }}>
                            Page ID {platform === 'facebook' ? '(required)' : '(company page)'}
                          </label>
                          {/* Page dropdown if loaded */}
                          {items.length > 0 && items.find(a => a.accountId === mapping.accountId)?.pages?.length > 0 && (
                            <select value={mapping.pageId}
                              onChange={e => setAccountMapping(p => ({ ...p, [platform]: { ...p[platform], pageId: e.target.value } }))}
                              style={{ ...input, marginBottom:6, fontSize:13 }}>
                              <option value="">— select page —</option>
                              {(items.find(a => a.accountId === mapping.accountId)?.pages || []).map(pg => (
                                <option key={pg.pageId} value={pg.pageId}>{pg.name}</option>
                              ))}
                            </select>
                          )}
                          <input
                            type="text"
                            placeholder="e.g. 987654321"
                            value={mapping.pageId || ''}
                            onChange={e => setAccountMapping(p => ({ ...p, [platform]: { ...p[platform], pageId: e.target.value.trim() } }))}
                            style={{ ...input, fontSize:13, fontFamily:'monospace' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {hasValidMapping() && (
                <div style={{ padding:'10px 14px', background:'#f0fdf4', borderRadius:8,
                  border:'1px solid #bbf7d0', fontSize:13, color:GREEN }}>
                  ✓ Ready to schedule. Posts will go out at the time set on each slot.
                </div>
              )}
            </Card>

            {/* ── Blotato Scheduled Posts ── */}
            {(() => {
              const scheduled = (schedule || []).flatMap(slot => {
                const stat = scheduleStatus[slot.id];
                if (!stat) return [];
                return Object.entries(stat)
                  .filter(([,r]) => r && (r.ok || r.deleted) && !r._loading)
                  .map(([plat, r]) => ({
                    slotId: slot.id,
                    platform: plat,
                    result: r,
                    date: slot.date,
                    time: slot.time,
                    day: slot.day,
                    topic: slot.article?.category || slot.boostedTopic || slotLabel(slot),
                  }));
              });
              if (!scheduled.length) return null;
              return (
                <div style={{ gridColumn:'1/-1', marginTop:8 }}>
                  <Card title={`Blotato Queue (${scheduled.filter(s=>s.result.ok).length} scheduled)`}>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {scheduled.map((item, i) => (
                        <div key={`${item.slotId}-${item.platform}-${i}`}
                          style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 10px',
                            borderRadius:8, background: item.result.deleted ? '#f9fafb' : BG,
                            opacity: item.result.deleted ? 0.5 : 1 }}>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:12,
                            fontWeight:600, color: item.result.deleted ? MUTED : PLATFORM_COLORS[item.platform],
                            minWidth:90 }}>
                            <span style={{ width:7, height:7, borderRadius:'50%',
                              background: item.result.deleted ? MUTED : PLATFORM_COLORS[item.platform],
                              display:'inline-block' }} />
                            {PLATFORM_LABELS[item.platform]}
                          </span>
                          <span style={{ fontSize:13, color: item.result.deleted ? MUTED : TEXT,
                            flex:1, textDecoration: item.result.deleted ? 'line-through' : 'none' }}>
                            {item.topic}
                          </span>
                          <span style={{ fontSize:12, color:MUTED, minWidth:130 }}>
                            {item.day} {item.date} · {formatTime(item.time)}
                          </span>
                          {item.result.deleted ? (
                            <span style={{ fontSize:11, color:MUTED }}>Removed from Blotato</span>
                          ) : item.result.ok ? (
                            <a href="https://app.blotato.com" target="_blank" rel="noreferrer"
                              style={{ ...outlineBtn, fontSize:11, padding:'3px 10px', color:BLUE, borderColor:BLUE, textDecoration:'none' }}>
                              Delete on Blotato ↗
                            </a>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              );
            })()}
          </div>
        )}

        {/* ══ REVIEW TAB ════════════════════════ */}
        {tab==='review' && (
          <>
            {!schedule && (
              <div style={{ textAlign:'center', padding:80, color:MUTED }}>
                <div style={{ fontSize:48, marginBottom:16 }}>📅</div>
                <p style={{ fontSize:16 }}>Build your schedule and click <strong>Generate Posts</strong>.</p>
                <button onClick={()=>setTab('config')} style={{ ...primaryBtn, marginTop:16 }}>Go to Schedule</button>
              </div>
            )}

            {schedule && (
              <>
                {/* Progress bar */}
                {generating && (
                  <div style={{ marginBottom:20 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:MUTED, marginBottom:6 }}>
                      <span>{autoSchedule && blotatoReady ? 'Generating & scheduling...' : 'Generating posts...'} {progress.done}/{progress.total}</span>
                      <span>{totalSlots>0?Math.round(progress.done/totalSlots*100):0}%</span>
                    </div>
                    <div style={{ background:BORDER, borderRadius:4, height:6 }}>
                      <div style={{ background:BLUE, height:6, borderRadius:4,
                        width:`${totalSlots>0?Math.round(progress.done/totalSlots*100):0}%`, transition:'width 0.3s' }} />
                    </div>
                  </div>
                )}

                {/* Summary strip */}
                {!generating && doneCount>0 && (
                  <div style={{ display:'flex', gap:20, marginBottom:20, padding:'12px 18px',
                    background:'#fff', border:`1px solid ${BORDER}`, borderRadius:10, flexWrap:'wrap', alignItems:'center' }}>
                    <Stat label="Posts generated" value={doneCount} />
                    <Stat label="Scheduled to Blotato" value={scheduledCount} color={scheduledCount>0?GREEN:MUTED} />
                    <Stat label="Date range" value={`${schedule[0]?.date} – ${schedule[schedule.length-1]?.date}`} />
                    <div style={{ display:'flex', gap:8, marginLeft:'auto', flexWrap:'wrap', alignItems:'center' }}>
                      <button onClick={exportCSV} style={{ ...outlineBtn, fontSize:12 }}>Export CSV</button>
                      {blotatoReady && !autoSchedule && (
                        <button onClick={scheduleAll} style={{ ...outlineBtn, fontSize:12, color:P, borderColor:P }}>
                          Schedule All to Blotato
                        </button>
                      )}
                      {!blotatoReady && (
                        <button onClick={()=>setTab('blotato')} style={{ ...outlineBtn, fontSize:12, color:BLUE, borderColor:BLUE }}>
                          Set up Blotato →
                        </button>
                      )}
                      {!clearPostsConfirm ? (
                        <>
                          <button onClick={()=>{
                            setPosts({});
                            setScheduleStatus({});
                            try { localStorage.removeItem('innago-posts'); localStorage.removeItem('innago-schedule-status'); } catch {}
                          }} style={{ ...outlineBtn, fontSize:12, color:RED, borderColor:RED }}>
                            Clear All Generated Text
                          </button>
                          <button onClick={()=>setClearPostsConfirm(true)}
                            style={{ ...outlineBtn, fontSize:12, color:RED, borderColor:RED }}>
                            Delete All Slots
                          </button>
                        </>
                      ) : (
                        <button onClick={async ()=>{
                          if (schedule) await Promise.all(schedule.map(s => unscheduleSlotFromBlotato(s.id)));
                          setSchedule(null); setPosts({}); setScheduleStatus({});
                          setClearPostsConfirm(false);
                          try { localStorage.removeItem('innago-schedule'); localStorage.removeItem('innago-posts'); localStorage.removeItem('innago-schedule-status'); } catch {}
                        }} style={{ ...primaryBtn, fontSize:12, background:RED }}>
                          Are you sure? Click to confirm
                        </button>
                      )}
                      <button onClick={() => schedule?.forEach(slot => {
                        if (posts[slot.id] && !posts[slot.id].error) approvePost(slot.id, slot.platforms || PLATFORMS_LIST);
                      })} style={{ ...outlineBtn, fontSize:12, color:GREEN, borderColor:GREEN }}>
                        ✓ Approve All
                      </button>
                    </div>
                  </div>
                )}

                {/* LinkedIn Batch — approved LinkedIn posts, downloadable as CSV for manual scheduling */}
                {!generating && linkedinBatchRows.length > 0 && (
                  <div style={{ marginBottom:20, padding:'14px 18px', background:'#fff',
                    border:`1px solid ${BORDER}`, borderLeft:`4px solid ${PLATFORM_COLORS.linkedin}`, borderRadius:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                      marginBottom:10, flexWrap:'wrap', gap:8 }}>
                      <div>
                        <span style={{ fontWeight:700, fontSize:14, color:PLATFORM_COLORS.linkedin }}>
                          LinkedIn Batch
                        </span>
                        <span style={{ marginLeft:8, fontSize:13, color:MUTED }}>
                          {linkedinBatchRows.length} approved post{linkedinBatchRows.length!==1?'s':''} ready to schedule manually
                        </span>
                      </div>
                      <button onClick={exportLinkedinBatchCSV}
                        style={{ ...outlineBtn, fontSize:12, color:PLATFORM_COLORS.linkedin, borderColor:PLATFORM_COLORS.linkedin }}>
                        ⬇ Download CSV
                      </button>
                    </div>
                    <div style={{ overflowX:'auto' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                        <thead>
                          <tr style={{ textAlign:'left', color:MUTED, borderBottom:`1px solid ${BORDER}` }}>
                            <th style={{ padding:'4px 8px', fontWeight:600 }}>Date</th>
                            <th style={{ padding:'4px 8px', fontWeight:600 }}>Time</th>
                            <th style={{ padding:'4px 8px', fontWeight:600 }}>Article</th>
                            <th style={{ padding:'4px 8px', fontWeight:600 }}>Post</th>
                            <th style={{ padding:'4px 8px', fontWeight:600 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {linkedinBatchRows.map(slot => {
                            const p = posts[slot.id];
                            const text = p?.post_linkedin || p?.post || '';
                            return (
                              <tr key={slot.id} style={{ borderBottom:`1px solid ${BORDER}` }}>
                                <td style={{ padding:'6px 8px', whiteSpace:'nowrap', color:TEXT }}>{slot.date}</td>
                                <td style={{ padding:'6px 8px', whiteSpace:'nowrap', color:MUTED }}>{slot.time}</td>
                                <td style={{ padding:'6px 8px', maxWidth:180, overflow:'hidden',
                                  textOverflow:'ellipsis', whiteSpace:'nowrap', color:TEXT }}>
                                  {p?.title || slot.article?.displayTitle}
                                </td>
                                <td style={{ padding:'6px 8px', maxWidth:340, overflow:'hidden',
                                  textOverflow:'ellipsis', whiteSpace:'nowrap', color:MUTED }}
                                  title={text}>
                                  {text}
                                </td>
                                <td style={{ padding:'6px 8px', whiteSpace:'nowrap' }}>
                                  <button onClick={()=>confirmLinkedinCopied(slot.id)}
                                    style={{ background:'none', border:'none', cursor:'pointer', fontSize:12,
                                      color:PLATFORM_COLORS.linkedin, fontWeight:600 }}>
                                    ✓ Copied
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* View toggle + platform tabs row */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
                  {/* Platform tabs (only in list view) */}
                  {reviewView === 'list' && (
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
                      {PLATFORMS_LIST.map(p=>(
                        <button key={p} onClick={()=>setActivePlatform(p)} style={{
                          padding:'6px 16px', borderRadius:20, cursor:'pointer', fontSize:13,
                          border:`1.5px solid ${activePlatform===p?PLATFORM_COLORS[p]:BORDER}`,
                          background:activePlatform===p?PLATFORM_COLORS[p]:'#fff',
                          color:activePlatform===p?'#fff':'#374151', fontWeight:activePlatform===p?600:400,
                        }}>
                          {PLATFORM_LABELS[p]}
                        </button>
                      ))}
                      <button onClick={()=>setActivePlatform('universal')} style={{
                        padding:'6px 16px', borderRadius:20, cursor:'pointer', fontSize:13,
                        border:`1.5px solid ${activePlatform==='universal'?BLUE:BORDER}`,
                        background:activePlatform==='universal'?BLUE:'#fff',
                        color:activePlatform==='universal'?'#fff':'#374151',
                        fontWeight:activePlatform==='universal'?600:400,
                      }}>Universal</button>
                    </div>
                  )}
                  {reviewView === 'calendar' && <div />}

                  {/* List / Calendar toggle */}
                  <div style={{ display:'flex', gap:4, marginLeft:'auto' }}>
                    {['list','calendar'].map(v=>(
                      <button key={v} onClick={()=>setReviewView(v)}
                        style={{ padding:'5px 14px', borderRadius:6, cursor:'pointer', fontSize:12,
                          border:`1px solid ${reviewView===v?BLUE:BORDER}`,
                          background:reviewView===v?BLUE_BG:'#fff',
                          color:reviewView===v?BLUE:MUTED, fontWeight:reviewView===v?600:400 }}>
                        {v==='list'?'List':'Calendar'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── CALENDAR VIEW ── */}
                {reviewView === 'calendar' && (() => {
                  const postsByDate = {};
                  (schedule||[]).forEach(slot => {
                    if (!postsByDate[slot.date]) postsByDate[slot.date] = [];
                    postsByDate[slot.date].push(slot);
                  });
                  return (
                    <>
                      {/* Nav + month/week toggle */}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <button onClick={()=>setReviewCalFocus(f=>reviewCalMode==='month'?shiftMonth(f,-1):addDays(f,-7))}
                            style={{ ...outlineBtn, padding:'4px 10px', fontSize:15 }}>‹</button>
                          <span style={{ fontWeight:600, fontSize:14, minWidth:200, textAlign:'center' }}>
                            {reviewCalMode==='month'?monthLabel(reviewCalFocus):weekLabel(reviewCalFocus)}
                          </span>
                          <button onClick={()=>setReviewCalFocus(f=>reviewCalMode==='month'?shiftMonth(f,1):addDays(f,7))}
                            style={{ ...outlineBtn, padding:'4px 10px', fontSize:15 }}>›</button>
                        </div>
                        <div style={{ display:'flex', gap:4 }}>
                          {['month','week'].map(m=>(
                            <button key={m} onClick={()=>setReviewCalMode(m)}
                              style={{ padding:'4px 12px', borderRadius:6, cursor:'pointer', fontSize:12,
                                border:`1px solid ${reviewCalMode===m?BLUE:BORDER}`,
                                background:reviewCalMode===m?BLUE_BG:'#fff',
                                color:reviewCalMode===m?BLUE:MUTED, fontWeight:reviewCalMode===m?600:400 }}>
                              {m==='month'?'Month':'Week'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Month grid */}
                      {reviewCalMode === 'month' && (
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
                          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>(
                            <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:600, color:MUTED, padding:'4px 0 6px' }}>{d}</div>
                          ))}
                          {getMonthGrid(reviewCalFocus).map((dateStr,i)=>{
                            if (!dateStr) return <div key={`e${i}`} style={{ minHeight:60 }} />;
                            const daySlots = postsByDate[dateStr]||[];
                            const isToday = dateStr===today();
                            return (
                              <div key={dateStr} style={{ minHeight:64, borderRadius:6, padding:'4px 6px',
                                border:`1px solid ${isToday?BLUE:daySlots.length>0?BORDER:'#f3f4f6'}`,
                                background:isToday?BLUE_BG:daySlots.length>0?'#fff':'#fafafa' }}>
                                <div style={{ fontSize:11, fontWeight:isToday?700:400, color:isToday?BLUE:'#9ca3af', textAlign:'right' }}>
                                  {new Date(dateStr+'T00:00:00').getDate()}
                                </div>
                                {daySlots.map(slot=>{
                                  const p=posts[slot.id];
                                  const hasPost=p&&!p.error;
                                  const slotStatus=scheduleStatus[slot.id];
                                  const isScheduled=!slotStatus?._loading&&allPlatformsDone(slot);
                                  const color=isScheduled?GREEN:hasPost?BLUE:MUTED;
                                  return (
                                    <div key={slot.id}
                                      onClick={()=>{ setReviewView('list'); setHighlightedSlotId(slot.id); }}
                                      style={{ marginTop:2, padding:'2px 5px', borderRadius:3, cursor:'pointer',
                                        background:color+'18', border:`1px solid ${color}33` }}>
                                      <div style={{ fontSize:9, fontWeight:700, color, lineHeight:1.3,
                                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                        {slot.time ? formatTime(slot.time) : ''}{' '}
                                        {isScheduled?'✓ Queued':hasPost?'Draft':'Pending'}
                                      </div>
                                      <div style={{ display:'flex', gap:2, marginTop:1, flexWrap:'wrap' }}>
                                        {(slot.platforms||PLATFORMS_LIST).map(pl=>(
                                          <span key={pl} style={{ width:5, height:5, borderRadius:'50%',
                                            background:PLATFORM_COLORS[pl], display:'inline-block' }} />
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Week grid */}
                      {reviewCalMode === 'week' && (
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
                          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>(
                            <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:600, color:MUTED, padding:'4px 0 6px' }}>{d}</div>
                          ))}
                          {getWeekDates(reviewCalFocus).map(dateStr=>{
                            const daySlots = postsByDate[dateStr]||[];
                            const isToday = dateStr===today();
                            const d = new Date(dateStr+'T00:00:00');
                            return (
                              <div key={dateStr} style={{ minHeight:110, borderRadius:8, padding:'6px 8px',
                                border:`1px solid ${isToday?BLUE:BORDER}`,
                                background:isToday?BLUE_BG:'#fafafa' }}>
                                <div style={{ fontSize:11, fontWeight:600, color:isToday?BLUE:MUTED,
                                  marginBottom:6, textAlign:'center' }}>
                                  {d.toLocaleString('default',{month:'short'})} {d.getDate()}
                                </div>
                                {daySlots.flatMap(slot=>
                                  (slot.platforms||PLATFORMS_LIST).map(platform=>({ slot, platform }))
                                ).map(({slot,platform})=>{
                                  const p=posts[slot.id];
                                  const isScheduled=isPlatformDone(slot, platform);
                                  const color=PLATFORM_COLORS[platform];
                                  return (
                                    <div key={`${slot.id}-${platform}`}
                                      onClick={()=>{ setReviewView('list'); setHighlightedSlotId(slot.id); }}
                                      style={{ borderRadius:5, marginBottom:3, cursor:'pointer',
                                        padding:'4px 7px', border:`1.5px solid ${color}`,
                                        background:color+'12' }}>
                                      <div style={{ fontSize:10, fontWeight:700, color,
                                        textTransform:'uppercase', letterSpacing:'0.04em', lineHeight:1.2, marginBottom:1 }}>
                                        {PLATFORM_LABELS[platform]}
                                      </div>
                                      <div style={{ fontSize:10, color:MUTED }}>{formatTime(slot.time)}</div>
                                      <div style={{ fontSize:10, fontWeight:600,
                                        color:isScheduled?GREEN:p&&!p.error?BLUE:MUTED }}>
                                        {isScheduled?'✓ Queued':p&&!p.error?'Draft':'Pending'}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* ── LIST VIEW ── */}
                {reviewView === 'list' && <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  {schedule.filter(slot => !allPlatformsDone(slot)).map(slot=>{
                    const p=posts[slot.id];
                    const field=activePlatform==='universal'?'post':POST_FIELD[activePlatform]||'post_linkedin';
                    const ek=`${slot.id}::${field}`;
                    const isEditing=editingKey===ek;
                    const isLoading=(!p && generating) || regeneratingId===slot.id;
                    const slotStatus=scheduleStatus[slot.id];
                    const postText=p?.[field]||p?.post||'';
                    const charLimit=CHAR_LIMITS[activePlatform];
                    const charCount=postText.length;
                    const overLimit=charLimit&&charCount>charLimit;
                    const nearLimit=charLimit&&charCount>charLimit*0.9&&!overLimit;
                    const isCopied=copiedKey===ek;
                    const platformIncluded = activePlatform==='universal' || !slot.platforms || slot.platforms.includes(activePlatform);

                    // Image logic per Python script:
                    //   Instagram: always show
                    //   LinkedIn/Facebook: first post of ISO week only
                    //   Twitter: never
                    //   Universal: show if available
                    const heroUrl = p?.image_url || '';
                    const imgEntry = generatedImages[slot.id];
                    const hasAiImage = !!imgEntry?.html;
                    // Hide scraped hero if AI image has been generated
                    const showImage =
                      heroUrl && !hasAiImage && (
                        activePlatform === 'instagram' ||
                        activePlatform === 'universal' ||
                        (['linkedin','facebook'].includes(activePlatform) && slot.isFirstOfWeek)
                      );
                    const showAiImage = hasAiImage && activePlatform !== 'twitter';

                    const slotApproved = approvedPosts[slot.id];
                    const allPlatformsApproved = slotApproved && (slot.platforms || PLATFORMS_LIST).every(pl => (slotApproved.platforms || []).includes(pl));

                    return (
                      <div key={slot.id} id={`slot-card-${slot.id}`} style={{
                        background:'#fff', border:`1px solid ${overLimit?RED:BORDER}`, borderRadius:10, padding:'16px 20px',
                        borderLeft:`4px solid ${allPlatformsApproved?GREEN:slot.boostedTopic?BLUE:overLimit?RED:BORDER}`,
                        opacity: !platformIncluded ? 0.55 : 1,
                      }}>
                        {/* Header row */}
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                          <div>
                            <span style={{ fontWeight:600, fontSize:15, color:TEXT }}>
                              {slot.date} · {slot.day}
                            </span>
                            <span style={{ marginLeft:10, fontSize:12, color:MUTED }}>{slot.time} ET</span>
                            {slot.boostedTopic && (
                              <span style={{ marginLeft:8, fontSize:11, background:BLUE_BG,
                                color:BLUE, padding:'2px 8px', borderRadius:10, fontWeight:600 }}>
                                {slot.boostedTopic}
                              </span>
                            )}
                            <div style={{ display:'flex', gap:6, alignItems:'center', marginTop:5 }}>
                              {/* Platform badges for this slot */}
                              {(slot.platforms||PLATFORMS_LIST).map(pl=>(
                                <span key={pl} style={{ display:'inline-flex', alignItems:'center', gap:4,
                                  fontSize:11, padding:'2px 7px', borderRadius:8,
                                  background: PLATFORM_COLORS[pl]+'18', color:PLATFORM_COLORS[pl], fontWeight:600 }}>
                                  <span style={{ width:6, height:6, borderRadius:'50%', background:PLATFORM_COLORS[pl], display:'inline-block' }} />
                                  {PLATFORM_LABELS[pl]}
                                </span>
                              ))}
                              <span style={{ fontSize:12, color:MUTED }}>·</span>
                              <span style={{ fontSize:12, color:MUTED }}>{slot.article?.category}</span>
                              <span style={{ fontSize:12, color:MUTED }}>·</span>
                              <a href={slot.article?.url} target="_blank" rel="noreferrer"
                                style={{ fontSize:12, color:BLUE, textDecoration:'none' }}>
                                {p?.title || slot.article?.displayTitle}
                              </a>
                              <button
                                onClick={() => setSwapArticleSlotId(swapArticleSlotId === slot.id ? null : slot.id)}
                                title="Pick a different article to regenerate from"
                                style={{ background:'none', border:'none', cursor:'pointer', fontSize:11,
                                  color: swapArticleSlotId===slot.id ? P : MUTED,
                                  padding:'1px 5px', borderRadius:5,
                                  textDecoration:'underline', textDecorationStyle:'dotted' }}>
                                ↩ swap link
                              </button>
                              {allPlatformsApproved && (
                                <span style={{ fontSize:11, background:'#f0fdf4', color:GREEN,
                                  padding:'2px 8px', borderRadius:10, fontWeight:600 }}>
                                  ✓ All approved
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Inline article swap picker */}
                          {swapArticleSlotId === slot.id && (
                            <div style={{ marginBottom:10, padding:'12px 14px', background:PBG,
                              borderRadius:8, border:`1px solid ${PBORDER}` }}>
                              <div style={{ fontSize:12, fontWeight:600, color:TEXT, marginBottom:8 }}>
                                Pick a different article — post will regenerate automatically
                              </div>
                              <ArticlePicker
                                value={slot.article?.url || ''}
                                onChange={(url, article) => {
                                  if (article) swapArticleAndRegenerate(slot.id, article);
                                  else setSwapArticleSlotId(null);
                                }}
                                slotDate={slot.date}
                                articles={allArticles}
                              />
                              <button onClick={() => setSwapArticleSlotId(null)}
                                style={{ marginTop:8, background:'none', border:'none', cursor:'pointer',
                                  fontSize:12, color:MUTED, textDecoration:'underline' }}>
                                Cancel
                              </button>
                            </div>
                          )}

                          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', justifyContent:'flex-end' }}>
                            {((slotStatus && !slotStatus._loading) || (slot.platforms||PLATFORMS_LIST).includes('linkedin')) && (
                              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                                {slotStatus && !slotStatus._loading && Object.entries(slotStatus).map(([plat,r])=>(
                                  <StatusChip key={plat} platform={plat} result={r}
                                    onUnschedule={r?.ok ? ()=>unschedulePost(slot.id, plat) : null} />
                                ))}
                                {(slot.platforms||PLATFORMS_LIST).includes('linkedin') && (
                                  <LinkedinManualChip
                                    confirmed={!!linkedinManual[slot.id]?.confirmedAt}
                                    onUndo={()=>unconfirmLinkedinCopied(slot.id)}
                                  />
                                )}
                              </div>
                            )}
                            {slotStatus?._loading && <span style={{ fontSize:12, color:MUTED }}>Scheduling…</span>}


                            {p && !p.error && !isLoading && (
                              <button onClick={()=> hasAiImage ? setImgFeedbackSlotId(slot.id) : generateImage(slot)}
                                disabled={!!imgEntry?.loading}
                                title="Generate AI branded image"
                                style={{ ...outlineBtn, fontSize:12, padding:'5px 10px',
                                  color:'#8A47DF', borderColor:'#8A47DF', opacity:imgEntry?.loading?0.6:1 }}>
                                {imgEntry?.loading ? 'Generating…' : hasAiImage ? '🖼 Regenerate Image' : '🖼 Generate Image'}
                              </button>
                            )}

                            {p && !p.error && !isLoading && platformIncluded && (
                              <>
                                <button onClick={()=>copyPost(slot.id,field,postText)}
                                  style={{ ...outlineBtn, fontSize:12, padding:'5px 10px',
                                    color:isCopied?GREEN:undefined, borderColor:isCopied?GREEN:undefined }}>
                                  {isCopied?'Copied':'Copy'}
                                </button>
                                <button onClick={()=>regenerateSingle(slot)} disabled={!!generating}
                                  style={{ ...outlineBtn, fontSize:12, padding:'5px 10px', opacity:generating?0.5:1 }}>
                                  Regenerate
                                </button>
                                {activePlatform === 'linkedin' ? (
                                  linkedinManual[slot.id]?.confirmedAt ? (
                                    <span style={{ fontSize:12, color:GREEN, fontWeight:600, padding:'5px 10px' }}>
                                      ✓ Scheduled in LinkedIn
                                    </span>
                                  ) : (
                                    <button onClick={()=>confirmLinkedinCopied(slot.id)}
                                      style={{ ...outlineBtn, fontSize:12, padding:'5px 10px', color:'#0A66C2', borderColor:'#0A66C2' }}>
                                      ✓ Copied to LinkedIn
                                    </button>
                                  )
                                ) : (
                                  blotatoReady && !slotStatus?._loading && (
                                    <button onClick={async()=>{
                                      setScheduleStatus(prev=>({...prev,[slot.id]:{_loading:true}}));
                                      const r=await scheduleSlot(slot.id,p);
                                      setScheduleStatus(prev=>({...prev,[slot.id]:r}));
                                    }} style={{ ...outlineBtn, fontSize:12, padding:'5px 10px', color:BLUE, borderColor:BLUE }}>
                                      {slotStatus ? 'Reschedule' : 'Schedule to Blotato'}
                                    </button>
                                  )
                                )}
                                <button onClick={()=>isEditing?saveEdit(slot.id,field):startEdit(slot.id,field)}
                                  style={{ ...outlineBtn, fontSize:12, padding:'5px 10px',
                                    ...(isEditing?{color:BLUE,borderColor:BLUE}:{}) }}>
                                  {isEditing?'Save':'Edit'}
                                </button>
                                {activePlatform !== 'universal' && (() => {
                                  const plApproved = slotApproved?.platforms?.includes(activePlatform);
                                  return plApproved ? (
                                    <span style={{ fontSize:12, color:GREEN, fontWeight:600, padding:'5px 10px' }}>✓ Approved</span>
                                  ) : (
                                    <button onClick={() => approvePost(slot.id, [activePlatform])}
                                      style={{ ...outlineBtn, fontSize:12, padding:'5px 10px', color:GREEN, borderColor:GREEN }}>
                                      ✓ Approve
                                    </button>
                                  );
                                })()}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Image feedback panel */}
                        {imgFeedbackSlotId === slot.id && (
                          <div style={{ marginTop: 8, padding: '10px 12px', background: BLUE_BG, borderRadius: 8, border: `1px solid ${BORDER}` }}>
                            <div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>What should be improved? (optional)</div>
                            <textarea
                              value={imgFeedbackText}
                              onChange={e => setImgFeedbackText(e.target.value)}
                              placeholder="e.g. Use a darker background, make the stat larger, don't use Template 3..."
                              style={{ width: '100%', minHeight: 64, padding: 8, borderRadius: 6, border: `1px solid ${BORDER}`, fontSize: 12, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                              autoFocus
                            />
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                              <button onClick={() => {
                                if (imgFeedbackText.trim()) {
                                  const entry = { slotId: slot.id, articleUrl: slot.article?.url, feedback: imgFeedbackText.trim(), timestamp: new Date().toISOString() };
                                  setImageFeedbackHistory(prev => {
                                    const next = [...prev, entry];
                                    try { localStorage.setItem('innago-image-feedback', JSON.stringify(next)); } catch {}
                                    return next;
                                  });
                                }
                                generateImageWithFeedback(slot, imgFeedbackText.trim());
                                setImgFeedbackSlotId(null);
                                setImgFeedbackText('');
                              }} style={{ ...primaryBtn, fontSize: 12, padding: '6px 16px' }}>Regenerate</button>
                              <button onClick={() => { setImgFeedbackSlotId(null); setImgFeedbackText(''); }}
                                style={{ ...outlineBtn, fontSize: 12, padding: '6px 12px' }}>Cancel</button>
                            </div>
                          </div>
                        )}

                        {/* Not on this platform */}
                        {!platformIncluded && (
                          <div style={{ color:MUTED, fontSize:13, fontStyle:'italic', paddingTop:4 }}>
                            Not scheduled for {PLATFORM_LABELS[activePlatform]}
                          </div>
                        )}

                        {/* Post body */}
                        {platformIncluded && isLoading && (
                          <div style={{ display:'flex', flexDirection:'column', gap:8, paddingTop:4 }}>
                            <div style={{ height:14, background:'#f3f4f6', borderRadius:4, width:'85%', animation:'pulse 1.5s ease-in-out infinite' }} />
                            <div style={{ height:14, background:'#f3f4f6', borderRadius:4, width:'70%', animation:'pulse 1.5s ease-in-out infinite' }} />
                            <div style={{ height:14, background:'#f3f4f6', borderRadius:4, width:'45%', animation:'pulse 1.5s ease-in-out infinite' }} />
                            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
                          </div>
                        )}
                        {platformIncluded && !isLoading && !p && <div style={{ color:'#d1d5db', fontSize:14 }}>Pending</div>}
                        {platformIncluded && p?.error && (
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                            <span style={{ color:RED, fontSize:13, wordBreak:'break-word', whiteSpace:'pre-wrap' }}>{p.error}{p.detail ? ` — ${p.detail.slice(0,300)}` : ''}</span>
                            <button onClick={()=>regenerateSingle(slot)}
                              style={{ ...outlineBtn, fontSize:12, padding:'5px 10px', color:RED, borderColor:RED }}>
                              Retry
                            </button>
                          </div>
                        )}
                        {/* Hero image (scraped) */}
                        {platformIncluded && showImage && (
                          <div style={{ marginBottom:12 }}>
                            <img src={heroUrl} alt="Article hero"
                              style={{ width:'100%', maxHeight:220, objectFit:'cover', borderRadius:8, display:'block' }}
                              onError={e=>{e.target.style.display='none';}} />
                            <div style={{ fontSize:11, color:MUTED, marginTop:4 }}>
                              Scraped hero image
                              {['linkedin','facebook'].includes(activePlatform) && !slot.isFirstOfWeek && (
                                <span style={{ marginLeft:8, color:YELLOW }}>
                                  (only on first post of each week for {PLATFORM_LABELS[activePlatform]})
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* AI-generated image preview */}
                        {platformIncluded && showAiImage && (
                          <div style={{ marginBottom:12 }}>
                            <div style={{ width:280, height:280, overflow:'hidden', borderRadius:8, flexShrink:0 }}>
                              <iframe
                                srcDoc={imgEntry.html}
                                sandbox="allow-same-origin"
                                style={{
                                  width:1080, height:1080,
                                  transform:'scale(0.259)',
                                  transformOrigin:'top left',
                                  border:'none',
                                  display:'block',
                                  pointerEvents:'none',
                                }}
                                title="AI generated image preview"
                              />
                            </div>
                            <div style={{ fontSize:11, color:MUTED, marginTop:6 }}>
                              AI-generated image · Template {imgEntry.template}
                            </div>
                          </div>
                        )}

                        {/* Universal view — stacked per-platform posts with per-platform editing */}
                        {activePlatform === 'universal' && p && !p.error && !isLoading && (
                          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                            {PLATFORMS_LIST.filter(pl => !slot.platforms || slot.platforms.includes(pl)).map(pl => {
                              const plField = POST_FIELD[pl];
                              const plText = p[plField] || p.post || '';
                              const plLimit = CHAR_LIMITS[pl];
                              const plCount = plText.length;
                              const plOver = plLimit && plCount > plLimit;
                              const plNear = plLimit && plCount > plLimit * 0.9 && !plOver;
                              const plCopyKey = `${slot.id}::${plField}`;
                              const plCopied = copiedKey === plCopyKey;
                              const plEditKey = `${slot.id}::${plField}`;
                              const plEditing = editingKey === plEditKey;
                              return (
                                <div key={pl} style={{ borderRadius:8, border:`1px solid ${plOver?RED:BORDER}`,
                                  borderLeft:`3px solid ${PLATFORM_COLORS[pl]}`, padding:'10px 14px', background:BG }}>
                                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                                    <span style={{ display:'inline-flex', alignItems:'center', gap:5,
                                      fontSize:12, fontWeight:700, color:PLATFORM_COLORS[pl] }}>
                                      <span style={{ width:7, height:7, borderRadius:'50%', background:PLATFORM_COLORS[pl], display:'inline-block' }} />
                                      {PLATFORM_LABELS[pl]}
                                    </span>
                                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                                      {plLimit && plCount > 0 && (
                                        <span style={{ fontSize:11, fontWeight:500,
                                          color: plOver?RED : plNear?YELLOW : MUTED }}>
                                          {plCount}/{plLimit}{plOver && ` (+${plCount-plLimit} over)`}
                                        </span>
                                      )}
                                      <button onClick={()=>copyPost(slot.id, plField, plText)}
                                        style={{ background:'none', border:'none', cursor:'pointer',
                                          fontSize:12, color:plCopied?GREEN:MUTED, padding:'2px 6px' }}>
                                        {plCopied ? '✓ Copied' : 'Copy'}
                                      </button>
                                      <button onClick={()=>plEditing ? saveEdit(slot.id, plField) : startEdit(slot.id, plField)}
                                        style={{ background:'none', border:'none', cursor:'pointer',
                                          fontSize:12, color:plEditing?BLUE:MUTED, padding:'2px 6px', fontWeight:plEditing?600:400 }}>
                                        {plEditing ? 'Save' : 'Edit'}
                                      </button>
                                      {slotApproved?.platforms?.includes(pl) ? (
                                        <span style={{ fontSize:11, color:GREEN, fontWeight:600, padding:'2px 6px' }}>✓ Approved</span>
                                      ) : (
                                        <button onClick={() => approvePost(slot.id, [pl])}
                                          style={{ background:'none', border:'none', cursor:'pointer',
                                            fontSize:12, color:GREEN, padding:'2px 6px', fontWeight:600 }}>
                                          ✓ Approve
                                        </button>
                                      )}
                                      {pl === 'linkedin' && (
                                        linkedinManual[slot.id]?.confirmedAt ? (
                                          <span style={{ fontSize:11, color:PLATFORM_COLORS.linkedin, fontWeight:600, padding:'2px 6px' }}>
                                            ✓ Copied to LinkedIn
                                          </span>
                                        ) : (
                                          <button onClick={() => confirmLinkedinCopied(slot.id)}
                                            style={{ background:'none', border:'none', cursor:'pointer',
                                              fontSize:12, color:PLATFORM_COLORS.linkedin, padding:'2px 6px', fontWeight:600 }}>
                                            ✓ Copied to LinkedIn
                                          </button>
                                        )
                                      )}
                                    </div>
                                  </div>
                                  {plEditing ? (
                                    <textarea value={editDraft} onChange={e=>setEditDraft(e.target.value)}
                                      style={{ width:'100%', minHeight:90, padding:8, borderRadius:6,
                                        border:`1.5px solid ${PLATFORM_COLORS[pl]}`, fontSize:13, lineHeight:1.6,
                                        fontFamily:'inherit', resize:'vertical', boxSizing:'border-box', outline:'none' }}
                                      autoFocus />
                                  ) : (
                                    <p style={{ margin:0, fontSize:13, lineHeight:1.6, color:'#374151', whiteSpace:'pre-wrap' }}>
                                      {plText}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Single-platform view */}
                        {activePlatform !== 'universal' && platformIncluded && p && !p.error && !isLoading && (
                          <>
                            {isEditing ? (
                              <textarea value={editDraft} onChange={e=>setEditDraft(e.target.value)}
                                style={{ width:'100%', minHeight:100, padding:10, borderRadius:6,
                                  border:`1.5px solid ${BLUE}`, fontSize:14, lineHeight:1.6,
                                  fontFamily:'inherit', resize:'vertical', boxSizing:'border-box', outline:'none' }}
                                autoFocus />
                            ) : (
                              <p style={{ margin:0, fontSize:14, lineHeight:1.65, color:'#374151', whiteSpace:'pre-wrap' }}>
                                {postText}
                              </p>
                            )}
                            {charLimit && charCount > 0 && (
                              <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
                                <span style={{ fontSize:12, fontWeight:500,
                                  color: overLimit?RED : nearLimit?YELLOW : MUTED }}>
                                  {charCount}/{charLimit}{overLimit && ` (+${charCount-charLimit} over)`}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        {/* Delete slot — bottom of card, clearly labelled */}
                        {!generating && (
                          <div style={{ marginTop:14, paddingTop:12, borderTop:`1px solid ${BORDER}`, display:'flex', justifyContent:'flex-end', gap:8 }}>
                            {posts[slot.id] && (
                              <button
                                onClick={()=>{
                                  setPosts(p=>{ const n={...p}; delete n[slot.id]; return n; });
                                  setScheduleStatus(s=>{ const n={...s}; delete n[slot.id]; return n; });
                                }}
                                style={{ ...outlineBtn, fontSize:12, padding:'5px 12px', color:MUTED, borderColor:BORDER }}>
                                Clear Generated Text
                              </button>
                            )}
                            <button
                              onClick={async ()=>{
                                await unscheduleSlotFromBlotato(slot.id);
                                setSchedule(s=>s.filter(x=>x.id!==slot.id));
                                setPosts(p=>{ const n={...p}; delete n[slot.id]; return n; });
                                setScheduleStatus(s=>{ const n={...s}; delete n[slot.id]; return n; });
                              }}
                              style={{ ...outlineBtn, fontSize:12, padding:'5px 12px', color:RED, borderColor:RED }}>
                              Delete Slot
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function Logo() {
  return (
    <div style={{ width:32, height:32, background:BLUE, borderRadius:8,
      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <span style={{ color:'#fff', fontWeight:700, fontSize:14 }}>I</span>
    </div>
  );
}

function TabBtn({ active, onClick, children, color = BLUE }) {
  return (
    <button onClick={onClick} style={{ padding:'6px 16px', borderRadius:6, border:'none',
      cursor:'pointer', fontWeight:active?600:400, fontSize:14,
      background:active?BG:'transparent', color:active?color:MUTED }}>
      {children}
    </button>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background:'#fff', border:`1px solid ${BORDER}`, borderRadius:12, padding:24 }}>
      <h3 style={{ margin:'0 0 16px', fontSize:15, fontWeight:600, color:TEXT }}>{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginTop:14 }}>
      <div style={labelStyle}>{label}</div>
      {children}
    </div>
  );
}

function Stat({ label, value, color=TEXT }) {
  return (
    <div>
      <div style={{ fontSize:20, fontWeight:700, color }}>{value}</div>
      <div style={{ fontSize:12, color:MUTED }}>{label}</div>
    </div>
  );
}

function PlatformDot({ color }) {
  return <div style={{ width:10, height:10, borderRadius:'50%', background:color, flexShrink:0 }} />;
}

function StatusChip({ platform, result, onUnschedule }) {
  if (!result) return null;
  if (result.deleted) {
    return (
      <span style={{ fontSize:11, padding:'2px 7px', borderRadius:10, border:'1px solid #e5e7eb',
        background:'#f9fafb', color:'#9ca3af', fontWeight:600, textDecoration:'line-through' }}>
        {PLATFORM_LABELS[platform] || platform}
      </span>
    );
  }
  if (result._deleting) {
    return (
      <span style={{ fontSize:11, padding:'2px 7px', borderRadius:10, border:'1px solid #fecaca',
        background:'#fef2f2', color:RED, fontWeight:600 }}>
        Removing…
      </span>
    );
  }
  const ok = result.ok;
  const color = ok ? PLATFORM_COLORS[platform] : RED;
  const bg = ok ? '#f0fdf4' : '#fef2f2';
  const border = ok ? '#bbf7d0' : '#fecaca';
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, padding:'2px 7px',
      borderRadius:10, border:`1px solid ${border}`, background:bg, color, fontWeight:600 }}>
      {ok ? '✓' : '✗'} {PLATFORM_LABELS[platform] || platform}
      {ok && (
        <a href="https://app.blotato.com" target="_blank" rel="noreferrer"
          title="Delete from Blotato manually"
          style={{ color, fontSize:10, marginLeft:2, opacity:0.7, textDecoration:'none' }}>
          ↗
        </a>
      )}
    </span>
  );
}

// LinkedIn is posted by hand (copy/paste into LinkedIn's own scheduler),
// so its status is a manual confirmation rather than a Blotato result.
function LinkedinManualChip({ confirmed, onUndo }) {
  const color = confirmed ? PLATFORM_COLORS.linkedin : YELLOW;
  const bg = confirmed ? '#f0fdf4' : '#fffbeb';
  const border = confirmed ? '#bbf7d0' : '#fde68a';
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, padding:'2px 7px',
      borderRadius:10, border:`1px solid ${border}`, background:bg, color, fontWeight:600 }}>
      {confirmed ? '✓' : '○'} LinkedIn {confirmed ? '(manual)' : '(copy pending)'}
      {confirmed && onUndo && (
        <button onClick={onUndo} title="Undo — not actually posted yet"
          style={{ background:'none', border:'none', cursor:'pointer', padding:0,
            color, fontSize:10, marginLeft:2, opacity:0.7 }}>
          ↺
        </button>
      )}
    </span>
  );
}

// ── ArticlePicker ─────────────────────────────────────────────
// Search by topic keyword OR filter to articles relevant to a slot date.
// "By date" = shows articles whose category keywords match the season/month of slotDate.
const MONTH_HINTS = {
  1:  ['tax','1099','depreciation'],      // Jan
  2:  ['tax','1099','depreciation'],      // Feb
  3:  ['tax','deduction'],                // Mar
  4:  ['spring','turnover','vacancy'],    // Apr
  5:  ['spring','turnover','listing'],    // May
  6:  ['screening','leasing','lease'],    // Jun
  7:  ['maintenance','inspection'],       // Jul
  8:  ['maintenance','inspection'],       // Aug
  9:  ['eviction','lease','renewal'],     // Sep
  10: ['year-end','winter','heating'],    // Oct
  11: ['winter','heating','year-end'],    // Nov
  12: ['year-end','tax','depreciation'],  // Dec
};

function articleMatchesDate(article, dateStr) {
  if (!dateStr) return true;
  const month = new Date(dateStr+'T00:00:00').getMonth() + 1;
  const hints = MONTH_HINTS[month] || [];
  if (!hints.length) return true;
  const text = (article.displayTitle + ' ' + article.category + ' ' + article.url).toLowerCase();
  return hints.some(h => text.includes(h));
}

function ArticlePicker({ value, onChange, slotDate, articles }) {
  const pool = articles || ALL_ARTICLES;
  const [query, setQuery] = useState('');
  const [dateFilter, setDateFilter] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selectedArticle = value ? pool.find(a => a.url === value) : null;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = pool.filter(a => {
    const matchesQuery = !query || (a.displayTitle + ' ' + a.category).toLowerCase().includes(query.toLowerCase());
    const matchesDate = !dateFilter || articleMatchesDate(a, slotDate);
    return matchesQuery && matchesDate;
  });

  // Group filtered results by category
  const grouped = {};
  for (const a of filtered) {
    if (!grouped[a.category]) grouped[a.category] = [];
    grouped[a.category].push(a);
  }

  return (
    <div ref={ref} style={{ position:'relative' }}>
      {/* Selected state */}
      {selectedArticle && !open ? (
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
          borderRadius:8, border:`1.5px solid ${GREEN}`, background:'#f0fdf4', fontSize:13 }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:GREEN, flexShrink:0 }} />
          <span style={{ flex:1, color:TEXT, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {selectedArticle.displayTitle}
          </span>
          <span style={{ fontSize:11, color:MUTED, flexShrink:0 }}>{selectedArticle.category}</span>
          <button onClick={()=>{ onChange('', null); setQuery(''); }}
            style={{ background:'none', border:'none', cursor:'pointer', color:MUTED, fontSize:16, padding:'0 2px', lineHeight:1, flexShrink:0 }}>×</button>
        </div>
      ) : (
        <input
          value={query}
          onChange={e=>{ setQuery(e.target.value); setOpen(true); }}
          onFocus={()=>setOpen(true)}
          placeholder="Search articles by title or category…"
          style={{ ...input, borderColor: open ? BLUE : BORDER }}
        />
      )}

      {/* Search filters row */}
      {(open || !selectedArticle) && (
        <div style={{ display:'flex', gap:8, marginTop:6, alignItems:'center' }}>
          <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:12, color:MUTED }}>
            <input type="checkbox" checked={dateFilter} onChange={e=>{ setDateFilter(e.target.checked); setOpen(true); }}
              style={{ accentColor:BLUE }} />
            Suggest by posting date
            {dateFilter && slotDate && (
              <span style={{ color:BLUE }}>({new Date(slotDate+'T00:00:00').toLocaleString('default',{month:'short'})})</span>
            )}
          </label>
          <span style={{ color:MUTED, fontSize:12 }}>{filtered.length} article{filtered.length!==1?'s':''}</span>
        </div>
      )}

      {/* Dropdown results */}
      {open && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:200, marginTop:4,
          background:'#fff', border:`1px solid ${BORDER}`, borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.12)',
          maxHeight:280, overflowY:'auto' }}>
          {Object.keys(grouped).length === 0 && (
            <div style={{ padding:'16px', fontSize:13, color:MUTED, textAlign:'center' }}>No articles match.</div>
          )}
          {Object.entries(grouped).map(([cat, articles]) => (
            <div key={cat}>
              <div style={{ padding:'8px 12px 4px', fontSize:11, fontWeight:700, color:MUTED,
                textTransform:'uppercase', letterSpacing:'0.06em', background:BG, position:'sticky', top:0 }}>
                {cat}
              </div>
              {articles.map(a => (
                <button key={a.url} onClick={()=>{ onChange(a.url, a); setQuery(''); setOpen(false); }}
                  style={{ display:'block', width:'100%', textAlign:'left', padding:'8px 14px',
                    background: value===a.url ? BLUE_BG : 'transparent',
                    border:'none', cursor:'pointer', fontSize:13,
                    color: value===a.url ? BLUE : TEXT, fontWeight: value===a.url ? 600 : 400,
                    borderBottom:`1px solid ${BORDER}` }}>
                  {a.displayTitle}
                  {value===a.url && <span style={{ marginLeft:8, fontSize:11 }}>✓</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────
const labelStyle = { fontSize:12, fontWeight:600, color:MUTED, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 };
const input = { width:'100%', padding:'9px 12px', borderRadius:8, border:`1px solid ${BORDER}`, fontSize:14, boxSizing:'border-box', color:'#374151', background:'#fff', outline:'none', fontFamily:'inherit' };
const primaryBtn = { padding:'9px 20px', borderRadius:8, border:'none', background:BLUE, color:'#fff', fontWeight:600, fontSize:14, cursor:'pointer' };
const outlineBtn = { padding:'7px 16px', borderRadius:8, border:`1.5px solid ${BORDER}`, background:'#fff', color:'#374151', fontWeight:500, fontSize:14, cursor:'pointer' };
