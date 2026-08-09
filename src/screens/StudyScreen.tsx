import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TextInput, Pressable, ScrollView, Platform, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Text } from '../components/ui/Text';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { useLanguageStore, LanguageCode } from '../stores/languageStore';
import { useStudyStore } from '../stores/studyStore';
import { Chapter, Subtopic } from '../types/study';
import { Card } from '../components/ui/Card';
import { ContentRenderer } from '../components/study/ContentRenderer';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface StudyScreenProps {
  onNavigateToTab?: (tab: 'home' | 'study' | 'quiz' | 'progress' | 'profile') => void;
}

export const StudyScreen: React.FC<StudyScreenProps> = ({ onNavigateToTab }) => {
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];
  const currentLang = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  // Store States
  const { 
    books, 
    chapters, 
    bookmarkedPages, 
    progress, 
    downloadedChapters, 
    selectedBookId, 
    setSelectedBookId, 
    toggleBookmark, 
    markAsRead, 
    setLastRead, 
  } = useStudyStore();

  // Navigation states
  const [activeCategory, setActiveCategory] = useState<'car' | 'bike' | 'large' | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<Subtopic | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  // Handle external routing
  useEffect(() => {
    if (selectedBookId) {
      setActiveCategory('car');
      setSelectedBookId(null);
    }
  }, [selectedBookId, setSelectedBookId]);

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

  // Static Chapter Data with Thumbnails for Category View
  const categoryChaptersData = [
    {
      id: 'ch-1',
      num: 1,
      titleKey: 'study.rulesForHighways',
      descKey: 'study.rulesForHighwaysSub',
      progress: 60,
      topicsCount: 5,
      image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&q=80',
    },
    {
      id: 'ch-2',
      num: 2,
      titleKey: 'study.rulesForPedestrians',
      descKey: 'study.rulesForPedestriansSub',
      progress: 40,
      topicsCount: 6,
      image: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?w=600&q=80',
    },
    {
      id: 'ch-3',
      num: 3,
      titleKey: 'study.trafficSignsSignals',
      descKey: 'study.trafficSignsSignalsSub',
      progress: 30,
      topicsCount: 7,
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&q=80',
    },
    {
      id: 'ch-4',
      num: 4,
      titleKey: 'study.intersectionsCrosswalks',
      descKey: 'study.intersectionsCrosswalksSub',
      progress: 0,
      topicsCount: 4,
      image: 'https://images.unsplash.com/photo-1578836537282-3171d77f8632?w=600&q=80',
    },
    {
      id: 'ch-5',
      num: 5,
      titleKey: 'study.parkingStopping',
      descKey: 'study.parkingStoppingSub',
      progress: 0,
      topicsCount: 5,
      image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&q=80',
    },
  ];

  // ----------------------------------------------------
  // VIEW 3: SUBTOPIC READER VIEW (When reading a topic)
  // ----------------------------------------------------
  if (selectedSubtopic && selectedChapter) {
    const isBookmarked = bookmarkedPages.some(
      b => b.chapterId === selectedChapter.id && b.subtopicId === selectedSubtopic.id
    );

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.readerHeader, { borderBottomColor: colors.border, backgroundColor: colors.backgroundElement }]}>
          <TouchableOpacity 
            onPress={() => setSelectedSubtopic(null)}
            style={[styles.iconBtn, { backgroundColor: colors.background }]}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.readerTitle, { color: colors.text }]} numberOfLines={1}>
            {loc(selectedSubtopic.title)}
          </Text>
          <TouchableOpacity 
            onPress={() => toggleBookmark(selectedChapter.id, selectedSubtopic.id)}
            style={[styles.iconBtn, { backgroundColor: colors.background }]}
          >
            <Ionicons 
              name={isBookmarked ? "bookmark" : "bookmark-outline"} 
              size={20} 
              color={isBookmarked ? colors.primary : colors.text} 
            />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.readerContent}>
          <ContentRenderer 
            content={loc(selectedSubtopic.content)} 
            fontSize="medium" 
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ----------------------------------------------------
  // VIEW 2: CATEGORY CHAPTERS LIST VIEW (Screenshot 1)
  // ----------------------------------------------------
  if (activeCategory) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Top Header */}
          <View style={styles.topNav}>
            <TouchableOpacity onPress={() => setActiveCategory(null)} style={{ paddingRight: 8 }}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoBadgeText}>NS</Text>
              </View>
              <View style={{ marginLeft: 8 }}>
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

          {/* Car License Category Hero Card */}
          <View style={styles.categoryHeroCard}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80' }}
              style={styles.categoryHeroImage}
              resizeMode="cover"
            />
            <View style={[
              styles.categoryHeroOverlay,
              { backgroundColor: theme === 'dark' ? 'rgba(11, 12, 16, 0.90)' : 'rgba(255,255,255,0.88)' }
            ]} />

            <View style={styles.categoryHeroContent}>
              <View style={[
                styles.carIconBadge,
                { backgroundColor: theme === 'dark' ? 'rgba(227, 24, 55, 0.2)' : '#FFEBEE' }
              ]}>
                <Ionicons name="car-sport" size={24} color={theme === 'dark' ? '#FF4D6D' : '#E31837'} />
              </View>
              <Text style={[styles.categoryTitle, { color: colors.text }]}>
                {t('study.carLicense')}
              </Text>
              <Text style={[styles.categorySub, { color: colors.textSecondary }]}>
                {t('study.carLicenseSub')}
              </Text>

              {/* Progress */}
              <View style={styles.categoryProgressRow}>
                <Text style={[styles.progressLbl, { color: colors.textSecondary }]}>Progress</Text>
                <Text style={[styles.progressVal, { color: theme === 'dark' ? '#FF4D6D' : '#E31837' }]}>32%</Text>
              </View>
              <View style={[styles.progressTrackBg, { backgroundColor: theme === 'dark' ? '#232633' : '#E0E0E0' }]}>
                <View style={[styles.progressTrackFill, { width: '32%', backgroundColor: theme === 'dark' ? '#FF4D6D' : '#E31837' }]} />
              </View>
              <Text style={[styles.completedTopicsSub, { color: colors.textSecondary }]}>
                {t('study.topicsCompleted', { completed: 8, total: 25 })}
              </Text>
            </View>
          </View>

          {/* 4 Stat Boxes Row */}
          <View style={styles.statBoxesRow}>
            <Card style={styles.statBoxCard}>
              <Ionicons name="book-outline" size={20} color="#E31837" />
              <Text style={[styles.statBoxNum, { color: colors.text }]}>5</Text>
              <Text style={[styles.statBoxLabel, { color: colors.textSecondary }]}>Chapters</Text>
            </Card>

            <Card style={styles.statBoxCard}>
              <Ionicons name="checkbox-outline" size={20} color="#FF9800" />
              <Text style={[styles.statBoxNum, { color: colors.text }]}>25</Text>
              <Text style={[styles.statBoxLabel, { color: colors.textSecondary }]}>{t('study.topics')}</Text>
            </Card>

            <Card style={styles.statBoxCard}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
              <Text style={[styles.statBoxNum, { color: colors.text }]}>8</Text>
              <Text style={[styles.statBoxLabel, { color: colors.textSecondary }]}>{t('study.complete')}</Text>
            </Card>

            <Card style={styles.statBoxCard}>
              <Ionicons name="time-outline" size={20} color="#7C4DFF" />
              <Text style={[styles.statBoxNum, { color: colors.text }]}>2h 15m</Text>
              <Text style={[styles.statBoxLabel, { color: colors.textSecondary }]}>{t('study.estTime')}</Text>
            </Card>
          </View>

          {/* Chapters List */}
          <Text style={[styles.sectionHeading, { color: colors.text }]}>{t('study.chapters')}</Text>

          <View style={{ gap: 14, marginBottom: 20 }}>
            {categoryChaptersData.map((ch) => {
              const realChapter = chapters[ch.num - 1] || chapters[0];
              return (
                <Card 
                  key={ch.id} 
                  style={styles.chapterCardRow}
                  onPress={() => {
                    if (realChapter) {
                      setSelectedChapter(realChapter);
                      setSelectedSubtopic(realChapter.subtopics[0] || null);
                    }
                  }}
                >
                  <Image source={{ uri: ch.image }} style={styles.chapterThumb} />

                  <View style={styles.chapterInfoCol}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <View style={styles.chapterNumBadge}>
                        <Text style={styles.chapterNumText}>{ch.num}</Text>
                      </View>
                      <Text style={[styles.chapterItemTitle, { color: colors.text }]} numberOfLines={1}>
                        {t(ch.titleKey)}
                      </Text>
                    </View>

                    <Text style={[styles.chapterItemDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                      {t(ch.descKey)}
                    </Text>

                    <View style={styles.chapterProgressFooter}>
                      <View style={styles.miniProgressTrack}>
                        <View style={[styles.miniProgressFill, { width: `${ch.progress}%` }]} />
                      </View>
                      <Text style={styles.miniProgressPercent}>{ch.progress}%</Text>
                      <Text style={[styles.topicsCountMeta, { color: colors.textSecondary }]}>
                        {t('study.topicsCount', { count: ch.topicsCount })}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>

        </ScrollView>
      </SafeAreaView>
    );
  }

  // ----------------------------------------------------
  // VIEW 1: MAIN STUDY TAB VIEW (Screenshot 2)
  // ----------------------------------------------------
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Navigation */}
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
            <Text style={[styles.mainPageTitle, { color: colors.text }]}>{t('tabs.study')}</Text>
            <Text style={[styles.mainPageSub, { color: colors.textSecondary }]}>
              {t('study.subtitle')}
            </Text>
          </View>
          <View style={styles.carIllustrationFrame}>
            <Ionicons name="car-sport" size={38} color="#E31837" />
          </View>
        </View>

        {/* Search Bar + Filter Button */}
        <View style={styles.searchRowContainer}>
          <View style={[styles.searchBarBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t('study.searchPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={[styles.filterBtnPill, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <Ionicons name="options-outline" size={18} color={colors.text} />
            <Text style={[styles.filterBtnText, { color: colors.text }]}>{t('study.filter')}</Text>
          </TouchableOpacity>
        </View>

        {/* Continue Reading Hero Card */}
        <Card style={styles.continueReadingHero}>
          <View style={styles.circularGaugeBox}>
            <View style={styles.ringOuter}>
              <Text style={styles.ringPercentText}>68%</Text>
              <Text style={styles.ringCompleteText}>{t('study.complete')}</Text>
            </View>
          </View>

          <View style={styles.continueDetailsCol}>
            <Text style={styles.continueBadgeTag}>{t('study.continueReadingBadge')}</Text>
            <Text style={[styles.continueChapterTitle, { color: colors.text }]}>Traffic Rules & Signals</Text>
            <Text style={[styles.continueChapterSub, { color: colors.textSecondary }]}>Chapter 2 • Traffic Lights</Text>

            <View style={styles.progressLineBg}>
              <View style={[styles.progressLineFill, { width: '68%' }]} />
            </View>
            <Text style={[styles.lessonSubText, { color: colors.textSecondary }]}>
              {t('study.lessonOf', { current: 8, total: 12 })}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.continueActionBtn}
            onPress={() => setActiveCategory('car')}
          >
            <Ionicons name="chevron-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        </Card>

        {/* Study by Category Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>{t('study.studyByCategory')}</Text>
          <Text style={[styles.sectionSubHeading, { color: colors.textSecondary }]}>{t('study.studyByCategorySub')}</Text>

          <View style={{ gap: 12, marginTop: 12 }}>
            {/* Category Card 1: Car License */}
            <Card style={styles.categoryCardRow} onPress={() => setActiveCategory('car')}>
              <View style={[
                styles.catIconCircle, 
                { backgroundColor: theme === 'dark' ? 'rgba(227, 24, 55, 0.2)' : '#FFEBEE' }
              ]}>
                <Ionicons name="car-sport" size={22} color={theme === 'dark' ? '#FF4D6D' : '#E31837'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.catCardTitle, { color: colors.text }]}>{t('study.carLicense')}</Text>
                <Text style={[styles.catCardSub, { color: colors.textSecondary }]}>{t('study.carLicenseSub')}</Text>
              </View>
              <View style={[
                styles.catBadgeRed,
                { backgroundColor: theme === 'dark' ? 'rgba(227, 24, 55, 0.2)' : '#FFEBEE' }
              ]}>
                <Text style={[styles.catBadgeRedText, { color: theme === 'dark' ? '#FF4D6D' : '#E31837' }]}>5 Chapters</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </Card>

            {/* Category Card 2: Motorcycle License */}
            <Card style={styles.categoryCardRow} onPress={() => setActiveCategory('bike')}>
              <View style={[
                styles.catIconCircle, 
                { backgroundColor: theme === 'dark' ? 'rgba(255, 152, 0, 0.2)' : '#FFF8E1' }
              ]}>
                <Ionicons name="bicycle" size={22} color={theme === 'dark' ? '#FFB74D' : '#FF9800'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.catCardTitle, { color: colors.text }]}>{t('study.motorcycleLicense')}</Text>
                <Text style={[styles.catCardSub, { color: colors.textSecondary }]}>{t('study.motorcycleLicenseSub')}</Text>
              </View>
              <View style={[
                styles.catBadgeYellow,
                { backgroundColor: theme === 'dark' ? 'rgba(255, 152, 0, 0.2)' : '#FFF8E1' }
              ]}>
                <Text style={[styles.catBadgeYellowText, { color: theme === 'dark' ? '#FFB74D' : '#E65100' }]}>4 Chapters</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </Card>

            {/* Category Card 3: Large Vehicle License */}
            <Card style={styles.categoryCardRow} onPress={() => setActiveCategory('large')}>
              <View style={[
                styles.catIconCircle, 
                { backgroundColor: theme === 'dark' ? 'rgba(156, 39, 176, 0.2)' : '#F3E5F5' }
              ]}>
                <Ionicons name="bus" size={22} color={theme === 'dark' ? '#CE93D8' : '#9C27B0'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.catCardTitle, { color: colors.text }]}>{t('study.largeVehicleLicense')}</Text>
                <Text style={[styles.catCardSub, { color: colors.textSecondary }]}>{t('study.largeVehicleLicenseSub')}</Text>
              </View>
              <View style={[
                styles.catBadgePurple,
                { backgroundColor: theme === 'dark' ? 'rgba(156, 39, 176, 0.2)' : '#F3E5F5' }
              ]}>
                <Text style={[styles.catBadgePurpleText, { color: theme === 'dark' ? '#CE93D8' : '#7B1FA2' }]}>6 Chapters</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </Card>
          </View>
        </View>

        {/* Quick Tools Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>{t('study.quickTools')}</Text>
          <View style={styles.quickToolsGrid}>
            <TouchableOpacity style={styles.quickToolBox} onPress={() => {}}>
              <View style={[
                styles.quickToolIconBadge, 
                { backgroundColor: theme === 'dark' ? 'rgba(227, 24, 55, 0.2)' : '#FFEBEE' }
              ]}>
                <Ionicons name="bookmark" size={22} color={theme === 'dark' ? '#FF4D6D' : '#E31837'} />
              </View>
              <Text style={[styles.quickToolLabel, { color: colors.text }]}>{t('study.bookmarks')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickToolBox} onPress={() => {}}>
              <View style={[
                styles.quickToolIconBadge, 
                { backgroundColor: theme === 'dark' ? 'rgba(255, 152, 0, 0.2)' : '#FFF3E0' }
              ]}>
                <Ionicons name="time" size={22} color={theme === 'dark' ? '#FFB74D' : '#FF9800'} />
              </View>
              <Text style={[styles.quickToolLabel, { color: colors.text }]}>{t('study.recent')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickToolBox} onPress={() => {}}>
              <View style={[
                styles.quickToolIconBadge, 
                { backgroundColor: theme === 'dark' ? 'rgba(76, 175, 80, 0.2)' : '#E8F5E9' }
              ]}>
                <Ionicons name="download" size={22} color={theme === 'dark' ? '#81C784' : '#4CAF50'} />
              </View>
              <Text style={[styles.quickToolLabel, { color: colors.text }]}>{t('study.downloads')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickToolBox} onPress={() => {}}>
              <View style={[
                styles.quickToolIconBadge, 
                { backgroundColor: theme === 'dark' ? 'rgba(33, 150, 243, 0.2)' : '#E3F2FD' }
              ]}>
                <Ionicons name="journal" size={22} color={theme === 'dark' ? '#64B5F6' : '#2196F3'} />
              </View>
              <Text style={[styles.quickToolLabel, { color: colors.text }]}>{t('study.notes')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Study Tip Banner */}
        <Card style={[
          styles.studyTipCard,
          { 
            backgroundColor: theme === 'dark' ? '#18141F' : '#FFF5F5',
            borderColor: theme === 'dark' ? 'rgba(227, 24, 55, 0.3)' : '#FFE0E0'
          }
        ]}>
          <View style={[
            styles.tipIconBadge,
            { backgroundColor: theme === 'dark' ? 'rgba(227, 24, 55, 0.2)' : '#FFEBEE' }
          ]}>
            <Ionicons name="disc" size={28} color={theme === 'dark' ? '#FF4D6D' : '#E31837'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.tipTitleHeader, { color: theme === 'dark' ? '#FF4D6D' : '#E31837' }]}>{t('study.studyTip')}</Text>
            <Text style={[styles.tipMainText, { color: colors.text }]}>{t('study.studyTipTitle')}</Text>
            <Text style={[styles.tipSubText, { color: colors.textSecondary }]}>{t('study.studyTipSub')}</Text>
          </View>
          <TouchableOpacity style={[styles.viewTipsBtn, { borderColor: theme === 'dark' ? '#FF4D6D' : '#E31837' }]}>
            <Text style={[styles.viewTipsText, { color: theme === 'dark' ? '#FF4D6D' : '#E31837' }]}>{t('study.viewTips')}</Text>
            <Ionicons name="chevron-forward" size={14} color={theme === 'dark' ? '#FF4D6D' : '#E31837'} />
          </TouchableOpacity>
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
  // Page Title & Header
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
  carIllustrationFrame: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Search & Filter
  searchRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  searchBarBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    padding: 0,
  },
  filterBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    gap: 6,
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Continue Reading Hero
  continueReadingHero: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
    marginBottom: 22,
  },
  circularGaugeBox: {
    marginRight: 14,
  },
  ringOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 5,
    borderColor: '#E31837',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringPercentText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#E31837',
  },
  ringCompleteText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#E31837',
  },
  continueDetailsCol: {
    flex: 1,
    paddingRight: 8,
  },
  continueBadgeTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E31837',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  continueChapterTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  continueChapterSub: {
    fontSize: 12,
    marginBottom: 8,
  },
  progressLineBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F0F0F5',
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressLineFill: {
    height: '100%',
    backgroundColor: '#E31837',
    borderRadius: 3,
  },
  lessonSubText: {
    fontSize: 11,
    fontWeight: '600',
  },
  continueActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E31837',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Categories Section
  sectionContainer: {
    marginBottom: 22,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  sectionSubHeading: {
    fontSize: 12.5,
  },
  categoryCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    gap: 12,
  },
  catIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  catCardSub: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  catBadgeRed: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  catBadgeRedText: {
    color: '#E31837',
    fontSize: 11,
    fontWeight: '800',
  },
  catBadgeYellow: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  catBadgeYellowText: {
    color: '#F57F17',
    fontSize: 11,
    fontWeight: '800',
  },
  catBadgePurple: {
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  catBadgePurpleText: {
    color: '#7B1FA2',
    fontSize: 11,
    fontWeight: '800',
  },
  // Quick Tools
  quickToolsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  quickToolBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  quickToolIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickToolLabel: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  // Study Tip Card
  studyTipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFF5F5',
    gap: 12,
  },
  tipIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipTitleHeader: {
    color: '#E31837',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
  },
  tipMainText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  tipSubText: {
    fontSize: 11.5,
  },
  viewTipsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E31837',
    gap: 4,
  },
  viewTipsText: {
    color: '#E31837',
    fontSize: 11.5,
    fontWeight: '800',
  },

  // Category Detail View Styles
  categoryHeroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    minHeight: 190,
    marginBottom: 16,
    position: 'relative',
  },
  categoryHeroImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '65%',
  },
  categoryHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    width: '60%',
  },
  categoryHeroContent: {
    padding: 20,
  },
  carIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  categorySub: {
    fontSize: 12.5,
    maxWidth: '60%',
    marginBottom: 14,
  },
  categoryProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '55%',
    marginBottom: 4,
  },
  progressLbl: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#666',
  },
  progressVal: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#E31837',
  },
  progressTrackBg: {
    width: '55%',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressTrackFill: {
    height: '100%',
    backgroundColor: '#E31837',
    borderRadius: 3,
  },
  completedTopicsSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  // 4 Stat Boxes
  statBoxesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  statBoxCard: {
    flex: 1,
    padding: 10,
    borderRadius: 18,
    alignItems: 'center',
  },
  statBoxNum: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 4,
  },
  statBoxLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  // Chapter Cards Row
  chapterCardRow: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 20,
    gap: 12,
  },
  chapterThumb: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  chapterInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  chapterNumBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterNumText: {
    color: '#E31837',
    fontSize: 11,
    fontWeight: '800',
  },
  chapterItemTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    flex: 1,
  },
  chapterItemDesc: {
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 8,
  },
  chapterProgressFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniProgressTrack: {
    width: 60,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#E31837',
  },
  miniProgressPercent: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E31837',
  },
  topicsCountMeta: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 6,
  },

  // Reader View Styles
  readerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  readerTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  readerContent: {
    padding: 20,
  },
});
