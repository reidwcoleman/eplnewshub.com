import React, { useState, useEffect } from 'react'

function NewsletterPopup() {
  const [isVisible, setIsVisible] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: ''
  })

  useEffect(() => {
    // Show popup on page load
    setIsVisible(true)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      alert('Subscription successful!')
      setIsVisible(false)
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred while subscribing.')
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const closePopup = () => {
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div id="popupForm" className="popup-overlay" style={{ display: 'block' }}>
      <div className="popup-content">
        <span className="close-btn" onClick={closePopup}>&times;</span>
        <h2>Subscribe to Our Newsletter</h2>
        <p>Stay updated with the latest Premier League news and analysis!</p>
        <form id="subscriptionForm" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="address">Address (Optional):</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
            />
          </div>
          <button type="submit" className="submit-btn">Subscribe</button>
        </form>
      </div>
    </div>
  )
}

export default NewsletterPopup