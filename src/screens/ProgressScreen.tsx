import React from 'react';
import {View, StyleSheet, SafeAreaView, ScrollView} from 'react-native';
import { Text } from '../components/ui/Text';

import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { useQuizStore } from '../stores/quizStore';
import { useStudyStore } from '../stores/studyStore';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, withDelay, FadeInUp } from 'react-native-reanimated';

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

  const fillAnim = useSharedValue(0);

  React.useEffect(() => {
    fillAnim.value = withDelay(300, withTiming(readinessValue, { duration: 1200, easing: Easing.out(Easing.cubic) }));
  }, [readinessValue]);

  const animatedFillStyle = useAnimatedStyle(() => ({
    width: `${fillAnim.value}%`,
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>{t('tabs.progress')}</Text>

        {/* Readiness Meter Card */}
        <Animated.View entering={FadeInUp.delay(100).springify()}>
          <Card style={styles.readinessCard}>
            <Text style={[styles.readinessTitle, { color: colors.textSecondary }]}>{t('progress.examReadiness')}</Text>
            <View style={styles.meterContainer}>
              <View style={[styles.gaugeBg, { backgroundColor: colors.backgroundSelected }]}>
                <Animated.View style={[styles.gaugeFill, { backgroundColor: readiness.color }, animatedFillStyle]} />
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
        </Animated.View>

        {/* Study Analytics Bento Grid */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 12 }]}>{t('progress.studyAnalytics')}</Text>

        <View style={styles.bentoGrid}>
          {/* Row 1: Big Scores */}
          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.bentoRow}>
            <Card style={[styles.bentoCard, styles.flex1]}>
              <View style={[styles.bentoIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="analytics" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.bentoLabel, { color: colors.textSecondary }]}>{t('progress.averageScore')}</Text>
              <Text style={[styles.bentoValue, { color: colors.text }]}>{Math.round(avgScore)}%</Text>
            </Card>
            
            <Card style={[styles.bentoCard, styles.flex1]}>
              <View style={[styles.bentoIcon, { backgroundColor: '#10B98115' }]}>
                <Ionicons name="trophy" size={24} color="#10B981" />
              </View>
              <Text style={[styles.bentoLabel, { color: colors.textSecondary }]}>{t('progress.bestPracticeScore')}</Text>
              <Text style={[styles.bentoValue, { color: '#10B981' }]}>{bestScore}%</Text>
            </Card>
          </Animated.View>

          {/* Row 2: Stats Trio */}
          <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.bentoRow}>
            <Card style={[styles.bentoCard, styles.flex1]}>
              <Text style={[styles.bentoLabelSmall, { color: colors.textSecondary }]}>{t('progress.quizzesCompleted')}</Text>
              <Text style={[styles.bentoValueSmall, { color: colors.text }]}>{totalQuizzes}</Text>
            </Card>
            <Card style={[styles.bentoCard, styles.flex1]}>
              <Text style={[styles.bentoLabelSmall, { color: colors.textSecondary }]}>{t('progress.correctAnswers')}</Text>
              <Text style={[styles.bentoValueSmall, { color: '#10B981' }]}>{totalCorrect}</Text>
            </Card>
            <Card style={[styles.bentoCard, styles.flex1]}>
              <Text style={[styles.bentoLabelSmall, { color: colors.textSecondary }]}>{t('progress.incorrectAnswers')}</Text>
              <Text style={[styles.bentoValueSmall, { color: colors.error }]}>{totalIncorrect}</Text>
            </Card>
          </Animated.View>

          {/* Row 3: Actionable Queues */}
          <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.bentoRow}>
            <Card style={[styles.bentoCard, styles.flex1, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
              <View>
                <Text style={[styles.bentoLabel, { color: colors.textSecondary }]}>{t('quiz.bookmarkedQuestions')}</Text>
                <Text style={[styles.bentoValue, { color: colors.text }]}>{bookmarkedQuestions.length}</Text>
              </View>
              <Ionicons name="bookmark" size={32} color={colors.primary} style={{ opacity: 0.2 }} />
            </Card>
            
            <Card style={[styles.bentoCard, styles.flex1, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
              <View>
                <Text style={[styles.bentoLabel, { color: colors.textSecondary }]}>{t('progress.reviewQueue')}</Text>
                <Text style={[styles.bentoValue, { color: colors.error }]}>{wrongQuestions.length}</Text>
              </View>
              <Ionicons name="alert-circle" size={32} color={colors.error} style={{ opacity: 0.2 }} />
            </Card>
          </Animated.View>
        </View>
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
  bentoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  bentoCard: {
    padding: 16,
    justifyContent: 'center',
  },
  bentoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  bentoLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  bentoValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  bentoLabelSmall: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  bentoValueSmall: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
});
