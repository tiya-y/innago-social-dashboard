/**
 * REI Grove content pool — real assets, articles, webinars, and podcast episodes.
 * Source: REI Grove knowledge base (reigrove.com).
 * Each entry includes a description used directly in post generation.
 */

const CONTENT = [

  // ── Promotional ───────────────────────────────────────────────
  // All promo entries point to reigrove.com/plus — the $1 trial landing page.
  // Descriptions are written as post briefs so Claude has everything it needs.

  { url: 'https://reigrove.com/plus/', category: 'Promotional',
    displayTitle: "REI Grove+ $1 Trial — Full Access for a Week",
    description: "REI Grove+ normally costs $20/month or $200/year. Right now, you can get full access for a week for $1. That includes lawyer-developed state leases and legal forms, 10 deal analysis spreadsheets, 14 financial calculators, 7 investor eBooks, the RE Sidekick AI tool, a rent estimator, a property valuation tool, and a market research tool powered by RentCast — plus a Ledgre membership for real estate accounting (a $60/year value on its own). Write a post that makes the $1 trial feel like a no-brainer for any investor sitting on the fence." },

  { url: 'https://reigrove.com/plus/', category: 'Promotional',
    displayTitle: "REI Grove+ $1 Trial — Tools Angle",
    description: "REI Grove+ is $20/month or $200/year. The $1 trial gives you 7 days of full access. Lead with a specific tool: investors can run a full deal analysis, check a rent estimate, and pull a property valuation before spending a dollar beyond the trial. Also includes 10 spreadsheet templates (BRRRR analysis, pro forma, depreciation, house flipping analysis), 14 calculators (cap rate, DSCR, ARV, 70% rule, cash-on-cash return), and the RE Sidekick AI assistant. Write a post that leads with what you can actually do with the tools in a single week." },

  { url: 'https://reigrove.com/plus/', category: 'Promotional',
    displayTitle: "REI Grove+ $1 Trial — Legal Forms Angle",
    description: "REI Grove+ is $20/month or $200/year. The $1 trial includes lawyer-developed state leases available for all 50 states plus DC, quitclaim deeds, sublease agreements, lease termination forms, rent increase notices, background check authorizations, and more. A state-specific lease alone is worth $30+ per state. Write a post that leads with the legal forms — investors who have paid an attorney to draft a lease will immediately understand the value." },

  { url: 'https://reigrove.com/plus/', category: 'Promotional',
    displayTitle: "REI Grove+ $1 Trial — Community & Education Angle",
    description: "REI Grove+ is $20/month or $200/year. The $1 trial gives you a week of full access including premium eBooks (Landlord Taxes, Evictions, Tenant Screening, How to Fill Units, Rent Collection, Increase Revenue, AI for Real Estate), deal analysis calculators, market research tools, and the RE Sidekick AI assistant — all on top of the free tier which already includes webinars, The Breakdown articles, The Rentish Podcast, and community forums. Write a post that frames this as a week to stress-test the platform before committing to a subscription." },

  // ── The Breakdown ──────────────────────────────────────────────
  { url: 'https://reigrove.com/the-breakdown/gen-z-homeownership-rate/', category: 'The Breakdown',
    displayTitle: "What's Behind Gen Z's Unprecedented Homeownership Rate",
    description: "Why Gen Z is achieving higher homeownership rates than Millennials and Gen Xers at the same age — and what this means for the U.S. housing market." },

  { url: 'https://reigrove.com/the-breakdown/cities-cracking-down-on-short-term-rentals/', category: 'The Breakdown',
    displayTitle: "Why Cities Are Cracking Down on Short-Term Rentals — And What's Next",
    description: "Why cities around the globe are implementing restrictions and bans on short-term rentals like Airbnbs and Vrbos, and the future of short-term real estate investing in the U.S." },

  { url: 'https://reigrove.com/the-breakdown/national-construction-boom-2025/', category: 'The Breakdown',
    displayTitle: "Breaking Ground: What a National Construction Boom in 2025 Could Mean for You",
    description: "A potential surge in construction on the horizon in 2025 — key predictions for U.S. housing inventory, potential effects on the market, and considerations for investors." },

  { url: 'https://reigrove.com/the-breakdown/tariffs-affect-real-estate-2025/', category: 'The Breakdown',
    displayTitle: "How Tariffs Could Continue to Affect Real Estate in 2025",
    description: "The current status of tariffs in the United States and their potential effects on the housing market — what's changed, how tariffs could impact real estate further, and what to expect." },

  { url: 'https://reigrove.com/the-breakdown/climate-changing-real-estate-3-cities/', category: 'The Breakdown',
    displayTitle: "Where Climate Is Changing Real Estate First: 3 Cities Leading the Shift",
    description: "The impact of climate risks on real estate in three U.S. cities hit by extreme weather — covering the growing home insurance crisis, property valuation impacts, and responses to climate risk." },

  { url: 'https://reigrove.com/the-breakdown/americas-housing-crisis/', category: 'The Breakdown',
    displayTitle: "Gimme Shelter: Examining America's Housing Crisis",
    description: "The ongoing housing crisis in America, what it means for property owners and renters, and the outlook for the future." },

  { url: 'https://reigrove.com/the-breakdown/investors-adjusting-2025-market-correction/', category: 'The Breakdown',
    displayTitle: "Keep Calm, Carry On: How Investors Are Adjusting to the 2025 Market Correction",
    description: "The shifting real estate investment landscape in late 2025, the quieter strategies investors are leaning into, and what it could mean for your portfolio." },

  { url: 'https://reigrove.com/the-breakdown/lower-federal-interest-rates-homebuyers/', category: 'The Breakdown',
    displayTitle: "How Lower Federal Interest Rates Are Prompting Optimism in Homebuyers",
    description: "Recent drops in interest rates from the Federal Reserve, their potential effects on mortgage rates and the U.S. housing market, and what to expect moving forward." },

  { url: 'https://reigrove.com/the-breakdown/one-big-beautiful-bill-real-estate-tax/', category: 'The Breakdown',
    displayTitle: "How the One Big Beautiful Bill May Affect Real Estate This Tax Season",
    description: "The potential impact of the One Big Beautiful Bill on the upcoming tax season — key changes for individuals and the real estate industry, and how it could alter the tax landscape." },

  { url: 'https://reigrove.com/the-breakdown/ai-powered-proptech-landlords/', category: 'The Breakdown',
    displayTitle: "Your PropTech Is Evolving: Practical Tips for Navigating an AI-Powered Industry",
    description: "The real estate AI market has already surpassed $3.65 billion. How is AI changing the real estate industry, and if you're an average rental property owner, what should you be doing in response?" },

  { url: 'https://reigrove.com/the-breakdown/21st-century-road-to-housing-act/', category: 'The Breakdown',
    displayTitle: "Affordability Is Back: What You Need to Know About the 21st Century ROAD to Housing Act",
    description: "The potential impact of the bipartisan 21st Century ROAD to Housing Act — what it is, what provisions it includes, who it affects, and its potential to move forward." },

  { url: 'https://reigrove.com/the-breakdown/iran-conflict-mortgage-rates-2026/', category: 'The Breakdown',
    displayTitle: "Why the Conflict in Iran Is Pushing Mortgage Rates Higher",
    description: "The recent conflict in Iran and its potential effects on mortgage rates and the U.S. housing market — what's happening and what's to come for the 2026 housing market." },

  // ── The Rentish Podcast ───────────────────────────────────────
  { url: 'https://reigrove.com/podcast/dscr-loans-real-estate-growth-alex-bekeza/', category: 'The Rentish Podcast',
    displayTitle: "Real Estate Growth Using DSCR Loans with Alex Bekeza",
    description: "Alex Bekeza — the most reviewed loan officer on BiggerPockets with over $100M originated — breaks down DSCR loans, how beginners can get started, common mistakes, and what to expect from the lending market heading into 2026." },

  { url: 'https://reigrove.com/podcast/brrrr-method-build-wealth-john-blatchford/', category: 'The Rentish Podcast',
    displayTitle: "The BRRRR Blueprint: How to Build Wealth in Real Estate",
    description: "John Blatchford breaks down the BRRRR Method (Buy, Rehab, Rent, Refinance, Repeat) — how to find the right property, estimate rehab costs, nail the refinance step to pull your cash back out, and repeat the process to scale." },

  { url: 'https://reigrove.com/podcast/tax-strategies-real-estate-investors-kc-chohan/', category: 'The Rentish Podcast',
    displayTitle: "Tax Strategies Every Real Estate Investor Should Know",
    description: "KC Chohan, founder of Together CFO, covers the most overlooked parts of real estate investing — tax strategy. The most common mistakes landlords make, and practical tax-saving moves for both new and experienced investors." },

  { url: 'https://reigrove.com/podcast/house-hacking-beginners-funding-equity/', category: 'The Rentish Podcast',
    displayTitle: "House Hacking for Beginners: Funding Strategies and Building Equity",
    description: "John Blatchford unpacks how house hacking can be a game-changing entry point for first-time real estate investors, focusing on smart funding strategies and proven methods for building equity from day one." },

  { url: 'https://reigrove.com/podcast/mid-term-rentals-exposed-bailey-kramer/', category: 'The Rentish Podcast',
    displayTitle: "Mid-Term Rentals EXPOSED: When They Win, When They Fail",
    description: "Bailey Kramer breaks down mid-term rentals (30-day to 6-month leases) — the real numbers, why furnishing matters more than expected, how tenant screening changes by platform, and why this is not the safe middle ground everyone assumes." },

  { url: 'https://reigrove.com/podcast/best-landlords-treat-tenants-like-customers/', category: 'The Rentish Podcast',
    displayTitle: "Why the Best Landlords Treat Tenants Like Customers",
    description: "Ray Glymph, a real estate investor with over 100 doors, explains why treating tenants like customers leads to better retention, fewer evictions, and lower turnover — and why lowering rent is often smarter than lowering standards." },

  { url: 'https://reigrove.com/podcast/house-flipping-vs-renting-mackaylee/', category: 'The Rentish Podcast',
    displayTitle: "House Flipping vs Renting: Which Strategy Builds More Wealth",
    description: "Mackaylee, who has flipped over 300 units and generates $40K/month in rent from her portfolio, shares what it's really like managing rental properties and the key factors investors should consider when evaluating a property." },

  { url: 'https://reigrove.com/podcast/revolutionizing-real-estate-ai-william-hollis/', category: 'The Rentish Podcast',
    displayTitle: "Why the Investors Winning Quietly Are Using AI",
    description: "William Hollis, founder and CEO of Raise AI, discusses the intersection of artificial intelligence and real estate investing — how AI can streamline processes and the practical advice for first-time investors." },

  { url: 'https://reigrove.com/podcast/pets-policies-fair-housing-victoria-cowart/', category: 'The Rentish Podcast',
    displayTitle: "Pets, Policies, and Fair Housing: What Landlords Need to Know",
    description: "Victoria Cowart, VP of Education at PetScreening, breaks down what landlords need to know about pets, assistance animals, and fair housing compliance — including how ESA fraud is rising and how to protect yourself." },

  { url: 'https://reigrove.com/podcast/first-time-investor-journey-levi/', category: 'The Rentish Podcast',
    displayTitle: "From First Deal to Figuring It Out: A New Investor's Journey into Real Estate",
    description: "Levi shares how he got started in real estate investing, what drew him to it, how he manages his properties today — a candid conversation about setting expectations and learning through experience." },

  { url: 'https://reigrove.com/podcast/historic-property-revitalization-john-blatchford/', category: 'The Rentish Podcast',
    displayTitle: "My First Property: Historic Building Restoration with John Blatchford",
    description: "Cincinnati real estate investor John Blatchford discusses the art of historic building restoration — how to use tax incentives and creative financing to turn neglected spaces into vibrant, modern homes." },

  { url: 'https://reigrove.com/podcast/rent-reporting-cheaper-new-homes-falling-mortgage-rates/', category: 'The Rentish Podcast',
    displayTitle: "Rent Reporting, Cheaper New Homes, and Falling Mortgage Rates",
    description: "Three major housing headlines: more renters using monthly payments to build credit; new construction now selling for nearly $40K less than existing properties; and mortgages hitting their lowest level since 2022." },

  { url: 'https://reigrove.com/podcast/trump-50-year-mortgage-government-reopening-housing/', category: 'The Rentish Podcast',
    displayTitle: "Trump's 50-Year Mortgage and What It Means for Today's Housing Market",
    description: "The federal government reopening after a 43-day shutdown and Trump's proposed 50-year mortgage plan — how the shutdown backlog could slow closings and whether ultra-long mortgages help buyers or lock them into decades of extra interest." },

  { url: 'https://reigrove.com/podcast/seller-strategies-homes-staying-market/', category: 'The Rentish Podcast',
    displayTitle: "Seller Strategies for Homes Staying on the Market",
    description: "Why homes are staying on the market longer than before — how shifting buyer behavior and current market conditions like higher mortgage rates and affordability challenges are impacting sellers and buyers alike." },

  { url: 'https://reigrove.com/podcast/cincinnati-rental-market-surges-past-chicago/', category: 'The Rentish Podcast',
    displayTitle: "Cincinnati Rental Market Surges Past Chicago: What Landlords Need to Know",
    description: "Cincinnati is now tied with Chicago as the toughest spot for Midwest renters and the second most sought-after city nationwide — what this explosive growth means for landlords and investors." },

  { url: 'https://reigrove.com/podcast/philly-security-deposit-law-lease-loopholes/', category: 'The Rentish Podcast',
    displayTitle: "Philly Security Deposit Law Shakeup: Lease Loopholes and Landlord Q&A",
    description: "Philadelphia's groundbreaking security deposit law — what these changes mean for landlords and tenants and whether this could set a national trend. Plus lease loopholes, landlord responsibilities, and late fees." },

  { url: 'https://reigrove.com/podcast/mary-ragano-first-investment-property/', category: 'The Rentish Podcast',
    displayTitle: "Taking the Leap: How Mary Ragano Bought Her First Investment Property",
    description: "Mary Ragano, Senior Marketing Leader at Innago, shares the story of her very first property — what sparked her interest in real estate, the challenges she faced as a beginner, and the key lessons she walked away with." },

  // ── Webinars ──────────────────────────────────────────────────
  { url: 'https://reigrove.com/webinars/modern-marketing-tactics-lease-faster-2025/', category: 'Webinars',
    displayTitle: "Modern Marketing Tactics to Lease Faster in 2025",
    description: "Marketing strategies today's most successful landlords use to stand out — how to build a strong rental brand, leverage underutilized listing strategies, and use new tools to streamline your leasing process." },

  { url: 'https://reigrove.com/webinars/2025-renter-data-backed-insights-win-better-tenants/', category: 'Webinars',
    displayTitle: "The 2025 Renter: Data-Backed Insights to Win Better Tenants",
    description: "Real proprietary data on what renters want in 2025 — the keys to appealing to great tenants, retaining the best tenants, and actionable insights from thousands of Innago tenants." },

  { url: 'https://reigrove.com/webinars/dscr-loans-cash-flow-based-financing-rentals/', category: 'Webinars',
    displayTitle: "DSCR Loans 101: Unlocking Cash Flow-Based Financing for Your Rentals",
    description: "How DSCR loans work and why they're a powerful tool for building a rental portfolio — whether you're new to DSCR loans or looking to refine your financing approach. With Alex Bekeza, who has originated over $100M in DSCR loans." },

  { url: 'https://reigrove.com/webinars/tax-credits-abatements-opportunity-zones-landlords/', category: 'Webinars',
    displayTitle: "Unlocking Incentives: Tax Credits, Abatements, and Opportunity Zones for Landlords",
    description: "Key financial tools and strategies that landlords can use to reduce tax liabilities and boost investment returns — tax credits, abatements, and opportunity zones explained by seasoned developer John Blatchford." },

  { url: 'https://reigrove.com/webinars/tax-prep-landlords-year-end/', category: 'Webinars',
    displayTitle: "Tax Prep for Landlords: What to Know Before Year-End",
    description: "How to organize financial records before tax time, identify deductible rental income and expenses, avoid common tax mistakes, and use simple year-end tools to streamline bookkeeping and reporting." },

  { url: 'https://reigrove.com/webinars/rent-collection-costly-mistakes/', category: 'Webinars',
    displayTitle: "Rent Collection Exposed: How to Avoid Costly Mistakes",
    description: "The real risks and rewards of today's most common payment methods — from cash and checks to apps and online tools. What truly works, what puts you at risk, and which approach delivers the most reliable results." },

  { url: 'https://reigrove.com/webinars/hidden-tax-strategies-business-owners/', category: 'Webinars',
    displayTitle: "Hidden Tax Strategies: What Every Business Owner Should Know",
    description: "How to maximize deductions, approach taxes with a keen eye, and tackle tax season with the strategies most real estate professionals don't know about. With KC Chohan of Together CFO." },

  { url: 'https://reigrove.com/webinars/cost-segregation-basics-property-owners/', category: 'Webinars',
    displayTitle: "Cost Segregation 101: Basics for Property Owners",
    description: "The basics of cost segregation and how it can help investors during tax season — explained by Sean Lustyan and Gregory DiNardo of SegTax." },

  { url: 'https://reigrove.com/webinars/ai-landlords-smarter-property-management-2026/', category: 'Webinars',
    displayTitle: "AI for Landlords: Smarter Property Management in 2026",
    description: "How to leverage AI for your rental business — the best ways to maximize AI to streamline and enhance your operations, with AI expert William Hollis." },

  { url: 'https://reigrove.com/webinars/diy-taxes-cpa-when-landlords-bring-in-pro/', category: 'Webinars',
    displayTitle: "From DIY Taxes to CPA-Backed Confidence: When Landlords Should Bring in a Pro",
    description: "When it makes sense to bring in a CPA for your real estate taxes — how to know when you've outgrown DIY and what a professional can find that you're likely leaving on the table." },

  { url: 'https://reigrove.com/webinars/real-estate-tax-checklist-get-it-right/', category: 'Webinars',
    displayTitle: "Time's Almost Up: The Real Estate Tax Checklist to Get It Right",
    description: "Practical advice for tax season — what you need to get taxes done right quickly, from SegTax experts Sean Lustyan and Gregory DiNardo." },

  { url: 'https://reigrove.com/webinars/modern-pet-esa-policy-playbook/', category: 'Webinars',
    displayTitle: "The Modern Pet and ESA Policy Playbook",
    description: "72% of renters own pets, but most independent landlords have outdated or nonexistent pet policies. Victoria Cowart of PetScreening gives landlords the playbook to handle pet policy and ESA requests correctly — and avoid Fair Housing violations." },

  // ── Data Reports ──────────────────────────────────────────────
  { url: 'https://reigrove.com/reports/2025-innago-feature-usage-report/', category: 'Data Reports',
    displayTitle: "2025 Innago Feature Usage Report",
    description: "Platform-wide usage data from July 2024 to June 2025, measuring feature trends and impact, with survey data from 4,500+ active tenants." },

  { url: 'https://reigrove.com/reports/2026-market-outlook-report/', category: 'Data Reports',
    displayTitle: "2026 Market Outlook Report",
    description: "Based on a survey of 400 Innago landlords — investor sentiment, portfolio plans, market hotspots, and how AI is shaping decisions heading into 2026." },

  { url: 'https://reigrove.com/reports/2026-tenant-screening-report/', category: 'Data Reports',
    displayTitle: "2026 Tenant Screening Report",
    description: "Based on real data from Innago users — demonstrates the true value of tenant screening on your rental portfolio." },

  { url: 'https://reigrove.com/reports/2026-tenant-preferences-report/', category: 'Data Reports',
    displayTitle: "2026 Tenant Preferences Report",
    description: "Survey data from 3,450 active tenants and 470 landlords on tenant trends and preferences for amenities, technology, and more." },

  // ── Spreadsheets & Tools ──────────────────────────────────────
  { url: 'https://reigrove.com/resources/deal-analysis-spreadsheet/', category: 'Spreadsheets & Tools',
    displayTitle: "Deal Analysis Spreadsheet",
    description: "Calculate an amortization schedule, annual summary, and KPIs for a potential rental property given details about its acquisition costs, holding assumptions, and disposition." },

  { url: 'https://reigrove.com/resources/rental-property-analysis-spreadsheet/', category: 'Spreadsheets & Tools',
    displayTitle: "Rental Property Analysis Spreadsheet",
    description: "Develop a purchase decision and cash flow analysis for a potential rental property." },

  { url: 'https://reigrove.com/resources/brrrr-analysis-spreadsheet/', category: 'Spreadsheets & Tools',
    displayTitle: "BRRRR Analysis Spreadsheet",
    description: "Break down the components of the BRRRR method for a particular property, including a purchase and refinance analysis." },

  { url: 'https://reigrove.com/resources/pro-forma-spreadsheet/', category: 'Spreadsheets & Tools',
    displayTitle: "Pro Forma Spreadsheet",
    description: "Generate a five-year projected breakdown of revenue and expenses for a rental property." },

  { url: 'https://reigrove.com/resources/house-flipping-analysis-spreadsheet/', category: 'Spreadsheets & Tools',
    displayTitle: "House Flipping Analysis Spreadsheet",
    description: "Analyze the costs and profits of a potential house flipping project." },

  { url: 'https://reigrove.com/resources/real-estate-depreciation-spreadsheet/', category: 'Spreadsheets & Tools',
    displayTitle: "Real Estate Depreciation Spreadsheet",
    description: "Calculate a straight-line depreciation schedule for real property based on its cost basis." },

  { url: 'https://reigrove.com/resources/comparative-market-analysis-spreadsheet/', category: 'Spreadsheets & Tools',
    displayTitle: "Comparative Market Analysis Spreadsheet",
    description: "Track details and key metrics for real estate comparables relative to a reference property." },

  { url: 'https://reigrove.com/resources/tenant-scoring-system-spreadsheet/', category: 'Spreadsheets & Tools',
    displayTitle: "Tenant Scoring System Spreadsheet",
    description: "Choose the most qualified tenant by comparing applicants with a point-based scoring system." },

  { url: 'https://reigrove.com/resources/rental-income-expenses-spreadsheet/', category: 'Spreadsheets & Tools',
    displayTitle: "Rental Income and Expenses Spreadsheet",
    description: "Track and total your rental income, expenses, and security deposits with a profit/loss report." },

  { url: 'https://reigrove.com/resources/replacement-reserve-spreadsheet/', category: 'Spreadsheets & Tools',
    displayTitle: "Replacement Reserve Spreadsheet",
    description: "Track common building components that wear out over time and their replacement costs." },

  // ── Calculators ───────────────────────────────────────────────
  { url: 'https://reigrove.com/calculators/cap-rate/', category: 'Calculators',
    displayTitle: "Cap Rate Calculator",
    description: "Measures how quickly an investor can make back what they spend on an investment property." },

  { url: 'https://reigrove.com/calculators/cash-on-cash-return/', category: 'Calculators',
    displayTitle: "Cash-on-Cash Return Calculator",
    description: "Calculates the ratio of what you earn from a rental property to the initial capital you invested." },

  { url: 'https://reigrove.com/calculators/dscr/', category: 'Calculators',
    displayTitle: "Debt Service Coverage Ratio (DSCR) Calculator",
    description: "Assesses a borrower's ability to pay off their debts — a key metric lenders use for DSCR loans." },

  { url: 'https://reigrove.com/calculators/arv-after-repair-value/', category: 'Calculators',
    displayTitle: "ARV (After Repair Value) Calculator",
    description: "Calculates the fair market value of a property after all renovations, repairs, and improvements are completed." },

  { url: 'https://reigrove.com/calculators/70-percent-rule/', category: 'Calculators',
    displayTitle: "70% Rule Calculator",
    description: "Determines the maximum amount you should invest in a flip based on its expected post-rehab value." },

  { url: 'https://reigrove.com/calculators/noi/', category: 'Calculators',
    displayTitle: "NOI (Net Operating Income) Calculator",
    description: "Gauges an investment property's profitability by measuring income after regular monthly expenses are subtracted." },

  { url: 'https://reigrove.com/calculators/irr/', category: 'Calculators',
    displayTitle: "IRR (Internal Rate of Return) Calculator",
    description: "Estimates the interest you'll earn on each dollar invested in rental property over its holding period." },

  { url: 'https://reigrove.com/calculators/gross-rent-multiplier/', category: 'Calculators',
    displayTitle: "Gross Rent Multiplier Calculator",
    description: "Determines the ratio of a property's market value to its yearly gross rental income." },

  { url: 'https://reigrove.com/calculators/roi/', category: 'Calculators',
    displayTitle: "ROI Calculator",
    description: "Measures profitability of an investment based on percentage of profit relative to the initial investment." },

  { url: 'https://reigrove.com/calculators/annual-net-cash-flow/', category: 'Calculators',
    displayTitle: "Annual Net Cash Flow Calculator",
    description: "Measures the amount of money your property generates yearly after expenses and debt are subtracted." },

  { url: 'https://reigrove.com/calculators/1-percent-rule/', category: 'Calculators',
    displayTitle: "1% Rule Calculator",
    description: "Approximates the minimum monthly rent required for a property's income to equal or exceed its mortgage." },

  { url: 'https://reigrove.com/calculators/mortgage-payment/', category: 'Calculators',
    displayTitle: "Mortgage Payment Calculator",
    description: "Estimates your monthly loan payment and amortization schedule." },

  // ── eBooks & Guides ───────────────────────────────────────────
  { url: 'https://reigrove.com/resources/landlords-guide-to-ai-for-real-estate/', category: 'eBooks & Guides',
    displayTitle: "Landlords' Guide to AI for Real Estate",
    description: "An introduction to AI for landlords: what it can do, how it's being used in real estate today, and where to start." },

  { url: 'https://reigrove.com/resources/landlord-taxes-ebook/', category: 'eBooks & Guides',
    displayTitle: "Landlord Taxes eBook",
    description: "A plain-English guide to navigating the complexities of rental property taxation." },

  { url: 'https://reigrove.com/resources/evictions-ebook/', category: 'eBooks & Guides',
    displayTitle: "Evictions eBook",
    description: "A guide to understanding the evictions process, avoiding evictions, and properly navigating legal proceedings when necessary." },

  { url: 'https://reigrove.com/resources/how-to-fill-units-ebook/', category: 'eBooks & Guides',
    displayTitle: "How to Fill Units eBook",
    description: "Strategies for filling rental units — audience targeting, listing creation, rental marketing, staging, and showings." },

  { url: 'https://reigrove.com/resources/tenant-screening-ebook/', category: 'eBooks & Guides',
    displayTitle: "Tenant Screening eBook",
    description: "Covers the qualities of a great tenant, types of screening, fair housing compliance, and the overall screening process." },

  { url: 'https://reigrove.com/resources/rent-collection-ebook/', category: 'eBooks & Guides',
    displayTitle: "Rent Collection eBook",
    description: "Covers why efficient rent collection matters, different collection methods, and how to handle non-payment situations." },

  { url: 'https://reigrove.com/resources/increase-revenue-ebook/', category: 'eBooks & Guides',
    displayTitle: "Increase Revenue eBook",
    description: "Tips, tricks, and strategies to help landlords make more money and increase the value of their investments." },

  // ── Checklists & Forms ────────────────────────────────────────
  { url: 'https://reigrove.com/resources/first-time-landlord-checklist/', category: 'Checklists & Forms',
    displayTitle: "First-Time Landlord Checklist",
    description: "Organize the most important tasks for new landlords just getting started." },

  { url: 'https://reigrove.com/resources/tenant-screening-checklist/', category: 'Checklists & Forms',
    displayTitle: "Tenant Screening Checklist",
    description: "Ensure you conduct robust screening and remain objective when considering potential tenants." },

  { url: 'https://reigrove.com/resources/rental-property-inspection-checklist/', category: 'Checklists & Forms',
    displayTitle: "Rental Property Inspection Checklist",
    description: "Track before and after condition of properties and keep your rentals in top shape." },

  { url: 'https://reigrove.com/resources/tenant-turnover-checklist/', category: 'Checklists & Forms',
    displayTitle: "Tenant Turnover Checklist",
    description: "Stay organized and ensure your rental is ready to attract new tenants after a move-out." },

  { url: 'https://reigrove.com/resources/risk-management-checklist/', category: 'Checklists & Forms',
    displayTitle: "Risk Management Checklist",
    description: "Identify risks and vulnerabilities across your rental properties." },

  { url: 'https://reigrove.com/resources/rental-property-tax-checklist/', category: 'Checklists & Forms',
    displayTitle: "Rental Property Tax Checklist",
    description: "Organize the documents and files you'll need for tax season as a landlord." },

  { url: 'https://reigrove.com/resources/house-flipping-checklist/', category: 'Checklists & Forms',
    displayTitle: "House Flipping Checklist",
    description: "Hold yourself accountable through the house flipping process from acquisition to sale." },

  { url: 'https://reigrove.com/resources/home-buying-legal-checklist/', category: 'Checklists & Forms',
    displayTitle: "Home Buying Legal Checklist",
    description: "Track important legal priorities in the approximate order they occur in the home buying process." },

  { url: 'https://reigrove.com/resources/short-term-rental-furnishings-checklist/', category: 'Checklists & Forms',
    displayTitle: "Short-/Medium-Term Rental Furnishings Checklist",
    description: "Keep track of all the necessary furnishings room by room to stay ahead of the competition." },

  { url: 'https://reigrove.com/resources/seasonal-property-maintenance-checklist/', category: 'Checklists & Forms',
    displayTitle: "Seasonal Property Maintenance Checklist",
    description: "Ensure proper maintenance throughout the year and avoid miscommunication while assigning tasks." },

];

// Build CATEGORIES object for the UI dropdown
export const RG_CATEGORIES = CONTENT.reduce((acc, item) => {
  if (!acc[item.category]) acc[item.category] = [];
  acc[item.category].push(item.url);
  return acc;
}, {});

// Full article list with descriptions
export const RG_ALL_ARTICLES = CONTENT.map(item => ({
  url: item.url,
  category: item.category,
  displayTitle: item.displayTitle,
  description: item.description,
  slug: item.url.replace(/^https?:\/\/[^/]+\/[^/]+\//, '').replace(/\/$/, ''),
}));
