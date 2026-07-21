import React from 'react';
import { View, StyleSheet, Text, SafeAreaView, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { useQuizStore } from '../stores/quizStore';
import { useStudyStore } from '../stores/studyStore';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Ionicons } from '@expo/vector-icons';

export const ProgressScreen: React.FC = () => {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  // Store data
  const { history, wrongQuestions, bookmarkedQuestions } = useQuizStore();
  const { chapters, progress } = useStudyStore();

  // 1. Calculations for study progress
  const totalSubtopics = chapters.reduce((acc, c) => acc + c.subtopics.length, 0);
  const completedSubtopics = progress.completedSubtopics.length;
  const studyProgressPercent = totalSubtopics > 0 ? completedSubtopics / totalSubtopics : 0;

  // 2. Calculations for quiz performance
  const totalQuizzes = history.length;
  const avgScore = totalQuizzes > 0
    ? history.reduce((acc, h) => acc + h.score, 0) / totalQuizzes
    : 0;

  const bestScore = totalQuizzes > 0
    ? Math.max(...history.map(h => h.score))
    : 0;

  const totalCorrect = history.reduce((acc, h) => acc + h.correctCount, 0);
  const totalIncorrect = history.reduce((acc, h) => acc + h.incorrectCount, 0);

  // 3. Overall Readiness Meter (60% quiz avg + 40% study progress)
  const quizWeight = 0.6;
  const studyWeight = 0.4;
  
  // Readiness calculated as weighted percentage
  const readinessValue = Math.round(
    (avgScore * quizWeight) + (studyProgressPercent * 100 * studyWeight)
  );

  const getReadinessStatus = (value: number) => {
    if (value < 40) return { label: t('progress.keepStudying'), color: colors.error };
    if (value < 70) return { label: t('progress.gettingThere'), color: colors.warning };
    if (value < 90) return { label: t('progress.almostReady'), color: '#2F80ED' }; // custom blue
    return { label: t('progress.examReady'), color: colors.success };
  };

  const readiness = getReadinessStatus(readinessValue);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>{t('tabs.progress')}</Text>

        {/* Readiness Meter Card */}
        <Card style={styles.readinessCard}>
          <Text style={[styles.readinessTitle, { color: colors.textSecondary }]}>{t('progress.examReadiness')}</Text>
          <View style={styles.meterContainer}>
            <View style={[styles.gaugeBg, { backgroundColor: colors.backgroundSelected }]}>
              <View style={[styles.gaugeFill, { backgroundColor: readiness.color, width: `${readinessValue}%` }]} />
            </View>
            <Text style={[styles.gaugeText, { color: colors.text }]}>{readinessValue}%</Text>
          </View>
          <Text style={[styles.readinessLabel, { color: readiness.color }]}>
            {readiness.label}
          </Text>
          <Text style={[styles.readinessDesc, { color: colors.textSecondary }]}>
            {t('progress.readinessDesc', { quizScore: Math.round(avgScore), studyScore: Math.round(studyProgressPercent * 100) })}
          </Text>
        </Card>

        {/* Study Analytics */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('progress.studyAnalytics')}</Text>

        <Card style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={[styles.statLbl, { color: colors.textSecondary }]}>{t('progress.quizzesCompleted')}</Text>
            <Text style={[styles.statVal, { color: colors.text }]}>{totalQuizzes}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.statRow}>
            <Text style={[styles.statLbl, { color: colors.textSecondary }]}>{t('progress.averageScore')}</Text>
            <Text style={[styles.statVal, { color: colors.text }]}>{Math.round(avgScore)}%</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.statRow}>
            <Text style={[styles.statLbl, { color: colors.textSecondary }]}>{t('progress.bestPracticeScore')}</Text>
            <Text style={[styles.statVal, { color: colors.success }]}>{bestScore}%</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.statRow}>
            <Text style={[styles.statLbl, { color: colors.textSecondary }]}>{t('progress.correctAnswers')}</Text>
            <Text style={[styles.statVal, { color: colors.success }]}>{totalCorrect}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.statRow}>
            <Text style={[styles.statLbl, { color: colors.textSecondary }]}>{t('progress.incorrectAnswers')}</Text>
            <Text style={[styles.statVal, { color: colors.error }]}>{totalIncorrect}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.statRow}>
            <Text style={[styles.statLbl, { color: colors.textSecondary }]}>{t('quiz.bookmarkedQuestions')}</Text>
            <Text style={[styles.statVal, { color: colors.text }]}>{bookmarkedQuestions.length}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.statRow}>
            <Text style={[styles.statLbl, { color: colors.textSecondary }]}>{t('progress.reviewQueue')}</Text>
            <Text style={[styles.statVal, { color: colors.error }]}>{wrongQuestions.length}</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
  },
  readinessCard: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 28,
  },
  readinessTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  meterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 16,
    marginBottom: 12,
  },
  gaugeBg: {
    flex: 1,
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 8,
  },
  gaugeText: {
    fontSize: 18,
    fontWeight: '800',
  },
  readinessLabel: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  readinessDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  statsCard: {
    padding: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statLbl: {
    fontSize: 14,
    fontWeight: '600',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    width: '100%',
  },
});
