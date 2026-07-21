import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, SafeAreaView, FlatList, TextInput, Pressable, ScrollView, Platform, Image } from 'react-native';
import { Alert } from '../utils/alert';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { useLanguageStore } from '../stores/languageStore';
import { useStudyStore } from '../stores/studyStore';
import { useQuizStore } from '../stores/quizStore';

import { Chapter, Subtopic } from '../types/study';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ContentRenderer } from '../components/study/ContentRenderer';
import { Ionicons } from '@expo/vector-icons';

type FontSize = 'small' | 'medium' | 'large';

interface StudyScreenProps {
  onNavigateToTab?: (tab: 'home' | 'study' | 'quiz' | 'progress' | 'profile') => void;
}

export const StudyScreen: React.FC<StudyScreenProps> = ({ onNavigateToTab }) => {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];
  const lang = useLanguageStore((state) => state.language); // 'en' | 'ja' | 'zh' | 'pt'

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

  // Store States
  const { books, chapters, bookmarkedPages, progress, downloadedChapters, toggleBookmark, markAsRead, setLastRead, downloadChapter, deleteDownload } = useStudyStore();

  // Local navigation states
  const [activeSection, setActiveSection] = useState<'car' | 'bike' | null>(null);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<Subtopic | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [fontSize, setFontSize] = useState<FontSize>('medium');

  const renderChapterExplanation = () => {
    if (!selectedChapter) return null;

    const langStrings: any = {
      en: {
        title: "Chapter Overview & Explanation",
        intro: `This chapter covers the rules and safety guidelines for "${loc(selectedChapter.title)}".`,
        topicsHeader: "Key learning topics:",
        carFocus: "🚗 Car Driving Focus",
        carText: "Keep vehicle dimensions in mind. Ensure all passenger seatbelts are fastened, maintain correct lane alignment, and check blind spots thoroughly before changing lanes.",
        bikeFocus: "🏍️ Motorcycle Riding Focus",
        bikeText: "Ensure your helmet is buckled securely. Maximize your visibility to heavy trucks, practice proper body positioning in corners, and watch out for road hazards like wet leaves or manhole covers."
      },
      ja: {
        title: "章の概要と解説",
        intro: `この章では、「${loc(selectedChapter.title)}」に関する規則と安全ガイドラインについて説明します。`,
        topicsHeader: "主な学習項目：",
        carFocus: "🚗 普通乗用車のポイント",
        carText: "車両の大きさを意識してください。すべての同乗者のシートベルト着用を確認し、正しい車線維持を行い、車線変更時は死角を十分に確認してください。",
        bikeFocus: "🏍️ 二輪バイクのポイント",
        bikeText: "ヘルメットのあご紐を確実に締めてください。大型車からの死角に入らないよう視認性を確保し、コーナリング時の傾き姿勢に注意し、路面のマンホールや濡れた葉に警戒してください。"
      },
      zh: {
        title: "章节概述与要点讲解",
        intro: `本章详细介绍了关于“${loc(selectedChapter.title)}”的法规和安全准则。`,
        topicsHeader: "核心学习内容：",
        carFocus: "🚗 乘用汽车驾驶要点",
        carText: "时刻注意车辆的车宽和盲区。确保所有乘员系好安全带，保持规范的车道居中行驶，变道时务必侧头扭头观察后方死角。",
        bikeFocus: "🏍️ 摩托车骑行要点",
        bikeText: "骑行前确保安全头盔佩戴扣紧。注意避开重型货车的视线盲区，掌握正确的压弯倾斜姿势，防范井盖、洒水路面或积雪落叶等路面湿滑隐患。"
      },
      pt: {
        title: "Visão Geral e Explicação do Capítulo",
        intro: `Este capítulo descreve as regras e diretrizes de segurança para "${loc(selectedChapter.title)}".`,
        topicsHeader: "Tópicos importantes de aprendizagem:",
        carFocus: "🚗 Foco em Condução de Carro",
        carText: "Tenha em mente o tamanho do veículo. Garanta que todos os cintos de segurança dos passageiros estejam afivelados, mantenha o alinhamento adequado e verifique os pontos cegos ao mudar de faixa.",
        bikeFocus: "🏍️ Foco em Pilotagem de Moto",
        bikeText: "Certifique-se de que o capacete esteja afivelado firmemente. Melhore sua visibilidade para caminhões, adote postura correta nas curvas e evite perigos como tampas de bueiro ou folhas molhadas na pista."
      }
    };

    const currentStrings = langStrings[lang] || langStrings.en;

    return (
      <Card style={styles.explanationCard}>
        <View style={styles.explanationHeaderRow}>
          <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
          <Text style={[styles.explanationCardTitle, { color: colors.primary }]}>
            {currentStrings.title}
          </Text>
        </View>
        
        <Text style={[styles.explanationIntroText, { color: colors.text }]}>
          {currentStrings.intro}
        </Text>

        <Text style={[styles.explanationSubtitle, { color: colors.text }]}>
          {currentStrings.topicsHeader}
        </Text>
        {(selectedChapter.subtopics || []).map((sub) => (
          <View key={sub.id} style={styles.takeawayRow}>
            <Ionicons name="radio-button-on" size={8} color={colors.textSecondary} style={{ marginTop: 6 }} />
            <Text style={[styles.takeawayText, { color: colors.textSecondary }]}>
              {loc(sub.title)}
            </Text>
          </View>
        ))}

        <View style={[styles.explanationDivider, { backgroundColor: colors.border }]} />

        {activeSection === 'car' ? (
          <View style={[styles.vehicleFocusBox, { backgroundColor: `${colors.primary}05`, borderColor: `${colors.primary}20` }]}>
            <Text style={[styles.vehicleFocusTitle, { color: colors.primary }]}>
              {currentStrings.carFocus}
            </Text>
            <Text style={[styles.vehicleFocusText, { color: colors.textSecondary }]}>
              {currentStrings.carText}
            </Text>
          </View>
        ) : (
          <View style={[styles.vehicleFocusBox, { backgroundColor: '#FFB30008', borderColor: '#FFB30030' }]}>
            <Text style={[styles.vehicleFocusTitle, { color: '#FFB300' }]}>
              {currentStrings.bikeFocus}
            </Text>
            <Text style={[styles.vehicleFocusText, { color: colors.textSecondary }]}>
              {currentStrings.bikeText}
            </Text>
          </View>
        )}
      </Card>
    );
  };

  const renderEmptySubtopics = () => {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.5, marginBottom: 16 }} />
        <Text style={{ color: colors.textSecondary, fontSize: 16, textAlign: 'center', lineHeight: 24 }}>
          {t('study.noSubtopics', 'The AI is still processing content for this chapter, or no subtopics were generated. Try re-ingesting the content.')}
        </Text>
      </View>
    );
  };

  // Load reading position on mount if user wants to continue
  const handleResumeReading = () => {
    if (progress.lastReadSubtopicId && progress.lastReadChapterId) {
      const chapter = chapters.find(c => c.id === progress.lastReadChapterId);
      if (chapter) {
        const subtopic = chapter.subtopics.find(s => s.id === progress.lastReadSubtopicId);
        if (subtopic) {
          setSelectedChapter(chapter);
          setSelectedSubtopic(subtopic);
        }
      }
    }
  };

  // Trigger reading position auto-save on subtopic load
  useEffect(() => {
    if (selectedSubtopic && selectedChapter) {
      setLastRead(selectedSubtopic.id, selectedChapter.id);
      markAsRead(selectedSubtopic.id, selectedChapter.id);
    }
  }, [selectedSubtopic, selectedChapter]);

  // Calculate completion percentage for a chapter
  const getChapterProgress = (chapter: Chapter) => {
    if (!chapter.subtopics.length) return 0;
    const completedCount = chapter.subtopics.filter(sub => 
      progress.completedSubtopics.includes(sub.id)
    ).length;
    return Math.round((completedCount / chapter.subtopics.length) * 100);
  };

  // Find last read subtopic title
  const getLastReadTitle = () => {
    if (progress.lastReadSubtopicId && progress.lastReadChapterId) {
      const chapter = chapters.find(c => c.id === progress.lastReadChapterId);
      const subtopic = chapter?.subtopics.find(s => s.id === progress.lastReadSubtopicId);
      return loc(subtopic?.title) || '';
    }
    return '';
  };

  // Search filter
  const getSearchResults = () => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    const results: { chapter: Chapter; subtopic: Subtopic }[] = [];

    chapters.forEach(chapter => {
      chapter.subtopics.forEach(subtopic => {
        const titleMatch = loc(subtopic.title)?.toLowerCase().includes(query);
        const contentMatch = loc(subtopic.content)?.toLowerCase().includes(query);
        if (titleMatch || contentMatch) {
          results.push({ chapter, subtopic });
        }
      });
    });

    return results;
  };

  const searchResults = getSearchResults();

  // Navigation handlers within reader
  const handleNextSubtopic = () => {
    if (!selectedChapter || !selectedSubtopic) return;
    const currentIndex = selectedChapter.subtopics.findIndex(s => s.id === selectedSubtopic.id);
    if (currentIndex < selectedChapter.subtopics.length - 1) {
      setSelectedSubtopic(selectedChapter.subtopics[currentIndex + 1]);
    }
  };

  const handlePrevSubtopic = () => {
    if (!selectedChapter || !selectedSubtopic) return;
    const currentIndex = selectedChapter.subtopics.findIndex(s => s.id === selectedSubtopic.id);
    if (currentIndex > 0) {
      setSelectedSubtopic(selectedChapter.subtopics[currentIndex - 1]);
    }
  };

  // Render Subtopic Reader Screen
  if (selectedSubtopic && selectedChapter) {
    const currentIndex = selectedChapter.subtopics.findIndex(s => s.id === selectedSubtopic.id);
    const hasNext = currentIndex < selectedChapter.subtopics.length - 1;
    const hasPrev = currentIndex > 0;
    const isBookmarked = bookmarkedPages.includes(selectedSubtopic.id);
    const readingProgressPercent = ((currentIndex + 1) / selectedChapter.subtopics.length);

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.gradientOverlay} />
        
        {/* Animated 1px progress line with a floating needle */}
        <View style={[styles.readerProgressBg, { backgroundColor: colors.backgroundSelected, height: 1, position: 'relative' }]}>
          <View style={[styles.readerProgressFill, { backgroundColor: colors.primary, width: `${readingProgressPercent * 100}%`, height: 1 }]} />
          <View style={[
            styles.readerNeedle, 
            { 
              backgroundColor: colors.primary, 
              left: `${readingProgressPercent * 100}%`, 
              marginLeft: -4 
            }
          ]} />
        </View>

        {/* Reader Header */}
        <View style={[styles.readerHeader, { borderBottomColor: colors.border, zIndex: 10 }]}>
          <Pressable onPress={() => setSelectedSubtopic(null)} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>

          {/* Font Size Selector */}
          <View style={styles.fontSizeSelector}>
            <Pressable 
              onPress={() => setFontSize('small')} 
              style={[styles.fontSizeBtn, fontSize === 'small' && { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.fontSizeText, { color: fontSize === 'small' ? '#FFF' : colors.text, fontSize: 12 }]}>A</Text>
            </Pressable>
            <Pressable 
              onPress={() => setFontSize('medium')} 
              style={[styles.fontSizeBtn, fontSize === 'medium' && { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.fontSizeText, { color: fontSize === 'medium' ? '#FFF' : colors.text, fontSize: 15 }]}>A</Text>
            </Pressable>
            <Pressable 
              onPress={() => setFontSize('large')} 
              style={[styles.fontSizeBtn, fontSize === 'large' && { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.fontSizeText, { color: fontSize === 'large' ? '#FFF' : colors.text, fontSize: 18 }]}>A</Text>
            </Pressable>
          </View>

          {/* Bookmark Toggle */}
          <Pressable onPress={() => toggleBookmark(selectedSubtopic.id)} style={styles.headerBtn}>
            <Ionicons 
              name={isBookmarked ? 'heart' : 'heart-outline'} 
              size={26} 
              color={isBookmarked ? colors.primary : colors.text} 
            />
          </Pressable>
        </View>

        {/* Reader Scroll Contents */}
        <ScrollView contentContainerStyle={[styles.readerContent, { zIndex: 5 }]}>
          <Text style={[styles.readerTitle, { color: colors.text }]}>
            {loc(selectedSubtopic.title)}
          </Text>

          {selectedSubtopic.imageUrl && (
            <Image 
              source={{ uri: selectedSubtopic.imageUrl }} 
              style={{ width: '100%', height: 220, borderRadius: 12, marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.05)' }}
              resizeMode="contain"
            />
          )}

          <ContentRenderer content={loc(selectedSubtopic.content)} fontSize={fontSize} />

          {/* Display localized tips if present */}
          {selectedSubtopic.tip && (
            <View style={[styles.tipCard, { backgroundColor: `${colors.primary}10`, borderColor: colors.primary }]}>
              <View style={styles.tipHeader}>
                <Ionicons name="bulb" size={20} color={colors.primary} />
                <Text style={[styles.tipTitle, { color: colors.primary }]}>{t('study.drivingTip')}</Text>
              </View>
              <Text style={[styles.tipText, { color: colors.text }]}>
                {loc(selectedSubtopic.tip)}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Reader Navigation Footer */}
        <View style={[styles.readerFooter, { borderTopColor: colors.border, backgroundColor: colors.backgroundElement }]}>
          <Button
            title={t('quiz.prev')}
            onPress={handlePrevSubtopic}
            disabled={!hasPrev}
            variant="ghost"
            style={styles.navBtn}
          />
          <Text style={[styles.pageNumber, { color: colors.textSecondary }]}>
            {currentIndex + 1} / {selectedChapter.subtopics.length}
          </Text>
          <Button
            title={t('quiz.next')}
            onPress={handleNextSubtopic}
            disabled={!hasNext}
            variant="ghost"
            style={styles.navBtn}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Render Chapter Subtopics List View
  if (selectedChapter) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.chapterHeader}>
            <Pressable onPress={() => setSelectedChapter(null)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {loc(selectedChapter.title)}
            </Text>
          </View>

          {/* Chapter Quiz Trigger Button */}
          <Card style={styles.chapterQuizCard}>
            <View style={styles.chapterQuizRow}>
              <View style={[styles.subtopicIndex, { backgroundColor: `${colors.primary}15`, marginRight: 4 }]}>
                <Ionicons name="school" size={16} color={colors.primary} />
              </View>
              <View style={styles.chapterQuizInfo}>
                <Text style={[styles.chapterQuizTitle, { color: colors.text }]}>{t('study.chapterPracticeQuiz')}</Text>
                <Text style={[styles.chapterQuizSub, { color: colors.textSecondary }]}>
                  {t('study.chapterQuizDesc')}
                </Text>
              </View>
            </View>
            <Button
              title={t('study.startChapterQuiz')}
              onPress={() => {
                useQuizStore.getState().startNewQuiz(undefined, undefined, selectedChapter.id);
                useQuizStore.getState().setViewMode('countdown');
                if (onNavigateToTab) {
                  onNavigateToTab('quiz');
                }
              }}
              style={{ marginTop: 12 }}
            />
          </Card>

          {/* Subtopics FlatList */}
          <FlatList
            data={selectedChapter.subtopics}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={renderChapterExplanation}
            ListEmptyComponent={renderEmptySubtopics}
            renderItem={({ item, index }) => {
              const isRead = progress.completedSubtopics.includes(item.id);
              return (
                <Card onPress={() => setSelectedSubtopic(item)} style={styles.subtopicCard}>
                  <View style={styles.subtopicRow}>
                    <View style={[styles.subtopicIndex, { backgroundColor: isRead ? colors.success : colors.backgroundSelected }]}>
                      {isRead ? (
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                      ) : (
                        <Text style={[styles.subtopicIndexText, { color: colors.textSecondary }]}>{index + 1}</Text>
                      )}
                    </View>
                    <View style={styles.subtopicInfo}>
                      <Text style={[styles.subtopicTitle, { color: colors.text }]}>
                        {loc(item.title)}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </View>
                </Card>
              );
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Render Main Chapters Grid / Search View
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{t('tabs.study')}</Text>

        {/* Search Input */}
        <View style={[styles.searchBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            placeholder={t('study.searchPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        {/* Search Results rendering */}
        {searchQuery ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.subtopic.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('study.noMatchingRules')}</Text>
            }
            renderItem={({ item }) => (
              <Card 
                onPress={() => {
                  setSelectedChapter(item.chapter);
                  setSelectedSubtopic(item.subtopic);
                  setSearchQuery(''); // clear search on click
                }}
                style={styles.searchResultCard}
              >
                <Text style={[styles.searchResultChapter, { color: colors.primary }]}>
                  {loc(item.chapter.title)}
                </Text>
                <Text style={[styles.searchResultSubtopic, { color: colors.text }]}>
                  {loc(item.subtopic.title)}
                </Text>
                <Text style={[styles.searchResultContent, { color: colors.textSecondary }]} numberOfLines={2}>
                  {loc(item.subtopic.content)}
                </Text>
              </Card>
            )}
          />
        ) : (
          <ScrollView contentContainerStyle={styles.listContent}>
            {/* Continue Reading Banner */}
            {!selectedBook && progress.lastReadSubtopicId && (
              <Card onPress={handleResumeReading} variant="glass" style={styles.resumeCard}>
                <View style={styles.resumeContent}>
                  <Ionicons name="play" size={20} color="#FFFFFF" style={styles.resumePlayIcon} />
                  <View style={styles.resumeTextContainer}>
                    <Text style={styles.resumeLbl}>{t('study.resumeReading')}</Text>
                    <Text style={styles.resumeTitle} numberOfLines={1}>
                      {getLastReadTitle()}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </View>
              </Card>
            )}

            {/* IF NO SECTION IS SELECTED: Render Car/Bike Selector */}
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
            ) : (
              <>
                {/* Back button if book is selected */}
                {selectedBook && (
                  <View style={[styles.chapterHeader, { marginBottom: 8 }]}>
                    <Pressable onPress={() => setSelectedBook(null)} style={styles.backBtn}>
                      <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                      {loc(selectedBook.title)}
                    </Text>
                  </View>
                )}

                {/* Back button to clear activeSection if no book is selected */}
                {!selectedBook && (
                  <View style={[styles.chapterHeader, { marginBottom: 8 }]}>
                    <Pressable onPress={() => setActiveSection(null)} style={styles.backBtn}>
                      <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                      {activeSection === 'car' ? t('study.carCategory') : t('study.bikeCategory')}
                    </Text>
                  </View>
                )}

                {/* If selectedBook is active, render its chapters */}
                {selectedBook ? (
                  (selectedBook.chapters || []).map((chapter: any) => {
                    const compPercent = getChapterProgress(chapter);
                    const isDownloaded = downloadedChapters.includes(chapter.id);

                    const handleDownload = () => {
                      if (isDownloaded) {
                        Alert.alert(
                          t('study.removeDownloadTitle'),
                          t('study.removeDownloadConfirm'),
                          [
                            { text: t('common.cancel'), style: 'cancel' },
                            { text: t('study.deleteDownload'), style: 'destructive', onPress: () => deleteDownload(chapter.id) }
                          ]
                        );
                      } else {
                        downloadChapter(chapter.id).then(() => {
                          Alert.alert(t('study.downloadedTitle'), t('study.downloadedMessage'));
                        });
                      }
                    };

                    return (
                      <Card 
                        key={chapter.id} 
                        onPress={() => setSelectedChapter(chapter)} 
                        style={styles.chapterCard}
                      >
                        <View style={styles.chapterHeaderRow}>
                          <View style={[styles.chapterIconBox, { backgroundColor: `${colors.primary}10` }]}>
                            <Ionicons name="book-outline" size={24} color={colors.primary} />
                          </View>
                          <View style={styles.chapterInfo}>
                            <Text style={[styles.chapterCardTitle, { color: colors.text }]}>
                              {loc(chapter.title)}
                            </Text>
                            <Text style={[styles.chapterCardSub, { color: colors.textSecondary }]}>
                              {loc(chapter.title)}
                            </Text>
                          </View>
                          {/* Download Toggle icon */}
                          <Pressable onPress={handleDownload} style={styles.downloadIconBtn}>
                            <Ionicons 
                              name={isDownloaded ? 'cloud-done' : 'cloud-download-outline'} 
                              size={22} 
                              color={isDownloaded ? colors.success : colors.textSecondary} 
                            />
                          </Pressable>
                        </View>
                        
                        {/* Progress Line */}
                        <View style={styles.progressRow}>
                          <View style={[styles.progressBarBg, { backgroundColor: colors.backgroundSelected }]}>
                            <View style={[styles.progressBarFill, { backgroundColor: colors.primary, width: `${compPercent}%` }]} />
                          </View>
                          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                            {compPercent}%
                          </Text>
                        </View>
                      </Card>
                    );
                  })
                ) : (
                  /* Render Books list if no book is selected */
                  books.map((book) => {
                    const totalChapters = book.chapters?.length || 0;
                    return (
                      <Card 
                        key={book.id} 
                        onPress={() => setSelectedBook(book)} 
                        style={styles.chapterCard}
                      >
                        <View style={styles.chapterHeaderRow}>
                          <View style={[styles.chapterIconBox, { backgroundColor: activeSection === 'car' ? `${colors.primary}10` : '#FFB30015' }]}>
                            <Ionicons 
                              name={activeSection === 'car' ? "car-sport-outline" : "bicycle-outline"} 
                              size={24} 
                              color={activeSection === 'car' ? colors.primary : "#FFB300"} 
                            />
                          </View>
                          <View style={styles.chapterInfo}>
                            <Text style={[styles.chapterCardTitle, { color: colors.text }]}>
                              {loc(book.title)}
                            </Text>
                            <Text style={[styles.chapterCardSub, { color: colors.textSecondary }]}>
                              {loc(book.description)} | {t('study.chaptersCount', { count: totalChapters })}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                        </View>
                      </Card>
                    );
                  })
                )}
              </>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  listContent: {
    gap: 16,
    paddingBottom: 40,
  },
  resumeCard: {
    padding: 14,
  },
  resumeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resumePlayIcon: {
    marginRight: 12,
  },
  resumeTextContainer: {
    flex: 1,
  },
  resumeLbl: {
    color: '#D0D0D0',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  resumeTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  chapterCard: {
    padding: 16,
  },
  chapterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chapterIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chapterInfo: {
    flex: 1,
    paddingRight: 8,
  },
  chapterCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  chapterCardSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  downloadIconBtn: {
    padding: 4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'right',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 15,
  },
  searchResultCard: {
    padding: 16,
  },
  searchResultChapter: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  searchResultSubtopic: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  searchResultContent: {
    fontSize: 13,
    lineHeight: 18,
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
  subtopicCard: {
    padding: 16,
  },
  subtopicRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtopicIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subtopicIndexText: {
    fontSize: 13,
    fontWeight: '700',
  },
  subtopicInfo: {
    flex: 1,
  },
  subtopicTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0D0D0D',
    ...Platform.select({
      web: {
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(227, 24, 55, 0.04) 0%, rgba(13, 13, 13, 0) 75%)',
      } as any,
    }),
  },
  readerProgressBg: {
    height: 1,
    width: '100%',
  },
  readerProgressFill: {
    height: '100%',
  },
  readerNeedle: {
    position: 'absolute',
    top: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    ...Platform.select({
      web: {
        boxShadow: '0 0 8px #FF3B55',
      } as any,
      default: {
        shadowColor: '#FF3B55',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  readerHeader: {
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
  fontSizeSelector: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 16,
    overflow: 'hidden',
  },
  fontSizeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontSizeText: {
    fontWeight: '700',
  },
  readerContent: {
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  readerTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 24,
    lineHeight: 30,
    letterSpacing: 0.5,
  },
  tipCard: {
    marginTop: 28,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
  readerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  navBtn: {
    minHeight: 36,
    paddingVertical: 6,
  },
  pageNumber: {
    fontSize: 13,
    fontWeight: '600',
  },
  chapterQuizCard: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  chapterQuizRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chapterQuizInfo: {
    flex: 1,
  },
  chapterQuizTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  chapterQuizSub: {
    fontSize: 12,
  },
  // Car / Bike vehicle selector styling
  selectorContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 16,
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
  // Chapter Explanation styling
  explanationCard: {
    padding: 20,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 16,
  },
  explanationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  explanationCardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  explanationIntroText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  explanationSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  takeawayRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  takeawayText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  explanationDivider: {
    height: 1,
    marginVertical: 16,
  },
  vehicleFocusBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  vehicleFocusTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  vehicleFocusText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
