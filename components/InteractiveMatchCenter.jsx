import React, { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import './InteractiveMatchCenter.css'

const InteractiveMatchCenter = () => {
  const [matchData, setMatchData] = useState(null)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [liveMatches, setLiveMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { darkMode } = useTheme()

  useEffect(() => {
    initializeMatchCenter()
    // Update every 30 seconds for live matches
    const interval = setInterval(initializeMatchCenter, 30000)
    return () => clearInterval(interval)
  }, [])

  const initializeMatchCenter = async () => {
    try {
      setLoading(true)
      setError(null)

      // Wait for FPL service to be available
      if (typeof window !== 'undefined' && window.FPLDataService) {
        const service = new window.FPLDataService()
        await loadMatchData(service)
      } else {
        setTimeout(() => {
          if (window.FPLDataService) {
            const service = new window.FPLDataService()
            loadMatchData(service)
          } else {
            setError('Match data service unavailable')
            setLoading(false)
          }
        }, 1000)
      }
    } catch (err) {
      console.error('Match center initialization error:', err)
      setError('Failed to load match data')
      setLoading(false)
    }
  }

  const loadMatchData = async (service) => {
    try {
      const [bootstrapData, fixturesData] = await Promise.all([
        service.getBootstrapData(),
        service.getFixtures()
      ])

      setMatchData(bootstrapData)
      
      // Get current gameweek matches
      const currentEvent = bootstrapData.events.find(event => event.is_current)
      const todayMatches = fixturesData.filter(fixture => 
        fixture.event === currentEvent?.id &&
        (fixture.started || fixture.finished || isToday(fixture.kickoff_time))
      )

      // Filter and process live matches
      const processedMatches = todayMatches.map(fixture => ({
        ...fixture,
        homeTeam: getTeamData(fixture.team_h, bootstrapData.teams),
        awayTeam: getTeamData(fixture.team_a, bootstrapData.teams),
        isLive: fixture.started && !fixture.finished,
        minutesPlayed: fixture.minutes || 0
      }))

      setLiveMatches(processedMatches)
      if (processedMatches.length > 0) {
        setSelectedMatch(processedMatches[0])
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Error loading match data:', err)
      setError('Failed to load live matches')
      setLoading(false)
    }
  }

  const getTeamData = (teamId, teams) => {
    const team = teams.find(t => t.id === teamId)
    return {
      id: teamId,
      name: team?.name || 'Unknown Team',
      shortName: team?.short_name || 'TBD',
      strength: team?.strength || 0
    }
  }

  const isToday = (kickoffTime) => {
    if (!kickoffTime) return false
    const today = new Date().toDateString()
    const matchDate = new Date(kickoffTime).toDateString()
    return today === matchDate
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

  const getMatchStatus = (match) => {
    if (match.finished) return 'FT'
    if (match.isLive) return `${match.minutesPlayed}'`
    if (match.kickoff_time) return formatKickoffTime(match.kickoff_time)
    return 'TBD'
  }

  const generateMockPlayerRatings = (teamName) => {
    const players = [
      { name: 'Player 1', position: 'GK', rating: 7.2 },
      { name: 'Player 2', position: 'DEF', rating: 6.8 },
      { name: 'Player 3', position: 'MID', rating: 8.1 },
      { name: 'Player 4', position: 'FWD', rating: 7.5 }
    ]
    return players.map(p => ({ ...p, team: teamName }))
  }

  if (loading) {
    return (
      <div className={`match-center-container ${darkMode ? 'dark' : 'light'}`}>
        <div className="match-center-header">
          <h3>
            <span className="match-icon">⚽</span>
            Interactive Match Center
          </h3>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading match data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`match-center-container ${darkMode ? 'dark' : 'light'}`}>
        <div className="match-center-header">
          <h3>
            <span className="match-icon">⚽</span>
            Interactive Match Center
          </h3>
        </div>
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={initializeMatchCenter} className="retry-btn">
            🔄 Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`match-center-container ${darkMode ? 'dark' : 'light'}`}>
      <div className="match-center-header">
        <h3>
          <span className="match-icon">⚽</span>
          Interactive Match Center
        </h3>
        <div className="live-indicator">
          <span className="live-dot">●</span>
          LIVE
        </div>
      </div>

      {liveMatches.length > 0 ? (
        <div className="match-center-content">
          {/* Match Selection Tabs */}
          <div className="match-tabs">
            {liveMatches.map((match, index) => (
              <button
                key={match.id || index}
                className={`match-tab ${selectedMatch?.id === match.id ? 'active' : ''}`}
                onClick={() => setSelectedMatch(match)}
              >
                <div className="tab-teams">
                  {match.homeTeam.shortName} vs {match.awayTeam.shortName}
                </div>
                <div className="tab-status">
                  {match.isLive && <span className="live-dot">●</span>}
                  {getMatchStatus(match)}
                </div>
              </button>
            ))}
          </div>

          {/* Selected Match Details */}
          {selectedMatch && (
            <div className="match-details">
              {/* Score Display */}
              <div className="match-score">
                <div className="team home">
                  <div className="team-name">{selectedMatch.homeTeam.name}</div>
                  <div className="score">
                    {selectedMatch.team_h_score !== null ? selectedMatch.team_h_score : '-'}
                  </div>
                </div>
                
                <div className="match-info">
                  <div className="status">
                    {selectedMatch.isLive && <span className="live-pulse">🔴</span>}
                    {getMatchStatus(selectedMatch)}
                  </div>
                  {selectedMatch.isLive && (
                    <div className="live-events">
                      <span className="event">⚽ Live Updates</span>
                    </div>
                  )}
                </div>
                
                <div className="team away">
                  <div className="team-name">{selectedMatch.awayTeam.name}</div>
                  <div className="score">
                    {selectedMatch.team_a_score !== null ? selectedMatch.team_a_score : '-'}
                  </div>
                </div>
              </div>

              {/* Match Statistics */}
              <div className="match-stats">
                <h4>Match Statistics</h4>
                <div className="stats-grid">
                  <div className="stat-row">
                    <span className="stat-home">65%</span>
                    <span className="stat-label">Possession</span>
                    <span className="stat-away">35%</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-home">12</span>
                    <span className="stat-label">Shots</span>
                    <span className="stat-away">7</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-home">5</span>
                    <span className="stat-label">Shots on Target</span>
                    <span className="stat-away">3</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-home">8</span>
                    <span className="stat-label">Corners</span>
                    <span className="stat-away">4</span>
                  </div>
                </div>
              </div>

              {/* Player Ratings */}
              <div className="player-ratings">
                <h4>Top Performers</h4>
                <div className="ratings-grid">
                  <div className="team-ratings">
                    <h5>{selectedMatch.homeTeam.shortName}</h5>
                    {generateMockPlayerRatings(selectedMatch.homeTeam.shortName).map((player, idx) => (
                      <div key={idx} className="player-rating">
                        <span className="player-name">{player.name}</span>
                        <span className="player-position">{player.position}</span>
                        <span className={`rating ${player.rating >= 8 ? 'excellent' : player.rating >= 7 ? 'good' : 'average'}`}>
                          {player.rating}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="team-ratings">
                    <h5>{selectedMatch.awayTeam.shortName}</h5>
                    {generateMockPlayerRatings(selectedMatch.awayTeam.shortName).map((player, idx) => (
                      <div key={idx} className="player-rating">
                        <span className="player-name">{player.name}</span>
                        <span className="player-position">{player.position}</span>
                        <span className={`rating ${player.rating >= 8 ? 'excellent' : player.rating >= 7 ? 'good' : 'average'}`}>
                          {player.rating}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="no-matches">
          <div className="no-matches-icon">📅</div>
          <h4>No Live Matches Today</h4>
          <p>Check back during match days for live scores, stats, and player ratings</p>
          <div className="next-fixtures">
            <h5>Upcoming Premier League Fixtures</h5>
            <p>Next matches will appear here</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default InteractiveMatchCenter