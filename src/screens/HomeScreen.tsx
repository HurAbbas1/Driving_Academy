import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, Platform, TouchableOpacity, Image, Pressable, useWindowDimensions } from 'react-native';
import { Text } from '../components/ui/Text';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';
import { useStudyStore } from '../stores/studyStore';
import { useLanguageStore, LanguageCode } from '../stores/languageStore';
import { Card } from '../components/ui/Card';
import { Ionicons } from '@expo/vector-icons';

interface HomeScreenProps {
  onNavigateToTab?: (tab: 'home' | 'study' | 'quiz' | 'progress' | 'profile') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToTab }) => {
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];
  const profile = useAuthStore((state) => state.profile);

  // Store data
  const { chapters, progress } = useStudyStore();

  const streak = profile?.streak?.current ?? 0;
  const username = profile?.displayName || 'Learner';

  // Calculate study progress dynamically against active handbook subtopics
  const activeSubtopicIds = new Set(
    chapters.flatMap(c => (c.subtopics || []).map(s => s.id))
  );
  const validCompletedSubtopics = (progress?.completedSubtopics || []).filter(id => activeSubtopicIds.has(id));
  const totalSubtopics = activeSubtopicIds.size || 14;
  const completedSubtopics = validCompletedSubtopics.length;
  const studyProgressPercent = totalSubtopics > 0
    ? Math.min(100, Math.round((completedSubtopics / totalSubtopics) * 100))
    : 0;

  const remainingLessons = Math.max(0, totalSubtopics - completedSubtopics);
  const totalChapters = chapters.length || 14;

  const currentLang = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Header / App Branding Area */}
        <View style={styles.topNav}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Logo Badge */}
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>NS</Text>
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={[styles.logoBrandMain, { color: colors.text }]}>NEW SUNSHINE</Text>
              <Text style={styles.logoBrandSub}>DRIVING ACADEMY</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 50 }}>
            {/* Language Selector Dropdown */}
            <View style={{ position: 'relative' }}>
              <Pressable 
                style={[styles.langSelector, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
                onPress={() => setIsLangMenuOpen(!isLangMenuOpen)}
              >
                <Ionicons name="globe-outline" size={16} color={colors.text} />
                <Text style={[styles.langText, { color: colors.text }]}>{currentLang.toUpperCase()}</Text>
                <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
              </Pressable>
              
              {isLangMenuOpen && (
                <View style={[styles.langDropdown, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  {['en', 'ja', 'zh', 'pt'].map((lang) => (
                    <Pressable
                      key={lang}
                      style={[styles.langDropdownItem, currentLang === lang && { backgroundColor: `${colors.primary}15` }]}
                      onPress={() => {
                        setLanguage(lang as LanguageCode);
                        setIsLangMenuOpen(false);
                      }}
                    >
                      <Text style={[styles.langDropdownText, { color: currentLang === lang ? colors.primary : colors.text }]}>
                        {lang.toUpperCase()}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Hero Banner Card */}
        <View style={styles.heroWrapper}>
          <Card style={[styles.heroCard, { backgroundColor: theme === 'dark' ? colors.backgroundElement : '#FFFFFF' }]}>
            {/* Fuji & Sakura Background Image on Right */}
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80' }} 
              style={styles.heroBgImage} 
              resizeMode="cover" 
            />
            {/* Smooth Left Linear Gradient Fade Overlay */}
            <View 
              style={[
                styles.heroOverlay, 
                Platform.select({
                  web: {
                    backgroundImage: theme === 'dark' 
                      ? 'linear-gradient(to right, #14161D 0%, #14161D 35%, rgba(20,22,29,0.85) 55%, rgba(20,22,29,0) 80%)'
                      : 'linear-gradient(to right, #FFFFFF 0%, #FFFFFF 35%, rgba(255,255,255,0.85) 55%, rgba(255,255,255,0) 80%)',
                  } as any,
                  default: {
                    backgroundColor: theme === 'dark' ? 'rgba(26,26,46,0.5)' : 'rgba(255,255,255,0.4)',
                  }
                })
              ]} 
            />

            {/* Content Overlay */}
            <View style={styles.heroContent}>
              <Text style={styles.greetingText}>
                {t('home.greeting', { name: username })}
              </Text>
              
              <Text style={[styles.heroHeadline, { color: colors.text }]}>
                {t('home.heroHeadlineStart')}<Text style={{ color: colors.primary }}>{t('home.confidence')}</Text>
              </Text>

              {/* Action Buttons */}
              <View style={styles.heroBtnRow}>
                <TouchableOpacity 
                  activeOpacity={0.9} 
                  onPress={() => onNavigateToTab?.('study')} 
                  style={[styles.continueBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.continueBtnText}>{t('home.continueLearning')}</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity 
                  activeOpacity={0.88} 
                  onPress={() => onNavigateToTab?.('quiz')} 
                  style={[styles.quizBtn, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.12)' : '#FFFFFF', borderColor: '#E2E8F0' }]}
                >
                  <View style={styles.questionCircle}>
                    <Ionicons name="help-outline" size={14} color={colors.text} />
                  </View>
                  <Text style={[styles.quizBtnText, { color: colors.text }]}>{t('home.takeAQuiz')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        </View>

        {/* SWAPPED POSITION 1: Study Rules Take & Action Bento Cards */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.studyRulesTake')}</Text>
            <TouchableOpacity onPress={() => onNavigateToTab?.('study')}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>{t('home.viewAll')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionCardsRow}>
            {/* Card 1: Study Rules Take */}
            <Card style={styles.actionCard} onPress={() => onNavigateToTab?.('study')}>
              <View style={styles.actionCardTop}>
                <View style={[styles.actionIconCircle, { backgroundColor: colors.primary }]}>
                  <Ionicons name="book" size={22} color="#FFF" />
                </View>
                <Text style={[styles.actionCardTitle, { color: colors.text }]}>{t('home.studyRulesTake')}</Text>
                <Text style={[styles.actionCardSub, { color: colors.textSecondary }]}>
                  {t('home.masterTrafficRules')}
                </Text>
              </View>
              <View style={styles.actionCardFooter}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 13 }}>⭐</Text>
                  <Text style={[styles.footerMetaText, { color: colors.textSecondary }]}>
                    {t('home.chaptersCount', { count: totalChapters })}
                  </Text>
                </View>
                <View style={[styles.arrowCircleBtn, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : '#F0F0F5' }]}>
                  <Ionicons name="arrow-forward" size={16} color={colors.text} />
                </View>
              </View>
            </Card>

            {/* Card 2: Take Practice Quiz */}
            <Card style={styles.actionCard} onPress={() => onNavigateToTab?.('quiz')}>
              <View style={styles.actionCardTop}>
                <View style={[styles.actionIconCircle, { backgroundColor: '#FF8A65' }]}>
                  <Ionicons name="help-sharp" size={22} color="#FFF" />
                </View>
                <Text style={[styles.actionCardTitle, { color: colors.text }]}>{t('home.takePracticeQuiz')}</Text>
                <Text style={[styles.actionCardSub, { color: colors.textSecondary }]}>
                  {t('home.realExamQuestions')}
                </Text>
              </View>
              <View style={styles.actionCardFooter}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 13 }}>🎯</Text>
                  <Text style={[styles.footerMetaText, { color: colors.textSecondary }]}>{t('home.questionsCount')}</Text>
                </View>
                <View style={[styles.arrowCircleBtn, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : '#F0F0F5' }]}>
                  <Ionicons name="arrow-forward" size={16} color={colors.text} />
                </View>
              </View>
            </Card>
          </View>
        </View>

        {/* SWAPPED POSITION 2: My Progress Card */}
        <View style={styles.sectionContainer}>
          <Card style={[styles.progressCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <View style={styles.progressCardContent}>
              {/* Left Column: Overall Progress */}
              <View style={styles.progressLeftCol}>
                <View style={styles.progressHeaderRow}>
                  <View style={styles.progressIconBadge}>
                    <Ionicons name="bar-chart-sharp" size={18} color="#2E7D32" />
                  </View>
                  <Text style={[styles.progressTitle, { color: colors.text }]}>{t('home.myProgress')}</Text>
                </View>

                <Text style={[styles.progressPercentText, { color: colors.text }]}>
                  {studyProgressPercent}%
                </Text>
                <Text style={[styles.progressSubtext, { color: colors.textSecondary }]}>
                  {t('home.overallProgress')}
                </Text>

                <View style={styles.progressTrackBg}>
                  <View style={[styles.progressTrackFill, { backgroundColor: colors.primary, width: `${Math.max(10, studyProgressPercent)}%` }]} />
                </View>
              </View>

              {/* Vertical Separator */}
              <View style={[styles.colDivider, { backgroundColor: colors.border }]} />

              {/* Right Column: Streak & Lessons Left */}
              <View style={styles.progressRightCol}>
                {/* Streak Item */}
                <View style={styles.statItemRow}>
                  <View style={styles.statIconFrame}>
                    <Ionicons name="flame" size={22} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.statValueBold, { color: colors.primary }]}>
                      {t('home.dayStreak', { count: streak })}
                    </Text>
                    <Text style={[styles.statSubText, { color: colors.textSecondary }]}>
                      {t('home.keepItGoing')}
                    </Text>
                  </View>
                </View>

                {/* Lessons Left Item */}
                <View style={[styles.statItemRow, { marginTop: 16 }]}>
                  <View style={styles.statIconFrame}>
                    <Ionicons name="calendar-outline" size={20} color="#0288D1" />
                  </View>
                  <View>
                    <Text style={[styles.statValueBold, { color: colors.text }]}>
                      {t('home.lessonsLeft', { count: remainingLessons })}
                    </Text>
                    <Text style={[styles.statSubText, { color: colors.textSecondary }]}>
                      {t('home.untilNextMilestone')}
                    </Text>
                  </View>
                </View>
              </View>
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
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 40,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: Platform.OS === 'ios' ? 0 : 12,
    zIndex: 100,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E31837',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBadgeText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 16,
    fontStyle: 'italic',
  },
  logoBrandMain: {
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1.2,
    lineHeight: 16,
  },
  logoBrandSub: {
    color: '#E31837',
    fontWeight: '800',
    fontSize: 9,
    letterSpacing: 1.5,
    lineHeight: 11,
  },
  langSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
  },
  langText: {
    fontSize: 12,
    fontWeight: '700',
  },
  langDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 8,
    width: 80,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 999,
  },
  langDropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  langDropdownText: {
    fontSize: 12,
    fontWeight: '700',
  },
  // Hero Section
  heroWrapper: {
    marginBottom: 20,
  },
  heroCard: {
    padding: 0,
    borderRadius: 24,
    overflow: 'hidden',
    minHeight: 245,
    position: 'relative',
  },
  heroBgImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '72%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
  },
  heroContent: {
    padding: 24,
    zIndex: 2,
  },
  greetingText: {
    color: '#E31837',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  heroHeadline: {
    fontSize: 25,
    fontWeight: '900',
    lineHeight: 33,
    maxWidth: '78%',
    marginBottom: 22,
  },
  heroBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 25,
    gap: 8,
    ...Platform.select({
      web: { boxShadow: '0 6px 18px rgba(227, 24, 55, 0.38)' } as any,
    }),
  },
  continueBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  quizBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    gap: 8,
  },
  questionCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Section Headers
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Action Cards Row
  actionCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    justifyContent: 'space-between',
    minHeight: 180,
  },
  actionCardTop: {
    marginBottom: 16,
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  actionCardSub: {
    fontSize: 12,
    lineHeight: 17,
  },
  actionCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  footerMetaText: {
    fontSize: 12,
    fontWeight: '700',
  },
  arrowCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Progress Card
  progressCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  progressCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressLeftCol: {
    flex: 1.1,
    paddingRight: 14,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  progressIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressPercentText: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  progressSubtext: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressTrackBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  progressTrackFill: {
    height: '100%',
    borderRadius: 3,
  },
  colDivider: {
    width: 1,
    height: '80%',
    marginHorizontal: 4,
  },
  progressRightCol: {
    flex: 1,
    paddingLeft: 14,
  },
  statItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statIconFrame: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValueBold: {
    fontSize: 13,
    fontWeight: '800',
  },
  statSubText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
