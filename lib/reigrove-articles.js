/**
 * REI Grove article pool organized by category.
 * Add your REI Grove blog/resource URLs here — the article title is fetched
 * at generation time from the page's og:title so slugs don't need to be perfect.
 */

function slugToTitle(url) {
  const slug = url.replace(/^https?:\/\/[^/]+\//, '').replace(/\/$/, '');
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export const RG_CATEGORIES = {
  'Investing Fundamentals': [
    'https://reigrove.com/blog/how-to-start-investing-in-rental-properties/',
    'https://reigrove.com/blog/cap-rate-explained-for-real-estate-investors/',
    'https://reigrove.com/blog/cash-on-cash-return-what-it-is-and-how-to-calculate-it/',
    'https://reigrove.com/blog/gross-rent-multiplier-explained/',
    'https://reigrove.com/blog/real-estate-investing-terms-every-investor-should-know/',
  ],
  'Financing & Deals': [
    'https://reigrove.com/blog/how-to-analyze-a-rental-property-deal/',
    'https://reigrove.com/blog/dscr-loans-for-real-estate-investors/',
    'https://reigrove.com/blog/hard-money-loans-vs-conventional-financing/',
    'https://reigrove.com/blog/using-a-heloc-to-invest-in-real-estate/',
    'https://reigrove.com/blog/creative-financing-strategies-for-investors/',
  ],
  'Portfolio & Strategy': [
    'https://reigrove.com/blog/how-to-scale-a-rental-portfolio/',
    'https://reigrove.com/blog/single-family-vs-multifamily-investing/',
    'https://reigrove.com/blog/building-a-real-estate-portfolio-from-scratch/',
    'https://reigrove.com/blog/real-estate-portfolio-diversification/',
    'https://reigrove.com/blog/when-to-sell-a-rental-property/',
  ],
  'Tax Strategy': [
    'https://reigrove.com/blog/real-estate-depreciation-tax-benefits/',
    'https://reigrove.com/blog/1031-exchange-guide-for-landlords/',
    'https://reigrove.com/blog/cost-segregation-study-what-investors-need-to-know/',
    'https://reigrove.com/blog/passive-income-and-taxes-what-real-estate-investors-owe/',
    'https://reigrove.com/blog/llc-vs-personal-ownership-for-rental-properties/',
  ],
  'Property Management': [
    'https://reigrove.com/blog/how-to-manage-rental-properties-remotely/',
    'https://reigrove.com/blog/self-managing-vs-hiring-a-property-manager/',
    'https://reigrove.com/blog/tenant-screening-best-practices-for-investors/',
    'https://reigrove.com/blog/how-to-reduce-rental-vacancy-rates/',
    'https://reigrove.com/blog/property-maintenance-cost-estimates-for-landlords/',
  ],
  'Market & Analysis': [
    'https://reigrove.com/blog/how-to-find-cash-flowing-rental-markets/',
    'https://reigrove.com/blog/real-estate-market-indicators-investors-should-track/',
    'https://reigrove.com/blog/neighborhood-analysis-for-rental-property-investors/',
    'https://reigrove.com/blog/population-growth-and-real-estate-demand/',
    'https://reigrove.com/blog/how-interest-rates-affect-real-estate-investing/',
  ],
};

export const RG_ALL_ARTICLES = Object.entries(RG_CATEGORIES).flatMap(([category, urls]) =>
  urls.map((url) => ({
    url,
    category,
    slug: url.replace(/^https?:\/\/[^/]+\//, '').replace(/\/$/, ''),
    displayTitle: slugToTitle(url),
  }))
);
