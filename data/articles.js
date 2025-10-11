// Articles data for EPL News Hub
export const articles = [
  {
    id: 'premier-league-transfer-window-latest-rumors-07-20-2025',
    title: 'Premier League Transfer Window: Latest Rumors & Breaking News',
    excerpt: 'The Premier League transfer window is in full swing with clubs across England making moves to strengthen their squads for the 2025-26 season. Manchester United are reportedly close to securing Khvicha Kvaratskhelia for €85 million, while Arsenal intensify their hunt for Benjamin Šeško.',
    image: '/premier-league-transfer-deadline-day-january-2025-watkins-marmoush-dorgu.avif',
    category: 'Transfers',
    date: '2025-07-20',
    readTime: '5 min read',
    featured: true,
    tags: ['Transfers', 'Manchester United', 'Arsenal', 'Liverpool', 'Chelsea']
  },
  {
    id: 'latest-epl-news-2025-02-07',
    title: 'Latest EPL News & Match Highlights - February 2025',
    excerpt: 'Comprehensive coverage of the latest Premier League action, standings, and breaking news from February 2025. Postecoglou defends Tottenham after Liverpool defeat, Premier League debates celebration rules.',
    image: '/DALL·E 2025-02-07 21.06.05 - A vibrant Premier League football scene with players celebrating a goal, showcasing the iconic stadium backdrop, the bustling crowd, and the dynamic a.webp',
    category: 'News',
    date: '2025-02-07',
    readTime: '4 min read',
    featured: true,
    tags: ['News', 'Tottenham', 'Liverpool', 'Match Reports']
  },
  {
    id: 'nottingham-forest-rises-to-an-incredible-third-in-the-epl-standings-01-06-2025',
    title: 'Nottingham Forest\'s Incredible Rise to Third Place',
    excerpt: 'Analyzing Forest\'s remarkable journey to the top of the Premier League table and what it means for the rest of the season.',
    image: '/nottingham_forest2.webp',
    category: 'Analysis',
    date: '2025-01-06',
    readTime: '6 min read',
    featured: true,
    tags: ['Analysis', 'Nottingham Forest', 'Premier League Table']
  },
  {
    id: 'Manchester-Uniteds-worst-team-in-years-20-01-2025',
    title: 'Manchester United\'s Crisis Deepens',
    excerpt: 'Examining the struggles of what many consider United\'s worst team in years and the challenges facing the club.',
    image: '/DALL·E 2025-01-20 11.05.22 - A dramatic and intense football scene depicting a Manchester United player looking frustrated and defeated on the pitch. The background should show a .webp',
    category: 'Analysis',
    date: '2025-01-20',
    readTime: '7 min read',
    featured: true,
    tags: ['Analysis', 'Manchester United', 'Crisis']
  },
  {
    id: 'liverpool-triumph-over-bournemouth-2025-02-02',
    title: 'Liverpool Triumph Over Bournemouth',
    excerpt: 'Match report and analysis of Liverpool\'s impressive victory against Bournemouth.',
    image: '/DALL·E 2025-02-02 17.04.58 - A Premier League soccer match scene featuring a Liverpool player celebrating a goal, with a digital scoreboard in the background showing 2-0, and an i.webp',
    category: 'Match Reports',
    date: '2025-02-02',
    readTime: '4 min read',
    featured: false,
    tags: ['Match Reports', 'Liverpool', 'Bournemouth']
  },
  {
    id: 'michal-oliver-banned-from-reffing-arsenal-games-01-27-2025',
    title: 'Michael Oliver Banned from Reffing Arsenal Games',
    excerpt: 'Breaking news on referee assignments and the controversial decision affecting Arsenal matches.',
    image: '/DALL·E 2025-01-27 17.59.55 - A dramatic depiction of a Premier League referee walking away from a football field under stormy skies, symbolizing controversy. The referee is in a t.webp',
    category: 'News',
    date: '2025-01-27',
    readTime: '3 min read',
    featured: false,
    tags: ['News', 'Arsenal', 'Referees', 'Controversy']
  },
  {
    id: 'victor-gyokeres-premier-league-giants-in-hot-pursuit-05-25-25',
    title: 'Victor Gyökeres: Premier League Giants in Hot Pursuit',
    excerpt: 'The latest on the transfer race for one of Europe\'s most sought-after strikers.',
    image: '/May 25, 2025, 06_22_37 PM.png',
    category: 'Transfers',
    date: '2025-05-25',
    readTime: '5 min read',
    featured: false,
    tags: ['Transfers', 'Victor Gyökeres', 'Strikers']
  },
  {
    id: 'why-erling-haaland-is-unstopable-in-2024-2025-season-09-17-2024',
    title: 'Why Erling Haaland is Unstoppable in 2024-2025 Season',
    excerpt: 'A deep dive into Haaland\'s incredible form and what makes him the Premier League\'s most lethal striker.',
    image: '/DALL·E 2024-09-17 20.09.01 - A dynamic image of Erling Haaland in action during a Premier League match, showing his intense focus, speed, and strength. The scene captures Haaland .webp',
    category: 'Player Focus',
    date: '2024-09-17',
    readTime: '6 min read',
    featured: false,
    tags: ['Player Focus', 'Erling Haaland', 'Manchester City', 'Goals']
  },
  {
    id: 'cole-palmers-rise-and-domination-of-the-premier-league-09-30-2024',
    title: 'Cole Palmer\'s Rise and Domination of the Premier League',
    excerpt: 'How Chelsea\'s young star has become one of the most exciting players in English football.',
    image: '/DALL·E 2024-09-30 18.55.23 - An action-packed football scene featuring Cole Palmer in Chelsea\'s blue kit, dribbling the ball with agility and focus in a Premier League match. The .webp',
    category: 'Player Focus',
    date: '2024-09-30',
    readTime: '5 min read',
    featured: false,
    tags: ['Player Focus', 'Cole Palmer', 'Chelsea', 'Rising Stars']
  }
];

// Helper functions
export const getFeaturedArticles = () => articles.filter(article => article.featured);
export const getArticlesByCategory = (category) => articles.filter(article => article.category === category);
export const getArticleById = (id) => articles.find(article => article.id === id);
export const getRecentArticles = (limit = 6) => articles.slice(0, limit);

// Categories
export const categories = [
  { name: 'News', color: '#e74c3c', icon: '📰' },
  { name: 'Transfers', color: '#3498db', icon: '↔️' },
  { name: 'Analysis', color: '#f39c12', icon: '📊' },
  { name: 'Match Reports', color: '#27ae60', icon: '⚽' },
  { name: 'Player Focus', color: '#9b59b6', icon: '👤' }
];