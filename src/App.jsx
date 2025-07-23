import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import ArticlePage from './pages/ArticlePage'
import NewsletterPopup from './components/NewsletterPopup'

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/article/:slug" element={<ArticlePage />} />
        </Routes>
        <Footer />
        <NewsletterPopup />
      </div>
    </Router>
  )
}

export default App