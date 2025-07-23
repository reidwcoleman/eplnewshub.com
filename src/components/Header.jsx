import React, { useState } from 'react'
import { Link } from 'react-router-dom'

function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const performSearch = () => {
    // Search functionality to be implemented
    console.log('Searching for:', searchQuery)
  }

  return (
    <header className="site-header">
      <div className="header-top">
        <div className="header-content">
          <div className="logo">
            <h1>EPL News Hub</h1>
            <p className="tagline">Premier League News & Analysis</p>
          </div>
          <div className="header-utils">
            <div className="search-container">
              <input 
                type="text" 
                id="search-input" 
                placeholder="Search articles..." 
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="search-btn" onClick={performSearch}>🔍</button>
              <div id="search-results" className="search-results"></div>
            </div>
            <button className="menu-btn" onClick={toggleMobileMenu}>☰</button>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="main-nav">
        <div className="nav-content">
          <ul className="nav-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/news">News</Link></li>
            <li><Link to="/stats">Stats</Link></li>
            <li><Link to="/fpl">Fantasy</Link></li>
            <li><Link to="/polls">Polls</Link></li>
            <li><Link to="/social">Social</Link></li>
          </ul>
        </div>
      </nav>
      
      {/* Mobile Sidebar Menu */}
      <div className={`mobile-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-sidebar-header">
          <h3>EPL News Hub</h3>
          <button className="close-sidebar" onClick={toggleMobileMenu}>×</button>
        </div>
        <nav className="mobile-sidebar-nav">
          <ul className="mobile-nav-links">
            <li><Link to="/signin">🔐 Sign In</Link></li>
            <li><Link to="/create-account">👤 Create Account</Link></li>
            <li><Link to="/fpl">⚽ FPL Hub</Link></li>
            <li><Link to="/live-stats">📊 Live Stats</Link></li>
            <li className="nav-divider"></li>
            <li><Link to="/">🏠 Home</Link></li>
            <li><Link to="/news">📰 News</Link></li>
            <li><Link to="/stats">📈 Stats</Link></li>
            <li><Link to="/fpl">⚽ Fantasy</Link></li>
            <li><Link to="/polls">🗳️ Polls</Link></li>
            <li><Link to="/social">💬 Social</Link></li>
          </ul>
        </nav>
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-sidebar-overlay" onClick={toggleMobileMenu}></div>
      )}
    </header>
  )
}

export default Header