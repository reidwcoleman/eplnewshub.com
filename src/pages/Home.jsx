import React from 'react'
import { Link } from 'react-router-dom'
import { getFeaturedArticles, getRecentArticles, categories } from '../data/articles'
import LiveGameStats from '../components/LiveGameStats'
import InteractiveMatchCenter from '../components/InteractiveMatchCenter'
import FantasyFootballHub from '../components/FantasyFootballHub'

function Home() {
  const featuredArticles = getFeaturedArticles()
  const recentArticles = getRecentArticles(6)
  const mainArticle = featuredArticles[0]
  const subArticles = featuredArticles.slice(1, 4)

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getCategoryInfo = (categoryName) => {
    return categories.find(cat => cat.name === categoryName) || { icon: '📰', color: '#666' }
  }

  return (
    <div className="home-page">
      {/* Hero Section with Main Article */}
      <section className="hero-section">
        {mainArticle && (
          <div className="hero-article">
            <Link to={`/article/${mainArticle.id}`} className="hero-link">
              <div className="hero-image-container">
                <img src={mainArticle.image} alt={mainArticle.title} className="hero-image" />
                <div className="hero-overlay">
                  <div className="hero-meta">
                    <span className="hero-category" style={{ backgroundColor: getCategoryInfo(mainArticle.category).color }}>
                      {getCategoryInfo(mainArticle.category).icon} {mainArticle.category}
                    </span>
                    <span className="hero-date">{formatDate(mainArticle.date)}</span>
                  </div>
                </div>
              </div>
              <div className="hero-content">
                <h1 className="hero-title">{mainArticle.title}</h1>
                <p className="hero-excerpt">{mainArticle.excerpt}</p>
                <div className="hero-stats">
                  <span className="read-time">📖 {mainArticle.readTime}</span>
                  <span className="trending">🔥 Trending</span>
                </div>
              </div>
            </Link>
          </div>
        )}
      </section>

      {/* Live Game Stats */}
      <LiveGameStats />

      {/* Interactive Match Center */}
      <InteractiveMatchCenter />

      {/* Fantasy Football Hub */}
      <FantasyFootballHub />

      {/* Featured Articles Grid */}
      <section className="featured-section">
        <h2 className="section-title">
          <span className="title-icon">⭐</span>
          Featured Stories
        </h2>
        <div className="featured-grid">
          {subArticles.map(article => (
            <Link key={article.id} to={`/article/${article.id}`} className="featured-card">
              <div className="featured-image-container">
                <img src={article.image} alt={article.title} className="featured-image" />
                <div className="featured-category" style={{ backgroundColor: getCategoryInfo(article.category).color }}>
                  {getCategoryInfo(article.category).icon}
                </div>
              </div>
              <div className="featured-content">
                <h3 className="featured-title">{article.title}</h3>
                <p className="featured-excerpt">{article.excerpt.substring(0, 120)}...</p>
                <div className="featured-meta">
                  <time className="featured-date">{formatDate(article.date)}</time>
                  <span className="featured-read-time">{article.readTime}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <h2 className="section-title">
          <span className="title-icon">📂</span>
          Browse by Category
        </h2>
        <div className="categories-grid">
          {categories.map(category => (
            <div key={category.name} className="category-card" style={{ borderColor: category.color }}>
              <div className="category-icon" style={{ backgroundColor: category.color }}>
                {category.icon}
              </div>
              <h3 className="category-name">{category.name}</h3>
              <p className="category-count">
                {recentArticles.filter(a => a.category === category.name).length} articles
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Articles */}
      <section className="recent-section">
        <h2 className="section-title">
          <span className="title-icon">📰</span>
          Latest Updates
        </h2>
        <div className="recent-grid">
          {recentArticles.map(article => (
            <Link key={article.id} to={`/article/${article.id}`} className="recent-card">
              <img src={article.image} alt={article.title} className="recent-image" />
              <div className="recent-content">
                <div className="recent-meta">
                  <span className="recent-category" style={{ color: getCategoryInfo(article.category).color }}>
                    {getCategoryInfo(article.category).icon} {article.category}
                  </span>
                  <time className="recent-date">{formatDate(article.date)}</time>
                </div>
                <h3 className="recent-title">{article.title}</h3>
                <p className="recent-excerpt">{article.excerpt.substring(0, 100)}...</p>
                <div className="recent-tags">
                  {article.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="recent-tag">#{tag}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="newsletter-cta">
        <div className="newsletter-content">
          <div className="newsletter-icon">📧</div>
          <h2>Never Miss a Goal!</h2>
          <p>Get the latest Premier League news, transfer updates, and match analysis delivered straight to your inbox.</p>
          <div className="newsletter-stats">
            <div className="stat">
              <strong>25,000+</strong>
              <span>Subscribers</span>
            </div>
            <div className="stat">
              <strong>Daily</strong>
              <span>Updates</span>
            </div>
            <div className="stat">
              <strong>100%</strong>
              <span>Free</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home