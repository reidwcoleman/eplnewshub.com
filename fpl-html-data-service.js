// FPL HTML Data Service - Fetches data from existing HTML pages
class FPLHtmlDataService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.playerDataUrl = '/player-data.html';
        this.fixtureDataUrl = '/fixture-tracker-pro.html';
        this.statsDataUrl = '/stats.html';
    }

    async fetchHtmlPage(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${url}`);
            }
            const html = await response.text();
            return html;
        } catch (error) {
            console.error('Error fetching HTML page:', error);
            throw error;
        }
    }

    async extractPlayerDataFromHTML() {
        const cacheKey = 'player-data-html';
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            // Fetch the player-data.html page
            const html = await this.fetchHtmlPage(this.playerDataUrl);
            
            // Create a temporary iframe to load and execute the page
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            
            // Write the HTML to the iframe
            iframe.contentDocument.open();
            iframe.contentDocument.write(html);
            iframe.contentDocument.close();
            
            // Wait for the page to load its data
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Try to extract data from the iframe's window
            let playerData = null;
            if (iframe.contentWindow && iframe.contentWindow.allPlayers) {
                playerData = iframe.contentWindow.allPlayers;
            }
            
            // Clean up
            document.body.removeChild(iframe);
            
            if (!playerData) {
                // If we couldn't get data from iframe, use the embedded mock data
                playerData = await this.getEmbeddedPlayerData();
            }
            
            // Cache the data
            this.cache.set(cacheKey, {
                data: playerData,
                timestamp: Date.now()
            });
            
            return playerData;
        } catch (error) {
            console.error('Error extracting player data from HTML:', error);
            return this.getEmbeddedPlayerData();
        }
    }

    async getBootstrapData() {
        try {
            // Try to get data from player-data.html
            const players = await this.extractPlayerDataFromHTML();
            
            // Build bootstrap-like data structure
            const teams = this.getTeamsData();
            const events = this.getEventsData();
            const elementTypes = this.getElementTypesData();
            
            return {
                elements: players || this.getEmbeddedPlayerData(),
                teams: teams,
                events: events,
                element_types: elementTypes
            };
        } catch (error) {
            console.error('Error getting bootstrap data:', error);
            // Return embedded fallback data
            return {
                elements: this.getEmbeddedPlayerData(),
                teams: this.getTeamsData(),
                events: this.getEventsData(),
                element_types: this.getElementTypesData()
            };
        }
    }

    async getFixtures() {
        const cacheKey = 'fixtures-html';
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            // For now, return embedded fixture data
            const fixtures = this.getEmbeddedFixtures();
            
            this.cache.set(cacheKey, {
                data: fixtures,
                timestamp: Date.now()
            });
            
            return fixtures;
        } catch (error) {
            console.error('Error getting fixtures:', error);
            return this.getEmbeddedFixtures();
        }
    }

    // Embedded data methods (fallbacks)
    getTeamsData() {
        return [
            { id: 1, name: "Arsenal", short_name: "ARS", strength: 4, strength_overall_home: 1300, strength_overall_away: 1280 },
            { id: 2, name: "Aston Villa", short_name: "AVL", strength: 3, strength_overall_home: 1150, strength_overall_away: 1120 },
            { id: 3, name: "Bournemouth", short_name: "BOU", strength: 2, strength_overall_home: 1050, strength_overall_away: 1020 },
            { id: 4, name: "Brentford", short_name: "BRE", strength: 3, strength_overall_home: 1100, strength_overall_away: 1080 },
            { id: 5, name: "Brighton", short_name: "BHA", strength: 3, strength_overall_home: 1150, strength_overall_away: 1130 },
            { id: 6, name: "Chelsea", short_name: "CHE", strength: 4, strength_overall_home: 1250, strength_overall_away: 1230 },
            { id: 7, name: "Crystal Palace", short_name: "CRY", strength: 2, strength_overall_home: 1080, strength_overall_away: 1060 },
            { id: 8, name: "Everton", short_name: "EVE", strength: 2, strength_overall_home: 1020, strength_overall_away: 1000 },
            { id: 9, name: "Fulham", short_name: "FUL", strength: 2, strength_overall_home: 1090, strength_overall_away: 1070 },
            { id: 10, name: "Ipswich", short_name: "IPS", strength: 1, strength_overall_home: 950, strength_overall_away: 930 },
            { id: 11, name: "Leicester", short_name: "LEI", strength: 2, strength_overall_home: 980, strength_overall_away: 960 },
            { id: 12, name: "Liverpool", short_name: "LIV", strength: 5, strength_overall_home: 1350, strength_overall_away: 1330 },
            { id: 13, name: "Man City", short_name: "MCI", strength: 5, strength_overall_home: 1400, strength_overall_away: 1380 },
            { id: 14, name: "Newcastle", short_name: "NEW", strength: 4, strength_overall_home: 1200, strength_overall_away: 1180 },
            { id: 15, name: "Nottingham Forest", short_name: "NFO", strength: 3, strength_overall_home: 1160, strength_overall_away: 1140 },
            { id: 16, name: "Southampton", short_name: "SOU", strength: 1, strength_overall_home: 970, strength_overall_away: 950 },
            { id: 17, name: "Spurs", short_name: "TOT", strength: 4, strength_overall_home: 1250, strength_overall_away: 1230 },
            { id: 18, name: "West Ham", short_name: "WHU", strength: 3, strength_overall_home: 1130, strength_overall_away: 1110 },
            { id: 19, name: "Wolves", short_name: "WOL", strength: 2, strength_overall_home: 1040, strength_overall_away: 1020 },
            { id: 20, name: "Man Utd", short_name: "MUN", strength: 3, strength_overall_home: 1180, strength_overall_away: 1160 }
        ];
    }

    getEventsData() {
        const events = [];
        const currentGW = 24; // Update this to current gameweek
        
        for (let i = 1; i <= 38; i++) {
            events.push({
                id: i,
                name: `Gameweek ${i}`,
                finished: i < currentGW,
                is_current: i === currentGW,
                is_next: i === currentGW + 1
            });
        }
        return events;
    }

    getElementTypesData() {
        return [
            { id: 1, plural_name: "Goalkeepers", singular_name: "Goalkeeper" },
            { id: 2, plural_name: "Defenders", singular_name: "Defender" },
            { id: 3, plural_name: "Midfielders", singular_name: "Midfielder" },
            { id: 4, plural_name: "Forwards", singular_name: "Forward" }
        ];
    }

    getEmbeddedPlayerData() {
        // Top performing players with realistic 2024/25 season data
        return [
            // Liverpool players
            { id: 1, first_name: "Mohamed", second_name: "Salah", team: 12, element_type: 3, now_cost: 131, total_points: 178, form: "7.2", selected_by_percent: "58.3", goals_scored: 16, assists: 11, clean_sheets: 8, minutes: 1980, bonus: 28 },
            { id: 2, first_name: "Luis", second_name: "Díaz", team: 12, element_type: 3, now_cost: 79, total_points: 112, form: "5.8", selected_by_percent: "22.1", goals_scored: 9, assists: 5, clean_sheets: 7, minutes: 1620, bonus: 15 },
            { id: 3, first_name: "Virgil", second_name: "van Dijk", team: 12, element_type: 2, now_cost: 65, total_points: 98, form: "4.5", selected_by_percent: "31.2", goals_scored: 3, assists: 1, clean_sheets: 11, minutes: 2070, bonus: 12 },
            { id: 4, first_name: "Alisson", second_name: "Becker", team: 12, element_type: 1, now_cost: 55, total_points: 92, form: "4.2", selected_by_percent: "18.5", goals_scored: 0, assists: 0, clean_sheets: 12, minutes: 1980, saves: 68, bonus: 8 },
            
            // Man City players
            { id: 5, first_name: "Erling", second_name: "Haaland", team: 13, element_type: 4, now_cost: 150, total_points: 165, form: "6.8", selected_by_percent: "62.4", goals_scored: 18, assists: 5, clean_sheets: 0, minutes: 1890, bonus: 25 },
            { id: 6, first_name: "Phil", second_name: "Foden", team: 13, element_type: 3, now_cost: 92, total_points: 121, form: "5.5", selected_by_percent: "28.7", goals_scored: 10, assists: 8, clean_sheets: 9, minutes: 1710, bonus: 18 },
            { id: 7, first_name: "Kevin", second_name: "De Bruyne", team: 13, element_type: 3, now_cost: 95, total_points: 108, form: "6.2", selected_by_percent: "19.3", goals_scored: 6, assists: 11, clean_sheets: 6, minutes: 1350, bonus: 16 },
            
            // Arsenal players
            { id: 8, first_name: "Bukayo", second_name: "Saka", team: 1, element_type: 3, now_cost: 102, total_points: 142, form: "6.1", selected_by_percent: "41.2", goals_scored: 11, assists: 10, clean_sheets: 10, minutes: 1980, bonus: 22 },
            { id: 9, first_name: "Martin", second_name: "Ødegaard", team: 1, element_type: 3, now_cost: 85, total_points: 118, form: "5.4", selected_by_percent: "25.6", goals_scored: 7, assists: 9, clean_sheets: 9, minutes: 1890, bonus: 17 },
            { id: 10, first_name: "Gabriel", second_name: "Magalhães", team: 1, element_type: 2, now_cost: 60, total_points: 95, form: "4.3", selected_by_percent: "22.8", goals_scored: 4, assists: 0, clean_sheets: 12, minutes: 2070, bonus: 11 },
            
            // Chelsea players
            { id: 11, first_name: "Cole", second_name: "Palmer", team: 6, element_type: 3, now_cost: 108, total_points: 156, form: "7.0", selected_by_percent: "48.5", goals_scored: 13, assists: 11, clean_sheets: 7, minutes: 1980, bonus: 26 },
            { id: 12, first_name: "Nicolas", second_name: "Jackson", team: 6, element_type: 4, now_cost: 78, total_points: 98, form: "4.8", selected_by_percent: "15.2", goals_scored: 10, assists: 4, clean_sheets: 0, minutes: 1620, bonus: 12 },
            
            // Spurs players
            { id: 13, first_name: "Son", second_name: "Heung-min", team: 17, element_type: 3, now_cost: 98, total_points: 128, form: "5.9", selected_by_percent: "32.1", goals_scored: 12, assists: 7, clean_sheets: 6, minutes: 1800, bonus: 20 },
            { id: 14, first_name: "James", second_name: "Maddison", team: 17, element_type: 3, now_cost: 76, total_points: 102, form: "4.9", selected_by_percent: "18.7", goals_scored: 6, assists: 8, clean_sheets: 5, minutes: 1530, bonus: 14 },
            
            // Newcastle players
            { id: 15, first_name: "Alexander", second_name: "Isak", team: 14, element_type: 4, now_cost: 85, total_points: 118, form: "5.6", selected_by_percent: "27.3", goals_scored: 14, assists: 3, clean_sheets: 0, minutes: 1710, bonus: 18 },
            { id: 16, first_name: "Anthony", second_name: "Gordon", team: 14, element_type: 3, now_cost: 73, total_points: 96, form: "4.6", selected_by_percent: "16.9", goals_scored: 7, assists: 6, clean_sheets: 7, minutes: 1800, bonus: 13 },
            
            // Man Utd players
            { id: 17, first_name: "Bruno", second_name: "Fernandes", team: 20, element_type: 3, now_cost: 86, total_points: 112, form: "5.2", selected_by_percent: "29.4", goals_scored: 8, assists: 9, clean_sheets: 5, minutes: 1980, bonus: 17 },
            { id: 18, first_name: "Marcus", second_name: "Rashford", team: 20, element_type: 3, now_cost: 72, total_points: 78, form: "3.8", selected_by_percent: "12.3", goals_scored: 6, assists: 3, clean_sheets: 4, minutes: 1440, bonus: 9 },
            
            // Aston Villa players
            { id: 19, first_name: "Ollie", second_name: "Watkins", team: 2, element_type: 4, now_cost: 88, total_points: 124, form: "5.7", selected_by_percent: "35.6", goals_scored: 13, assists: 6, clean_sheets: 0, minutes: 1890, bonus: 19 },
            { id: 20, first_name: "Leon", second_name: "Bailey", team: 2, element_type: 3, now_cost: 65, total_points: 82, form: "4.1", selected_by_percent: "11.8", goals_scored: 5, assists: 7, clean_sheets: 6, minutes: 1260, bonus: 10 },
            
            // Brighton players
            { id: 21, first_name: "Kaoru", second_name: "Mitoma", team: 5, element_type: 3, now_cost: 66, total_points: 88, form: "4.4", selected_by_percent: "14.2", goals_scored: 6, assists: 5, clean_sheets: 6, minutes: 1530, bonus: 11 },
            { id: 22, first_name: "Evan", second_name: "Ferguson", team: 5, element_type: 4, now_cost: 58, total_points: 62, form: "3.2", selected_by_percent: "8.7", goals_scored: 6, assists: 2, clean_sheets: 0, minutes: 1080, bonus: 7 },
            
            // West Ham players
            { id: 23, first_name: "Jarrod", second_name: "Bowen", team: 18, element_type: 3, now_cost: 74, total_points: 94, form: "4.5", selected_by_percent: "19.8", goals_scored: 8, assists: 5, clean_sheets: 4, minutes: 1710, bonus: 13 },
            { id: 24, first_name: "Mohammed", second_name: "Kudus", team: 18, element_type: 3, now_cost: 62, total_points: 76, form: "3.9", selected_by_percent: "10.5", goals_scored: 5, assists: 4, clean_sheets: 3, minutes: 1440, bonus: 9 },
            
            // Nottingham Forest players
            { id: 25, first_name: "Morgan", second_name: "Gibbs-White", team: 15, element_type: 3, now_cost: 64, total_points: 86, form: "4.3", selected_by_percent: "13.6", goals_scored: 4, assists: 7, clean_sheets: 8, minutes: 1800, bonus: 11 },
            { id: 26, first_name: "Chris", second_name: "Wood", team: 15, element_type: 4, now_cost: 61, total_points: 92, form: "4.7", selected_by_percent: "16.4", goals_scored: 11, assists: 1, clean_sheets: 0, minutes: 1620, bonus: 13 },
            
            // Brentford players
            { id: 27, first_name: "Bryan", second_name: "Mbeumo", team: 4, element_type: 3, now_cost: 77, total_points: 104, form: "5.0", selected_by_percent: "23.7", goals_scored: 9, assists: 6, clean_sheets: 5, minutes: 1710, bonus: 15 },
            { id: 28, first_name: "Ivan", second_name: "Toney", team: 4, element_type: 4, now_cost: 73, total_points: 88, form: "4.4", selected_by_percent: "17.2", goals_scored: 10, assists: 2, clean_sheets: 0, minutes: 1530, bonus: 12 },
            
            // Fulham players
            { id: 29, first_name: "Raúl", second_name: "Jiménez", team: 9, element_type: 4, now_cost: 56, total_points: 72, form: "3.7", selected_by_percent: "9.3", goals_scored: 8, assists: 2, clean_sheets: 0, minutes: 1440, bonus: 9 },
            { id: 30, first_name: "Andreas", second_name: "Pereira", team: 9, element_type: 3, now_cost: 52, total_points: 68, form: "3.5", selected_by_percent: "7.8", goals_scored: 3, assists: 5, clean_sheets: 4, minutes: 1530, bonus: 8 }
        ];
    }

    getEmbeddedFixtures() {
        const teams = this.getTeamsData();
        const fixtures = [];
        const currentGW = 24;
        
        // Generate next 5 gameweeks of fixtures
        for (let gw = currentGW; gw < currentGW + 5; gw++) {
            for (let i = 0; i < teams.length; i += 2) {
                fixtures.push({
                    id: gw * 10 + i/2,
                    event: gw,
                    team_h: teams[i].id,
                    team_a: teams[i+1].id,
                    team_h_difficulty: Math.floor(Math.random() * 5) + 1,
                    team_a_difficulty: Math.floor(Math.random() * 5) + 1,
                    kickoff_time: new Date(Date.now() + (gw - currentGW) * 7 * 24 * 60 * 60 * 1000).toISOString(),
                    finished: false,
                    started: false
                });
            }
        }
        
        return fixtures;
    }

    // Utility methods
    formatPrice(value) {
        return `£${(value / 10).toFixed(1)}m`;
    }

    getPositionName(elementType) {
        const positions = {
            1: 'GKP',
            2: 'DEF',
            3: 'MID',
            4: 'FWD'
        };
        return positions[elementType] || 'Unknown';
    }

    getTeamName(teamId, teams) {
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : 'Unknown';
    }
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.FPLHtmlDataService = FPLHtmlDataService;
}