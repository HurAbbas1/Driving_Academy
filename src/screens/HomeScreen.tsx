import React, { useState } from 'react';
import { View, StyleSheet, Text, SafeAreaView, ScrollView, Platform, ImageBackground, TouchableOpacity, Image, Pressable, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';
import { useQuizStore } from '../stores/quizStore';
import { useStudyStore } from '../stores/studyStore';
import { useLanguageStore, LanguageCode } from '../stores/languageStore';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Ionicons } from '@expo/vector-icons';

interface HomeScreenProps {
  onNavigateToTab?: (tab: 'home' | 'study' | 'quiz' | 'progress' | 'profile') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToTab }) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 500;
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
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Top Header / App Branding Area */}
        <View style={styles.topNav}>
           <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text style={{color: colors.primary, fontSize: 32, fontWeight: '900', fontStyle: 'italic', letterSpacing: -2}}>N<Text style={{color: colors.text}}>S</Text></Text>
              <View style={{marginLeft: 12}}>
                 <Text style={{color: colors.text, fontWeight: '800', fontSize: 16, letterSpacing: 1.5}}>NEW SUNSHINE</Text>
                 <Text style={{color: colors.primary, fontWeight: '700', fontSize: 10, letterSpacing: 2}}>DRIVING ACADEMY</Text>
              </View>
           </View>
           <View style={{ position: 'relative', zIndex: 50 }}>
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

        {/* Huge Hero Image Section */}
        <ImageBackground 
           source={require('../../assets/images/hero_fuji_night.jpg')} 
           style={styles.heroBackground}
           imageStyle={{ borderRadius: 28, opacity: 0.85 }}
        >
          <View style={styles.heroOverlay}>
             <View style={styles.heroTopRow}>
                <View style={[styles.heroLocationBadge, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                  <Ionicons name="location" size={14} color={colors.primary} />
                  <Text style={[styles.heroLocationText, { color: '#FFF' }]}>ACROSS JAPAN</Text>
                </View>
                <View style={[styles.heroLocationBadge, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                  <Ionicons name="globe" size={14} color={'#FFF'} />
                  <Text style={[styles.heroLocationText, { color: '#FFF' }]}>5 LANGS</Text>
                </View>
             </View>
             
             <View style={styles.heroBottomContent}>
                <Text style={[styles.heroTitle, isMobile && { fontSize: 24, lineHeight: 32 }]}>{t('home.bannerTitle')}</Text>
                <Text style={styles.heroSubtitle}>{t('home.bannerSub')}</Text>
                
                {/* Language Pills */}
                <View style={[styles.langPills, { flexWrap: 'wrap' }]}>
                   <View style={[styles.langPill, {borderColor: colors.primary, backgroundColor: `${colors.primary}20`}]}><Text style={[styles.langPillText, {color: colors.primary}]}>Hello</Text></View>
                   <View style={styles.langPill}><Text style={styles.langPillText}>こんにちは</Text></View>
                   <View style={styles.langPill}><Text style={styles.langPillText}>你好</Text></View>
                   <View style={styles.langPill}><Text style={styles.langPillText}>Xin chào</Text></View>
                   <View style={styles.langPill}><Text style={styles.langPillText}>안녕하세요</Text></View>
                </View>
             </View>
          </View>
        </ImageBackground>

        {/* Bento Grid Layout */}
        <View style={styles.bentoGrid}>

          {/* Practice Quiz Highlight Row */}
          <Card style={styles.practiceQuizCard} variant="glass" onPress={() => onNavigateToTab?.('quiz')}>
             <View style={styles.practiceRow}>
                <View style={[styles.trophyIconBg, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}>
                   <Ionicons name="trophy" size={28} color={colors.primary} />
                </View>
                <View style={{flex: 1}}>
                   <Text style={[styles.practiceTitle, { color: colors.text }]}>{t("home.practiceQuizTitle")}</Text>
                   <Text style={[styles.practiceSub, { color: colors.textSecondary }]}>{t("home.practiceQuizSub")}</Text>
                </View>
             </View>
             <View style={[styles.practiceStatsRow, { flexWrap: 'wrap', gap: 16 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.statBox}>
                     <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} style={{marginRight: 6}} />
                     <View>
                       <Text style={[styles.statValue, { color: colors.text }]}>{completedQuizzes}</Text>
                       <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t("home.quizzesCompleted")}</Text>
                     </View>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.statBox}>
                     <Ionicons name="star" size={20} color={colors.warning} style={{marginRight: 6}} />
                     <View>
                       <Text style={[styles.statValue, { color: colors.text }]}>{avgScore}%</Text>
                       <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t("quiz.averageScore")}</Text>
                     </View>
                  </View>
                </View>
                <View style={[styles.takeQuizBtn, { borderColor: colors.primary, alignSelf: 'flex-start' }]}>
                  <Text style={[styles.takeQuizText, { color: colors.primary }]}>{t('home.takeFirstQuiz')}</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.primary} style={{ marginLeft: 6 }} />
                </View>
             </View>
          </Card>

          {/* Progress Split Row */}
          <View style={[styles.bentoRow, { flexWrap: 'wrap' }]}>
            {/* License Rules */}
            <Card style={[styles.bentoCardHalf, { flex: 1, minWidth: 280 }]} variant="glass" onPress={handleResumeReading}>
              <View style={styles.cardHeaderRow}>
                 <View style={[styles.bentoIconWrapper, { backgroundColor: `${colors.primary}15` }]}>
                   <Ionicons name="clipboard-outline" size={22} color={colors.primary} />
                 </View>
                 <Text style={[styles.cardTitle, { color: colors.text }]}>{t("home.licenseRulesTitle")}</Text>
              </View>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{t("home.licenseRulesSub")}</Text>
              
              <View style={styles.progressSection}>
                 <View style={styles.progressHeader}>
                   <Text style={[styles.progressLbl, { color: colors.textSecondary }]}>{t("home.progress")}</Text>
                   <Text style={[styles.progressVal, {color: colors.text}]}>{studyProgressPercent}%</Text>
                 </View>
                 <ProgressBar progress={studyProgressPercent / 100} style={{marginBottom: 12, height: 6}} />
                 <View style={styles.cardActionRow}>
                    <Text style={[styles.cardActionText, { color: colors.primary }]}>{resumeTitle ? t('home.resumeReading') : t('home.startLearning')}</Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                 </View>
              </View>
            </Card>

            {/* Traffic Quizzes */}
            <Card style={[styles.bentoCardHalf, { flex: 1 }]} variant="glass" onPress={() => onNavigateToTab?.('quiz')}>
              <View style={styles.cardHeaderRow}>
                 <View style={[styles.bentoIconWrapper, { backgroundColor: `${colors.error}15` }]}>
                   <Ionicons name="help-circle-outline" size={24} color={colors.error} />
                 </View>
                 <Text style={[styles.cardTitle, { color: colors.text }]}>{t("home.trafficQuizzesTitle")}</Text>
              </View>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{t("home.trafficQuizzesSub")}</Text>
              
              <View style={styles.progressSection}>
                 <View style={styles.progressHeader}>
                   <Text style={[styles.progressLbl, { color: colors.textSecondary }]}>{t("home.progress")}</Text>
                   <Text style={[styles.progressVal, {color: colors.text}]}>{avgScore}%</Text>
                 </View>
                 <ProgressBar progress={avgScore / 100} style={{marginBottom: 12, height: 6}} />
                 <View style={styles.cardActionRow}>
                    <Text style={[styles.cardActionText, { color: colors.error }]}>{t("home.startPracticing")}</Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.error} />
                 </View>
              </View>
            </Card>
          </View>

          {/* Safety Tip */}
          <Card style={styles.safetyTipCard} variant="glass">
            <View style={styles.safetyIconWrapper}>
              <Ionicons name="shield-checkmark" size={24} color="#FFF" />
            </View>
            <View style={styles.safetyContent}>
              <Text style={[styles.safetyTitle, { color: colors.primary }]}>{t("home.safetyTipTitle")}</Text>
              <Text style={[styles.safetyDesc, { color: colors.text }]}>
                {t('home.safetyTipMessage')}
              </Text>
            </View>
            <Ionicons name="car-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.2, position: 'absolute', right: 20, bottom: 20 }} />
          </Card>

          {/* Huge Call to Action Row */}
          <TouchableOpacity activeOpacity={0.9} onPress={() => onNavigateToTab?.('study')} style={{ marginTop: 8 }}>
            <View style={[styles.ctaContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.border, borderWidth: 1 }]}>
               <View style={styles.ctaIconBg}>
                  <Ionicons name="steering-wheel" size={32} color={colors.primary} />
               </View>
               <View style={styles.ctaTextContainer}>
                 <Text style={[styles.ctaTitle, { color: colors.text }]}>{t("home.ctaTitle")}</Text>
                 <Text style={[styles.ctaSub, { color: colors.textSecondary }]}>{t("home.ctaSub")}</Text>
               </View>
               <View style={[styles.ctaButton, { backgroundColor: colors.primary }]}>
                  <Text style={styles.ctaButtonText}>{t("home.ctaButton")}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
               </View>
            </View>
          </TouchableOpacity>

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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: Platform.OS === 'ios' ? 0 : 20,
    zIndex: 100,
    elevation: 10,
  },
  langSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
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
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 20 },
      web: { boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } as any,
    }),
  },
  langDropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  langDropdownText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroBackground: {
    width: '100%',
    height: 380,
    marginBottom: 16,
    borderRadius: 28,
  },
  heroOverlay: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 28,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroLocationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  heroLocationText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroBottomContent: {
    marginTop: 'auto',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 38,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 20,
    lineHeight: 22,
  },
  langPills: {
    flexDirection: 'row',
    gap: 12,
  },
  langPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  langPillText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  bentoGrid: {
    gap: 16,
  },
  practiceQuizCard: {
    padding: 20,
    borderRadius: 24,
  },
  practiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  trophyIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  practiceTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  practiceSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  practiceStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 30,
    marginHorizontal: 12,
  },
  takeQuizBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  takeQuizText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'left',
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  bentoCardHalf: {
    padding: 20,
    borderRadius: 24,
  },
  cardHeaderRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bentoIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
  },
  progressSection: {
    marginTop: 'auto',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLbl: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  safetyTipCard: {
    padding: 20,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  safetyIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E11D48',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safetyContent: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  safetyDesc: {
    fontSize: 13,
    lineHeight: 20,
  },
  ctaContainer: {
    borderRadius: 24,
    padding: 24,
    flexDirection: 'column',
    alignItems: 'center',
  },
  ctaIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(225, 29, 72, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  ctaTextContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaSub: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
