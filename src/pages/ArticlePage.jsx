import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

function ArticlePage() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load article content based on slug
    loadArticle(slug)
  }, [slug])

  const loadArticle = async (articleSlug) => {
    try {
      // In a real app, this would fetch from an API
      // For now, we'll simulate loading article content
      const response = await fetch(`/articles/${articleSlug}.html`)
      const htmlContent = await response.text()
      
      setArticle({
        slug: articleSlug,
        content: htmlContent,
        title: extractTitle(htmlContent),
        date: extractDate(articleSlug)
      })
      setLoading(false)
    } catch (error) {
      console.error('Error loading article:', error)
      setArticle(null)
      setLoading(false)
    }
  }

  const extractTitle = (htmlContent) => {
    const titleMatch = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i)
    return titleMatch ? titleMatch[1] : 'Article'
  }

  const extractDate = (slug) => {
    const dateMatch = slug.match(/(\d{2}-\d{2}-\d{4})/)
    return dateMatch ? dateMatch[1] : new Date().toLocaleDateString()
  }

  if (loading) {
    return <div className="loading">Loading article...</div>
  }

  if (!article) {
    return <div className="error">Article not found</div>
  }

  return (
    <div className="article-page">
      <article className="nyt-article">
        <div dangerouslySetInnerHTML={{ __html: article.content }} />
      </article>
      
      {/* Related Articles Section */}
      <section className="related-articles">
        <h3>Related Articles</h3>
        <div className="related-articles-grid">
          {/* Related articles would be loaded here */}
        </div>
      </section>
    </div>
  )
}

export default ArticlePage