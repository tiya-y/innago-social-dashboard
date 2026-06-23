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

    // Strip scripts, styles, nav, footer, header
    let text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // Return up to 2500 chars — enough context for meaningful template content
    return text.slice(0, 2500);
  } catch {
    return '';
  }
}

// ── System prompt ─────────────────────────────────────────────
const IMAGE_SYSTEM_PROMPT = `You generate a complete 1080×1080px branded Instagram graphic for Innago, a free property management platform.

Return ONLY raw HTML — a single <div> wrapping all elements. No DOCTYPE, no <html>, no <head>, no <style> blocks outside inline styles, no markdown fences, no explanations. Inline styles only. The outer div must be exactly width:1080px; height:1080px; position:relative; overflow:hidden.

━━━━━━━━━━━  CRITICAL CONTENT RULE  ━━━━━━━━━━━
You will receive the article title, summary, AND full article body text.
READ THE ARTICLE BODY. Extract the most compelling stat, quote, fact, or insight from it.
DO NOT copy the social caption text. DO NOT restate the title verbatim.
The graphic must surface something concrete from inside the article — a number, a dollar figure, a percentage, a named tip, a quoted line, a data point.

━━━━━━━━━━━  BRAND TOKENS  ━━━━━━━━━━━
Primary:   #2675FF blue  |  #2E3B47 dark navy  |  #ffffff white
Accents:   #8A47DF purple  |  #44D7B6 teal/mint  |  #DDF247 lime  |  #F6B42A amber  |  #FF6D5A coral
Approved gradients ONLY:
  purple→blue:   linear-gradient(135deg,#8A47DF 0%,#2675FF 100%)
  dark social:   linear-gradient(135deg,#2E3B47 0%,#363687 45%,#2675FF 100%)
  mint solid:    linear-gradient(135deg,#44D7B6 0%,#44D7B6 100%)
FONT: font-family:'Poppins',sans-serif — weights 400/500/600/700
LOGO: <img src="INNAGO_LOGO" style="height:36px;display:block;" alt="innago"> — always present

━━━━━━━━━━━  10 TEMPLATES — PICK THE BEST ONE  ━━━━━━━━━━━

TEMPLATE 1 — BIG STAT (multiplier or ratio stat, e.g. "1.2×")
  Background: linear-gradient(135deg,#8A47DF 0%,#2675FF 100%)
  Decorations: 3 polygon clip-path shapes — one large (540px) top-right, one (400px) bottom-left, one small diamond (220px) mid-right; all in #8A47DF or rgba(255,255,255,0.08), opacity 0.18–0.22
  Eyebrow pill: background rgba(255,255,255,0.18), border 1px solid rgba(255,255,255,0.3), Poppins 600 30px white, padding 14px 36px, border-radius 999px — shows category
  Giant number: Poppins 700 220px white, line-height 0.9
  Multiplier suffix (×, B, K): Poppins 700 110px #8A47DF, same line
  Stat description: Poppins 600 48px rgba(255,255,255,0.9), max-width 760px, margin-top 32px
  Source line: Poppins 400 30px rgba(255,255,255,0.6), margin-top 16px
  Logo: position:absolute bottom:56px right:80px

TEMPLATE 2 — TESTIMONIAL (use when article has a direct user quote or review)
  Background: linear-gradient(135deg,#8A47DF 0%,#2675FF 100%)
  Decorations: 3 CSS triangles (border-trick) — top-right, bottom-right, bottom-left; rgba(255,255,255,0.05–0.07)
  Large " mark: Georgia serif, 180px, rgba(255,255,255,0.15), position:absolute top:60px left:72px
  Quote text: Poppins 400 italic 48px white, line-height 1.5, max-width 860px, margin-top 100px, z-index 2 — MUST be a real quote from the article or a compelling paraphrase
  Author line: Poppins 700 34px #44D7B6, letter-spacing 2px, margin-top 48px
  Stars row: 5× white ★ 42px + platform label Poppins 500 28px rgba(255,255,255,0.6), margin-top 20px
  Logo: position:absolute top:68px right:80px

TEMPLATE 3 — DID YOU KNOW (percentage stat, e.g. "70%")
  Background: #2675FF solid
  Decorations: circle top-right (#8A47DF gradient, 500px, opacity 0.2) + circle bottom-left (#44D7B6, 350px, opacity 0.12)
  Top row: "DID YOU KNOW?" Poppins 600 30px rgba(255,255,255,0.75), letter-spacing 3px, uppercase — left; logo right
  Giant percentage: Poppins 700 240px #DDF247 lime, line-height 0.85
  Fact text: Poppins 600 52px white, line-height 1.3, max-width 820px, margin-top 20px
  Source: Poppins 400 30px rgba(255,255,255,0.72), margin-top 16px

TEMPLATE 4 — FREE / PRODUCT (free software, pricing, feature overview)
  Background: linear-gradient(180deg,#FFFFFF 0%,#F4F5F7 100%) white
  Arc decoration: large ellipse bottom-center, gradient purple→blue, opacity 0.08
  3 floating dots: 24px, 14px, 20px circles in blue/purple/teal, top corners, opacity 0.25–0.4
  Category pill: gradient purple→blue, white text Poppins 600 30px, padding 16px 40px, border-radius 999px, margin-bottom 48px
  Giant word: Poppins 700 160px, gradient purple→blue clipped to text (-webkit-background-clip:text; -webkit-text-fill-color:transparent)
  Sub headline: Poppins 600 52px #2E3B47, margin-top 16px
  Teal divider: 80px wide, 4px tall, #44D7B6, margin 40px auto
  Description: Poppins 400 32px #69727A, max-width 700px, line-height 1.6
  Logo: position:absolute bottom:56px left:50% transform:translateX(-50%) — use blue version src="https://www.innago.com/public/logos/innago-logo-blue.svg"
  Layout: flex column center align items center, text-align center

TEMPLATE 5 — COST ALERT (eviction cost, penalty, financial risk articles)
  Background: linear-gradient(135deg,#2E3B47 0%,#363687 45%,#2675FF 100%)
  Decoration: large ellipse right side (500×700px, border-radius 50%, #8A47DF gradient, opacity 0.15)
  Logo top-left (white version), margin-bottom 56px
  Eyebrow: inline-flex with 16px white dot + Poppins 600 30px white — short category phrase
  Big cost: Poppins 700 150px white, line-height 0.9 — the dollar figure from the article
  Plus sign: Poppins 700 90px white, same line
  Fact: Poppins 600 46px white, line-height 1.3, max-width 780px, margin-top 28px
  Sub context: Poppins 400 32px rgba(255,255,255,0.55), max-width 700px, margin-top 20px, line-height 1.6
  Logo: position:absolute bottom:60px right:80px (white version)

TEMPLATE 6 — DATA COMPARISON (comparison articles, before/after, screening data)
  Background: #2675FF solid
  Decoration: diamond polygon (clip-path) top-right, 420px, #8A47DF gradient, opacity 0.25
  Logo: position:absolute top:68px right:80px
  Headline: Poppins 700 58px white, line-height 1.2, max-width 820px, margin-bottom 56px — one word or phrase in #44D7B6
  3 bar chart items, each: label Poppins 600 34px rgba(255,255,255,0.9) + percentage Poppins 700 44px (first bar #44D7B6, others white) + track 24px tall border-radius 999px, fill Poppins fills: first #44D7B6, others rgba(255,255,255,0.45) and rgba(255,255,255,0.25). Pull real data from article.
  Source: Poppins 400 26px rgba(255,255,255,0.4), margin-top 40px

TEMPLATE 7 — LANDLORD TIP (how-to, numbered lists, lease/maintenance/management tips)
  Background: linear-gradient(180deg,#FFFFFF 0%,#F4F5F7 100%) white
  Left accent bar: position:absolute left:0 top:0 width:16px height:100%, gradient linear-gradient(180deg,#2675FF 0%,#8A47DF 100%)
  Top-right circle decoration: 400px, light gradient #EEF4FF→#F4F5F7, border 2px solid #E7E7E7, position:absolute top:-80px right:-80px
  Logo (blue): top-left, margin-left 16px, margin-bottom 44px — src="https://www.innago.com/public/logos/innago-logo-blue.svg"
  Tag pill: gradient purple→blue, white Poppins 600 28px, padding 14px 36px, border-radius 999px, margin-left 16px, margin-bottom 44px — category label
  Tip title: Poppins 700 62px #2E3B47, line-height 1.2, max-width 780px, margin-left 16px, margin-bottom 48px
  3 tip items: row with numbered dot (46px circle, #2675FF bg, white Poppins 700 22px) + Poppins 500 34px #2E3B47 text — key word in #2675FF. Extract 3 real tips from article.
  Faded large number: Poppins 700 120px #E7E7E7, position:absolute right:90px bottom:160px — the count of tips
  Logo (blue): position:absolute bottom:60px left:106px

TEMPLATE 8 — MARKET GROWTH (market size, year-over-year stats, industry data)
  Background: linear-gradient(135deg,#2E3B47 0%,#363687 45%,#2675FF 100%)
  Grid overlay: position:absolute inset:0, repeating-linear-gradient grid lines 80px spacing, opacity 0.06
  Purple radial glow: top-left, 500px, opacity 0.45
  Blue radial glow: bottom-right, 600px
  Logo: position:absolute top:68px right:80px (white)
  Year/category label: Poppins 600 36px rgba(255,255,255,0.5), margin-bottom 24px
  Giant stat: Poppins 700 180px white, line-height 0.9 — suffix letter in #8A47DF (B, M, K, %)
  Stat context: Poppins 600 48px rgba(255,255,255,0.9), line-height 1.3, max-width 800px, margin-top 32px
  Arrow badge row: inline-flex, background rgba(138,71,223,0.25), border 1px solid rgba(205,174,255,0.5), border-radius 999px, padding 14px 32px, Poppins 600 30px #8A47DF — shows growth direction
  Sub label: Poppins 400 30px rgba(255,255,255,0.5), margin-left 20px

TEMPLATE 9 — FEATURE SPOTLIGHT (Innago product features, software tools, platform capabilities)
  Background: #2675FF solid
  Triangle decoration: position:absolute bottom:220px right:-60px, CSS border-trick 260px left/right transparent, 440px bottom rgba(255,255,255,0.06)
  Top row flex: logo left + feature pill right (background rgba(255,255,255,0.18), Poppins 600 30px white, padding 14px 36px, border-radius 999px)
  Headline: Poppins 700 72px white, line-height 1.15, max-width 820px, margin-bottom 40px — key word in #44D7B6 (use <em> style="font-style:normal;color:#44D7B6")
  UI mockup card: white, border-radius 24px, padding 36px 40px, shadow, flex row — icon box (100px square, light gradient, border-radius 16px, emoji icon) + text group (label Poppins 500 24px #69727A + amount Poppins 700 52px #2E3B47 + status row Poppins 600 26px #44D7B6). Use real feature data from article.
  Bottom quote strip: background rgba(255,255,255,0.12), border-radius 16px, padding 28px 36px — Poppins 400 italic 30px rgba(255,255,255,0.85) quote + Poppins 600 26px rgba(255,255,255,0.6) attribution
  Logo: position:absolute bottom:68px right:80px (white)

TEMPLATE 10 — CTA / REFERRAL (referral program, signup, getting started articles)
  Background: linear-gradient(135deg,#2675FF 0%,#8A47DF 100%)
  Blob 1: top-left, 440px circle, #44D7B6 solid, opacity 0.2
  Blob 2: bottom-right, 320px circle, rgba(255,255,255,0.08)
  Logo: position:absolute top:72px left:50% transform:translateX(-50%) (white, centered)
  White card panel: background #fff, border-radius 32px, padding 72px 80px, shadow, border 1px solid #E7E7E7, text-align center, position relative z-index 2, width 100%
    Inside card:
    Mint badge pill: #44D7B6 bg, white Poppins 600 30px, padding 16px 40px, border-radius 999px, margin-bottom 36px — action label
    CTA headline: Poppins 700 68px #2E3B47, line-height 1.15 — key word/phrase in #2675FF
    Sub copy: Poppins 400 34px #69727A, line-height 1.6, max-width 680px, margin 0 auto 52px
    CTA button: gradient purple→blue, white Poppins 600 32px, padding 26px 72px, border-radius 999px

━━━━━━━━━━━  TEMPLATE SELECTION GUIDE  ━━━━━━━━━━━
1  → article has a multiplier (1.2×, 3×, 10×) or ratio stat
2  → article contains a direct user quote, testimonial, or case study
3  → article has a percentage stat (70%, 45%, etc.) — default for general blog posts with any stat
4  → article is about free software, pricing, or a product feature overview
5  → article covers eviction cost, penalty, financial risk, legal fees
6  → article compares options, has before/after data, or multiple data points
7  → article is a tip list, how-to, numbered steps, or lease/maintenance guide
8  → article has market size data, industry growth stats, or year-labeled figures
9  → article spotlights a specific Innago feature (rent collection, screening, leases, maintenance)
10 → article is about referral program, getting started, or signing up

If none clearly fit, default to TEMPLATE 3 (Did You Know) if any number exists, else TEMPLATE 7 (Landlord Tip).

━━━━━━━━━━━  QUALITY RULES  ━━━━━━━━━━━
1. READ the article body. Extract real content — numbers, quotes, tips. Don't paraphrase the title.
2. Every template must include the INNAGO_LOGO image exactly as: <img src="INNAGO_LOGO" style="height:36px;display:block;" alt="innago">
3. Sentence case only — no ALL CAPS headlines.
4. No emojis except inside Template 9 UI mockup icon box.
5. All positions must use position:absolute on child elements when the parent is position:relative.
6. Fill the canvas — no large empty zones.`;

// ── Template selection hint ───────────────────────────────────
function getTemplateHint(title, summary, body) {
  const text = `${title} ${summary} ${body}`.toLowerCase();

  const hasMultiplier = /\d+(\.\d+)?\s*[×x]|\d+x\b/.test(text);
  const hasQuote = /[""][^""]{20,}[""]|said|testimonial|review|told us/.test(text);
  const hasPct = /\d+\s*%/.test(text);
  const isFree = /free forever|always free|no monthly fee|no cost|pricing/.test(text);
  const isEviction = /evict|court cost|legal fee|\$[\d,]+\+?\s*(cost|fee|fine|penalt)/.test(text);
  const isComparison = /vs\.?|compared to|versus|before.*after|option[s]?\b/.test(text);
  const isList = /\b(tip|step|way|mistake|\d+\s+thing|\d+\s+reason|how[\s-]to|checklist)\b/.test(title.toLowerCase());
  const isMarket = /market size|\$[\d.]+\s*b(illion)?|industry grow|projected|by 20\d\d/.test(text);
  const isFeature = /rent collection|tenant screening|lease|maintenance request|online payment|innago feature/.test(text);
  const isReferral = /referr|sign up|get started|join innago|free trial/.test(text);

  if (hasMultiplier) return 'Use TEMPLATE 1. Feature the multiplier stat as the giant number.';
  if (hasQuote)      return 'Use TEMPLATE 2. Use the most compelling quote from the article.';
  if (isEviction)    return 'Use TEMPLATE 5. Feature the dollar cost figure prominently.';
  if (isMarket)      return 'Use TEMPLATE 8. Feature the market size or growth stat.';
  if (isFree)        return 'Use TEMPLATE 4. Feature the "free" value proposition.';
  if (isFeature)     return 'Use TEMPLATE 9. Spotlight the specific Innago feature.';
  if (isReferral)    return 'Use TEMPLATE 10. Build a CTA card around the action.';
  if (isComparison)  return 'Use TEMPLATE 6. Show the comparison as a bar chart with real data points.';
  if (isList)        return 'Use TEMPLATE 7. Extract 3 concrete tips from the article body.';
  if (hasPct)        return 'Use TEMPLATE 3. Feature the percentage as the giant number.';
  return 'Use TEMPLATE 7 (default for general tips) or TEMPLATE 3 if any stat is present.';
}

const TEMPLATE_HINTS = {
  1:  'Use TEMPLATE 1. Feature the most striking multiplier, ratio, or numeric stat from the article as the giant number.',
  2:  'Use TEMPLATE 2. Find the most compelling quote or testimonial-style insight from the article.',
  3:  'Use TEMPLATE 3. Feature the most striking percentage or fraction stat from the article.',
  4:  'Use TEMPLATE 4. Frame the article around Innago\'s free value proposition.',
  5:  'Use TEMPLATE 5. Feature the biggest dollar cost or financial risk figure from the article.',
  6:  'Use TEMPLATE 6. Build a bar chart comparison using real data points from the article.',
  7:  'Use TEMPLATE 7. Extract the 3 most actionable tips or steps from the article.',
  8:  'Use TEMPLATE 8. Feature the market size, industry stat, or year-labeled growth figure.',
  9:  'Use TEMPLATE 9. Spotlight the key Innago feature or tool discussed in the article.',
  10: 'Use TEMPLATE 10. Build a CTA card around the main action the article recommends.',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { title, summary = '', content_type = 'blog post', url = '', anthropicKey, templateIndex } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  // Fetch article body so Claude can read real content
  const articleBody = await fetchArticleBody(url);

  // Cycle through all 10 templates if an index is provided; otherwise fall back to content-based selection
  const templateHint = (typeof templateIndex === 'number')
    ? TEMPLATE_HINTS[(templateIndex % 10) + 1]
    : getTemplateHint(title, summary, articleBody);

  const userPrompt = `Article title: ${title}
Content type: ${content_type}
Summary: ${summary.slice(0, 400)}

Article body (read this to extract real stats, quotes, and tips):
${articleBody || '(article body not available — use title and summary)'}

${templateHint}

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
