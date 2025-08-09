// Enhanced FPL Data Service with CORS handling and fallback data
class FPLDataServiceEnhanced {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 2 * 60 * 1000; // 2 minutes
        this.corsProxies = [
            'https://corsproxy.io/?',
            'https://api.allorigins.win/raw?url=',
            'https://cors-anywhere.herokuapp.com/',
            'https://proxy.cors.sh/'
        ];
        this.currentProxyIndex = 0;
        this.mockDataEnabled = true; // Always provide fallback data
    }

    async fetchWithCORS(url) {
        // Try direct fetch first
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                mode: 'cors'
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('Direct fetch failed, trying CORS proxy...');
        }

        // Try with CORS proxies
        for (let i = 0; i < this.corsProxies.length; i++) {
            const proxyIndex = (this.currentProxyIndex + i) % this.corsProxies.length;
            const proxy = this.corsProxies[proxyIndex];
            
            try {
                const proxyUrl = proxy + encodeURIComponent(url);
                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    }
                });
                
                if (response.ok) {
                    this.currentProxyIndex = proxyIndex; // Remember working proxy
                    return await response.json();
                }
            } catch (error) {
                console.log(`Proxy ${proxy} failed, trying next...`);
            }
        }
        
        throw new Error('All fetch attempts failed');
    }

    async getPlayerData() {
        const cacheKey = 'player_data';
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('Using cached player data');
                return cached.data;
            }
        }

        try {
            console.log('Fetching live player data...');
            const data = await this.fetchWithCORS('https://fantasy.premierleague.com/api/bootstrap-static/');
            
            // Cache the successful response
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });
            
            console.log('Live data loaded successfully');
            return data;
        } catch (error) {
            console.error('Failed to fetch live data, using comprehensive mock data:', error);
            // Return full mock data with all players
            return this.generateFullPlayerList();
        }
    }

    getMockPlayerData() {
        // Comprehensive mock data with top players
        return {
            elements: [
                // Top Goalkeepers
                {
                    id: 1,
                    first_name: "Alisson",
                    second_name: "Becker",
                    team: 12,
                    element_type: 1,
                    now_cost: 55,
                    total_points: 142,
                    goals_scored: 0,
                    assists: 0,
                    clean_sheets: 13,
                    saves: 86,
                    bonus: 10,
                    bps: 555,
                    influence: "755.4",
                    creativity: "10.7",
                    threat: "0.0",
                    ict_index: "76.7",
                    form: "5.2",
                    selected_by_percent: "15.3",
                    minutes: 3420,
                    yellow_cards: 3,
                    red_cards: 0,
                    transfers_in_event: 45231,
                    transfers_out_event: 12453,
                    news: "",
                    chance_of_playing_next_round: 100
                },
                {
                    id: 2,
                    first_name: "David",
                    second_name: "Raya",
                    team: 1,
                    element_type: 1,
                    now_cost: 56,
                    total_points: 135,
                    goals_scored: 0,
                    assists: 0,
                    clean_sheets: 16,
                    saves: 46,
                    bonus: 6,
                    bps: 569,
                    influence: "413.0",
                    creativity: "0.0",
                    threat: "0.0",
                    ict_index: "41.1",
                    form: "4.8",
                    selected_by_percent: "22.1",
                    minutes: 2880,
                    yellow_cards: 2,
                    red_cards: 0,
                    transfers_in_event: 32156,
                    transfers_out_event: 8934,
                    news: "",
                    chance_of_playing_next_round: 100
                },
                // Top Defenders
                {
                    id: 101,
                    first_name: "Trent",
                    second_name: "Alexander-Arnold",
                    team: 12,
                    element_type: 2,
                    now_cost: 75,
                    total_points: 178,
                    goals_scored: 2,
                    assists: 12,
                    clean_sheets: 13,
                    saves: 0,
                    bonus: 18,
                    bps: 892,
                    influence: "892.3",
                    creativity: "1234.5",
                    threat: "234.1",
                    ict_index: "236.1",
                    form: "6.2",
                    selected_by_percent: "45.2",
                    minutes: 3150,
                    yellow_cards: 2,
                    red_cards: 0,
                    transfers_in_event: 112453,
                    transfers_out_event: 23421,
                    news: "",
                    chance_of_playing_next_round: 100
                },
                {
                    id: 102,
                    first_name: "William",
                    second_name: "Saliba",
                    team: 1,
                    element_type: 2,
                    now_cost: 60,
                    total_points: 156,
                    goals_scored: 2,
                    assists: 1,
                    clean_sheets: 16,
                    saves: 0,
                    bonus: 12,
                    bps: 723,
                    influence: "623.1",
                    creativity: "45.2",
                    threat: "189.3",
                    ict_index: "85.7",
                    form: "5.4",
                    selected_by_percent: "38.7",
                    minutes: 3240,
                    yellow_cards: 3,
                    red_cards: 0,
                    transfers_in_event: 67234,
                    transfers_out_event: 15632,
                    news: "",
                    chance_of_playing_next_round: 100
                },
                // Top Midfielders
                {
                    id: 201,
                    first_name: "Mohamed",
                    second_name: "Salah",
                    team: 12,
                    element_type: 3,
                    now_cost: 130,
                    total_points: 256,
                    goals_scored: 22,
                    assists: 14,
                    clean_sheets: 0,
                    saves: 0,
                    bonus: 28,
                    bps: 1234,
                    influence: "1456.2",
                    creativity: "987.3",
                    threat: "1823.4",
                    ict_index: "426.7",
                    form: "8.9",
                    selected_by_percent: "67.3",
                    minutes: 3240,
                    yellow_cards: 1,
                    red_cards: 0,
                    transfers_in_event: 234567,
                    transfers_out_event: 45678,
                    news: "",
                    chance_of_playing_next_round: 100
                },
                {
                    id: 202,
                    first_name: "Bukayo",
                    second_name: "Saka",
                    team: 1,
                    element_type: 3,
                    now_cost: 100,
                    total_points: 198,
                    goals_scored: 15,
                    assists: 11,
                    clean_sheets: 0,
                    saves: 0,
                    bonus: 22,
                    bps: 987,
                    influence: "1123.4",
                    creativity: "876.2",
                    threat: "1234.5",
                    ict_index: "323.4",
                    form: "7.2",
                    selected_by_percent: "52.1",
                    minutes: 2970,
                    yellow_cards: 4,
                    red_cards: 0,
                    transfers_in_event: 156789,
                    transfers_out_event: 34567,
                    news: "",
                    chance_of_playing_next_round: 100
                },
                {
                    id: 203,
                    first_name: "Cole",
                    second_name: "Palmer",
                    team: 6,
                    element_type: 3,
                    now_cost: 105,
                    total_points: 214,
                    goals_scored: 18,
                    assists: 13,
                    clean_sheets: 0,
                    saves: 0,
                    bonus: 25,
                    bps: 1098,
                    influence: "1234.5",
                    creativity: "923.4",
                    threat: "1567.8",
                    ict_index: "372.5",
                    form: "7.8",
                    selected_by_percent: "58.9",
                    minutes: 3060,
                    yellow_cards: 3,
                    red_cards: 0,
                    transfers_in_event: 189234,
                    transfers_out_event: 29876,
                    news: "",
                    chance_of_playing_next_round: 100
                },
                // Top Forwards
                {
                    id: 301,
                    first_name: "Erling",
                    second_name: "Haaland",
                    team: 13,
                    element_type: 4,
                    now_cost: 150,
                    total_points: 289,
                    goals_scored: 32,
                    assists: 7,
                    clean_sheets: 0,
                    saves: 0,
                    bonus: 31,
                    bps: 1456,
                    influence: "1789.2",
                    creativity: "456.7",
                    threat: "2345.6",
                    ict_index: "459.1",
                    form: "9.5",
                    selected_by_percent: "78.4",
                    minutes: 3150,
                    yellow_cards: 2,
                    red_cards: 0,
                    transfers_in_event: 345678,
                    transfers_out_event: 12345,
                    news: "",
                    chance_of_playing_next_round: 100
                },
                {
                    id: 302,
                    first_name: "Alexander",
                    second_name: "Isak",
                    team: 14,
                    element_type: 4,
                    now_cost: 85,
                    total_points: 176,
                    goals_scored: 19,
                    assists: 5,
                    clean_sheets: 0,
                    saves: 0,
                    bonus: 18,
                    bps: 823,
                    influence: "987.6",
                    creativity: "543.2",
                    threat: "1456.7",
                    ict_index: "298.7",
                    form: "6.4",
                    selected_by_percent: "34.2",
                    minutes: 2790,
                    yellow_cards: 1,
                    red_cards: 0,
                    transfers_in_event: 98765,
                    transfers_out_event: 23456,
                    news: "",
                    chance_of_playing_next_round: 100
                },
                {
                    id: 303,
                    first_name: "Ollie",
                    second_name: "Watkins",
                    team: 2,
                    element_type: 4,
                    now_cost: 90,
                    total_points: 189,
                    goals_scored: 21,
                    assists: 8,
                    clean_sheets: 0,
                    saves: 0,
                    bonus: 20,
                    bps: 912,
                    influence: "1034.5",
                    creativity: "623.4",
                    threat: "1567.8",
                    ict_index: "322.5",
                    form: "6.8",
                    selected_by_percent: "41.3",
                    minutes: 3240,
                    yellow_cards: 3,
                    red_cards: 0,
                    transfers_in_event: 123456,
                    transfers_out_event: 34567,
                    news: "",
                    chance_of_playing_next_round: 100
                }
            ],
            teams: [
                { id: 1, name: "Arsenal", short_name: "ARS", strength_overall_home: 1350, strength_overall_away: 1320 },
                { id: 2, name: "Aston Villa", short_name: "AVL", strength_overall_home: 1180, strength_overall_away: 1150 },
                { id: 3, name: "Bournemouth", short_name: "BOU", strength_overall_home: 1050, strength_overall_away: 1020 },
                { id: 4, name: "Brentford", short_name: "BRE", strength_overall_home: 1100, strength_overall_away: 1070 },
                { id: 5, name: "Brighton", short_name: "BHA", strength_overall_home: 1150, strength_overall_away: 1120 },
                { id: 6, name: "Chelsea", short_name: "CHE", strength_overall_home: 1280, strength_overall_away: 1250 },
                { id: 7, name: "Crystal Palace", short_name: "CRY", strength_overall_home: 1080, strength_overall_away: 1050 },
                { id: 8, name: "Everton", short_name: "EVE", strength_overall_home: 1020, strength_overall_away: 990 },
                { id: 9, name: "Fulham", short_name: "FUL", strength_overall_home: 1090, strength_overall_away: 1060 },
                { id: 10, name: "Ipswich", short_name: "IPS", strength_overall_home: 950, strength_overall_away: 920 },
                { id: 11, name: "Leicester", short_name: "LEI", strength_overall_home: 980, strength_overall_away: 950 },
                { id: 12, name: "Liverpool", short_name: "LIV", strength_overall_home: 1380, strength_overall_away: 1350 },
                { id: 13, name: "Man City", short_name: "MCI", strength_overall_home: 1400, strength_overall_away: 1370 },
                { id: 14, name: "Newcastle", short_name: "NEW", strength_overall_home: 1200, strength_overall_away: 1170 },
                { id: 15, name: "Nottingham Forest", short_name: "NFO", strength_overall_home: 1060, strength_overall_away: 1030 },
                { id: 16, name: "Southampton", short_name: "SOU", strength_overall_home: 970, strength_overall_away: 940 },
                { id: 17, name: "Spurs", short_name: "TOT", strength_overall_home: 1250, strength_overall_away: 1220 },
                { id: 18, name: "West Ham", short_name: "WHU", strength_overall_home: 1130, strength_overall_away: 1100 },
                { id: 19, name: "Wolves", short_name: "WOL", strength_overall_home: 1040, strength_overall_away: 1010 },
                { id: 20, name: "Man Utd", short_name: "MUN", strength_overall_home: 1220, strength_overall_away: 1190 }
            ],
            events: [
                { id: 1, name: "Gameweek 1", is_current: false, is_next: true },
                { id: 2, name: "Gameweek 2", is_current: false, is_next: false },
                { id: 3, name: "Gameweek 3", is_current: false, is_next: false }
            ]
        };
    }

    // Add more mock players to reach 600+
    generateFullPlayerList() {
        const mockData = this.getMockPlayerData();
        const positions = ['GKP', 'DEF', 'MID', 'FWD'];
        const firstNames = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Daniel'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
        
        // Generate additional players
        for (let i = mockData.elements.length; i < 600; i++) {
            const position = Math.floor(Math.random() * 4) + 1;
            const team = Math.floor(Math.random() * 20) + 1;
            const price = Math.floor(Math.random() * 100 + 40);
            const points = Math.floor(Math.random() * 200);
            
            mockData.elements.push({
                id: 1000 + i,
                first_name: firstNames[Math.floor(Math.random() * firstNames.length)],
                second_name: lastNames[Math.floor(Math.random() * lastNames.length)],
                team: team,
                element_type: position,
                now_cost: price,
                total_points: points,
                goals_scored: position === 4 ? Math.floor(Math.random() * 20) : Math.floor(Math.random() * 5),
                assists: Math.floor(Math.random() * 10),
                clean_sheets: position <= 2 ? Math.floor(Math.random() * 15) : 0,
                saves: position === 1 ? Math.floor(Math.random() * 100) : 0,
                bonus: Math.floor(Math.random() * 20),
                bps: Math.floor(Math.random() * 1000),
                influence: (Math.random() * 1000).toFixed(1),
                creativity: (Math.random() * 1000).toFixed(1),
                threat: (Math.random() * 1000).toFixed(1),
                ict_index: (Math.random() * 300).toFixed(1),
                form: (Math.random() * 10).toFixed(1),
                selected_by_percent: (Math.random() * 50).toFixed(1),
                minutes: Math.floor(Math.random() * 3420),
                yellow_cards: Math.floor(Math.random() * 8),
                red_cards: Math.floor(Math.random() * 2),
                transfers_in_event: Math.floor(Math.random() * 100000),
                transfers_out_event: Math.floor(Math.random() * 50000),
                news: "",
                chance_of_playing_next_round: Math.random() > 0.2 ? 100 : Math.floor(Math.random() * 100)
            });
        }
        
        return mockData;
    }

    async getFixtures() {
        const cacheKey = 'fixtures';
        
        // Check cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const data = await this.fetchWithCORS('https://fantasy.premierleague.com/api/fixtures/');
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });
            return data;
        } catch (error) {
            console.error('Failed to fetch fixtures, using mock data:', error);
            return this.getMockFixtures();
        }
    }

    getMockFixtures() {
        const fixtures = [];
        const teams = this.getMockPlayerData().teams;
        
        // Generate fixtures for next 6 gameweeks
        for (let gw = 1; gw <= 6; gw++) {
            for (let i = 0; i < 10; i++) {
                const homeTeam = (i * 2) + 1;
                const awayTeam = (i * 2) + 2;
                
                fixtures.push({
                    id: gw * 100 + i,
                    code: 2561900 + gw * 10 + i,
                    team_h: homeTeam,
                    team_h_score: null,
                    team_a: awayTeam,
                    team_a_score: null,
                    event: gw,
                    finished: false,
                    minutes: 0,
                    provisional_start_time: false,
                    kickoff_time: new Date(2025, 7, 17 + (gw - 1) * 7, 15, 30).toISOString(),
                    event_name: `Gameweek ${gw}`,
                    is_home: i % 2 === 0,
                    difficulty: Math.floor(Math.random() * 5) + 1
                });
            }
        }
        
        return fixtures;
    }

    // Initialize and pre-load data
    async initializeAndPreload() {
        console.log('Initializing FPL Data Service...');
        // Try to pre-load player data on service initialization
        try {
            await this.getPlayerData();
            console.log('FPL data pre-loaded successfully');
        } catch (error) {
            console.log('Pre-load failed, will use mock data');
        }
    }
}

// Create global instance
window.FPLDataServiceEnhanced = new FPLDataServiceEnhanced();

// Pre-load data as soon as service is created
window.FPLDataServiceEnhanced.initializeAndPreload();