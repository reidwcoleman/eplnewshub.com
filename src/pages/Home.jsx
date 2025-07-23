import React from 'react'
import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="home-page">
      {/* Main Headline */}
      <section className="main_headline">
        <Link to="/article/premier-league-transfer-window-latest-rumors-07-20-2025" className="headlinelink">
          <img src="/premier-league-transfer-deadline-day-january-2025-watkins-marmoush-dorgu.avif" alt="Premier League Transfer News" />
          <h1 className="headlinelink">Premier League Transfer Window: Latest Rumors & Breaking News</h1>
        </Link>
        <p>The Premier League transfer window is in full swing with clubs across England making moves to strengthen their squads for the 2025-26 season. Manchester United are reportedly close to securing Khvicha Kvaratskhelia for €85 million, while Arsenal intensify their hunt for Benjamin Šeško. Liverpool are orchestrating a complete midfield overhaul, and Chelsea continue their spending spree with moves for Moisés Caicedo and Michael Olise. From blockbuster signings to surprise departures, this summer promises to reshape the competitive landscape of English football.</p>
      </section>

      {/* Sub Headlines */}
      <section className="sub-headlines">
        <div className="main_subheadline">
          <Link to="/article/latest-epl-news-2025-02-07" className="subheadlinelink">
            <img src="/DALL·E 2025-02-07 21.06.05 - A vibrant Premier League football scene with players celebrating a goal, showcasing the iconic stadium backdrop, the bustling crowd, and the dynamic a.webp" alt="Latest EPL News" />
            <h2>Latest EPL News & Match Highlights - February 2025</h2>
          </Link>
          <p>Comprehensive coverage of the latest Premier League action, standings, and breaking news from February 2025...</p>
        </div>

        <div className="main_subheadline2">
          <Link to="/article/nottingham-forest-rises-to-an-incredible-third-in-the-epl-standings-01-06-2025" className="subheadlinelink">
            <img src="/nottingham_forest2.webp" alt="Nottingham Forest" />
            <h2>Nottingham Forest's Incredible Rise to Third Place</h2>
          </Link>
          <p>Analyzing Forest's remarkable journey to the top of the Premier League table...</p>
        </div>

        <div className="main_subheadline3">
          <Link to="/article/Manchester-Uniteds-worst-team-in-years-20-01-2025" className="subheadlinelink">
            <img src="/DALL·E 2025-01-20 11.05.22 - A dramatic and intense football scene depicting a Manchester United player looking frustrated and defeated on the pitch. The background should show a .webp" alt="Manchester United Crisis" />
            <h2>Manchester United's Crisis Deepens</h2>
          </Link>
          <p>Examining the struggles of what many consider United's worst team in years...</p>
        </div>
      </section>

      {/* Newsletter Signup Section */}
      <section className="newsletter-section">
        <div className="newsletter-signup">
          <h2>Stay Updated with EPL News</h2>
          <p>Get the latest Premier League news, transfer updates, and match analysis delivered to your inbox.</p>
          <div className="newsletter-form">
            <input type="email" placeholder="Enter your email" />
            <button>Subscribe</button>
          </div>
        </div>
      </section>

      {/* Additional Content Sections */}
      <section className="recent-articles">
        <h2>Recent Articles</h2>
        <div className="articles-grid">
          {/* Articles will be dynamically loaded here */}
        </div>
      </section>
    </div>
  )
}

export default Home