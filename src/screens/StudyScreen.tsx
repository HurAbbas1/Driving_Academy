import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, TextInput, Pressable, ScrollView, Platform, Image, TouchableOpacity, useWindowDimensions, Modal } from 'react-native';
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
    bookmarkedChapters,
    recentChapters,
    progress, 
    downloadedChapters, 
    notes,
    selectedBookId, 
    setSelectedBookId, 
    toggleBookmark, 
    toggleBookmarkChapter,
    addRecentChapter,
    clearRecentChapters,
    toggleDownloadChapter,
    saveChapterNote,
    deleteChapterNote,
    markAsRead, 
    setLastRead, 
  } = useStudyStore();

  // Navigation & Quick Tools states
  const [activeCategory, setActiveCategory] = useState<'car' | 'bike' | 'large' | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<Subtopic | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [quickToolModal, setQuickToolModal] = useState<'bookmarks' | 'recent' | 'downloads' | 'notes' | null>(null);
  const [isQuickNoteModalOpen, setIsQuickNoteModalOpen] = useState(false);
  const [isTipsModalOpen, setIsTipsModalOpen] = useState(false);
  const [noteInputText, setNoteInputText] = useState('');
  const [activeNoteChapterId, setActiveNoteChapterId] = useState<string | null>(null);

  // Handle external routing
  useEffect(() => {
    if (selectedBookId) {
      setActiveCategory('car');
      setSelectedBookId(null);
    }
  }, [selectedBookId, setSelectedBookId]);

  // Auto-record progress, recent history, and last-read whenever reading a topic
  useEffect(() => {
    if (selectedChapter && selectedSubtopic) {
      addRecentChapter(selectedChapter.id);
      markAsRead(selectedSubtopic.id);
      setLastRead(selectedSubtopic.id, selectedChapter.id);
    }
  }, [selectedChapter?.id, selectedSubtopic?.id]);

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

  // Active Handbook & filtered Chapters selection
  const officialMasterBook = books.find(b => b.id === 'book_official_japan_handbook') || books[0];
  const activeBook = selectedBookId ? books.find(b => b.id === selectedBookId) || officialMasterBook : officialMasterBook;
  
  const getChapterNum = (ch: any): number => {
    if (ch.orderNum) return Number(ch.orderNum);
    if (ch.order_num) return Number(ch.order_num);
    const matchId = String(ch.id || '').match(/ch_(?:official_)?(\d+)/);
    if (matchId) return parseInt(matchId[1], 10);
    const matchTitle = (typeof ch.title === 'string' ? ch.title : ch.title?.en || '')?.match(/Chapter\s*(\d+)/i);
    if (matchTitle) return parseInt(matchTitle[1], 10);
    return 0;
  };

  // Get ONLY the chapters belonging to activeBook
  const rawChapters = activeBook?.chapters && activeBook.chapters.length > 0 
    ? activeBook.chapters 
    : chapters.filter(c => c.id.startsWith('ch_official_') || c.id.startsWith('ch_'));

  const activeChapters = [...rawChapters].sort((a, b) => getChapterNum(a) - getChapterNum(b));

  const activeTopicsCount = activeChapters.reduce((acc, c) => acc + (c.subtopics ? c.subtopics.length : 0), 0);
  const activeCompletedCount = activeChapters.reduce((acc, c) => {
    const subs = c.subtopics || [];
    return acc + subs.filter(s => progress.completedSubtopics.includes(s.id)).length;
  }, 0);
  const activeProgressPercent = activeTopicsCount > 0 ? Math.round((activeCompletedCount / activeTopicsCount) * 100) : 0;

  // Static Chapter Data with Thumbnails for Category View
  const categoryChaptersData = [
    {
      id: 'ch-1',
      num: 1,
      titleKey: 'study.rulesForHighways',
      descKey: 'study.rulesForHighwaysSub',
      progress: 60,
      topicsCount: 5,
      image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
    },
    {
      id: 'ch-2',
      num: 2,
      titleKey: 'study.rulesForPedestrians',
      descKey: 'study.rulesForPedestriansSub',
      progress: 40,
      topicsCount: 6,
      image: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=600&q=80',
    },
    {
      id: 'ch-3',
      num: 3,
      titleKey: 'study.trafficSignsSignals',
      descKey: 'study.trafficSignsSignalsSub',
      progress: 30,
      topicsCount: 7,
      image: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?w=600&q=80',
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
      image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&q=80',
    },
  ];

  // ----------------------------------------------------
  // VIEW 3: SUBTOPIC READER VIEW (When reading a topic)
  // ----------------------------------------------------
  if (selectedSubtopic && selectedChapter) {
    const isBookmarked = bookmarkedChapters.includes(selectedChapter.id) || 
                         bookmarkedPages.includes(selectedChapter.id) || 
                         bookmarkedPages.includes(selectedSubtopic.id);
    const hasNote = Boolean(notes[selectedChapter.id]);

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.readerHeader, { borderBottomColor: colors.border, backgroundColor: colors.backgroundElement }]}>
          <TouchableOpacity 
            onPress={() => {
              setSelectedSubtopic(null);
              setIsQuickNoteModalOpen(false);
            }}
            style={[styles.iconBtn, { backgroundColor: colors.background }]}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.readerTitle, { color: colors.text }]} numberOfLines={1}>
            {loc(selectedSubtopic.title)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity 
              onPress={() => {
                setNoteInputText(notes[selectedChapter.id] || '');
                setIsQuickNoteModalOpen(true);
              }}
              style={[styles.iconBtn, { backgroundColor: colors.background }]}
            >
              <Ionicons 
                name={hasNote ? "journal" : "journal-outline"} 
                size={20} 
                color={hasNote ? colors.primary : colors.text} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => toggleBookmarkChapter(selectedChapter.id)}
              style={[styles.iconBtn, { backgroundColor: colors.background }]}
            >
              <Ionicons 
                name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                size={20} 
                color={isBookmarked ? colors.primary : colors.text} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.readerContent}>
          <ContentRenderer 
            content={loc(selectedSubtopic.content)} 
            fontSize="medium" 
          />
        </ScrollView>

        {/* Instant Quick Note Popup Modal (Scoped ONLY to Subtopic Reader) */}
        <Modal
          visible={isQuickNoteModalOpen}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setIsQuickNoteModalOpen(false)}
        >
          <View style={styles.modalOverlayBg}>
            <View style={[styles.modalContentCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border, paddingBottom: 24 }]}>
              <View style={[styles.modalHeaderRow, { borderBottomColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <Ionicons name="journal" size={22} color="#2196F3" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: '800', letterSpacing: 0.5 }}>
                      QUICK NOTE • CH {getChapterNum(selectedChapter)}
                    </Text>
                    <Text style={[styles.modalTitleText, { color: colors.text }]} numberOfLines={1}>
                      {loc(selectedChapter.title)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setIsQuickNoteModalOpen(false)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={22} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={{ gap: 12, marginTop: 12 }}>
                <TextInput 
                  style={[
                    styles.noteInput, 
                    { 
                      color: colors.text, 
                      backgroundColor: colors.background, 
                      borderColor: colors.border,
                      minHeight: 120,
                      fontSize: 14,
                      lineHeight: 20
                    }
                  ]}
                  placeholder="Type your quick note or exam tip for this chapter..."
                  placeholderTextColor={colors.textSecondary}
                  multiline={true}
                  numberOfLines={5}
                  autoFocus={true}
                  value={noteInputText}
                  onChangeText={setNoteInputText}
                />

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  {notes[selectedChapter.id] ? (
                    <TouchableOpacity 
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8 }}
                      onPress={() => {
                        deleteChapterNote(selectedChapter.id);
                        setNoteInputText('');
                        setIsQuickNoteModalOpen(false);
                      }}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.error} />
                      <Text style={{ color: colors.error, fontSize: 12, fontWeight: '700' }}>Delete Note</Text>
                    </TouchableOpacity>
                  ) : <View />}

                  <View style={{ flexDirection: 'row', gap: 8, marginLeft: 'auto' }}>
                    <TouchableOpacity 
                      style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 }}
                      onPress={() => setIsQuickNoteModalOpen(false)}
                    >
                      <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.modalActionBtn, { backgroundColor: '#2196F3', paddingHorizontal: 18, paddingVertical: 10 }]}
                      onPress={() => {
                        if (noteInputText.trim()) {
                          saveChapterNote(selectedChapter.id, noteInputText.trim());
                          setIsQuickNoteModalOpen(false);
                        }
                      }}
                    >
                      <Ionicons name="checkmark-sharp" size={16} color="#FFF" />
                      <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '800' }}>Save Quick Note</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Modal>
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
          <View style={[styles.categoryHeroCard, { backgroundColor: theme === 'dark' ? colors.backgroundElement : '#FFFFFF' }]}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1200&q=80' }}
              style={styles.categoryHeroImage}
              resizeMode="cover"
            />
            <View style={[
              styles.categoryHeroOverlay,
              Platform.select({
                web: {
                  backgroundImage: theme === 'dark' 
                    ? 'linear-gradient(to right, #14161D 0%, #14161D 35%, rgba(20,22,29,0.85) 55%, rgba(20,22,29,0) 80%)'
                    : 'linear-gradient(to right, #FFFFFF 0%, #FFFFFF 35%, rgba(255,255,255,0.85) 55%, rgba(255,255,255,0) 80%)',
                } as any,
                default: {
                  backgroundColor: theme === 'dark' ? 'rgba(20,22,29,0.7)' : 'rgba(255,255,255,0.7)',
                }
              })
            ]} />

            <View style={styles.categoryHeroContent}>
              <View style={[
                styles.carIconBadge,
                { backgroundColor: theme === 'dark' ? 'rgba(227, 24, 55, 0.2)' : '#FFEBEE' }
              ]}>
                <Ionicons name="car-sport" size={24} color={theme === 'dark' ? '#FF4D6D' : '#E31837'} />
              </View>
              <Text style={[styles.categoryTitle, { color: colors.text }]}>
                {loc(activeBook?.title || t('study.carLicense'))}
              </Text>
              <Text style={[styles.categorySub, { color: colors.textSecondary }]}>
                {loc(activeBook?.description || t('study.carLicenseSub'))}
              </Text>

            </View>
          </View>

          {/* 4 Stat Boxes Row */}
          <View style={styles.statBoxesRow}>
            <Card style={styles.statBoxCard}>
              <Ionicons name="book-outline" size={20} color="#E31837" />
              <Text style={[styles.statBoxNum, { color: colors.text }]}>{activeChapters.length}</Text>
              <Text style={[styles.statBoxLabel, { color: colors.textSecondary }]}>Chapters</Text>
            </Card>

            <Card style={styles.statBoxCard}>
              <Ionicons name="checkbox-outline" size={20} color="#FF9800" />
              <Text style={[styles.statBoxNum, { color: colors.text }]}>{activeTopicsCount}</Text>
              <Text style={[styles.statBoxLabel, { color: colors.textSecondary }]}>{t('study.topics')}</Text>
            </Card>

            <Card style={styles.statBoxCard}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
              <Text style={[styles.statBoxNum, { color: colors.text }]}>{activeCompletedCount}</Text>
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
            {activeChapters.map((ch, idx) => {
              const chNum = getChapterNum(ch) || (idx + 1);
              const subCount = ch.subtopics ? ch.subtopics.length : 0;
              const readCount = ch.subtopics ? ch.subtopics.filter(s => progress.completedSubtopics.includes(s.id)).length : 0;
              const percent = subCount > 0 ? Math.round((readCount / subCount) * 100) : 0;
              const chapterImages = [
                'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&q=80', // Ch 1: Japanese Street Driving & Keep-Left Lane Rules
                'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&q=80', // Ch 2: Japanese Traffic Lights & STOP Signs
                'https://images.unsplash.com/photo-1508974239320-0a029497e820?w=800&q=80', // Ch 3: Multi-Lane Road Marking & Yellow Line Discipline
                'https://images.unsplash.com/photo-1578836537282-3171d77f8632?w=800&q=80', // Ch 4: City 4-Way Intersection Right-of-Way
                'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&q=80', // Ch 5: Pedestrian Crosswalk & Zebra Crossing Rules
                'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&q=80', // Ch 6: Speedometer & Speed Limit Rules
                'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&q=80', // Ch 7: Parking Restrictions & Street Parking Signs
                'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80', // Ch 8: Mountain Hazard Warning Signs & Foggy Weather
                'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&q=80', // Ch 9: Expressway ETC Toll Gate & Headlight Night Rules
                'https://images.unsplash.com/photo-1532105956626-9569c03602f6?w=800&q=80', // Ch 10: Japanese Train Level Crossing Gate (踏切)
                'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&q=80', // Ch 11: Fastened Car Seatbelt Buckle & Safety Gear
                'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80', // Ch 12: Driver Steering Wheel & Police Checkpoint DUI Rules
                'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80', // Ch 13: Shaken Vehicle Inspection & Engine Maintenance (Verified 200 OK)
                'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80', // Ch 14: Japanese Driving License Cockpit View & Foreign Reset
              ];
              const thumb = ch.cover_image || chapterImages[(chNum - 1) % chapterImages.length];

              return (
                <Card 
                  key={`${ch.id}-${idx}`} 
                  style={styles.chapterCardRow}
                  onPress={() => {
                    setSelectedChapter(ch);
                    addRecentChapter(ch.id);
                    const targetSubtopic = ch.subtopics && ch.subtopics.length > 0 ? ch.subtopics[0] : null;
                    if (targetSubtopic) {
                      setSelectedSubtopic(targetSubtopic);
                      markAsRead(targetSubtopic.id);
                      setLastRead(targetSubtopic.id, ch.id);
                    }
                  }}
                >
                  <Image source={{ uri: thumb }} style={styles.chapterThumb} />

                  <View style={styles.chapterInfoCol}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <View style={styles.chapterNumBadge}>
                        <Text style={styles.chapterNumText}>{chNum}</Text>
                      </View>
                      <Text style={[styles.chapterItemTitle, { color: colors.text }]} numberOfLines={1}>
                        {loc(ch.title)}
                      </Text>
                    </View>

                    <Text style={[styles.chapterItemDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                      {ch.subtopics && ch.subtopics[0] ? loc(ch.subtopics[0].title) : loc(ch.title)}
                    </Text>

                    <View style={styles.chapterProgressFooter}>
                      <Text style={[styles.topicsCountMeta, { color: colors.textSecondary }]}>
                        {t('study.topicsCount', { count: subCount })}
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
        {(() => {
          const lastChId = progress.lastReadChapterId || (activeChapters[0] ? activeChapters[0].id : 'ch_official_1');
          const lastSubId = progress.lastReadSubtopicId;
          const currentCh = activeChapters.find(c => c.id === lastChId) || activeChapters[0];
          const chNum = currentCh ? getChapterNum(currentCh) : 1;

          const activeSubtopicIds = new Set(
            activeChapters.flatMap(c => (c.subtopics || []).map(s => s.id))
          );
          const validCompletedSubtopics = (progress.completedSubtopics || []).filter(id => activeSubtopicIds.has(id));
          const totalSubtopics = activeSubtopicIds.size || 14;
          const completedCount = validCompletedSubtopics.length;
          const currentProgressPercent = totalSubtopics > 0 ? Math.min(100, Math.round((completedCount / totalSubtopics) * 100)) : 0;

          const currentSubtopic = currentCh && currentCh.subtopics ? currentCh.subtopics.find(s => s.id === lastSubId) || currentCh.subtopics[0] : null;
          const currentLessonNum = Math.min(totalSubtopics, completedCount > 0 ? completedCount : 1);

          return (
            <Card 
              style={styles.continueReadingHero}
              onPress={() => {
                setActiveCategory('car');
                setSelectedChapter(null);
                setSelectedSubtopic(null);
              }}
            >
              <View style={styles.circularGaugeBox}>
                <View style={styles.ringOuter}>
                  <Text style={styles.ringPercentText}>{currentProgressPercent}%</Text>
                  <Text style={styles.ringCompleteText}>{t('study.complete')}</Text>
                </View>
              </View>

              <View style={styles.continueDetailsCol}>
                <Text style={styles.continueBadgeTag}>{completedCount > 0 ? t('study.continueReadingBadge') : 'START STUDYING'}</Text>
                <Text style={[styles.continueChapterTitle, { color: colors.text }]} numberOfLines={1}>
                  {currentCh ? loc(currentCh.title) : 'Japan Driving Handbook'}
                </Text>
                <Text style={[styles.continueChapterSub, { color: colors.textSecondary }]} numberOfLines={1}>
                  {currentSubtopic ? loc(currentSubtopic.title) : `Chapter ${chNum}`}
                </Text>

                <View style={styles.progressLineBg}>
                  <View style={[styles.progressLineFill, { width: `${currentProgressPercent}%` }]} />
                </View>
                <Text style={[styles.lessonSubText, { color: colors.textSecondary }]}>
                  {t('study.lessonOf', { current: currentLessonNum, total: totalSubtopics || 14 })}
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.continueActionBtn}
                onPress={() => {
                  setActiveCategory('car');
                  setSelectedChapter(null);
                  setSelectedSubtopic(null);
                }}
              >
                <Ionicons name="chevron-forward" size={20} color="#FFF" />
              </TouchableOpacity>
            </Card>
          );
        })()}

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
                <Text style={[styles.catBadgeRedText, { color: theme === 'dark' ? '#FF4D6D' : '#E31837' }]}>
                  {activeChapters.length} Chapters
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </Card>
          </View>
        </View>

        {/* Quick Tools Section */}
        {(() => {
          const bookmarksCount = activeChapters.filter(c => 
            bookmarkedChapters.includes(c.id) || bookmarkedPages.some(p => p === c.id || p.startsWith(c.id))
          ).length;
          const recentCount = recentChapters.filter(r => activeChapters.some(c => c.id === r.chapterId)).length;
          const downloadsCount = downloadedChapters.filter(id => activeChapters.some(c => c.id === id)).length;
          const notesCount = Object.keys(notes).length;

          return (
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>{t('study.quickTools')}</Text>
              <View style={styles.quickToolsGrid}>
                {/* Bookmarks */}
                <TouchableOpacity style={styles.quickToolBox} onPress={() => setQuickToolModal('bookmarks')}>
                  <View style={[
                    styles.quickToolIconBadge, 
                    { backgroundColor: theme === 'dark' ? 'rgba(227, 24, 55, 0.2)' : '#FFEBEE' }
                  ]}>
                    <Ionicons name="bookmark" size={22} color={theme === 'dark' ? '#FF4D6D' : '#E31837'} />
                    {bookmarksCount > 0 && (
                      <View style={[styles.toolBadgeCount, { backgroundColor: '#E31837' }]}>
                        <Text style={styles.toolBadgeCountText}>{bookmarksCount}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.quickToolLabel, { color: colors.text }]}>{t('study.bookmarks')}</Text>
                </TouchableOpacity>

                {/* Recent */}
                <TouchableOpacity style={styles.quickToolBox} onPress={() => setQuickToolModal('recent')}>
                  <View style={[
                    styles.quickToolIconBadge, 
                    { backgroundColor: theme === 'dark' ? 'rgba(255, 152, 0, 0.2)' : '#FFF3E0' }
                  ]}>
                    <Ionicons name="time" size={22} color={theme === 'dark' ? '#FFB74D' : '#FF9800'} />
                    {recentCount > 0 && (
                      <View style={[styles.toolBadgeCount, { backgroundColor: '#FF9800' }]}>
                        <Text style={styles.toolBadgeCountText}>{recentCount}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.quickToolLabel, { color: colors.text }]}>{t('study.recent')}</Text>
                </TouchableOpacity>

                {/* Downloads */}
                <TouchableOpacity style={styles.quickToolBox} onPress={() => setQuickToolModal('downloads')}>
                  <View style={[
                    styles.quickToolIconBadge, 
                    { backgroundColor: theme === 'dark' ? 'rgba(76, 175, 80, 0.2)' : '#E8F5E9' }
                  ]}>
                    <Ionicons name="download" size={22} color={theme === 'dark' ? '#81C784' : '#4CAF50'} />
                    {downloadsCount > 0 && (
                      <View style={[styles.toolBadgeCount, { backgroundColor: '#4CAF50' }]}>
                        <Text style={styles.toolBadgeCountText}>{downloadsCount}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.quickToolLabel, { color: colors.text }]}>{t('study.downloads')}</Text>
                </TouchableOpacity>

                {/* Notes */}
                <TouchableOpacity style={styles.quickToolBox} onPress={() => setQuickToolModal('notes')}>
                  <View style={[
                    styles.quickToolIconBadge, 
                    { backgroundColor: theme === 'dark' ? 'rgba(33, 150, 243, 0.2)' : '#E3F2FD' }
                  ]}>
                    <Ionicons name="journal" size={22} color={theme === 'dark' ? '#64B5F6' : '#2196F3'} />
                    {notesCount > 0 && (
                      <View style={[styles.toolBadgeCount, { backgroundColor: '#2196F3' }]}>
                        <Text style={styles.toolBadgeCountText}>{notesCount}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.quickToolLabel, { color: colors.text }]}>{t('study.notes')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}

        {/* Study Tip Banner */}
        <Card 
          style={[
            styles.studyTipCard,
            { 
              backgroundColor: theme === 'dark' ? '#18141F' : '#FFF5F5',
              borderColor: theme === 'dark' ? 'rgba(227, 24, 55, 0.3)' : '#FFE0E0'
            }
          ]}
          onPress={() => setIsTipsModalOpen(true)}
        >
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
          <TouchableOpacity 
            style={[styles.viewTipsBtn, { borderColor: theme === 'dark' ? '#FF4D6D' : '#E31837' }]}
            onPress={() => setIsTipsModalOpen(true)}
          >
            <Text style={[styles.viewTipsText, { color: theme === 'dark' ? '#FF4D6D' : '#E31837' }]}>{t('study.viewTips')}</Text>
            <Ionicons name="chevron-forward" size={14} color={theme === 'dark' ? '#FF4D6D' : '#E31837'} />
          </TouchableOpacity>
        </Card>

      </ScrollView>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* QUICK TOOLS MODAL (Bookmarks, Recent, Downloads, Notes)        */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={quickToolModal !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setQuickToolModal(null)}
      >
        <View style={styles.modalOverlayBg}>
          <View style={[styles.modalContentCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeaderRow, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {quickToolModal === 'bookmarks' && <Ionicons name="bookmark" size={22} color="#E31837" />}
                {quickToolModal === 'recent' && <Ionicons name="time" size={22} color="#FF9800" />}
                {quickToolModal === 'downloads' && <Ionicons name="download" size={22} color="#4CAF50" />}
                {quickToolModal === 'notes' && <Ionicons name="journal" size={22} color="#2196F3" />}
                <Text style={[styles.modalTitleText, { color: colors.text }]}>
                  {quickToolModal === 'bookmarks' && 'Bookmarked Chapters'}
                  {quickToolModal === 'recent' && 'Recently Read Chapters'}
                  {quickToolModal === 'downloads' && 'Offline Downloaded Chapters'}
                  {quickToolModal === 'notes' && 'Personal Study Notes'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setQuickToolModal(null)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Modal Body Scroll */}
            <ScrollView style={{ maxHeight: 450 }} contentContainerStyle={{ paddingVertical: 12, gap: 12 }}>
              
              {/* 1. BOOKMARKS MODAL BODY */}
              {quickToolModal === 'bookmarks' && (() => {
                const bookmarkedList = activeChapters.filter(c => 
                  bookmarkedChapters.includes(c.id) || bookmarkedPages.some(p => p.startsWith(c.id))
                );

                if (bookmarkedList.length === 0) {
                  return (
                    <View style={styles.emptyModalBox}>
                      <Ionicons name="bookmark-outline" size={48} color={colors.textSecondary} />
                      <Text style={[styles.emptyModalTitle, { color: colors.text }]}>No Bookmarks Saved Yet</Text>
                      <Text style={[styles.emptyModalSub, { color: colors.textSecondary }]}>
                        Tap the 🔖 bookmark icon while reading any chapter to save it here for quick access!
                      </Text>
                    </View>
                  );
                }

                return bookmarkedList.map((ch) => {
                  const chNum = getChapterNum(ch);
                  return (
                    <Card key={ch.id} style={styles.modalItemRow}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <View style={styles.modalBadge}>
                            <Text style={styles.modalBadgeText}>CH {chNum}</Text>
                          </View>
                          <Text style={[styles.modalItemTitle, { color: colors.text }]} numberOfLines={1}>
                            {loc(ch.title)}
                          </Text>
                        </View>
                        {ch.subtopics && ch.subtopics[0] && (
                          <Text style={{ fontSize: 12, color: colors.textSecondary }} numberOfLines={1}>
                            {loc(ch.subtopics[0].title)}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity 
                        style={[styles.modalActionBtn, { backgroundColor: colors.primary }]}
                        onPress={() => {
                          setSelectedChapter(ch);
                          addRecentChapter(ch.id);
                          if (ch.subtopics && ch.subtopics.length > 0) setSelectedSubtopic(ch.subtopics[0]);
                          setQuickToolModal(null);
                        }}
                      >
                        <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>Read</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={{ padding: 6 }} 
                        onPress={() => toggleBookmarkChapter(ch.id)}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.error} />
                      </TouchableOpacity>
                    </Card>
                  );
                });
              })()}

              {/* 2. RECENT MODAL BODY */}
              {quickToolModal === 'recent' && (() => {
                const recentList = recentChapters
                  .map(item => ({ item, ch: activeChapters.find(c => c.id === item.chapterId) }))
                  .filter(entry => entry.ch !== undefined);

                if (recentList.length === 0) {
                  return (
                    <View style={styles.emptyModalBox}>
                      <Ionicons name="time-outline" size={48} color={colors.textSecondary} />
                      <Text style={[styles.emptyModalTitle, { color: colors.text }]}>No Recent Reading History</Text>
                      <Text style={[styles.emptyModalSub, { color: colors.textSecondary }]}>
                        Open any chapter from the study list to start tracking your reading history automatically!
                      </Text>
                    </View>
                  );
                }

                return (
                  <>
                    {recentList.map(({ item, ch }) => {
                      if (!ch) return null;
                      const chNum = getChapterNum(ch);
                      const dateStr = new Date(item.accessedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      return (
                        <Card key={ch.id} style={styles.modalItemRow}>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <View style={styles.modalBadge}>
                                <Text style={styles.modalBadgeText}>CH {chNum}</Text>
                              </View>
                              <Text style={{ fontSize: 10, color: colors.textSecondary }}>Opened {dateStr}</Text>
                            </View>
                            <Text style={[styles.modalItemTitle, { color: colors.text }]} numberOfLines={1}>
                              {loc(ch.title)}
                            </Text>
                          </View>
                          <TouchableOpacity 
                            style={[styles.modalActionBtn, { backgroundColor: '#FF9800' }]}
                            onPress={() => {
                              setSelectedChapter(ch);
                              addRecentChapter(ch.id);
                              if (ch.subtopics && ch.subtopics.length > 0) setSelectedSubtopic(ch.subtopics[0]);
                              setQuickToolModal(null);
                            }}
                          >
                            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>Resume</Text>
                          </TouchableOpacity>
                        </Card>
                      );
                    })}

                    <TouchableOpacity 
                      style={[styles.clearBtn, { borderColor: colors.border }]} 
                      onPress={clearRecentChapters}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.error} />
                      <Text style={{ color: colors.error, fontSize: 12, fontWeight: '700' }}>Clear Recent History</Text>
                    </TouchableOpacity>
                  </>
                );
              })()}

              {/* 3. DOWNLOADS MODAL BODY */}
              {quickToolModal === 'downloads' && (() => {
                return activeChapters.map((ch) => {
                  const chNum = getChapterNum(ch);
                  const isDownloaded = downloadedChapters.includes(ch.id);
                  return (
                    <Card key={ch.id} style={styles.modalItemRow}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <View style={[styles.modalBadge, isDownloaded && { backgroundColor: '#4CAF50' }]}>
                            <Text style={styles.modalBadgeText}>CH {chNum}</Text>
                          </View>
                          {isDownloaded && (
                            <Text style={{ fontSize: 10, color: '#4CAF50', fontWeight: '800' }}>✓ Available Offline</Text>
                          )}
                        </View>
                        <Text style={[styles.modalItemTitle, { color: colors.text }]} numberOfLines={1}>
                          {loc(ch.title)}
                        </Text>
                      </View>

                      <TouchableOpacity 
                        style={[
                          styles.modalActionBtn, 
                          { backgroundColor: isDownloaded ? '#4CAF50' : colors.primary }
                        ]}
                        onPress={() => toggleDownloadChapter(ch.id)}
                      >
                        <Ionicons name={isDownloaded ? "checkmark-circle" : "download-outline"} size={16} color="#FFF" />
                        <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>
                          {isDownloaded ? 'Downloaded' : 'Download'}
                        </Text>
                      </TouchableOpacity>
                    </Card>
                  );
                });
              })()}

              {/* 4. NOTES MODAL BODY */}
              {quickToolModal === 'notes' && (() => {
                const noteEntries = Object.entries(notes);

                return (
                  <>
                    {/* Add / Edit Note Input Box */}
                    <Card style={{ padding: 12, gap: 8, backgroundColor: theme === 'dark' ? '#1E202B' : '#F5F5FA' }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>
                        {activeNoteChapterId ? `Editing Note for Chapter` : 'Write Study Note'}
                      </Text>
                      <TextInput 
                        style={[
                          styles.noteInput, 
                          { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }
                        ]}
                        placeholder="Write key notes, memory hooks, or exam tips here..."
                        placeholderTextColor={colors.textSecondary}
                        multiline={true}
                        numberOfLines={3}
                        value={noteInputText}
                        onChangeText={setNoteInputText}
                      />
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                        {activeNoteChapterId && (
                          <TouchableOpacity 
                            style={{ paddingHorizontal: 12, paddingVertical: 6 }} 
                            onPress={() => {
                              setActiveNoteChapterId(null);
                              setNoteInputText('');
                            }}
                          >
                            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Cancel</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity 
                          style={[styles.modalActionBtn, { backgroundColor: '#2196F3' }]}
                          onPress={() => {
                            const targetId = activeNoteChapterId || (selectedChapter ? selectedChapter.id : activeChapters[0]?.id);
                            if (targetId && noteInputText.trim()) {
                              saveChapterNote(targetId, noteInputText.trim());
                              setNoteInputText('');
                              setActiveNoteChapterId(null);
                            }
                          }}
                        >
                          <Ionicons name="save-outline" size={14} color="#FFF" />
                          <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>Save Note</Text>
                        </TouchableOpacity>
                      </View>
                    </Card>

                    {/* Notes List */}
                    {noteEntries.length === 0 ? (
                      <View style={styles.emptyModalBox}>
                        <Ionicons name="journal-outline" size={48} color={colors.textSecondary} />
                        <Text style={[styles.emptyModalTitle, { color: colors.text }]}>No Study Notes Created Yet</Text>
                        <Text style={[styles.emptyModalSub, { color: colors.textSecondary }]}>
                          Type a note in the box above to keep important study reminders for your driving exam!
                        </Text>
                      </View>
                    ) : (
                      noteEntries.map(([chId, noteText]) => {
                        const ch = activeChapters.find(c => c.id === chId);
                        const chNum = ch ? getChapterNum(ch) : 1;
                        return (
                          <Card key={chId} style={{ padding: 12, gap: 6 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <View style={[styles.modalBadge, { backgroundColor: '#2196F3' }]}>
                                  <Text style={styles.modalBadgeText}>CH {chNum}</Text>
                                </View>
                                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }} numberOfLines={1}>
                                  {ch ? loc(ch.title) : 'Custom Note'}
                                </Text>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <TouchableOpacity 
                                  onPress={() => {
                                    setActiveNoteChapterId(chId);
                                    setNoteInputText(noteText);
                                  }}
                                >
                                  <Ionicons name="create-outline" size={18} color={colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => deleteChapterNote(chId)}>
                                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                                </TouchableOpacity>
                              </View>
                            </View>
                            <Text style={{ fontSize: 13, color: colors.text, lineHeight: 18, backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F9F9FB', padding: 8, borderRadius: 8 }}>
                              {noteText}
                            </Text>
                          </Card>
                        );
                      })
                    )}
                  </>
                );
              })()}

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* EXAM STUDY TIPS & STRATEGIES POPUP MODAL                         */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={isTipsModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsTipsModalOpen(false)}
      >
        <View style={styles.modalOverlayBg}>
          <View style={[styles.modalContentCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border, paddingBottom: 24 }]}>
            <View style={[styles.modalHeaderRow, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="bulb" size={24} color="#FF9800" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalTitleText, { color: colors.text }]}>
                    Japanese Exam Study Tips & Strategy
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                    Essential rules to pass your Japanese driving test on the first attempt!
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsTipsModalOpen(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={{ paddingVertical: 12, gap: 12 }}>
              {[
                {
                  icon: 'shield-checkmark',
                  color: '#E31837',
                  title: '1. Pedestrian Crosswalk Strict Stop (歩行者優先)',
                  desc: 'If a pedestrian is waiting at a zebra crossing, you MUST come to a full stop. Failing to yield carries an automatic test fail and 2 penalty points under Article 38.'
                },
                {
                  icon: 'eye',
                  color: '#2196F3',
                  title: '2. Makikomi Blind-Spot Squeeze (巻き込み確認)',
                  desc: 'Before making any left turn, check mirror AND physically turn your head 45 degrees over left shoulder to prevent catching scooters or cyclists in your blind spot.'
                },
                {
                  icon: 'subway',
                  color: '#FF9800',
                  title: '3. Train Level Crossing Protocol (踏切)',
                  desc: 'Always stop completely before the line, roll down window, listen for bells, verify tracks clear, and check that space exists past the gate before crossing.'
                },
                {
                  icon: 'speedometer',
                  color: '#4CAF50',
                  title: '4. Speedometer & Distance Rules',
                  desc: 'Remember: 60 km/h is standard default for general roads, 100 km/h for expressways. Keep 2-second follow distance in dry weather, 4-second in wet weather.'
                },
                {
                  icon: 'construct',
                  color: '#9C27B0',
                  title: '5. S-Curve & Crank Narrow Turns (S字・クランク)',
                  desc: 'Approach at crawling speed (徐行). Keep front tires aligned wide along outer curb to prevent rear tires from clipping inner curb corners.'
                },
                {
                  icon: 'alert-circle',
                  color: '#FF5722',
                  title: '6. Zero Tolerance DUI & High Fines',
                  desc: 'Japan strictly enforces 0.03% BAC limit. Penalties include up to 5 years imprisonment or ¥1,000,000 fine — Passengers and alcohol servers are also penalized!'
                }
              ].map((tip, idx) => (
                <Card key={idx} style={{ padding: 14, gap: 8, flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${tip.color}15`, justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name={tip.icon as any} size={22} color={tip.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 4 }}>
                      {tip.title}
                    </Text>
                    <Text style={{ fontSize: 12.5, color: colors.textSecondary, lineHeight: 18 }}>
                      {tip.desc}
                    </Text>
                  </View>
                </Card>
              ))}
            </ScrollView>

            <TouchableOpacity 
              style={[styles.modalActionBtn, { backgroundColor: colors.primary, justifyContent: 'center', marginTop: 8, paddingVertical: 12 }]}
              onPress={() => setIsTipsModalOpen(false)}
            >
              <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '800' }}>Got It! Back to Study</Text>
            </TouchableOpacity>
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
    position: 'relative',
  },
  toolBadgeCount: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  toolBadgeCountText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
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
    width: '72%',
  },
  categoryHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
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

  // Quick Tools Modal Styles
  modalOverlayBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContentCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 30,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  modalTitleText: {
    fontSize: 16.5,
    fontWeight: '900',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 20,
  },
  modalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    gap: 10,
  },
  modalBadge: {
    backgroundColor: '#E31837',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modalBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  modalItemTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  emptyModalBox: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    gap: 8,
  },
  emptyModalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyModalSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  noteInput: {
    fontSize: 13,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    textAlignVertical: 'top',
  },
});
