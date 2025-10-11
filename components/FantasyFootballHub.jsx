import React, { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import './FantasyFootballHub.css'

const FantasyFootballHub = () => {
  const [fplData, setFplData] = useState(null)
  const [activeTab, setActiveTab] = useState('tips')
  const [priceChanges, setPriceChanges] = useState([])
  const [topPlayers, setTopPlayers] = useState([])
  const [deadlineInfo, setDeadlineInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { darkMode } = useTheme()

  useEffect(() => {
    initializeFPLHub()
  }, [])

  const initializeFPLHub = async () => {
    try {
      setLoading(true)
      setError(null)

      if (typeof window !== 'undefined' && window.FPLDataService) {
        const service = new window.FPLDataService()
        await loadFPLData(service)
      } else {
        setTimeout(() => {
          if (window.FPLDataService) {
            const service = new window.FPLDataService()
            loadFPLData(service)
          } else {
            setError('FPL service unavailable')
            setLoading(false)
          }
        }, 1000)
      }
    } catch (err) {
      console.error('FPL Hub initialization error:', err)
      setError('Failed to load FPL data')
      setLoading(false)
    }
  }

  const loadFPLData = async (service) => {
    try {
      const bootstrapData = await service.getBootstrapData()
      setFplData(bootstrapData)

      // Get current event info
      const currentEvent = bootstrapData.events.find(event => event.is_current) || bootstrapData.events[0]
      setDeadlineInfo(currentEvent)

      // Process top players by total points
      const processedPlayers = bootstrapData.elements
        .map(player => {
          const team = bootstrapData.teams.find(t => t.id === player.team)
          const position = bootstrapData.element_types.find(p => p.id === player.element_type)
          return {
            ...player,
            team_name: team?.short_name || 'Unknown',
            position_name: position?.singular_name_short || 'Unknown',
            value_formatted: (player.now_cost / 10).toFixed(1),
            points_per_million: (player.total_points / (player.now_cost / 10)).toFixed(1)
          }
        })
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, 12)

      setTopPlayers(processedPlayers)

      // Generate mock price changes (in real app, this would come from price change API)
      const mockPriceChanges = generateMockPriceChanges(processedPlayers.slice(0, 8))
      setPriceChanges(mockPriceChanges)

      setLoading(false)
    } catch (err) {
      console.error('Error loading FPL data:', err)
      setError('Failed to load fantasy data')
      setLoading(false)
    }
  }

  const generateMockPriceChanges = (players) => {
    return players.map((player, index) => ({
      ...player,
      price_change: index % 3 === 0 ? 0.1 : index % 3 === 1 ? -0.1 : 0,
      ownership: Math.floor(Math.random() * 50) + 5
    })).filter(p => p.price_change !== 0)
  }

  const getDeadlineCountdown = () => {
    if (!deadlineInfo?.deadline_time) return 'TBD'
    
    const deadline = new Date(deadlineInfo.deadline_time)
    const now = new Date()
    const diff = deadline - now

    if (diff <= 0) return 'Deadline Passed'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const getPositionColor = (position) => {
    const colors = {
      'GKP': '#ff6b35',
      'DEF': '#00d2d3',
      'MID': '#facc15',
      'FWD': '#dc2626'
    }
    return colors[position] || '#666'
  }

  const weeklyTips = [
    {
      type: 'captain',
      title: 'Captain Pick',
      player: 'Erling Haaland',
      team: 'MCI',
      reason: 'Home fixture against struggling defense',
      confidence: 85
    },
    {
      type: 'differential',
      title: 'Differential Pick',
      player: 'Bruno Guimarães',
      team: 'NEW',
      reason: 'Great fixtures and low ownership',
      confidence: 70
    },
    {
      type: 'avoid',
      title: 'Avoid This Week',
      player: 'Mohamed Salah',
      team: 'LIV',
      reason: 'Tough away fixture and rotation risk',
      confidence: 60
    }
  ]

  const renderTipsTab = () => (
    <div className="tips-content">
      <div className="tips-header">
        <h4>This Gameweek's Recommendations</h4>
        <div className="gameweek-info">
          <span className="gameweek">GW {deadlineInfo?.id || 'TBD'}</span>
          <span className="deadline">⏰ {getDeadlineCountdown()}</span>
        </div>
      </div>

      <div className="tips-grid">
        {weeklyTips.map((tip, index) => (
          <div key={index} className={`tip-card ${tip.type}`}>
            <div className="tip-header">
              <span className="tip-type">{tip.title}</span>
              <span className="confidence">{tip.confidence}%</span>
            </div>
            <div className="tip-player">
              <span className="player-name">{tip.player}</span>
              <span className="team-badge">{tip.team}</span>
            </div>
            <p className="tip-reason">{tip.reason}</p>
          </div>
        ))}
      </div>

      <div className="quick-stats">
        <h5>Quick Stats</h5>
        <div className="stats-row">
          <div className="stat">
            <span className="stat-value">2.3M</span>
            <span className="stat-label">Active Managers</span>
          </div>
          <div className="stat">
            <span className="stat-value">63.2</span>
            <span className="stat-label">Average Score</span>
          </div>
          <div className="stat">
            <span className="stat-value">£2.1M</span>
            <span className="stat-label">Total Value</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderPriceChangesTab = () => (
    <div className="price-changes-content">
      <div className="price-header">
        <h4>Recent Price Changes</h4>
        <p className="price-note">Changes occur daily at 2:00 AM GMT</p>
      </div>

      <div className="price-changes-list">
        {priceChanges.map((player, index) => (
          <div key={index} className="price-change-item">
            <div className="player-info">
              <span className="player-name">{player.web_name}</span>
              <span className="team-name">{player.team_name}</span>
              <span 
                className="position-badge"
                style={{ backgroundColor: getPositionColor(player.position_name) }}
              >
                {player.position_name}
              </span>
            </div>
            <div className="price-info">
              <span className="current-price">£{player.value_formatted}m</span>
              <span className={`price-change ${player.price_change > 0 ? 'rise' : 'fall'}`}>
                {player.price_change > 0 ? '↗' : '↘'} £{Math.abs(player.price_change)}m
              </span>
            </div>
            <div className="ownership-info">
              <span className="ownership">{player.ownership}% owned</span>
            </div>
          </div>
        ))}
      </div>

      <div className="price-alerts">
        <h5>💡 Price Change Tips</h5>
        <ul>
          <li>Players need significant net transfers to change price</li>
          <li>Monitor ownership % and transfer trends</li>
          <li>Consider early transfers to avoid price rises</li>
        </ul>
      </div>
    </div>
  )

  const renderTopPlayersTab = () => (
    <div className="top-players-content">
      <div className="players-header">
        <h4>Top Performers This Season</h4>
        <p>Ranked by total points scored</p>
      </div>

      <div className="players-grid">
        {topPlayers.map((player, index) => (
          <div key={index} className="player-card">
            <div className="player-rank">#{index + 1}</div>
            <div className="player-details">
              <div className="player-name">{player.web_name}</div>
              <div className="player-team">{player.team_name}</div>
              <span 
                className="position-badge"
                style={{ backgroundColor: getPositionColor(player.position_name) }}
              >
                {player.position_name}
              </span>
            </div>
            <div className="player-stats">
              <div className="stat">
                <span className="stat-value">{player.total_points}</span>
                <span className="stat-label">Points</span>
              </div>
              <div className="stat">
                <span className="stat-value">£{player.value_formatted}m</span>
                <span className="stat-label">Price</span>
              </div>
              <div className="stat">
                <span className="stat-value">{player.points_per_million}</span>
                <span className="stat-label">Pts/£M</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className={`fpl-hub-container ${darkMode ? 'dark' : 'light'}`}>
        <div className="fpl-header">
          <h3>
            <span className="fpl-icon">🏆</span>
            Fantasy Premier League Hub
          </h3>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading FPL data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`fpl-hub-container ${darkMode ? 'dark' : 'light'}`}>
        <div className="fpl-header">
          <h3>
            <span className="fpl-icon">🏆</span>
            Fantasy Premier League Hub
          </h3>
        </div>
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={initializeFPLHub} className="retry-btn">
            🔄 Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`fpl-hub-container ${darkMode ? 'dark' : 'light'}`}>
      <div className="fpl-header">
        <h3>
          <span className="fpl-icon">🏆</span>
          Fantasy Premier League Hub
        </h3>
        <div className="deadline-countdown">
          <span className="countdown-label">Next Deadline:</span>
          <span className="countdown-time">{getDeadlineCountdown()}</span>
        </div>
      </div>

      <div className="fpl-tabs">
        <button 
          className={`fpl-tab ${activeTab === 'tips' ? 'active' : ''}`}
          onClick={() => setActiveTab('tips')}
        >
          💡 Weekly Tips
        </button>
        <button 
          className={`fpl-tab ${activeTab === 'prices' ? 'active' : ''}`}
          onClick={() => setActiveTab('prices')}
        >
          💰 Price Changes
        </button>
        <button 
          className={`fpl-tab ${activeTab === 'players' ? 'active' : ''}`}
          onClick={() => setActiveTab('players')}
        >
          ⭐ Top Players
        </button>
      </div>

      <div className="fpl-content">
        {activeTab === 'tips' && renderTipsTab()}
        {activeTab === 'prices' && renderPriceChangesTab()}
        {activeTab === 'players' && renderTopPlayersTab()}
      </div>
    </div>
  )
}

export default FantasyFootballHub