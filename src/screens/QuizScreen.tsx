import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, SafeAreaView, ScrollView, Pressable, FlatList, ActivityIndicator, Platform, Image } from 'react-native';
import { Alert } from '../utils/alert';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { useLanguageStore } from '../stores/languageStore';
import { useQuizStore } from '../stores/quizStore';
import { useStudyStore } from '../stores/studyStore';
import { Question, QuizSession, QuizHistoryItem, QuizViewMode } from '../types/quiz';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Ionicons } from '@expo/vector-icons';

type ViewMode = QuizViewMode;

export const QuizScreen: React.FC = () => {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];
  const lang = useLanguageStore((state) => state.language);

  // Zustand Store
  const { 
    questions,
    history, 
    bookmarkedQuestions, 
    wrongQuestions, 
    activeSession, 
    startNewQuiz, 
    selectAnswer, 
    toggleFlagQuestion, 
    toggleBookmarkQuestion, 
    submitQuiz, 
    cancelQuiz, 
    incrementElapsed,
    viewMode,
    setViewMode
  } = useQuizStore();
  const { books } = useStudyStore();
  const [activeSection, setActiveSection] = useState<'car' | 'bike' | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const timerRef = useRef<any>(null);

  // Safe localized text extractor — handles both multilingual objects and plain strings
  const loc = (field: any): string => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    if (typeof field === 'object') {
      const val = field[lang] ?? field.en ?? Object.values(field)[0] ?? '';
      // If the resolved value is still an object (double nesting!), resolve it again
      if (typeof val === 'object') {
        const valInner = val[lang] ?? val.en ?? Object.values(val)[0] ?? '';
        if (typeof valInner === 'object') return JSON.stringify(valInner);
        return String(valInner);
      }
      return String(val);
    }
    return String(field);
  };

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // 1. Countdown logic when quiz starts
  const triggerStartQuiz = (filterIds?: string[], bookIdFilter?: string, chapterIdFilter?: string) => {
    startNewQuiz(filterIds, bookIdFilter, chapterIdFilter);
    setCountdown(3);
    setViewMode('countdown');
  };

  useEffect(() => {
    if (viewMode === 'countdown') {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setTimeout(() => {
              setViewMode('active');
            }, 0);
            return 3;
          }
          return prev - 1;
        });
      }, 800);
      return () => clearInterval(interval);
    }
  }, [viewMode]);

  // 2. Active timer logic
  useEffect(() => {
    if (viewMode === 'active' && activeSession && !activeSession.endTime) {
      timerRef.current = setInterval(() => {
        incrementElapsed();
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [viewMode, activeSession]);

  // Clear timer when session ends
  useEffect(() => {
    if (activeSession?.endTime && timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [activeSession?.endTime]);

  const handleSubmit = () => {
    if (!activeSession) return;
    const answeredCount = Object.keys(activeSession.userAnswers).length;
    const totalCount = activeSession.questions.length;

    const performSubmit = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      submitQuiz().then(() => {
        setViewMode('results');
      });
    };

    if (answeredCount < totalCount) {
      Alert.alert(
        t('quiz.incompleteTitle'),
        t('quiz.incompleteMessage', { answered: answeredCount, total: totalCount }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('quiz.submit'), style: 'destructive', onPress: performSubmit }
        ]
      );
    } else {
      Alert.alert(
        t('quiz.submitQuiz'),
        t('quiz.areYouSureSubmit'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('quiz.submit'), style: 'default', onPress: performSubmit }
        ]
      );
    }
  };

  // Stats calculation for dashboard
  const totalQuizzes = history.length;
  const avgScore = totalQuizzes > 0 
    ? Math.round(history.reduce((acc, h) => acc + h.score, 0) / totalQuizzes)
    : 0;

  // Render countdown full screen
  if (viewMode === 'countdown') {
    return (
      <View style={[styles.countdownContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.countdownLabel, { color: colors.textSecondary }]}>GET READY</Text>
        <Text style={[styles.countdownNumber, { color: colors.primary }]}>{countdown}</Text>
      </View>
    );
  }

  // Render Active Quiz Taker Screen
  if (viewMode === 'active' && activeSession) {
    const currentQ = activeSession.questions[activeSession.currentIndex];
    if (!currentQ) {
      return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text, marginBottom: 16 }]}>{t('quiz.noQuestionsTitle')}</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary, textAlign: 'center', marginBottom: 24 }]}>
              {t('quiz.noQuestionsDesc')}
            </Text>
            <Button
              title={t('common.back')}
              onPress={() => {
                cancelQuiz();
                setViewMode('dashboard');
              }}
            />
          </View>
        </SafeAreaView>
      );
    }
    const totalQuestions = activeSession.questions.length;
    const selectedOptionIndex = activeSession.userAnswers[currentQ.id];
    const isFlagged = activeSession.flaggedQuestions.includes(currentQ.id);

    const handleNext = () => {
      if (activeSession.currentIndex < totalQuestions - 1) {
        useQuizStore.setState({
          activeSession: {
            ...activeSession,
            currentIndex: activeSession.currentIndex + 1
          }
        });
      }
    };

    const handlePrev = () => {
      if (activeSession.currentIndex > 0) {
        useQuizStore.setState({
          activeSession: {
            ...activeSession,
            currentIndex: activeSession.currentIndex - 1
          }
        });
      }
    };

    const handleCancel = () => {
      Alert.alert(
        t('quiz.quitQuiz'),
        t('quiz.areYouSureQuit'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('quiz.quit'), style: 'destructive', onPress: () => {
            cancelQuiz();
            setViewMode('dashboard');
          }}
        ]
      );
    };

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.quizHeader, { borderBottomColor: colors.border }]}>
          <Pressable onPress={handleCancel} style={styles.headerBtn}>
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.timerText, { color: colors.text }]}>
            {formatTime(activeSession.elapsedSeconds)}
          </Text>
          <Pressable onPress={() => toggleFlagQuestion(currentQ.id)} style={styles.headerBtn}>
            <Ionicons 
              name={isFlagged ? 'bookmark' : 'bookmark-outline'} 
              size={22} 
              color={isFlagged ? colors.primary : colors.text} 
            />
          </Pressable>
        </View>

        {/* Progress Line */}
        <ProgressBar progress={(activeSession.currentIndex + 1) / totalQuestions} />

        <ScrollView contentContainerStyle={styles.quizContent}>
          {/* Question Indicator */}
          <Text style={[styles.qIndexText, { color: colors.textSecondary }]}>
            {t('quiz.questionCount', { current: activeSession.currentIndex + 1, total: totalQuestions })}
          </Text>

          {/* Question Text */}
          <Text style={[styles.qText, { color: colors.text }]}>
            {loc(currentQ.text || (currentQ as any).question)}
          </Text>

          {currentQ.imageUrl && (
            <Image 
              source={{ uri: currentQ.imageUrl }} 
              style={{ width: '100%', height: 200, borderRadius: 12, marginBottom: 24, backgroundColor: 'rgba(255,255,255,0.05)' }}
              resizeMode="contain"
            />
          )}

          {/* Answer Options */}
          <View style={styles.optionsList}>
            {currentQ.options.map((opt, index) => {
              const isSelected = selectedOptionIndex === index;
              const hasAnswered = selectedOptionIndex !== undefined;
              
              let cardBorderColor: string = isSelected ? colors.primary : colors.border;
              let cardBgColor = isSelected ? `${colors.primary}10` : 'transparent';
              let borderWidth = isSelected ? 2 : 1;
              let customStyle: any = {};

              if (hasAnswered) {
                if (opt.isCorrect) {
                  // Correct option gets highlighted green with glowing outline
                  cardBorderColor = colors.success;
                  cardBgColor = `${colors.success}12`;
                  borderWidth = 2;
                  if (Platform.OS === 'web') {
                    customStyle.boxShadow = '0 0 16px rgba(0, 200, 83, 0.4)';
                  }
                } else if (isSelected && !opt.isCorrect) {
                  // Selected incorrect option gets flashed with soft crimson glass overlay
                  cardBorderColor = colors.error;
                  cardBgColor = 'rgba(255, 23, 68, 0.12)';
                  borderWidth = 2;
                  if (Platform.OS === 'web') {
                    customStyle.boxShadow = '0 0 16px rgba(255, 23, 68, 0.4)';
                  }
                }
              }

              return (
                <Card
                  key={index}
                  onPress={hasAnswered ? undefined : () => selectAnswer(currentQ.id, index)}
                  style={[
                    styles.optionCard,
                    { 
                      borderColor: cardBorderColor, 
                      borderWidth: borderWidth, 
                      backgroundColor: cardBgColor 
                    },
                    customStyle
                  ]}
                >
                  <View style={styles.optionRow}>
                    <View style={[
                      styles.optionCircle, 
                      { 
                        borderColor: hasAnswered 
                          ? (opt.isCorrect ? colors.success : (isSelected ? colors.error : colors.border))
                          : (isSelected ? colors.primary : colors.border) 
                      }
                    ]}>
                      {hasAnswered ? (
                        opt.isCorrect ? (
                          <Ionicons name="checkmark" size={14} color={colors.success} />
                        ) : isSelected ? (
                          <Ionicons name="close" size={14} color={colors.error} />
                        ) : null
                      ) : (
                        isSelected ? <View style={[styles.optionInnerCircle, { backgroundColor: colors.primary }]} /> : null
                      )}
                    </View>
                    <Text style={[
                      styles.optionText, 
                      { color: colors.text }, 
                      isSelected && { fontWeight: '600' },
                      hasAnswered && opt.isCorrect && { color: colors.success, fontWeight: '700' },
                      hasAnswered && isSelected && !opt.isCorrect && { color: colors.error }
                    ]}>
                      {loc(opt.text || opt)}
                    </Text>
                  </View>
                </Card>
              );
            })}
          </View>

          {/* Instant explanation feedback during active quiz */}
          {selectedOptionIndex !== undefined && (
            <View style={[styles.explanationBox, { backgroundColor: colors.backgroundSelected, marginTop: 16 }]}>
              <Text style={[styles.explanationLabel, { color: colors.text }]}>{t('quiz.explanation')}</Text>
              <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
                {loc(currentQ.explanation)}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Quiz Nav Bar Footer */}
        <View style={[styles.quizFooter, { borderTopColor: colors.border, backgroundColor: colors.backgroundElement }]}>
          <Button
            title={t('quiz.prev')}
            onPress={handlePrev}
            disabled={activeSession.currentIndex === 0}
            variant="ghost"
            style={styles.navBtn}
          />

          {activeSession.currentIndex === totalQuestions - 1 ? (
            <Button
              title={t('quiz.submit')}
              onPress={handleSubmit}
              style={[styles.navBtn, { minWidth: 100 }]}
            />
          ) : (
            <Button
              title={t('quiz.next')}
              onPress={handleNext}
              style={[styles.navBtn, { minWidth: 100 }]}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Render Results Screen
  if (viewMode === 'results' && activeSession) {
    const isPassed = (activeSession.questions.length > 0) &&
      (activeSession.questions.reduce((acc, q, idx) => {
        const selIdx = activeSession.userAnswers[q.id];
        return acc + (selIdx !== undefined && q.options[selIdx].isCorrect ? 1 : 0);
      }, 0) / activeSession.questions.length >= 0.9);

    const correct = activeSession.questions.reduce((acc, q) => {
      const selIdx = activeSession.userAnswers[q.id];
      return acc + (selIdx !== undefined && q.options[selIdx].isCorrect ? 1 : 0);
    }, 0);
    const scoreVal = activeSession.questions.length > 0 
      ? Math.round((correct / activeSession.questions.length) * 100)
      : 0;

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.resultsContent}>
          <Text style={[styles.resultsTitle, { color: colors.text }]}>{t('quiz.results')}</Text>

          {/* Score Speedometer circular graphic */}
          {Platform.OS === 'web' ? (
            <div style={{ position: 'relative', width: 180, height: 180, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
              <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="90"
                  cy="90"
                  r="76"
                  stroke={colors.backgroundSelected}
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="90"
                  cy="90"
                  r="76"
                  stroke={isPassed ? colors.success : colors.error}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 76}
                  strokeDashoffset={2 * Math.PI * 76 * (1 - scoreVal / 100)}
                  style={{
                    transition: 'stroke-dashoffset 1s ease-in-out',
                  }}
                />
              </svg>
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 36, fontWeight: '900', color: isPassed ? colors.success : colors.error }}>{scoreVal}%</span>
                <span style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginTop: 4 }}>
                  {t('quiz.correctCount', { correct, total: activeSession.questions.length })}
                </span>
              </div>
            </div>
          ) : (
            <View style={[styles.scoreRing, { borderColor: isPassed ? colors.success : colors.error }]}>
              <Text style={[styles.scoreValueText, { color: isPassed ? colors.success : colors.error }]}>
                {scoreVal}%
              </Text>
              <Text style={[styles.scoreLabelText, { color: colors.textSecondary }]}>
                {t('quiz.correctCount', { correct, total: activeSession.questions.length })}
              </Text>
            </View>
          )}

          <Badge 
            label={isPassed ? t('quiz.passed') : t('quiz.failed')} 
            variant={isPassed ? 'success' : 'danger'}
            style={styles.resultsBadge}
          />

          {/* Time taken */}
          <View style={styles.resultsStatRow}>
            <View style={styles.resultsStatBox}>
              <Ionicons name="time-outline" size={24} color={colors.textSecondary} />
              <Text style={[styles.resultsStatVal, { color: colors.text }]}>
                {formatTime(activeSession.elapsedSeconds)}
              </Text>
              <Text style={[styles.resultsStatLbl, { color: colors.textSecondary }]}>{t('quiz.timeTaken')}</Text>
            </View>
          </View>

          <View style={styles.resultsActions}>
            <Button
              title={t('quiz.reviewAnswers')}
              onPress={() => setViewMode('review')}
              style={styles.resultsBtn}
            />
            <Button
              title={t('quiz.returnToDashboard')}
              onPress={() => {
                cancelQuiz();
                setViewMode('dashboard');
              }}
              variant="secondary"
              style={styles.resultsBtn}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render Answers Review Screen
  if (viewMode === 'review' && activeSession) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <View style={styles.chapterHeader}>
            <Pressable onPress={() => setViewMode('results')} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('quiz.reviewAnswers')}</Text>
          </View>

          <FlatList
            data={activeSession.questions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => {
              const selectedIdx = activeSession.userAnswers[item.id];
              const isCorrect = selectedIdx !== undefined && item.options[selectedIdx].isCorrect;
              const isBookmarked = bookmarkedQuestions.includes(item.id);

              return (
                <Card style={styles.reviewCard}>
                  <View style={styles.reviewCardHeader}>
                    <View style={styles.reviewCardStatus}>
                      <Ionicons 
                        name={isCorrect ? 'checkmark-circle' : 'close-circle'} 
                        size={22} 
                        color={isCorrect ? colors.success : colors.error} 
                      />
                      <Text style={[styles.reviewIndexText, { color: colors.textSecondary }]}>{t('quiz.questionIndex', { index: index + 1 })}</Text>
                    </View>
                    <Pressable onPress={() => toggleBookmarkQuestion(item.id)}>
                      <Ionicons 
                        name={isBookmarked ? 'bookmark' : 'bookmark-outline'} 
                        size={20} 
                        color={isBookmarked ? colors.success : colors.textSecondary} 
                      />
                    </Pressable>
                  </View>

                  <Text style={[styles.reviewQText, { color: colors.text }]}>{loc(item.text || (item as any).question)}</Text>

                  {/* Options status */}
                  <View style={styles.reviewOptions}>
                    {item.options.map((opt, oIdx) => {
                      const wasSelected = selectedIdx === oIdx;
                      const isOptionCorrect = opt.isCorrect;

                      let cardBorder: string = colors.border;
                      let optionBg: string = 'transparent';

                      if (isOptionCorrect) {
                        cardBorder = colors.success;
                        optionBg = `${colors.success}10`;
                      } else if (wasSelected && !isOptionCorrect) {
                        cardBorder = colors.error;
                        optionBg = `${colors.error}10`;
                      }

                      return (
                        <View 
                          key={oIdx} 
                          style={[
                            styles.reviewOptionRow, 
                            { borderColor: cardBorder, backgroundColor: optionBg, borderWidth: 1 }
                          ]}
                        >
                          <Text style={[styles.reviewOptionText, { color: colors.text }]}>{loc(opt.text || opt)}</Text>
                          {wasSelected ? <Text style={[styles.selectedLabel, { color: isOptionCorrect ? colors.success : colors.error }]}>[{t('quiz.yourChoice')}]</Text> : null}
                          {isOptionCorrect ? <Text style={[styles.selectedLabel, { color: colors.success }]}>[{t('quiz.correct')}]</Text> : null}
                        </View>
                      );
                    })}
                  </View>

                  {/* Localized Explanation */}
                  <View style={[styles.explanationBox, { backgroundColor: colors.backgroundSelected }]}>
                    <Text style={[styles.explanationLabel, { color: colors.text }]}>{t('quiz.explanation')}</Text>
                    <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
                      {loc(item.explanation)}
                    </Text>
                  </View>
                </Card>
              );
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Render Bookmarked Questions Review Screen
  if (viewMode === 'bookmarks') {
    const bookmarkedList = questions.filter(q => bookmarkedQuestions.includes(q.id));

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <View style={styles.chapterHeader}>
            <Pressable onPress={() => setViewMode('dashboard')} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('quiz.bookmarkedQuestions')}</Text>
          </View>

          {bookmarkedList.length > 0 ? (
            <View style={styles.bookmarksWrapper}>
              <Button
                title={t('quiz.practiceSaved')}
                onPress={() => triggerStartQuiz(bookmarkedQuestions)}
                style={styles.practiceBtn}
              />
              <FlatList
                data={bookmarkedList}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                  <Card style={styles.bookmarkItemCard}>
                    <View style={styles.bookmarkItemHeader}>
                      <Text style={[styles.bookmarkCategory, { color: colors.primary }]}>{item.category}</Text>
                      <Pressable onPress={() => toggleBookmarkQuestion(item.id)}>
                        <Ionicons name="bookmark" size={20} color={colors.success} />
                      </Pressable>
                    </View>
                    <Text style={[styles.bookmarkQText, { color: colors.text }]}>{loc(item.text || (item as any).question)}</Text>
                    <Text style={[styles.bookmarkExplText, { color: colors.textSecondary }]}>
                      {loc(item.explanation)}
                    </Text>
                  </Card>
                )}
              />
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('quiz.emptyBookmarks')}
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Render Wrong Answers Review Screen
  if (viewMode === 'wrongAnswers') {
    const wrongListIds = wrongQuestions.map(wq => wq.questionId);
    const wrongList = questions.filter(q => wrongListIds.includes(q.id));

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <View style={styles.chapterHeader}>
            <Pressable onPress={() => setViewMode('dashboard')} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('quiz.wrongAnswersReview')}</Text>
          </View>

          {wrongList.length > 0 ? (
            <View style={styles.bookmarksWrapper}>
              <Button
                title={t('quiz.practiceWeak')}
                onPress={() => triggerStartQuiz(wrongListIds)}
                style={styles.practiceBtn}
              />
              <FlatList
                data={wrongList}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                  const state = wrongQuestions.find(wq => wq.questionId === item.id);
                  const streak = state ? state.consecutiveCorrectCount : 0;
                  return (
                    <Card style={styles.bookmarkItemCard}>
                      <View style={styles.bookmarkItemHeader}>
                        <Text style={[styles.bookmarkCategory, { color: colors.error }]}>{item.category}</Text>
                        <Badge label={`${t('quiz.correctStreak')}: ${streak}/3`} variant={streak > 0 ? 'success' : 'default'} />
                      </View>
                      <Text style={[styles.bookmarkQText, { color: colors.text }]}>{loc(item.text || (item as any).question)}</Text>
                      <Text style={[styles.bookmarkExplText, { color: colors.textSecondary }]}>
                        {loc(item.explanation)}
                      </Text>
                    </Card>
                  );
                }}
              />
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('quiz.emptyWrong')}
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Render Quiz Dashboard
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>{t('tabs.quiz')}</Text>

        {/* Practice by Handbook / Chapter */}
        {!activeSection ? (
          <View style={styles.selectorContainer}>
            {/* Car Card */}
            <Card
              onPress={() => setActiveSection('car')}
              style={[
                styles.selectorCard,
                {
                  borderColor: theme === 'dark' ? 'rgba(227, 24, 55, 0.35)' : 'rgba(227, 24, 55, 0.16)',
                  ...Platform.select({
                    web: {
                      boxShadow: theme === 'dark' ? '0 0 16px rgba(227, 24, 55, 0.12)' : '0 0 16px rgba(227, 24, 55, 0.05)',
                    } as any,
                    default: {
                      shadowColor: colors.primary,
                      shadowOpacity: theme === 'dark' ? 0.22 : 0.05,
                      shadowRadius: 10,
                      elevation: 3,
                    }
                  })
                }
              ]}
            >
              <View style={[styles.selectorIconWrapper, { backgroundColor: `${colors.primary}12` }]}>
                <Ionicons name="car-sport-sharp" size={32} color={colors.primary} />
              </View>
              <View style={styles.selectorTextInfo}>
                <Text style={[styles.selectorCardTitle, { color: colors.text }]}>
                  {t('study.carTitle')}
                </Text>
                <Text style={[styles.selectorCardSub, { color: colors.textSecondary }]}>
                  {t('study.carSub')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Card>

            {/* Bike Card */}
            <Card
              onPress={() => setActiveSection('bike')}
              style={[
                styles.selectorCard,
                {
                  borderColor: theme === 'dark' ? 'rgba(255, 179, 0, 0.35)' : 'rgba(245, 158, 11, 0.16)',
                  ...Platform.select({
                    web: {
                      boxShadow: theme === 'dark' ? '0 0 16px rgba(255, 179, 0, 0.12)' : '0 0 16px rgba(245, 158, 11, 0.05)',
                        } as any,
                        default: {
                          shadowColor: '#FFB300',
                          shadowOpacity: theme === 'dark' ? 0.22 : 0.05,
                          shadowRadius: 10,
                          elevation: 3,
                        }
                      })
                    }
                  ]}
                >
              <View style={[styles.selectorIconWrapper, { backgroundColor: '#FFB30015' }]}>
                <Ionicons name="bicycle-sharp" size={32} color="#FFB300" />
              </View>
              <View style={styles.selectorTextInfo}>
                <Text style={[styles.selectorCardTitle, { color: colors.text }]}>
                  {t('study.bikeTitle')}
                </Text>
                <Text style={[styles.selectorCardSub, { color: colors.textSecondary }]}>
                  {t('study.bikeSub')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Card>
          </View>
        ) : selectedBook ? (
          <>
            <View style={[styles.chapterHeader, { marginBottom: 12 }]}>
              <Pressable onPress={() => setSelectedBook(null)} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>
              <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                {loc(selectedBook.title)}
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('study.practiceByChapter')}</Text>
            {(selectedBook.chapters || []).map((chapter: any) => (
              <Card 
                key={chapter.id} 
                onPress={() => triggerStartQuiz(undefined, undefined, chapter.id)} 
                style={[styles.toolCard, { marginBottom: 10 }]}
              >
                <View style={styles.toolContent}>
                  <View style={[styles.toolIcon, { backgroundColor: `${colors.primary}10` }]}>
                    <Ionicons name="journal-outline" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.toolInfo}>
                    <Text style={[styles.toolTitle, { color: colors.text }]}>{loc(chapter.title)}</Text>
                    <Text style={[styles.toolSub, { color: colors.textSecondary }]}>
                      {loc(selectedBook.title)} | {t('study.testYourKnowledge')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </View>
              </Card>
            ))}
          </>
        ) : (
          <>
            <View style={[styles.chapterHeader, { marginBottom: 12 }]}>
              <Pressable onPress={() => setActiveSection(null)} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>
              <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                {activeSection === 'car' ? t('study.carCategory') : t('study.bikeCategory')}
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('quiz.practiceByHandbook')}</Text>
            {books.map((book) => (
              <Card key={book.id} style={[styles.toolCard, { marginBottom: 12 }]} onPress={() => setSelectedBook(book)}>
                <View style={styles.toolContent}>
                  <View style={[styles.toolIcon, { backgroundColor: activeSection === 'car' ? `${colors.primary}15` : '#FFB30015' }]}>
                    <Ionicons 
                      name={activeSection === 'car' ? "car-sport-outline" : "bicycle-outline"} 
                      size={24} 
                      color={activeSection === 'car' ? colors.primary : "#FFB300"} 
                    />
                  </View>
                  <View style={styles.toolInfo}>
                    <Text style={[styles.toolTitle, { color: colors.text }]}>{loc(book.title)}</Text>
                    <Text style={[styles.toolSub, { color: colors.textSecondary }]} numberOfLines={2}>
                      {loc(book.description)}
                    </Text>
                  </View>
                </View>
                <Button
                  title={t('study.practiceThisHandbook')}
                  onPress={(e) => {
                    e.stopPropagation(); // prevent opening book chapters
                    triggerStartQuiz(undefined, book.id);
                  }}
                  style={{ marginTop: 14 }}
                  variant="secondary"
                />
              </Card>
            ))}
          </>
        )}

        {/* Start Final Practice Exam */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>{t('quiz.finalCombinedExam')}</Text>
        <Card variant="glass" style={styles.startCard}>
          <View style={styles.startHeader}>
            <View style={[styles.iconBox, { backgroundColor: colors.primary }]}>
              <Ionicons name="school" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.startInfo}>
              <Text style={styles.startTitle}>{t('quiz.finalCombinedExam')}</Text>
              <Text style={styles.startSub}>
                {t('quiz.recommendedForFinal')}
              </Text>
            </View>
          </View>
          <Button
            title={t('quiz.startFinalExam')}
            onPress={() => triggerStartQuiz(undefined, 'final')}
            style={styles.startBtn}
          />
        </Card>

        {/* Quiz stats summary */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('quiz.yourPerformance')}</Text>
        <View style={styles.statsGrid}>
          <Card style={styles.statsCard}>
            <Ionicons name="checkbox-outline" size={26} color={colors.primary} />
            <Text style={[styles.statsVal, { color: colors.text }]}>{totalQuizzes}</Text>
            <Text style={[styles.statsLbl, { color: colors.textSecondary }]}>{t('quiz.examsCompleted')}</Text>
          </Card>
          
          <Card style={styles.statsCard}>
            <Ionicons name="star-outline" size={26} color={colors.success} />
            <Text style={[styles.statsVal, { color: colors.text }]}>{avgScore}%</Text>
            <Text style={[styles.statsLbl, { color: colors.textSecondary }]}>{t('quiz.averageScore')}</Text>
          </Card>
        </View>

        {/* Quiz review tools */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('quiz.practiceTools')}</Text>

        <Card onPress={() => setViewMode('wrongAnswers')} style={styles.toolCard}>
          <View style={styles.toolContent}>
            <View style={[styles.toolIcon, { backgroundColor: `${colors.error}15` }]}>
              <Ionicons name="close-circle-outline" size={24} color={colors.error} />
            </View>
            <View style={styles.toolInfo}>
              <Text style={[styles.toolTitle, { color: colors.text }]}>{t('quiz.wrongAnswersReview')}</Text>
              <Text style={[styles.toolSub, { color: colors.textSecondary }]}>
                {t('quiz.questionsToFix', { count: wrongQuestions.length })}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
        </Card>

        <Card onPress={() => setViewMode('bookmarks')} style={styles.toolCard}>
          <View style={styles.toolContent}>
            <View style={[styles.toolIcon, { backgroundColor: `${colors.success}15` }]}>
              <Ionicons name="bookmark-outline" size={24} color={colors.success} />
            </View>
            <View style={styles.toolInfo}>
              <Text style={[styles.toolTitle, { color: colors.text }]}>{t('quiz.bookmarkedQuestions')}</Text>
              <Text style={[styles.toolSub, { color: colors.textSecondary }]}>
                {t('quiz.savedForRevision', { count: bookmarkedQuestions.length })}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
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
  startCard: {
    padding: 20,
    marginBottom: 28,
  },
  startHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startInfo: {
    flex: 1,
  },
  startTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  startSub: {
    color: '#D0D0D0',
    fontSize: 13,
    lineHeight: 18,
  },
  startBtn: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statsCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  statsVal: {
    fontSize: 22,
    fontWeight: '800',
    marginVertical: 6,
  },
  statsLbl: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  toolCard: {
    padding: 16,
    marginBottom: 12,
  },
  toolContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  toolInfo: {
    flex: 1,
    paddingRight: 8,
  },
  toolTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  toolSub: {
    fontSize: 12,
  },
  countdownContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownLabel: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 16,
  },
  countdownNumber: {
    fontSize: 90,
    fontWeight: '900',
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerBtn: {
    padding: 6,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '700',
  },
  quizContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  qIndexText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  qText: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 28,
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    padding: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  quizFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  navBtn: {
    minHeight: 40,
  },
  resultsContent: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
  },
  resultsTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 32,
  },
  scoreRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  scoreValueText: {
    fontSize: 48,
    fontWeight: '900',
  },
  scoreLabelText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  resultsBadge: {
    marginBottom: 32,
  },
  resultsStatRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    marginBottom: 40,
  },
  resultsStatBox: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  resultsStatVal: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 2,
  },
  resultsStatLbl: {
    fontSize: 12,
    fontWeight: '600',
  },
  resultsActions: {
    width: '100%',
    gap: 12,
  },
  resultsBtn: {
    width: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  listContent: {
    gap: 16,
    paddingBottom: 30,
  },
  reviewCard: {
    padding: 16,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reviewCardStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewIndexText: {
    fontSize: 13,
    fontWeight: '700',
  },
  reviewQText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 16,
  },
  reviewOptions: {
    gap: 10,
    marginBottom: 16,
  },
  reviewOptionRow: {
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewOptionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },
  selectedLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  explanationBox: {
    padding: 12,
    borderRadius: 8,
  },
  explanationLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 13,
    lineHeight: 18,
  },
  bookmarksWrapper: {
    flex: 1,
  },
  practiceBtn: {
    width: '100%',
    marginBottom: 20,
  },
  bookmarkItemCard: {
    padding: 12,
    marginBottom: 12,
  },
  bookmarkItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookmarkCategory: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  bookmarkQText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 8,
  },
  bookmarkExplText: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
  // Car / Bike vehicle selector styling
  selectorContainer: {
    paddingHorizontal: 0,
    paddingTop: 8,
    gap: 16,
    marginBottom: 20,
  },
  selectorCard: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 20,
    borderWidth: 1,
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
      } as any,
    }),
  },
  selectorIconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorTextInfo: {
    flex: 1,
  },
  selectorCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  selectorCardSub: {
    fontSize: 13,
    lineHeight: 18,
  },
});
