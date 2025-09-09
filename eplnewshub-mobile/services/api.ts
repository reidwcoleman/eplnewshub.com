import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API configuration
const API_BASE_URL = 'https://api.eplnewshub.com'; // Replace with your actual API
const API_TIMEOUT = 10000; // 10 seconds

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add request interceptor for auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Types
export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  blurhash?: string;
  category: string;
  author: string;
  publishedAt: string;
  readTime: number;
  tags: string[];
  isPremium?: boolean;
}

export interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  price: number;
  points: number;
  form: number;
  imageUrl: string;
  stats: PlayerStats;
}

export interface PlayerStats {
  goals: number;
  assists: number;
  cleanSheets: number;
  saves: number;
  yellowCards: number;
  redCards: number;
  bonus: number;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  form: string[];
}

export interface Transfer {
  id: string;
  playerId: string;
  playerName: string;
  fromTeam: string;
  toTeam: string;
  fee: string;
  date: string;
  status: 'confirmed' | 'rumor' | 'medical';
}

// API Functions

// Articles
export const fetchArticles = async (page: number = 1, limit: number = 10): Promise<Article[]> => {
  try {
    const response = await apiClient.get('/articles', {
      params: { page, limit },
    });
    return response.data.articles;
  } catch (error) {
    console.error('Error fetching articles:', error);
    // Return cached articles as fallback
    const cached = await AsyncStorage.getItem(`articles_page_${page}`);
    return cached ? JSON.parse(cached) : [];
  }
};

export const fetchArticle = async (articleId: string): Promise<Article | null> => {
  try {
    const response = await apiClient.get(`/articles/${articleId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching article:', error);
    // Try to get from cache
    const cached = await AsyncStorage.getItem(`article_${articleId}`);
    return cached ? JSON.parse(cached) : null;
  }
};

export const searchArticles = async (query: string): Promise<Article[]> => {
  try {
    const response = await apiClient.get('/articles/search', {
      params: { q: query },
    });
    return response.data.articles;
  } catch (error) {
    console.error('Error searching articles:', error);
    return [];
  }
};

// FPL Data
export const fetchPlayers = async (): Promise<Player[]> => {
  try {
    const response = await apiClient.get('/fpl/players');
    return response.data.players;
  } catch (error) {
    console.error('Error fetching players:', error);
    const cached = await AsyncStorage.getItem('fpl_players');
    return cached ? JSON.parse(cached) : [];
  }
};

export const fetchPlayer = async (playerId: string): Promise<Player | null> => {
  try {
    const response = await apiClient.get(`/fpl/players/${playerId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching player:', error);
    return null;
  }
};

export const fetchTeamStandings = async (): Promise<Team[]> => {
  try {
    const response = await apiClient.get('/teams/standings');
    return response.data.standings;
  } catch (error) {
    console.error('Error fetching standings:', error);
    const cached = await AsyncStorage.getItem('team_standings');
    return cached ? JSON.parse(cached) : [];
  }
};

// Transfers
export const fetchTransfers = async (status?: string): Promise<Transfer[]> => {
  try {
    const response = await apiClient.get('/transfers', {
      params: status ? { status } : {},
    });
    return response.data.transfers;
  } catch (error) {
    console.error('Error fetching transfers:', error);
    const cached = await AsyncStorage.getItem('transfers');
    return cached ? JSON.parse(cached) : [];
  }
};

// FPL Tools
export const predictPlayerPoints = async (
  playerId: string,
  gameweek: number
): Promise<{ predicted: number; confidence: number }> => {
  try {
    const response = await apiClient.post('/fpl/predict', {
      playerId,
      gameweek,
    });
    return response.data;
  } catch (error) {
    console.error('Error predicting points:', error);
    return { predicted: 0, confidence: 0 };
  }
};

export const analyzeTeam = async (teamIds: string[]): Promise<any> => {
  try {
    const response = await apiClient.post('/fpl/analyze-team', {
      teamIds,
    });
    return response.data;
  } catch (error) {
    console.error('Error analyzing team:', error);
    return null;
  }
};

// Premium Features
export const checkPremiumStatus = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get('/user/premium-status');
    return response.data.isPremium;
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
};

export const unlockPremiumContent = async (contentId: string): Promise<any> => {
  try {
    const response = await apiClient.post('/premium/unlock', {
      contentId,
    });
    return response.data;
  } catch (error) {
    console.error('Error unlocking premium content:', error);
    return null;
  }
};

// User Preferences
export const saveUserPreferences = async (preferences: any): Promise<void> => {
  try {
    await apiClient.post('/user/preferences', preferences);
    await AsyncStorage.setItem('user_preferences', JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
};

export const getUserPreferences = async (): Promise<any> => {
  try {
    const response = await apiClient.get('/user/preferences');
    return response.data;
  } catch (error) {
    console.error('Error fetching preferences:', error);
    const cached = await AsyncStorage.getItem('user_preferences');
    return cached ? JSON.parse(cached) : {};
  }
};

// Push Notification Registration
export const registerPushToken = async (token: string): Promise<void> => {
  try {
    await apiClient.post('/notifications/register', { token });
  } catch (error) {
    console.error('Error registering push token:', error);
  }
};

export const updateNotificationPreferences = async (preferences: any): Promise<void> => {
  try {
    await apiClient.post('/notifications/preferences', preferences);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
  }
};

export default apiClient;