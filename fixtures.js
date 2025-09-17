// Fixtures Module for EPL News Hub
// Fetches and manages fixture data for all FPL tools

const FixturesModule = (() => {
    const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
    const FIXTURES_URL = 'https://fantasy.premierleague.com/api/fixtures/';
    const TEAMS_URL = 'https://fantasy.premierleague.com/api/bootstrap-static/';
    
    let teamsData = {};
    let fixturesData = [];
    let currentGameweek = null;

    // Initialize teams data
    async function fetchTeamsData() {
        try {
            const response = await fetch(CORS_PROXY + encodeURIComponent(TEAMS_URL));
            const data = await response.json();
            
            // Map team IDs to team names
            data.teams.forEach(team => {
                teamsData[team.id] = {
                    name: team.name,
                    short_name: team.short_name,
                    strength: team.strength,
                    strength_overall_home: team.strength_overall_home,
                    strength_overall_away: team.strength_overall_away,
                    strength_attack_home: team.strength_attack_home,
                    strength_attack_away: team.strength_attack_away,
                    strength_defence_home: team.strength_defence_home,
                    strength_defence_away: team.strength_defence_away
                };
            });
            
            // Get current gameweek
            currentGameweek = data.events.find(event => event.is_current)?.id || 1;
            
            return teamsData;
        } catch (error) {
            console.error('Error fetching teams data:', error);
            return {};
        }
    }

    // Fetch fixtures data
    async function fetchFixtures() {
        try {
            const response = await fetch(CORS_PROXY + encodeURIComponent(FIXTURES_URL));
            fixturesData = await response.json();
            
            // Enhance fixtures with team names
            fixturesData = fixturesData.map(fixture => ({
                ...fixture,
                team_h_name: teamsData[fixture.team_h]?.name || 'Unknown',
                team_a_name: teamsData[fixture.team_a]?.name || 'Unknown',
                team_h_short: teamsData[fixture.team_h]?.short_name || 'UNK',
                team_a_short: teamsData[fixture.team_a]?.short_name || 'UNK',
                kickoff_time_formatted: fixture.kickoff_time ? new Date(fixture.kickoff_time).toLocaleString() : 'TBD'
            }));
            
            return fixturesData;
        } catch (error) {
            console.error('Error fetching fixtures:', error);
            return [];
        }
    }

    // Get fixtures for specific gameweek
    function getGameweekFixtures(gameweek) {
        return fixturesData.filter(fixture => fixture.event === gameweek);
    }

    // Get fixtures for specific team
    function getTeamFixtures(teamName, limit = 5) {
        const teamId = Object.keys(teamsData).find(id => 
            teamsData[id].name.toLowerCase() === teamName.toLowerCase() ||
            teamsData[id].short_name.toLowerCase() === teamName.toLowerCase()
        );
        
        if (!teamId) return [];
        
        const fixtures = fixturesData
            .filter(fixture => 
                (fixture.team_h == teamId || fixture.team_a == teamId) &&
                (!fixture.finished || fixture.event >= currentGameweek)
            )
            .slice(0, limit)
            .map(fixture => {
                const isHome = fixture.team_h == teamId;
                const opponent = isHome ? fixture.team_a : fixture.team_h;
                const opponentName = teamsData[opponent]?.name || 'Unknown';
                const difficulty = isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;
                
                return {
                    ...fixture,
                    is_home: isHome,
                    opponent_name: opponentName,
                    opponent_short: teamsData[opponent]?.short_name || 'UNK',
                    fixture_difficulty: difficulty,
                    fixture_string: `${isHome ? 'H' : 'A'} vs ${teamsData[opponent]?.short_name || 'UNK'}`,
                    opponent_strength: {
                        overall: isHome ? teamsData[opponent]?.strength_overall_away : teamsData[opponent]?.strength_overall_home,
                        attack: isHome ? teamsData[opponent]?.strength_attack_away : teamsData[opponent]?.strength_attack_home,
                        defence: isHome ? teamsData[opponent]?.strength_defence_away : teamsData[opponent]?.strength_defence_home
                    }
                };
            });
        
        return fixtures;
    }

    // Get next fixtures for all teams
    function getNextFixtures(gameweeks = 5) {
        const upcomingFixtures = {};
        
        Object.keys(teamsData).forEach(teamId => {
            const teamName = teamsData[teamId].name;
            upcomingFixtures[teamName] = fixturesData
                .filter(fixture => 
                    (fixture.team_h == teamId || fixture.team_a == teamId) &&
                    fixture.event >= currentGameweek &&
                    fixture.event < currentGameweek + gameweeks
                )
                .map(fixture => {
                    const isHome = fixture.team_h == teamId;
                    const opponent = isHome ? fixture.team_a : fixture.team_h;
                    
                    return {
                        gameweek: fixture.event,
                        opponent: teamsData[opponent]?.short_name || 'UNK',
                        venue: isHome ? 'H' : 'A',
                        difficulty: isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty
                    };
                });
        });
        
        return upcomingFixtures;
    }

    // Calculate fixture difficulty rating (FDR) for next N games
    function calculateFDR(teamName, games = 5) {
        const fixtures = getTeamFixtures(teamName, games);
        if (fixtures.length === 0) return { rating: 0, fixtures: [] };
        
        const totalDifficulty = fixtures.reduce((sum, fixture) => sum + (fixture.fixture_difficulty || 3), 0);
        const avgDifficulty = totalDifficulty / fixtures.length;
        
        return {
            rating: avgDifficulty.toFixed(2),
            fixtures: fixtures.map(f => ({
                opponent: f.opponent_short,
                venue: f.is_home ? 'H' : 'A',
                difficulty: f.fixture_difficulty,
                gameweek: f.event
            }))
        };
    }

    // Get fixture ticker for display
    function getFixtureTicker(teamName, games = 3) {
        const fixtures = getTeamFixtures(teamName, games);
        return fixtures.map(f => {
            const difficultyColors = ['', '#00ff87', '#01fc7a', '#e7e7e7', '#ff1751', '#80072d'];
            const color = difficultyColors[f.fixture_difficulty] || '#e7e7e7';
            return `<span style="background-color: ${color}; padding: 2px 5px; margin: 0 2px; border-radius: 3px;">${f.fixture_string}</span>`;
        }).join('');
    }

    // Initialize module
    async function init() {
        await fetchTeamsData();
        await fetchFixtures();
        return {
            teams: teamsData,
            fixtures: fixturesData,
            currentGameweek: currentGameweek
        };
    }

    // Public API
    return {
        init,
        getGameweekFixtures,
        getTeamFixtures,
        getNextFixtures,
        calculateFDR,
        getFixtureTicker,
        getCurrentGameweek: () => currentGameweek,
        getTeamsData: () => teamsData,
        getFixturesData: () => fixturesData
    };
})();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FixturesModule;
}