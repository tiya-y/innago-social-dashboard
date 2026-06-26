/**
 * POST /api/generate-image
 *
 * Generates a branded 1080×1080 Instagram graphic for an article using Claude.
 * Fetches and reads the article body so Claude can extract real stats, quotes,
 * and key facts — rather than recycling the social caption text.
 *
 * Body: { title, summary, content_type, url, anthropicKey }
 * Returns: { html: string, template: string }
 */

import Anthropic from '@anthropic-ai/sdk';

const INNAGO_LOGO_URL =
  'https://res.cloudinary.com/dam3qptkg/image/upload/v1773275475/Innago_White_transparent_2_ww7aro.png';

// ── Fetch and extract meaningful text from the article ────────
async function fetchArticleBody(url) {
  if (!url) return '';
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return '';
    const html = await res.text();

    let text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    return text.slice(0, 2500);
  } catch {
    return '';
  }
}

// ── System prompt ─────────────────────────────────────────────
const IMAGE_SYSTEM_PROMPT = `You generate a complete 1080×1080px branded Instagram graphic for Innago, a free property management platform.

Return ONLY raw HTML — a single <div> wrapping all elements. No DOCTYPE, no <html>, no <head>, no <style> blocks outside inline styles, no markdown fences, no explanations. Inline styles only. The outer div must be exactly width:1080px; height:1080px; position:relative; overflow:hidden.

━━━━━━━━━━━  STRUCTURE — NON-NEGOTIABLE  ━━━━━━━━━━━
Every graphic has EXACTLY this structure — no more, no less:
  1. Background (gradient or solid color + decorative shapes only — no text in decorations)
  2. Logo (always present)
  3. Eyebrow label — 1–4 words, small pill or plain text (OPTIONAL but common)
  4. Hero element — ONE of: a giant number/stat OR a short 3–7 word headline
  5. Descriptor — ONE short supporting line, max 9 words (OPTIONAL)

That is 3–5 elements total. NOTHING ELSE. No cards. No boxes with text inside. No comparison rows. No bullet lists. No tip lists. No UI mockups. No quote boxes. No secondary stats. No bar charts. No bottom strips. If you are tempted to add a 6th element — don't.

━━━━━━━━━━━  TEXT RULES — NON-NEGOTIABLE  ━━━━━━━━━━━
1. MAXIMUM 15 WORDS across all text on the canvas. Logo and eyebrow label excluded. Count every word before finalising.
2. Every text element uses overflow:hidden on its container. No exceptions.
3. Hero element: 1–6 words (or a single number/stat). Never a full sentence.
4. Descriptor: max 9 words. Cut ruthlessly.
5. No ALL CAPS except the eyebrow label. Sentence case everywhere else.
6. No emojis, no hashtags, no fabricated quotes.

━━━━━━━━━━━  CONTENT RULE  ━━━━━━━━━━━
Read the article body. Extract ONE compelling stat, number, or insight.
Do NOT restate the title. Do NOT copy the summary. Surface something concrete — a number, dollar figure, percentage, or a sharp 5-word insight.

━━━━━━━━━━━  BRAND TOKENS  ━━━━━━━━━━━
Primary:   #2675FF blue  |  #2E3B47 dark navy  |  #ffffff white
Accents:   #8A47DF purple  |  #44D7B6 teal/mint  |  #DDF247 lime  |  #F6B42A amber  |  #FF6D5A coral
Approved gradients ONLY:
  purple→blue:   linear-gradient(135deg,#8A47DF 0%,#2675FF 100%)
  dark social:   linear-gradient(135deg,#2E3B47 0%,#363687 45%,#2675FF 100%)
FONT: font-family:'Poppins',sans-serif — weights 400/500/600/700
LOGO: <img src="INNAGO_LOGO" style="height:36px;display:block;" alt="innago"> — always present

━━━━━━━━━━━  8 TEMPLATES  ━━━━━━━━━━━
Each template is: background + decorations + logo + eyebrow + hero + descriptor. That's it.

TEMPLATE 1 — BIG STAT
  When: article has a multiplier, ratio, or large number (e.g. "3×", "$4,000", "1,200")
  Background: linear-gradient(135deg,#8A47DF 0%,#2675FF 100%)
  Decoration: 2 large polygon clip-path shapes, rgba(255,255,255,0.08), position:absolute, no text
  Logo: position:absolute top:68px right:80px
  Eyebrow pill: rgba(255,255,255,0.18) bg, border rgba(255,255,255,0.3), Poppins 600 28px white, padding 12px 32px, border-radius 999px, position:absolute top:68px left:80px, overflow:hidden, white-space:nowrap
  Hero: giant number, Poppins 700 200px white, line-height 0.9, position:absolute, left:80px, top:220px, overflow:hidden
  Descriptor: Poppins 600 44px rgba(255,255,255,0.9), max-width 820px, position:absolute left:80px top:460px, overflow:hidden, line-height 1.3

TEMPLATE 3 — DID YOU KNOW
  When: article has a percentage stat (e.g. "70%", "1 in 3")
  Background: #2675FF solid
  Decoration: circle top-right (500px, #8A47DF, opacity 0.2) + circle bottom-left (350px, #44D7B6, opacity 0.12), no text
  Logo: position:absolute top:68px right:80px
  Eyebrow: "DID YOU KNOW?" Poppins 600 28px rgba(255,255,255,0.75), letter-spacing 3px, position:absolute top:72px left:80px, overflow:hidden
  Hero: giant percentage, Poppins 700 220px #DDF247, line-height 0.85, position:absolute left:72px top:200px, overflow:hidden
  Descriptor: Poppins 600 48px white, max-width 820px, position:absolute left:80px top:460px, line-height 1.3, overflow:hidden

TEMPLATE 4 — FREE / PRODUCT
  When: article is about free software, pricing, or product value
  Background: linear-gradient(180deg,#FFFFFF 0%,#F4F5F7 100%)
  Decoration: large ellipse bottom-center, gradient purple→blue, opacity 0.08, no text
  Logo: position:absolute top:72px left:50%, transform:translateX(-50%), src use blue version https://www.innago.com/public/logos/innago-logo-blue.svg
  Eyebrow pill: gradient purple→blue bg, white Poppins 600 28px, padding 14px 36px, border-radius 999px, position:absolute top:180px left:50%, transform:translateX(-50%), overflow:hidden, white-space:nowrap
  Hero: Poppins 700 140px, gradient purple→blue clipped to text, position:absolute top:280px left:50%, transform:translateX(-50%), text-align:center, overflow:hidden
  Descriptor: Poppins 600 40px #2E3B47, text-align:center, max-width 700px, position:absolute top:460px left:50%, transform:translateX(-50%), overflow:hidden

TEMPLATE 5 — COST ALERT
  When: article covers eviction cost, financial penalty, legal fees, or dollar risks
  Background: linear-gradient(135deg,#2E3B47 0%,#363687 45%,#2675FF 100%)
  Decoration: large ellipse right side (500×700px, #8A47DF gradient, opacity 0.15), no text
  Logo: position:absolute top:68px left:80px
  Eyebrow: Poppins 600 28px white, position:absolute top:200px left:80px, overflow:hidden, white-space:nowrap
  Hero: dollar figure, Poppins 700 160px white, line-height 0.9, position:absolute left:80px top:280px, overflow:hidden
  Descriptor: Poppins 600 44px rgba(255,255,255,0.85), max-width 740px, position:absolute left:80px top:490px, line-height 1.3, overflow:hidden

TEMPLATE 7 — LANDLORD TIP
  When: article is a how-to, tip, or advice piece
  Background: linear-gradient(180deg,#FFFFFF 0%,#F4F5F7 100%)
  Decoration: left accent bar (position:absolute left:0 top:0 width:14px height:100%, gradient linear-gradient(180deg,#2675FF,#8A47DF)) + circle top-right (400px, #EEF4FF, no text)
  Logo (blue): position:absolute top:72px left:106px, src https://www.innago.com/public/logos/innago-logo-blue.svg
  Eyebrow pill: gradient purple→blue bg, white Poppins 600 26px, padding 12px 32px, border-radius 999px, position:absolute top:180px left:106px, overflow:hidden, white-space:nowrap
  Hero: Poppins 700 72px #2E3B47, line-height 1.2, max-width 780px, position:absolute left:106px top:280px, overflow:hidden — key word in #2675FF using a span
  Descriptor: Poppins 500 36px #69727A, max-width 740px, position:absolute left:106px top:440px, line-height 1.4, overflow:hidden

TEMPLATE 8 — MARKET GROWTH
  When: article has market size, industry growth, or year-labeled stats
  Background: linear-gradient(135deg,#2E3B47 0%,#363687 45%,#2675FF 100%)
  Decoration: grid overlay (repeating-linear-gradient, opacity 0.06) + purple radial glow top-left, no text in decorations
  Logo: position:absolute top:68px right:80px (white)
  Eyebrow: year or category label, Poppins 600 32px rgba(255,255,255,0.5), position:absolute top:68px left:80px, overflow:hidden
  Hero: giant stat, Poppins 700 180px white, line-height 0.9, position:absolute left:72px top:200px — suffix letter (B, M, %) in #8A47DF using a span, overflow:hidden
  Descriptor: Poppins 600 44px rgba(255,255,255,0.9), max-width 800px, position:absolute left:80px top:430px, line-height 1.3, overflow:hidden

TEMPLATE 9 — FEATURE SPOTLIGHT
  When: article spotlights a specific Innago feature (rent collection, screening, leases, maintenance)
  Background: #2675FF solid
  Decoration: triangle bottom-right (CSS border-trick, rgba(255,255,255,0.06)), no text
  Logo: position:absolute top:68px left:80px (white)
  Eyebrow pill: rgba(255,255,255,0.18) bg, Poppins 600 28px white, padding 12px 32px, border-radius 999px, position:absolute top:68px right:80px, overflow:hidden, white-space:nowrap
  Hero: Poppins 700 80px white, line-height 1.15, max-width 820px, position:absolute left:80px top:260px, overflow:hidden — key word in #44D7B6 using a span
  Descriptor: Poppins 500 40px rgba(255,255,255,0.8), max-width 760px, position:absolute left:80px top:420px, line-height 1.4, overflow:hidden

TEMPLATE 10 — CTA
  When: article is about referral program, getting started, or signing up
  Background: linear-gradient(135deg,#2675FF 0%,#8A47DF 100%)
  Decoration: blob top-left (440px circle, #44D7B6, opacity 0.2) + blob bottom-right (320px, rgba(255,255,255,0.08)), no text
  Logo: position:absolute top:72px left:50%, transform:translateX(-50%) (white, centered)
  White card: background #fff, border-radius 32px, padding 60px 72px, position:absolute top:180px left:80px right:80px, overflow:hidden — contains eyebrow + hero + descriptor
    Eyebrow pill inside card: #44D7B6 bg, white Poppins 600 28px, padding 14px 36px, border-radius 999px, margin-bottom 32px, display:inline-block, overflow:hidden, white-space:nowrap
    Hero inside card: Poppins 700 64px #2E3B47, line-height 1.15, overflow:hidden — key word in #2675FF
    Descriptor inside card: Poppins 400 32px #69727A, line-height 1.5, max-width 640px, margin-top 24px, overflow:hidden

━━━━━━━━━━━  TEMPLATE SELECTION  ━━━━━━━━━━━
1 → multiplier, ratio, or large number stat
3 → percentage stat — DEFAULT if any number exists
4 → free software, pricing, product value
5 → eviction cost, financial penalty, dollar risk
7 → how-to, tip list, advice — DEFAULT if no stat
8 → market size, industry growth, year-labeled figures
9 → specific Innago feature
10 → referral, signup, getting started`;

// ── Template selection hint ───────────────────────────────────
function getTemplateHint(title, summary, body) {
  const text = `${title} ${summary} ${body}`.toLowerCase();

  const hasMultiplier = /\d+(\.\d+)?\s*[×x]|\d+x\b/.test(text);
  const hasPct        = /\d+\s*%/.test(text);
  const isFree        = /free forever|always free|no monthly fee|no cost|pricing/.test(text);
  const isEviction    = /evict|court cost|legal fee|\$[\d,]+\+?\s*(cost|fee|fine|penalt)/.test(text);
  const isList        = /\b(tip|step|way|mistake|\d+\s+thing|\d+\s+reason|how[\s-]to|checklist)\b/.test(title.toLowerCase());
  const isMarket      = /market size|\$[\d.]+\s*b(illion)?|industry grow|projected|by 20\d\d/.test(text);
  const isFeature     = /rent collection|tenant screening|lease|maintenance request|online payment|innago feature/.test(text);
  const isReferral    = /referr|sign up|get started|join innago|free trial/.test(text);

  if (hasMultiplier) return 'Use TEMPLATE 1. Feature the multiplier stat as the giant number.';
  if (isEviction)    return 'Use TEMPLATE 5. Feature the dollar cost figure prominently.';
  if (isMarket)      return 'Use TEMPLATE 8. Feature the market size or growth stat.';
  if (isFree)        return 'Use TEMPLATE 4. Feature the "free" value proposition.';
  if (isFeature)     return 'Use TEMPLATE 9. Spotlight the specific Innago feature.';
  if (isReferral)    return 'Use TEMPLATE 10. Build a CTA around the action.';
  if (isList)        return 'Use TEMPLATE 7. Write a sharp headline from the top tip in the article.';
  if (hasPct)        return 'Use TEMPLATE 3. Feature the percentage as the giant number.';
  return 'Use TEMPLATE 7 (default for general tips) or TEMPLATE 3 if any stat is present.';
}

const TEMPLATE_HINTS = {
  1:  'Use TEMPLATE 1. Feature the most striking multiplier, ratio, or numeric stat from the article as the giant number.',
  3:  'Use TEMPLATE 3. Feature the most striking percentage or fraction stat from the article.',
  4:  'Use TEMPLATE 4. Frame the article around Innago\'s free value proposition.',
  5:  'Use TEMPLATE 5. Feature the biggest dollar cost or financial risk figure from the article.',
  7:  'Use TEMPLATE 7. Write a sharp 4–6 word headline capturing the single best tip from the article.',
  8:  'Use TEMPLATE 8. Feature the market size, industry stat, or year-labeled growth figure.',
  9:  'Use TEMPLATE 9. Spotlight the key Innago feature or tool discussed in the article.',
  10: 'Use TEMPLATE 10. Build a CTA card around the main action the article recommends.',
};

// Map template index (0-based cycling) to valid template numbers, skipping T2 and T6
const TEMPLATE_CYCLE = [1, 3, 4, 5, 7, 8, 9, 10];

// ── Post-process: enforce overflow:hidden on all text containers ──
function enforceOverflow(html) {
  // Add overflow:hidden to every style attribute that contains font-size (text element)
  // and doesn't already have overflow:hidden
  return html.replace(
    /style="([^"]*font-size[^"]*)"/gi,
    (match, styles) => {
      if (styles.includes('overflow')) return match;
      return `style="${styles};overflow:hidden"`;
    }
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { title, summary = '', content_type = 'blog post', url = '', anthropicKey, templateIndex, feedback, feedbackHistory } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const articleBody = await fetchArticleBody(url);

  // Cycle through the 8 valid templates (no T2 or T6)
  const templateHint = (typeof templateIndex === 'number')
    ? TEMPLATE_HINTS[TEMPLATE_CYCLE[templateIndex % TEMPLATE_CYCLE.length]]
    : getTemplateHint(title, summary, articleBody);

  const feedbackSection = [
    feedbackHistory?.length > 0
      ? `Past feedback on image regenerations (mistakes to avoid):\n${feedbackHistory.slice(-10).map(f => `- ${f.feedback}`).join('\n')}`
      : '',
    feedback
      ? `Specific feedback for THIS regeneration: ${feedback}`
      : '',
  ].filter(Boolean).join('\n\n');

  const userPrompt = `Article title: ${title}
Content type: ${content_type}
Summary: ${summary.slice(0, 400)}

Article body (read this to extract real stats, quotes, and tips):
${articleBody || '(article body not available — use title and summary)'}

${templateHint}
${feedbackSection ? `\n${feedbackSection}\n` : ''}
REMINDER: The graphic must have EXACTLY 3–5 elements: background/decorations + logo + eyebrow (optional) + hero stat or headline + descriptor (optional). No cards. No lists. No boxes with text. No bar charts. No quote boxes. Max 15 words total.

The logo src must be exactly: INNAGO_LOGO
Render it as: <img src="INNAGO_LOGO" style="height:36px;display:block;" alt="innago">

Return ONLY the raw HTML <div> (1080×1080px). No DOCTYPE, no html/head/body tags, no markdown fences.`;

  try {
    const client = new Anthropic({ apiKey: anthropicKey || process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: IMAGE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    let html = msg.content[0].text.trim();
    html = html.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
    html = html.replace(/INNAGO_LOGO/g, INNAGO_LOGO_URL);

    // Enforce overflow:hidden on all text containers post-generation
    html = enforceOverflow(html);

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1080px;overflow:hidden;font-family:'Poppins',sans-serif;-webkit-font-smoothing:antialiased;}
</style>
</head>
<body>${html}</body>
</html>`;

    const templateMatch = html.match(/TEMPLATE\s+(\d+)/i);
    const template = templateMatch ? templateMatch[1] : '3';

    res.status(200).json({ html: fullHtml, template });
  } catch (err) {
    console.error('Image generation error:', err);
    res.status(500).json({ error: 'Failed to generate image', detail: err.message });
  }
}

export const config = { api: { bodyParser: true } };
