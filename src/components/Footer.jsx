import React from 'react'
import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer>
      <div className="footer-content">
        <p>&copy; 2025 EPL News Hub</p>
        <nav>
          <ul>
            <li><Link to="/privacy-policy">Privacy Policy</Link></li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}

export default Footer