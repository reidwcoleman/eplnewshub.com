import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getArticleById, getRecentArticles, categories } from '../data/articles'

function ArticlePage() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [articleContent, setArticleContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [relatedArticles, setRelatedArticles] = useState([])

  useEffect(() => {
    loadArticle(slug)
  }, [slug])

  const loadArticle = async (articleSlug) => {
    try {
      // Get article metadata
      const articleData = getArticleById(articleSlug)
      
      if (!articleData) {
        setArticle(null)
        setLoading(false)
        return
      }

      // Load HTML content
      const response = await fetch(`/articles/${articleSlug}.html`)
      const htmlContent = await response.text()
      
      // Extract article body content
      const bodyMatch = htmlContent.match(/<article[^>]*>(.*?)<\/article>/s) || 
                       htmlContent.match(/<body[^>]*>(.*?)<\/body>/s)
      const content = bodyMatch ? bodyMatch[1] : htmlContent

      setArticle(articleData)
      setArticleContent(content)
      setRelatedArticles(getRecentArticles(4).filter(a => a.id !== articleSlug))
      setLoading(false)
    } catch (error) {
      console.error('Error loading article:', error)
      setArticle(null)
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getCategoryInfo = (categoryName) => {
    return categories.find(cat => cat.name === categoryName) || { icon: '📰', color: '#666' }
  }

  if (loading) {
    return (
      <div className="article-loading">
        <div className="loading-spinner"></div>
        <p>Loading article...</p>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="article-not-found">
        <div className="not-found-content">
          <h1>⚽ Article Not Found</h1>
          <p>Sorry, we couldn't find the article you're looking for.</p>
          <Link to="/" className="back-home-btn">← Back to Home</Link>
        </div>
      </div>
    )
  }

  const categoryInfo = getCategoryInfo(article.category)

  return (
    <div className="article-page">
      {/* Article Header */}
      <div className="article-header">
        <div className="article-hero">
          <img src={article.image} alt={article.title} className="article-hero-image" />
          <div className="article-hero-overlay">
            <div className="article-meta-top">
              <span className="article-category" style={{ backgroundColor: categoryInfo.color }}>
                {categoryInfo.icon} {article.category}
              </span>
              <span className="article-read-time">{article.readTime}</span>
            </div>
          </div>
        </div>
        <div className="article-title-section">
          <h1 className="article-title">{article.title}</h1>
          <div className="article-meta">
            <time className="article-date">{formatDate(article.date)}</time>
            <div className="article-tags">
              {article.tags.map(tag => (
                <span key={tag} className="article-tag">#{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <article className="article-content nyt-article">
        <div className="article-excerpt">
          <p className="lead-paragraph">{article.excerpt}</p>
        </div>
        
        <div className="article-body" dangerouslySetInnerHTML={{ __html: articleContent }} />
        
        {/* Article Actions */}
        <div className="article-actions">
          <button className="action-btn like-btn">👍 Like</button>
          <button className="action-btn share-btn">📤 Share</button>
          <button className="action-btn bookmark-btn">🔖 Save</button>
        </div>
      </article>

      {/* Related Articles */}
      <section className="related-articles">
        <h3>Related Articles</h3>
        <div className="related-articles-grid">
          {relatedArticles.map(relatedArticle => (
            <Link
              key={relatedArticle.id}
              to={`/article/${relatedArticle.id}`}
              className="related-article-card"
            >
              <img src={relatedArticle.image} alt={relatedArticle.title} />
              <div className="related-article-content">
                <h4>{relatedArticle.title}</h4>
                <p>{relatedArticle.excerpt.substring(0, 100)}...</p>
                <span className="related-article-date">{formatDate(relatedArticle.date)}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

export default ArticlePage