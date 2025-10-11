import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import ArticlePage from './pages/ArticlePage'
import NewsletterPopup from './components/NewsletterPopup'
import InstallPrompt from './components/InstallPrompt'
import { ThemeProvider } from './contexts/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/article/:slug" element={<ArticlePage />} />
          </Routes>
          <Footer />
          <NewsletterPopup />
          <InstallPrompt />
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App