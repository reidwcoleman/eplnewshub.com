import React, { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import './LiveGameStats.css'

const LiveGameStats = () => {
  const [gameData, setGameData] = useState(null)
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { darkMode, toggleTheme } = useTheme()

  useEffect(() => {
    initializeFPLService()
  }, [])

  const initializeFPLService = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check if FPL service is available globally
      if (typeof window !== 'undefined' && window.FPLDataService) {
        const service = new window.FPLDataService()
        await loadGameData(service)
      } else {
        // Fallback: Load the script dynamically
        const script = document.createElement('script')
        script.src = '/fpl-api-optimized.js'
        script.onload = async () => {
          if (window.FPLDataService) {
            const service = new window.FPLDataService()
            await loadGameData(service)
          }
        }
        script.onerror = () => {
          setError('Failed to load FPL service')
          setLoading(false)
        }
        document.head.appendChild(script)
      }
    } catch (err) {
      setError('Failed to initialize FPL service')
      setLoading(false)
    }
  }

  const loadGameData = async (service) => {
    try {
      // Load bootstrap data and fixtures
      const [bootstrapData, fixturesData] = await Promise.all([
        service.getBootstrapData(),
        service.getFixtures()
      ])

      setGameData(bootstrapData)
      
      // Filter for current gameweek fixtures
      const currentEvent = bootstrapData.events.find(event => event.is_current)
      const currentFixtures = fixturesData.filter(fixture => 
        fixture.event === currentEvent?.id && 
        (fixture.started || fixture.finished)
      ).slice(0, 6) // Show max 6 fixtures

      setFixtures(currentFixtures)
      setLoading(false)
    } catch (err) {
      console.error('Error loading game data:', err)
      setError('Failed to load live data')
      setLoading(false)
    }
  }


  const getTeamName = (teamId) => {
    if (!gameData?.teams) return 'Team'
    const team = gameData.teams.find(t => t.id === teamId)
    return team?.short_name || team?.name || 'Team'
  }

  const formatKickoffTime = (kickoffTime) => {
    if (!kickoffTime) return 'TBD'
    try {
      const date = new Date(kickoffTime)
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    } catch {
      return 'TBD'
    }
  }

  const getMatchStatus = (fixture) => {
    if (fixture.finished) return 'FT'
    if (fixture.started) return 'LIVE'
    return formatKickoffTime(fixture.kickoff_time)
  }

  const refreshData = () => {
    if (typeof window !== 'undefined' && window.FPLDataService) {
      const service = new window.FPLDataService()
      loadGameData(service)
    }
  }

  if (loading) {
    return (
      <div className={`live-stats-container ${darkMode ? 'dark' : 'light'}`}>
        <div className="stats-header">
          <h3>
            <span className="stats-icon">⚡</span>
            Live Game Stats
          </h3>
          <button onClick={toggleTheme} className="theme-toggle">
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading live data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`live-stats-container ${darkMode ? 'dark' : 'light'}`}>
        <div className="stats-header">
          <h3>
            <span className="stats-icon">⚡</span>
            Live Game Stats
          </h3>
          <button onClick={toggleTheme} className="theme-toggle">
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={refreshData} className="retry-btn">
            🔄 Retry
          </button>
        </div>
      </div>
    )
  }

  const currentEvent = gameData?.events?.find(event => event.is_current)

  return (
    <div className={`live-stats-container ${darkMode ? 'dark' : 'light'}`}>
      <div className="stats-header">
        <h3>
          <span className="stats-icon">⚡</span>
          Live Game Stats
        </h3>
        <div className="header-controls">
          <button onClick={refreshData} className="refresh-btn" title="Refresh data">
            🔄
          </button>
          <button onClick={toggleTheme} className="theme-toggle" title="Toggle theme">
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {currentEvent && (
        <div className="gameweek-info">
          <span className="gameweek-badge">
            {currentEvent.name}
          </span>
        </div>
      )}

      <div className="fixtures-grid">
        {fixtures.length > 0 ? (
          fixtures.map((fixture, index) => (
            <div key={fixture.id || index} className="fixture-card">
              <div className="teams">
                <div className="team home">
                  <span className="team-name">{getTeamName(fixture.team_h)}</span>
                  {fixture.team_h_score !== null && (
                    <span className="score">{fixture.team_h_score}</span>
                  )}
                </div>
                
                <div className="match-status">
                  <span className={`status ${fixture.started ? 'live' : 'scheduled'}`}>
                    {getMatchStatus(fixture)}
                  </span>
                  {fixture.started && !fixture.finished && (
                    <div className="live-indicator">●</div>
                  )}
                </div>
                
                <div className="team away">
                  <span className="team-name">{getTeamName(fixture.team_a)}</span>
                  {fixture.team_a_score !== null && (
                    <span className="score">{fixture.team_a_score}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-fixtures">
            <p>No live matches at the moment</p>
            <p className="sub-text">Check back during match days</p>
          </div>
        )}
      </div>

      <div className="stats-footer">
        <div className="update-info">
          <span className="update-text">
            {gameData && typeof window !== 'undefined' && window.FPLDataService ? 
              `Updated: ${new window.FPLDataService().getLastUpdateTime()}` :
              'Data from Fantasy Premier League'
            }
          </span>
        </div>
        <div className="live-badge">
          <span className="live-dot">●</span>
          LIVE
        </div>
      </div>
    </div>
  )
}

export default LiveGameStats