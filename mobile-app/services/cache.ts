import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system';
import { Article, Player, Team } from './api';

// Cache configuration
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
const CACHE_VERSION = 'v1';

// Cache keys
const CACHE_KEYS = {
  ARTICLES: 'cached_articles',
  ARTICLE_DETAIL: 'cached_article_',
  PLAYERS: 'cached_players',
  STANDINGS: 'cached_standings',
  IMAGES: 'cached_images',
  PREFERENCES: 'user_preferences',
  LAST_SYNC: 'last_sync_time',
};

interface CacheItem<T> {
  data: T;
  timestamp: number;
  version: string;
}

// Generic cache functions
async function setCache<T>(key: string, data: T): Promise<void> {
  try {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
  } catch (error) {
    console.error(`Error setting cache for ${key}:`, error);
  }
}

async function getCache<T>(key: string, maxAge: number = CACHE_EXPIRY): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const cacheItem: CacheItem<T> = JSON.parse(cached);
    
    // Check version
    if (cacheItem.version !== CACHE_VERSION) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    // Check expiry
    const age = Date.now() - cacheItem.timestamp;
    if (age > maxAge) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return cacheItem.data;
  } catch (error) {
    console.error(`Error getting cache for ${key}:`, error);
    return null;
  }
}

// Article caching
export async function cacheArticle(article: Article): Promise<void> {
  await setCache(`${CACHE_KEYS.ARTICLE_DETAIL}${article.id}`, article);
  
  // Cache the image
  if (article.imageUrl) {
    await cacheImage(article.imageUrl);
  }
}

export async function getCachedArticle(articleId: string): Promise<Article | null> {
  return getCache<Article>(`${CACHE_KEYS.ARTICLE_DETAIL}${articleId}`);
}

export async function cacheArticles(articles: Article[]): Promise<void> {
  await setCache(CACHE_KEYS.ARTICLES, articles);
  
  // Cache all article images in background
  articles.forEach(article => {
    if (article.imageUrl) {
      cacheImage(article.imageUrl);
    }
  });
}

export async function getCachedArticles(): Promise<Article[]> {
  const cached = await getCache<Article[]>(CACHE_KEYS.ARTICLES);
  return cached || [];
}

// Image caching
export async function cacheImage(imageUrl: string): Promise<void> {
  try {
    // Use Expo Image's built-in caching
    await Image.prefetch(imageUrl);
    
    // Additionally, save to file system for offline access
    const filename = imageUrl.split('/').pop() || 'image';
    const fileUri = `${FileSystem.cacheDirectory}${filename}`;
    
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      await FileSystem.downloadAsync(imageUrl, fileUri);
      
      // Track cached images
      const cachedImages = await AsyncStorage.getItem(CACHE_KEYS.IMAGES);
      const images = cachedImages ? JSON.parse(cachedImages) : {};
      images[imageUrl] = fileUri;
      await AsyncStorage.setItem(CACHE_KEYS.IMAGES, JSON.stringify(images));
    }
  } catch (error) {
    console.error('Error caching image:', error);
  }
}

export async function getCachedImageUri(imageUrl: string): Promise<string> {
  try {
    const cachedImages = await AsyncStorage.getItem(CACHE_KEYS.IMAGES);
    if (cachedImages) {
      const images = JSON.parse(cachedImages);
      const localUri = images[imageUrl];
      
      if (localUri) {
        const fileInfo = await FileSystem.getInfoAsync(localUri);
        if (fileInfo.exists) {
          return localUri;
        }
      }
    }
  } catch (error) {
    console.error('Error getting cached image:', error);
  }
  
  return imageUrl; // Return original URL if not cached
}

// Player caching
export async function cachePlayers(players: Player[]): Promise<void> {
  await setCache(CACHE_KEYS.PLAYERS, players);
}

export async function getCachedPlayers(): Promise<Player[]> {
  const cached = await getCache<Player[]>(CACHE_KEYS.PLAYERS);
  return cached || [];
}

// Standings caching
export async function cacheStandings(standings: Team[]): Promise<void> {
  await setCache(CACHE_KEYS.STANDINGS, standings);
}

export async function getCachedStandings(): Promise<Team[]> {
  const cached = await getCache<Team[]>(CACHE_KEYS.STANDINGS);
  return cached || [];
}

// Clear cache functions
export async function clearCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => 
      key.startsWith('cached_') || 
      key === CACHE_KEYS.LAST_SYNC
    );
    await AsyncStorage.multiRemove(cacheKeys);
    
    // Clear image cache directory
    await FileSystem.deleteAsync(FileSystem.cacheDirectory || '', { idempotent: true });
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

export async function getCacheSize(): Promise<number> {
  try {
    let totalSize = 0;
    
    // Calculate AsyncStorage size
    const keys = await AsyncStorage.getAllKeys();
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        totalSize += new Blob([value]).size;
      }
    }
    
    // Calculate file system cache size
    const cacheDir = await FileSystem.getInfoAsync(FileSystem.cacheDirectory || '');
    if (cacheDir.exists && 'size' in cacheDir) {
      totalSize += cacheDir.size || 0;
    }
    
    return totalSize;
  } catch (error) {
    console.error('Error calculating cache size:', error);
    return 0;
  }
}

export async function pruneCache(): Promise<void> {
  try {
    const currentSize = await getCacheSize();
    
    if (currentSize > MAX_CACHE_SIZE) {
      // Remove oldest cached items first
      const keys = await AsyncStorage.getAllKeys();
      const cacheItems: { key: string; timestamp: number }[] = [];
      
      for (const key of keys) {
        if (key.startsWith('cached_')) {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            try {
              const item = JSON.parse(value);
              cacheItems.push({ key, timestamp: item.timestamp || 0 });
            } catch {}
          }
        }
      }
      
      // Sort by timestamp (oldest first)
      cacheItems.sort((a, b) => a.timestamp - b.timestamp);
      
      // Remove oldest items until under size limit
      let removed = 0;
      for (const item of cacheItems) {
        if (currentSize - removed < MAX_CACHE_SIZE * 0.8) break; // Keep 20% buffer
        
        const value = await AsyncStorage.getItem(item.key);
        if (value) {
          removed += new Blob([value]).size;
          await AsyncStorage.removeItem(item.key);
        }
      }
    }
  } catch (error) {
    console.error('Error pruning cache:', error);
  }
}

// Sync management
export async function setLastSyncTime(): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString());
}

export async function getLastSyncTime(): Promise<number> {
  const time = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
  return time ? parseInt(time, 10) : 0;
}

export async function needsSync(): Promise<boolean> {
  const lastSync = await getLastSyncTime();
  const timeSinceSync = Date.now() - lastSync;
  return timeSinceSync > CACHE_EXPIRY / 4; // Sync every 6 hours
}

// Initialize cache management
export async function initializeCache(): Promise<void> {
  // Prune cache on app start
  await pruneCache();
  
  // Set up periodic cache pruning
  setInterval(() => {
    pruneCache();
  }, 60 * 60 * 1000); // Every hour
}

export default {
  cacheArticle,
  getCachedArticle,
  cacheArticles,
  getCachedArticles,
  cacheImage,
  getCachedImageUri,
  cachePlayers,
  getCachedPlayers,
  cacheStandings,
  getCachedStandings,
  clearCache,
  getCacheSize,
  pruneCache,
  setLastSyncTime,
  getLastSyncTime,
  needsSync,
  initializeCache,
};