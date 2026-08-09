import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, Platform, TouchableOpacity, Pressable } from 'react-native';
import { Text } from '../components/ui/Text';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { useQuizStore } from '../stores/quizStore';
import { useStudyStore } from '../stores/studyStore';
import { useLanguageStore, LanguageCode } from '../stores/languageStore';
import { Card } from '../components/ui/Card';
import { Ionicons } from '@expo/vector-icons';

interface ProgressScreenProps {
  onNavigateToTab?: (tab: 'home' | 'study' | 'quiz' | 'progress' | 'profile') => void;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({ onNavigateToTab }) => {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];
  const currentLang = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  // Store data
  const { 
    questions,
    history, 
    wrongQuestions, 
    bookmarkedQuestions, 
    toggleBookmarkQuestion, 
    startNewQuiz,
    setViewMode 
  } = useQuizStore();
  const { chapters, progress } = useStudyStore();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [activeListModal, setActiveListModal] = useState<'bookmarks' | 'review' | null>(null);

  // Safe localized text extractor
  const loc = (field: any): string => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    if (typeof field === 'object') {
      const val = field[currentLang] ?? field.en ?? Object.values(field)[0] ?? '';
      return String(val);
    }
    return String(field);
  };

  // 1. Calculations for study progress
  const activeSubtopicIds = new Set(
    chapters.flatMap(c => (c.subtopics || []).map(s => s.id))
  );
  const validCompletedSubtopics = (progress?.completedSubtopics || []).filter(id => activeSubtopicIds.has(id));
  const totalSubtopics = activeSubtopicIds.size || 14;
  const completedSubtopics = validCompletedSubtopics.length;
  const studyProgressPercent = totalSubtopics > 0 ? Math.min(100, Math.round((completedSubtopics / totalSubtopics) * 100)) : 0;

  // 2. Calculations for quiz performance
  const totalQuizzes = history.length;
  const avgScore = totalQuizzes > 0
    ? Math.round(history.reduce((acc, h) => acc + h.score, 0) / totalQuizzes)
    : 0;

  const bestScore = totalQuizzes > 0
    ? Math.max(...history.map(h => h.score))
    : 0;

  const totalCorrect = history.reduce((acc, h) => acc + h.correctCount, 0);
  const totalIncorrect = history.reduce((acc, h) => acc + h.incorrectCount, 0);

  // 3. Readiness % (60% quiz avg + 40% study progress)
  const readinessValue = Math.round((avgScore * 0.6) + (studyProgressPercent * 0.4));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Header */}
        <View style={styles.topNav}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>NS</Text>
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={[styles.logoBrandMain, { color: colors.text }]}>NEW SUNSHINE</Text>
              <Text style={styles.logoBrandSub}>DRIVING ACADEMY</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 50 }}>
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
                  {['en', 'ja', 'zh', 'pt'].map((l) => (
                    <Pressable
                      key={l}
                      style={[styles.langDropdownItem, currentLang === l && { backgroundColor: `${colors.primary}15` }]}
                      onPress={() => {
                        setLanguage(l as LanguageCode);
                        setIsLangMenuOpen(false);
                      }}
                    >
                      <Text style={[styles.langDropdownText, { color: currentLang === l ? colors.primary : colors.text }]}>
                        {l.toUpperCase()}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Page Title & Illustration Header */}
        <View style={styles.pageTitleHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.mainPageTitle, { color: colors.text }]}>{t('tabs.progress')}</Text>
            <Text style={[styles.mainPageSub, { color: colors.textSecondary }]}>
              {t('progress.subtitle')}
            </Text>
          </View>
          <View style={styles.chartIllustrationFrame}>
            <Ionicons name="stats-chart" size={34} color="#E31837" />
          </View>
        </View>

        {/* Exam Readiness Card (Screenshot 3) */}
        <Card style={styles.readinessCard}>
          <Text style={[styles.cardHeadingTitle, { color: colors.text }]}>{t('progress.examReadiness')}</Text>

          <View style={styles.readinessGaugeRow}>
            {/* Radial Dial Circle */}
            <View style={styles.gaugeCircleFrame}>
              <View style={styles.gaugeDialCircle}>
                <Text style={styles.gaugePercentVal}>{readinessValue}%</Text>
                <Text style={styles.gaugeSubLbl}>{t('progress.ready')}</Text>
              </View>
            </View>

            {/* Right Details Col */}
            <View style={{ flex: 1 }}>
              <Text style={styles.keepStudyingHeader}>{t('progress.keepStudyingTitle')}</Text>
              <Text style={[styles.readinessCalcText, { color: colors.textSecondary }]}>
                {t('progress.readinessCalcDesc', { quizScore: avgScore, studyScore: Math.round(studyProgressPercent) })}
              </Text>

              {/* Soft Alert Box */}
              <View style={[
                styles.alertBoxContainer,
                { 
                  backgroundColor: theme === 'dark' ? 'rgba(227, 24, 55, 0.15)' : '#FFF5F5',
                  borderColor: theme === 'dark' ? 'rgba(227, 24, 55, 0.3)' : 'transparent',
                  borderWidth: theme === 'dark' ? 1 : 0
                }
              ]}>
                <Ionicons name="disc-outline" size={16} color={theme === 'dark' ? '#FF4D6D' : '#E31837'} />
                <Text style={[styles.alertBoxText, { color: colors.text }]}>
                  {t('progress.readinessAlertBox')}
                </Text>
              </View>
            </View>
          </View>

          {/* 5-Step Milestone Line */}
          <View style={styles.milestoneTrackerRow}>
            <View style={styles.milestoneLineBg} />

            <View style={styles.milestoneStepItem}>
              <View style={[styles.milestoneDot, styles.milestoneDotActive]} />
              <Text style={[styles.milestoneName, styles.milestoneNameActive]}>{t('progress.beginner')}</Text>
              <Text style={styles.milestoneValText}>0%</Text>
            </View>

            <View style={styles.milestoneStepItem}>
              <View style={styles.milestoneDot} />
              <Text style={[styles.milestoneName, { color: colors.textSecondary }]}>{t('progress.learning')}</Text>
              <Text style={styles.milestoneValText}>25%</Text>
            </View>

            <View style={styles.milestoneStepItem}>
              <View style={styles.milestoneDot} />
              <Text style={[styles.milestoneName, { color: colors.textSecondary }]}>{t('progress.gettingThere')}</Text>
              <Text style={styles.milestoneValText}>50%</Text>
            </View>

            <View style={styles.milestoneStepItem}>
              <View style={styles.milestoneDot} />
              <Text style={[styles.milestoneName, { color: colors.textSecondary }]}>{t('progress.almostReady')}</Text>
              <Text style={styles.milestoneValText}>75%</Text>
            </View>

            <View style={styles.milestoneStepItem}>
              <View style={styles.milestoneDot} />
              <Text style={[styles.milestoneName, { color: colors.textSecondary }]}>{t('progress.ready100')}</Text>
              <Text style={styles.milestoneValText}>100%</Text>
            </View>
          </View>
        </Card>

        {/* Study Analytics Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>{t('progress.studyAnalytics')}</Text>
            <TouchableOpacity>
              <Text style={styles.viewStatsLink}>{t('progress.viewDetailedStats')} ›</Text>
            </TouchableOpacity>
          </View>

          {/* Row 1: Big Trend Cards */}
          <View style={styles.trendCardsRow}>
            {/* Average Score Card */}
            <Card style={[
              styles.trendCard, 
              { 
                backgroundColor: theme === 'dark' ? '#1C1216' : '#FFF5F5',
                borderColor: theme === 'dark' ? 'rgba(227, 24, 55, 0.3)' : '#FFE0E0'
              }
            ]}>
              <View style={[
                styles.trendIconBadge, 
                { backgroundColor: theme === 'dark' ? 'rgba(227, 24, 55, 0.25)' : '#FFEBEE' }
              ]}>
                <Ionicons name="trending-up" size={20} color={theme === 'dark' ? '#FF4D6D' : '#E31837'} />
              </View>
              <Text style={[styles.trendCardTitle, { color: colors.textSecondary }]}>{t('progress.averageScore')}</Text>
              <Text style={[styles.trendValText, { color: colors.text }]}>{avgScore}%</Text>
              <View style={[
                styles.badgePillRed,
                { backgroundColor: theme === 'dark' ? 'rgba(227, 24, 55, 0.25)' : '#FFEBEE' }
              ]}>
                <Text style={[styles.badgePillRedText, { color: theme === 'dark' ? '#FF4D6D' : '#E31837' }]}>
                  ↑ {t('progress.keepPracticing')}
                </Text>
              </View>
            </Card>

            {/* Best Practice Score Card */}
            <Card style={[
              styles.trendCard, 
              { 
                backgroundColor: theme === 'dark' ? '#111E16' : '#F1F8E9',
                borderColor: theme === 'dark' ? 'rgba(0, 230, 118, 0.3)' : '#DCEDC8'
              }
            ]}>
              <View style={[
                styles.trendIconBadge, 
                { backgroundColor: theme === 'dark' ? 'rgba(0, 230, 118, 0.25)' : '#DCEDC8' }
              ]}>
                <Ionicons name="trophy" size={20} color={theme === 'dark' ? '#00E676' : '#558B2F'} />
              </View>
              <Text style={[styles.trendCardTitle, { color: colors.textSecondary }]}>{t('progress.bestPracticeScore')}</Text>
              <Text style={[styles.trendValText, { color: colors.text }]}>{bestScore}%</Text>
              <View style={[
                styles.badgePillGreen,
                { backgroundColor: theme === 'dark' ? 'rgba(0, 230, 118, 0.25)' : '#DCEDC8' }
              ]}>
                <Text style={[styles.badgePillGreenText, { color: theme === 'dark' ? '#00E676' : '#33691E' }]}>
                  ↑ {t('progress.aimHigher')}
                </Text>
              </View>
            </Card>
          </View>

          {/* Row 2: 3 Counters Row */}
          <View style={styles.threeCountersRow}>
            <Card style={styles.counterBox}>
              <View style={[styles.counterIconCircle, { backgroundColor: theme === 'dark' ? 'rgba(30, 136, 229, 0.2)' : '#E3F2FD' }]}>
                <Ionicons name="clipboard-outline" size={18} color={theme === 'dark' ? '#64B5F6' : '#1E88E5'} />
              </View>
              <Text style={[styles.counterLabelText, { color: colors.textSecondary }]}>{t('progress.quizzesCompleted')}</Text>
              <Text style={[styles.counterValBold, { color: colors.text }]}>{totalQuizzes}</Text>
            </Card>

            <Card style={styles.counterBox}>
              <View style={[styles.counterIconCircle, { backgroundColor: theme === 'dark' ? 'rgba(76, 175, 80, 0.2)' : '#E8F5E9' }]}>
                <Ionicons name="checkmark-circle-outline" size={18} color={theme === 'dark' ? '#81C784' : '#4CAF50'} />
              </View>
              <Text style={[styles.counterLabelText, { color: colors.textSecondary }]}>{t('progress.correctAnswers')}</Text>
              <Text style={[styles.counterValBold, { color: colors.text }]}>{totalCorrect}</Text>
            </Card>

            <Card style={styles.counterBox}>
              <View style={[styles.counterIconCircle, { backgroundColor: theme === 'dark' ? 'rgba(227, 24, 55, 0.2)' : '#FFEBEE' }]}>
                <Ionicons name="close-circle-outline" size={18} color={theme === 'dark' ? '#FF4D6D' : '#E31837'} />
              </View>
              <Text style={[styles.counterLabelText, { color: colors.textSecondary }]}>{t('progress.incorrectAnswers')}</Text>
              <Text style={[styles.counterValBold, { color: colors.text }]}>{totalIncorrect}</Text>
            </Card>
          </View>

          {/* Row 3: 2 Link Counter Cards */}
          <View style={{ gap: 10, marginTop: 12 }}>
            <Card style={styles.linkCounterRow} onPress={() => setActiveListModal('bookmarks')}>
              <View style={[styles.linkIconCircle, { backgroundColor: theme === 'dark' ? 'rgba(142, 36, 170, 0.2)' : '#F3E5F5' }]}>
                <Ionicons name="bookmark-outline" size={20} color={theme === 'dark' ? '#BA68C8' : '#8E24AA'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.linkLabelText, { color: colors.text }]}>{t('progress.bookmarkedQuestions')}</Text>
              </View>
              <Text style={[styles.linkValText, { color: colors.text }]}>{bookmarkedQuestions.length}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} style={{ marginLeft: 8 }} />
            </Card>

            <Card style={styles.linkCounterRow} onPress={() => setActiveListModal('review')}>
              <View style={[styles.linkIconCircle, { backgroundColor: theme === 'dark' ? 'rgba(245, 124, 0, 0.2)' : '#FFF3E0' }]}>
                <Ionicons name="time-outline" size={20} color={theme === 'dark' ? '#FFB74D' : '#F57C00'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.linkLabelText, { color: colors.text }]}>{t('progress.questionsInReviewQueue')}</Text>
              </View>
              <Text style={[styles.linkValText, { color: colors.text }]}>{wrongQuestions.length}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} style={{ marginLeft: 8 }} />
            </Card>
          </View>
        </View>

        {/* Bottom Encouragement Banner */}
        <Card style={[
          styles.bottomEncouragementCard,
          { 
            backgroundColor: theme === 'dark' ? '#18141F' : '#FFF5F5',
            borderColor: theme === 'dark' ? 'rgba(227, 24, 55, 0.3)' : '#FFE0E0'
          }
        ]}>
          <View style={[
            styles.bannerIconBadge,
            { backgroundColor: theme === 'dark' ? 'rgba(227, 24, 55, 0.2)' : '#FFEBEE' }
          ]}>
            <Ionicons name="disc" size={28} color={theme === 'dark' ? '#FF4D6D' : '#E31837'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerMainText, { color: colors.text }]}>
              {t('progress.smallStepsEveryday')} <Text style={{ color: theme === 'dark' ? '#FF4D6D' : '#E31837', fontWeight: '900' }}>{t('progress.bigResultsAhead')}</Text>
            </Text>
            <Text style={[styles.bannerSubText, { color: colors.textSecondary }]}>
              {t('progress.stayConsistent')}
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.studyNowBtn, { borderColor: theme === 'dark' ? '#FF4D6D' : '#E31837' }]}
            onPress={() => onNavigateToTab?.('study')}
          >
            <Text style={[styles.studyNowBtnText, { color: theme === 'dark' ? '#FF4D6D' : '#E31837' }]}>
              {t('progress.studyNow')}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={theme === 'dark' ? '#FF4D6D' : '#E31837'} />
          </TouchableOpacity>
        </Card>

      </ScrollView>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* INTERACTIVE BOOKMARKED / REVIEW QUEUE QUESTIONS POPUP MODAL     */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={activeListModal !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveListModal(null)}
      >
        <View style={styles.modalOverlayBg}>
          <View style={[styles.modalContentCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border, paddingBottom: 20 }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeaderRow, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <Ionicons 
                  name={activeListModal === 'bookmarks' ? "bookmark" : "time"} 
                  size={24} 
                  color={activeListModal === 'bookmarks' ? "#8E24AA" : "#F57C00"} 
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalTitleText, { color: colors.text }]}>
                    {activeListModal === 'bookmarks' 
                      ? `${t('progress.bookmarkedQuestions')} (${bookmarkedQuestions.length})`
                      : `${t('progress.questionsInReviewQueue')} (${wrongQuestions.length})`}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                    {activeListModal === 'bookmarks'
                      ? 'Saved questions for quick practice and quick review.'
                      : 'Incorrectly answered questions queued for spaced repetition.'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setActiveListModal(null)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Content List */}
            {(() => {
              const targetQuestionIds = activeListModal === 'bookmarks'
                ? bookmarkedQuestions
                : wrongQuestions.map(w => w.questionId);

              const matchingQuestions = questions.filter(q => targetQuestionIds.includes(q.id));

              if (matchingQuestions.length === 0) {
                return (
                  <View style={{ paddingVertical: 40, alignItems: 'center', gap: 8 }}>
                    <Ionicons 
                      name={activeListModal === 'bookmarks' ? "bookmark-outline" : "checkmark-circle-outline"} 
                      size={48} 
                      color={colors.textSecondary} 
                    />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                      {activeListModal === 'bookmarks' ? 'No Bookmarked Questions' : 'Review Queue is Empty! 🎉'}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 20 }}>
                      {activeListModal === 'bookmarks' 
                        ? 'Flag questions during quizzes to review them here anytime.'
                        : 'Great job! You have cleared all your review questions.'}
                    </Text>
                  </View>
                );
              }

              return (
                <View style={{ flex: 1 }}>
                  {/* Action Bar: Start Targeted Quiz */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justify: 'center',
                      gap: 8,
                      backgroundColor: activeListModal === 'bookmarks' ? '#8E24AA' : '#F57C00',
                      paddingVertical: 12,
                      borderRadius: 14,
                      marginTop: 10,
                      marginBottom: 10,
                    }}
                    onPress={() => {
                      startNewQuiz(targetQuestionIds);
                      setViewMode('countdown');
                      onNavigateToTab?.('quiz');
                      setActiveListModal(null);
                    }}
                  >
                    <Ionicons name="play-circle" size={20} color="#FFF" />
                    <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800' }}>
                      Practice {matchingQuestions.length} {activeListModal === 'bookmarks' ? 'Bookmarked' : 'Review'} Questions Now
                    </Text>
                  </TouchableOpacity>

                  <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ gap: 10, paddingBottom: 10 }}>
                    {matchingQuestions.map((q, idx) => (
                      <Card key={q.id || idx} style={{ padding: 14, gap: 8 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>
                            QUESTION {idx + 1}
                          </Text>
                          {activeListModal === 'bookmarks' && (
                            <TouchableOpacity 
                              onPress={() => toggleBookmarkQuestion(q.id)}
                              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                            >
                              <Ionicons name="trash-outline" size={14} color={colors.error} />
                              <Text style={{ fontSize: 11, color: colors.error, fontWeight: '700' }}>Remove</Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        <Text style={{ fontSize: 13.5, fontWeight: '700', color: colors.text, lineHeight: 19 }}>
                          {loc(q.text)}
                        </Text>

                        {/* Options preview */}
                        <View style={{ gap: 4, marginTop: 4 }}>
                          {q.options && q.options.map((opt: any, oIdx: number) => {
                            const isCorrect = oIdx === q.correctAnswerIndex;
                            return (
                              <View 
                                key={oIdx} 
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: 8,
                                  borderRadius: 8,
                                  backgroundColor: isCorrect 
                                    ? (theme === 'dark' ? 'rgba(76, 175, 80, 0.2)' : '#E8F5E9') 
                                    : (theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F8F9FA')
                                }}
                              >
                                <Ionicons 
                                  name={isCorrect ? "checkmark-circle" : "ellipse-outline"} 
                                  size={16} 
                                  color={isCorrect ? "#4CAF50" : colors.textSecondary} 
                                />
                                <Text style={{ fontSize: 12, color: isCorrect ? (theme === 'dark' ? '#81C784' : '#2E7D32') : colors.text, flex: 1, fontWeight: isCorrect ? '700' : '400' }}>
                                  {loc(opt.text || opt)}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </Card>
                    ))}
                  </ScrollView>
                </View>
              );
            })()}

          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 40,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    zIndex: 100,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#E31837',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBadgeText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 15,
    fontStyle: 'italic',
  },
  logoBrandMain: {
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
    lineHeight: 15,
  },
  logoBrandSub: {
    color: '#E31837',
    fontWeight: '800',
    fontSize: 8.5,
    letterSpacing: 1.2,
    lineHeight: 10,
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
  // Header
  pageTitleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mainPageTitle: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  mainPageSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  chartIllustrationFrame: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Exam Readiness Card
  readinessCard: {
    padding: 18,
    borderRadius: 22,
    marginBottom: 20,
  },
  cardHeadingTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
  },
  readinessGaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  gaugeCircleFrame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeDialCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 6,
    borderColor: '#E31837',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugePercentVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1A2E',
  },
  gaugeSubLbl: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E31837',
  },
  keepStudyingHeader: {
    fontSize: 17,
    fontWeight: '900',
    color: '#E31837',
    marginBottom: 4,
  },
  readinessCalcText: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  alertBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#FFF5F5',
    gap: 8,
  },
  alertBoxText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A1A2E',
    flex: 1,
  },
  // Milestone Tracker
  milestoneTrackerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    position: 'relative',
    paddingTop: 10,
  },
  milestoneLineBg: {
    position: 'absolute',
    top: 15,
    left: '10%',
    right: '10%',
    height: 2,
    backgroundColor: '#E0E0E0',
    zIndex: 1,
  },
  milestoneStepItem: {
    alignItems: 'center',
    zIndex: 2,
    width: '18%',
  },
  milestoneDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
    borderWidth: 2,
    borderColor: '#FFF',
    marginBottom: 6,
  },
  milestoneDotActive: {
    backgroundColor: '#E31837',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  milestoneName: {
    fontSize: 9.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  milestoneNameActive: {
    color: '#E31837',
    fontWeight: '900',
  },
  milestoneValText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#999',
    marginTop: 2,
  },
  // Study Analytics
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
  },
  viewStatsLink: {
    color: '#E31837',
    fontSize: 12.5,
    fontWeight: '700',
  },
  trendCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  trendCard: {
    flex: 1,
    padding: 14,
    borderRadius: 20,
  },
  trendIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  trendCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  trendValText: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 8,
  },
  badgePillRed: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  badgePillRedText: {
    color: '#E31837',
    fontSize: 10.5,
    fontWeight: '800',
  },
  badgePillGreen: {
    backgroundColor: '#DCEDC8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  badgePillGreenText: {
    color: '#33691E',
    fontSize: 10.5,
    fontWeight: '800',
  },
  // 3 Counters Row
  threeCountersRow: {
    flexDirection: 'row',
    gap: 10,
  },
  counterBox: {
    flex: 1,
    padding: 12,
    borderRadius: 18,
    alignItems: 'center',
  },
  counterIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  counterLabelText: {
    fontSize: 10.5,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  counterValBold: {
    fontSize: 20,
    fontWeight: '900',
  },
  // Link Counter Row
  linkCounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    gap: 12,
  },
  linkIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkLabelText: {
    fontSize: 13,
    fontWeight: '700',
  },
  linkValText: {
    fontSize: 16,
    fontWeight: '900',
  },
  // Bottom Encouragement Banner
  bottomEncouragementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#FFF5F5',
    gap: 12,
  },
  bannerIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerMainText: {
    fontSize: 13.5,
    lineHeight: 18,
    marginBottom: 2,
  },
  bannerSubText: {
    fontSize: 11.5,
  },
  studyNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E31837',
    gap: 4,
  },
  studyNowBtnText: {
    color: '#E31837',
    fontSize: 11.5,
    fontWeight: '800',
  },
  // Modal styles
  modalOverlayBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContentCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    borderWidth: 1,
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitleText: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: 6,
  },
});
