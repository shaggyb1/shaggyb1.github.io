/* All page content lives here. To change a project, a link or a skill, edit this file.
   live: a public website. Leave it null and the page shows liveNote instead.
   repo: the GitHub link. private:true tells visitors to ask for a walkthrough, because they get a 404 otherwise.
   sample: a public repo with part of a private project's code.
   video: a demo video file, like 'assets/upsoar-demo.mp4'. Leave it null and the screenshot shows instead.
   feature:true gives a project the large layout with sections. */

const PROJECTS = [
  {
    id: 'upsoar', tags: ['Live', 'AI'], feature: true, name: 'Upsoar', logo: 'assets/logos/upsoar.svg', shot: 'assets/shots/upsoar.jpg',
    accent: '#2ee6ff', video: null,
    kind: 'AI social media manager', status: 'Live, with paying users',
    line: 'You tell it what you want, like "plan next week", and its agent, Mello, drafts and schedules the posts.',
    sections: [
      ['What I built', 'The whole product: UI, 46 API endpoints, database, hosting and billing. Mello has 5 custom tools plus live web search. Accounts connect to Instagram, Facebook, LinkedIn, X, Threads and Bluesky over OAuth, and access tokens are encrypted with AES-256. People in India pay through Razorpay, everyone else through Stripe.'],
      ['The hard part', 'Every AI call costs money, so a flat plan could lose money on a heavy user. I priced each feature in credits by what it costs to run. Quick writing goes to a fast, cheap Claude model and deeper work goes to a smarter one, with prompt caching on top. That way no plan loses money, even at full use.'],
      ['What went wrong', 'On Windows, the embedded Postgres I used for local work could get corrupted when the dev server stopped. I moved day-to-day development to a separate hosted database and kept a reset script for the local one. There are also 64 automated tests running in CI/CD.']
    ],
    tech: 'Next.js, React, TypeScript, PostgreSQL, Claude API, Razorpay, Stripe, Vercel',
    live: { url: 'https://upsoar.in', label: 'upsoar.in' },
    repo: { url: 'https://github.com/shaggyb1/upsoar', private: true },
    sample: { url: 'https://github.com/shaggyb1/credit-meter', label: 'Credit and routing code on GitHub' },
    log: [
      ['Agent', 'Mello, with tools and live web search'],
      ['Voice', 'Brand DNA learns your voice from 3 to 10 real posts'],
      ['Tools', 'Repurpose, Trend Radar and Post Score'],
      ['Billing', 'Razorpay, Stripe, plan tiers and credits'],
      ['Launch', 'Public at upsoar.in, first paying users']
    ],
    demo: 'upsoar', demoTitle: 'Ask Mello', demoNote: 'Scripted, not the live agent.'
  },
  {
    id: 'tradewire', tags: ['Live', 'Mobile'], feature: true, name: 'TradeWire', logo: 'assets/logos/tradewire.png', shot: 'assets/shots/tradewire.jpg',
    accent: '#7df0a0',
    kind: 'Market news for Indian traders', status: 'In trial, Android and web',
    line: 'I built this for my own trading. It reads RBI, SEBI, NSE, BSE, the US Fed and other official sources directly, then tags each headline by likely impact.',
    sections: [
      ['What I built', 'An Android app and website from the same React Native code. It has option chains for Nifty, Bank Nifty and 218 F&O stocks with PCR, max pain, OI and IV, plus intraday EMA, RSI and Supertrend on SVG charts. There is no account, no ads and no tracking.'],
      ['The hard part', 'The phone can read the feeds directly, but browsers can\'t. So the website goes through small server routes while the app needs no backend at all. The tags are plain keyword rules, so the app says clearly that they are not investment advice or buy and sell signals.'],
      ['What went wrong', 'Early versions had real bugs. Older items with no date kept jumping to the top of the news, and the intraday chart ran outside market hours until I limited it to 9:15 to 15:30. Both were fixed in v1.4.']
    ],
    tech: 'React Native, Expo, TypeScript, SVG charts',
    live: { url: 'https://tradewire.expo.app', label: 'tradewire.expo.app' },
    repo: { url: 'https://github.com/shaggyb1/tradewire', private: false },
    log: [
      ['v1.0', 'Official feeds, impact tags, background alerts'],
      ['v1.1', 'Bullish and bearish indicator, news mood gauge'],
      ['v1.2', 'Watchlist, market calendar, app lock'],
      ['v1.3', 'Insights tab and index option chains'],
      ['v1.4', 'Website version from the same code, plus bug fixes'],
      ['v1.5', 'Nifty Next 50 and 218 F&O option chains, new theme'],
      ['v1.6', 'More sources, watchlist results, full-page website']
    ],
    demo: 'tradewire', demoTitle: 'Tag a headline', demoNote: 'A small sample of keyword rules. Not investment advice.'
  },
  {
    id: 'distributor', tags: ['Mobile', 'AI', 'Business'], name: 'Local Distributor', logo: 'assets/logos/local-distributor.svg', shot: 'assets/shots/distributor.jpg',
    accent: '#f4c430',
    kind: 'Grocery delivery for villages near Narkhed and Katol', status: 'Two Android apps and a website',
    note: 'A shop app, a seller app and a website in 13 Indian languages. The main feature is Parchi: you write or speak a list the way you\'d tell a shopkeeper, and it becomes a cart. If Firebase isn\'t set up, orders still work over WhatsApp.',
    tech: 'HTML, CSS, JavaScript, Firebase, Android, Claude API',
    live: null, liveNote: 'Shared as Android APKs',
    repo: { url: 'https://github.com/shaggyb1/local-distributor', private: true },
    demo: 'parchi', demoTitle: 'Write a parchi', demoNote: 'It knows a short word list. Try your own shopping list.'
  },
  {
    id: 'naad', tags: [], name: 'Naad Music', logo: 'assets/logos/naad.svg', shot: 'assets/shots/naad.jpg',
    accent: '#f77fa8',
    kind: 'Ad-free music player', status: 'In progress',
    note: 'Search Hindi, English, Punjabi, Tamil and other music, and keep your playlists across devices. I only used official sources, like the YouTube and Spotify players, iTunes previews, Audius and Jamendo, so it never rips songs. A Flutter app on the same API is next.',
    tech: 'React, TypeScript, Node.js, Express, PostgreSQL',
    live: null, liveNote: 'Not deployed yet',
    repo: { url: 'https://github.com/shaggyb1/Naad-Music', private: true },
    demo: 'naad', demoTitle: 'Play a raga', demoNote: 'Your browser makes this sound live. Naad means &ldquo;sound&rdquo;.'
  },
  {
    id: 'derma', tags: ['Business'], name: 'Derma Tracker', logo: 'assets/logos/derma.svg', shot: 'assets/shots/derma.jpg',
    accent: '#6aa8ff',
    kind: 'Treatment tracker for a skin clinic', status: 'Built',
    note: 'The clinic counted multi-session courses in a paper register and phoned each patient by hand. Now staff enter a course once, patients get a WhatsApp reminder with a booking link, and the session count updates itself. The screenshot shows sample patients.',
    tech: 'JavaScript, Node.js, Express, SQLite, WhatsApp Cloud API',
    live: null, liveNote: 'Private clinic tool',
    repo: null, repoNote: 'Not on GitHub',
    demo: 'derma', demoTitle: 'Run a course', demoNote: 'Made-up patient. Dates count from today.'
  },
  {
    id: 'consultancy', tags: ['Business'], name: 'E-Commerce Consultancy', logo: 'assets/logos/consultancy.svg', shot: 'assets/shots/consultancy.jpg',
    accent: '#ee6c4d',
    kind: 'Website for a client', status: 'Client project',
    note: 'A site for a GeM tender and marketplace consultant. Each enquiry goes straight to the owner\'s Google Sheet and email through Apps Script, so there\'s no backend to pay for.',
    tech: 'HTML, CSS, JavaScript, Google Apps Script',
    live: null, liveNote: 'No public link yet',
    repo: { url: 'https://github.com/shaggyb1/ecommerce-consultancy-website', private: true },
    demo: 'leads', demoTitle: 'Send an enquiry', demoNote: 'Nothing leaves this page.'
  },
  {
    id: 'calculator', tags: [], name: 'Calculator', logo: 'assets/logos/calculator.svg',
    accent: '#c9a2ff',
    kind: 'My first GitHub repo', status: '2022',
    note: 'In 2022 I pushed an empty file called cal.html, with the description "trying my best". I\'ve left it up. The working calculator below is the one it was supposed to become.',
    tech: 'JavaScript, no eval',
    live: null, liveNote: '',
    repo: { url: 'https://github.com/shaggyb1/Calculator', private: false },
    demo: 'calculator', demoTitle: 'Use the calculator', demoNote: 'You can type on your keyboard too.'
  }
];

/* The skills you most want a hirer to see. icon is a Devicon file name. */
const MAIN_SKILLS = [
  ['React', 'react-original'], ['Next.js', 'nextjs-original'], ['TypeScript', 'typescript-original'],
  ['JavaScript', 'javascript-original'], ['Node.js', 'nodejs-original'], ['PostgreSQL', 'postgresql-original'],
  ['React Native', 'react-original'], ['Firebase', 'firebase-original'], ['Git', 'git-original'], ['Vercel', 'vercel-original']
];

const OTHER_SKILLS = [
  ['AI', 'Claude API, agents and tool calling, prompt caching, Claude Code'],
  ['Web and data', 'HTML, CSS, Express, REST APIs, OAuth 2.0, SQLite, Google Apps Script'],
  ['Mobile', 'Expo, Android'],
  ['Tools and services', 'GitHub Actions, Vitest, Docker, Razorpay, Stripe, WhatsApp Cloud API']
];
