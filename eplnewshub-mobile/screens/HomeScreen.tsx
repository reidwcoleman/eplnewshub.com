import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import * as Haptics from 'expo-haptics';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

// Services
import { fetchArticles, Article } from '../services/api';
import { cacheArticle, getCachedArticles } from '../services/cache';
import { trackEvent } from '../services/analytics';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

const HomeScreen = () => {
  const navigation = useNavigation();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadInitialArticles();
  }, []);

  const loadInitialArticles = async () => {
    try {
      // Try to load cached articles first for instant display
      const cached = await getCachedArticles();
      if (cached.length > 0) {
        setArticles(cached);
        setLoading(false);
      }

      // Then fetch fresh articles
      const freshArticles = await fetchArticles(1);
      setArticles(freshArticles);
      
      // Cache articles for offline reading
      freshArticles.forEach(article => cacheArticle(article));
      
      trackEvent('articles_loaded', { page: 1, count: freshArticles.length });
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    
    try {
      const freshArticles = await fetchArticles(1);
      setArticles(freshArticles);
      
      // Light haptic feedback on refresh
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error refreshing articles:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadMoreArticles = async () => {
    if (!hasMore || loading) return;

    const nextPage = page + 1;
    try {
      const moreArticles = await fetchArticles(nextPage);
      if (moreArticles.length === 0) {
        setHasMore(false);
      } else {
        setArticles([...articles, ...moreArticles]);
        setPage(nextPage);
        
        // Cache new articles
        moreArticles.forEach(article => cacheArticle(article));
      }
    } catch (error) {
      console.error('Error loading more articles:', error);
    }
  };

  const handleArticlePress = (article: Article) => {
    // Haptic feedback on press
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Track article view
    trackEvent('article_opened', { 
      articleId: article.id,
      title: article.title,
      category: article.category 
    });
    
    // Navigate to article detail
    navigation.navigate('ArticleDetail', { article });
  };

  const renderArticle = ({ item, index }: { item: Article; index: number }) => {
    // Insert ad every 5 articles
    if ((index + 1) % 5 === 0) {
      return (
        <>
          <ArticleCard article={item} onPress={() => handleArticlePress(item)} />
          <View style={styles.adContainer}>
            <BannerAd
              unitId="ca-app-pub-6480210605786899/1234567890"
              size={BannerAdSize.MEDIUM_RECTANGLE}
              requestOptions={{
                requestNonPersonalizedAdsOnly: true,
              }}
            />
          </View>
        </>
      );
    }

    return <ArticleCard article={item} onPress={() => handleArticlePress(item)} />;
  };

  const renderSkeleton = () => (
    <SkeletonPlaceholder backgroundColor="#f0f0f0" highlightColor="#e0e0e0">
      <View style={styles.skeletonContainer}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.skeletonCard}>
            <View style={styles.skeletonImage} />
            <View style={styles.skeletonTextContainer}>
              <View style={styles.skeletonTitle} />
              <View style={styles.skeletonSubtitle} />
              <View style={styles.skeletonMeta} />
            </View>
          </View>
        ))}
      </View>
    </SkeletonPlaceholder>
  );

  if (loading && articles.length === 0) {
    return renderSkeleton();
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={articles}
        renderItem={renderArticle}
        keyExtractor={(item) => item.id}
        estimatedItemSize={isTablet ? 200 : 120}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#38003c']}
            tintColor="#38003c"
          />
        }
        onEndReached={loadMoreArticles}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          hasMore ? (
            <View style={styles.loadingFooter}>
              <ActivityIndicator size="small" color="#38003c" />
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        numColumns={isTablet ? 2 : 1}
      />
    </View>
  );
};

const ArticleCard = ({ article, onPress }: { article: Article; onPress: () => void }) => {
  return (
    <TouchableOpacity
      style={[styles.articleCard, isTablet && styles.tabletCard]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <ExpoImage
        source={{ uri: article.imageUrl }}
        style={styles.articleImage}
        contentFit="cover"
        transition={200}
        placeholder={article.blurhash}
      />
      <View style={styles.articleContent}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{article.category.toUpperCase()}</Text>
        </View>
        <Text style={styles.articleTitle} numberOfLines={2}>
          {article.title}
        </Text>
        <Text style={styles.articleSummary} numberOfLines={2}>
          {article.summary}
        </Text>
        <View style={styles.articleMeta}>
          <Text style={styles.articleAuthor}>{article.author}</Text>
          <Text style={styles.articleDate}>{article.publishedAt}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    paddingHorizontal: isTablet ? 20 : 10,
    paddingTop: 10,
    paddingBottom: 20,
  },
  articleCard: {
    backgroundColor: '#fff',
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabletCard: {
    marginHorizontal: 5,
    flex: 0.48,
  },
  articleImage: {
    width: '100%',
    height: isTablet ? 250 : 200,
  },
  articleContent: {
    padding: 15,
  },
  categoryBadge: {
    backgroundColor: '#38003c',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Roboto-Bold',
    letterSpacing: 0.5,
  },
  articleTitle: {
    fontSize: isTablet ? 20 : 18,
    fontFamily: 'Roboto-Bold',
    color: '#000',
    marginBottom: 8,
    lineHeight: 24,
  },
  articleSummary: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  articleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  articleAuthor: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#999',
  },
  articleDate: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#999',
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  adContainer: {
    alignItems: 'center',
    marginVertical: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
  },
  skeletonContainer: {
    padding: 10,
  },
  skeletonCard: {
    backgroundColor: '#fff',
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  skeletonImage: {
    width: '100%',
    height: 200,
  },
  skeletonTextContainer: {
    padding: 15,
  },
  skeletonTitle: {
    width: '80%',
    height: 20,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonSubtitle: {
    width: '100%',
    height: 14,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonMeta: {
    width: '40%',
    height: 12,
    borderRadius: 4,
  },
})

export default HomeScreen;