import React from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';

export default function App() {
  const articles = [
    {
      id: '1',
      title: 'Arsenal Eye Premier League Glory',
      category: 'News',
      image: 'https://via.placeholder.com/400x200',
      summary: 'The Gunners are looking strong this season with key signings making an immediate impact.',
      author: 'John Smith',
      date: '2 hours ago'
    },
    {
      id: '2',
      title: 'Manchester United Transfer Update',
      category: 'Transfers',
      image: 'https://via.placeholder.com/400x200',
      summary: 'Red Devils linked with multiple targets as transfer window approaches.',
      author: 'Sarah Johnson',
      date: '4 hours ago'
    },
    {
      id: '3',
      title: 'Liverpool vs Chelsea Preview',
      category: 'Match Preview',
      image: 'https://via.placeholder.com/400x200',
      summary: 'Two giants clash at Anfield in what promises to be an exciting encounter.',
      author: 'Mike Wilson',
      date: '6 hours ago'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
        backgroundColor="#262627"
      />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚽ EPL News Hub</Text>
        <Text style={styles.headerSubtitle}>Premier League News & Updates</Text>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Article */}
        <TouchableOpacity style={styles.heroCard} activeOpacity={0.9}>
          <Image 
            source={{ uri: 'https://via.placeholder.com/400x250' }}
            style={styles.heroImage}
          />
          <View style={styles.heroContent}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>BREAKING</Text>
            </View>
            <Text style={styles.heroTitle}>Premier League Title Race Heats Up</Text>
            <Text style={styles.heroSummary}>
              Arsenal, Liverpool, and Manchester City separated by just 3 points with 10 games remaining
            </Text>
            <Text style={styles.articleMeta}>EPL News Hub • 1 hour ago</Text>
          </View>
        </TouchableOpacity>

        {/* Article List */}
        <View style={styles.articleList}>
          <Text style={styles.sectionTitle}>Latest News</Text>
          
          {articles.map((article) => (
            <TouchableOpacity key={article.id} style={styles.articleCard} activeOpacity={0.8}>
              <Image 
                source={{ uri: article.image }}
                style={styles.articleImage}
              />
              <View style={styles.articleContent}>
                <View style={styles.articleBadge}>
                  <Text style={styles.articleCategory}>{article.category.toUpperCase()}</Text>
                </View>
                <Text style={styles.articleTitle} numberOfLines={2}>
                  {article.title}
                </Text>
                <Text style={styles.articleSummary} numberOfLines={2}>
                  {article.summary}
                </Text>
                <View style={styles.articleMetaContainer}>
                  <Text style={styles.articleAuthor}>{article.author}</Text>
                  <Text style={styles.articleDate}>{article.date}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* FPL Tools Section */}
        <View style={styles.fplSection}>
          <Text style={styles.sectionTitle}>FPL Tools</Text>
          <View style={styles.toolsGrid}>
            <TouchableOpacity style={styles.toolCard}>
              <Text style={styles.toolIcon}>📊</Text>
              <Text style={styles.toolTitle}>Player Stats</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolCard}>
              <Text style={styles.toolIcon}>🔮</Text>
              <Text style={styles.toolTitle}>Predictor</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolCard}>
              <Text style={styles.toolIcon}>💰</Text>
              <Text style={styles.toolTitle}>Transfers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolCard}>
              <Text style={styles.toolIcon}>🏆</Text>
              <Text style={styles.toolTitle}>League Table</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>📰</Text>
          <Text style={styles.navText}>News</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>⚽</Text>
          <Text style={styles.navText}>FPL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>📊</Text>
          <Text style={styles.navText}>Stats</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#262627',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#00ff87',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  heroCard: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  heroImage: {
    width: '100%',
    height: 220,
  },
  heroContent: {
    padding: 15,
  },
  categoryBadge: {
    backgroundColor: '#ff0000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  categoryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  heroSummary: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  articleMeta: {
    fontSize: 12,
    color: '#999',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  articleList: {
    marginTop: 10,
  },
  articleCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  articleImage: {
    width: 100,
    height: 100,
  },
  articleContent: {
    flex: 1,
    padding: 12,
  },
  articleBadge: {
    backgroundColor: '#38003c',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 3,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  articleCategory: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  articleSummary: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    lineHeight: 16,
  },
  articleMetaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  articleAuthor: {
    fontSize: 10,
    color: '#999',
  },
  articleDate: {
    fontSize: 10,
    color: '#999',
  },
  fplSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
  },
  toolCard: {
    width: '48%',
    backgroundColor: '#fff',
    margin: '1%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  toolIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  toolTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navText: {
    fontSize: 10,
    color: '#666',
  },
});