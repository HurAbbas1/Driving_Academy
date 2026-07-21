import React from 'react';
import { View, StyleSheet, Text, SafeAreaView, ScrollView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';
import { useQuizStore } from '../stores/quizStore';
import { useStudyStore } from '../stores/studyStore';
import { useLanguageStore } from '../stores/languageStore';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Ionicons } from '@expo/vector-icons';

interface HomeScreenProps {
  onNavigateToTab?: (tab: 'home' | 'study' | 'quiz' | 'progress' | 'profile') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToTab }) => {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];
  const profile = useAuthStore((state) => state.profile);

  // Store data
  const { history, bookmarkedQuestions, setViewMode } = useQuizStore();
  const { chapters, progress } = useStudyStore();

  const streak = profile?.streak?.current ?? 0;
  const username = profile?.displayName ?? 'Learner';

  const handleGoToBookmarks = () => {
    setViewMode('bookmarks');
    if (onNavigateToTab) {
      onNavigateToTab('quiz');
    }
  };

  const handleResumeReading = () => {
    if (onNavigateToTab) {
      onNavigateToTab('study');
    }
  };

  // Calculations
  const completedQuizzes = history.length;
  const avgScore = completedQuizzes > 0
    ? Math.round(history.reduce((acc, h) => acc + h.score, 0) / completedQuizzes)
    : 0;

  // Study progress calculation
  const totalSubtopics = chapters.reduce((acc, c) => acc + c.subtopics.length, 0);
  const completedSubtopics = progress.completedSubtopics.length;
  const studyProgressPercent = totalSubtopics > 0
    ? Math.round((completedSubtopics / totalSubtopics) * 100)
    : 0;

  const currentLang = useLanguageStore((state) => state.language);

  // Resume title details
  const getResumeTitle = () => {
    if (progress.lastReadSubtopicId && progress.lastReadChapterId) {
      const chapter = chapters.find(c => c.id === progress.lastReadChapterId);
      const sub = chapter?.subtopics.find(s => s.id === progress.lastReadSubtopicId);
      return sub?.title[currentLang] || '';
    }
    return '';
  };

  const resumeTitle = getResumeTitle();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background ambient radial gradient simulation wrapper */}
      <View style={[
        styles.gradientOverlay,
        {
          backgroundColor: colors.background,
          ...Platform.select({
            web: {
              backgroundImage: theme === 'dark' 
                ? 'radial-gradient(circle at 50% 50%, rgba(227, 24, 55, 0.05) 0%, rgba(13, 13, 13, 0) 70%)'
                : 'radial-gradient(circle at 50% 50%, rgba(227, 24, 55, 0.03) 0%, rgba(248, 250, 252, 0) 70%)',
            } as any,
          })
        }
      ]} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>{t('home.welcome')}</Text>
            <Text style={[styles.nameText, { color: colors.text }]}>{username} 👋</Text>
          </View>
          <View style={[styles.streakContainer, { backgroundColor: `${colors.warning}15`, borderColor: `${colors.warning}30`, borderWidth: 1 }]}>
            <Ionicons name="flame" size={20} color={colors.warning} />
            <Text style={[styles.streakText, { color: colors.warning }]}>{t('home.streakDays', { days: streak })}</Text>
          </View>
        </View>

        {/* Bento Grid Layout */}
        <View style={styles.bentoGrid}>
          {/* Row 1: Large Highlight Banner */}
          <Card variant="glass" style={styles.bentoBanner}>
            <Text style={[styles.bannerTitle, { color: colors.text }]}>{t('home.bannerTitle')}</Text>
            <Text style={[styles.bannerSubtitle, { color: colors.textSecondary }]}>{t('home.bannerSub')}</Text>
            <Badge label="English, 日本語, 中文, Português" variant="primary" style={styles.bannerBadge} />
          </Card>

          {/* Row 2: Side-by-Side Asymmetric Bento Cards (Stats) */}
          <View style={styles.bentoRow}>
            <Card style={[styles.bentoCardHalf, { flex: 1.1 }]} variant="glass">
              <View style={[styles.bentoIconWrapper, { backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)' }]}>
                <Ionicons name="checkbox-outline" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.bentoVal, { color: colors.text }]}>{completedQuizzes}</Text>
              <Text style={[styles.bentoLbl, { color: colors.textSecondary }]}>{t('home.quizzesCompleted')}</Text>
            </Card>

            <Card style={[styles.bentoCardHalf, { flex: 0.9 }]} variant="glass">
              <View style={[styles.bentoIconWrapper, { backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)' }]}>
                <Ionicons name="star-outline" size={22} color={colors.success} />
              </View>
              <Text style={[styles.bentoVal, { color: colors.text }]}>{avgScore}%</Text>
              <Text style={[styles.bentoLbl, { color: colors.textSecondary }]}>{t('quiz.averageScore')}</Text>
            </Card>
          </View>

          {/* Row 3: Bookmarks & Streak / Resume */}
          <View style={styles.bentoRow}>
            <Card onPress={handleGoToBookmarks} style={[styles.bentoCardHalf, { flex: 0.8, padding: 16 }]} variant="glass">
              <View style={[styles.bentoIconWrapper, { backgroundColor: `${colors.warning}15` }]}>
                <Ionicons name="bookmark" size={20} color={colors.warning} />
              </View>
              <Text style={[styles.bentoTitleSmall, { color: colors.text }]}>{t('quiz.bookmarkedQuestions')}</Text>
              <Text style={[styles.bentoSubSmall, { color: colors.textSecondary }]}>
                {bookmarkedQuestions.length} saved
              </Text>
            </Card>

            {resumeTitle ? (
              <Card style={[styles.bentoCardHalf, { flex: 1.2 }]} onPress={handleResumeReading} variant="glass">
                <View style={[styles.bentoIconWrapper, { backgroundColor: `${colors.primary}15` }]}>
                  <Ionicons name="play" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.bentoTitleSmall, { color: colors.text }]}>{t('home.resumeReading')}</Text>
                <Text style={[styles.bentoSubSmall, { color: colors.textSecondary }]} numberOfLines={1}>
                  {resumeTitle}
                </Text>
              </Card>
            ) : (
              <Card style={[styles.bentoCardHalf, { flex: 1.2 }]} variant="glass">
                <View style={[styles.bentoIconWrapper, { backgroundColor: `${colors.warning}15` }]}>
                  <Ionicons name="flame" size={20} color={colors.warning} />
                </View>
                <Text style={[styles.bentoTitleSmall, { color: colors.text }]}>{t('home.dailyStreak')}</Text>
                <Text style={[styles.bentoSubSmall, { color: colors.textSecondary }]}>
                  {t('home.daysActive', { count: streak })}
                </Text>
              </Card>
            )}
          </View>

          {/* Row 4: Large Study Progress Card (Full Width) */}
          <Card style={styles.bentoProgressCard} variant="glass">
            <View style={styles.progressHeader}>
              <Text style={[styles.progressTitle, { color: colors.text }]}>{t('progress.studyProgress')}</Text>
              <Text style={[styles.progressPercent, { color: colors.primary }]}>{studyProgressPercent}%</Text>
            </View>
            <ProgressBar progress={studyProgressPercent / 100} style={styles.progressBar} />
            <View style={styles.progressFooter}>
              <Ionicons name="book-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.progressFooterText, { color: colors.textSecondary, marginLeft: 6 }]}>
                {t('home.topicsRead', { completed: completedSubtopics, total: totalSubtopics })}
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '700',
  },
  bentoGrid: {
    gap: 16,
  },
  bentoBanner: {
    padding: 24,
    borderRadius: 24,
    // Add soft shadow glow
    ...Platform.select({
      web: { boxShadow: '0 8px 32px rgba(227, 24, 55, 0.08)' } as any,
    }),
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  bannerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  bannerBadge: {
    alignSelf: 'flex-start',
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  bentoCardHalf: {
    padding: 20,
    borderRadius: 20,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  bentoIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  bentoVal: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 12,
  },
  bentoLbl: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  bentoTitleSmall: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
  },
  bentoSubSmall: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  bentoProgressCard: {
    padding: 24,
    borderRadius: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  progressPercent: {
    fontSize: 15,
    fontWeight: '800',
  },
  progressBar: {
    marginBottom: 16,
  },
  progressFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressFooterText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
