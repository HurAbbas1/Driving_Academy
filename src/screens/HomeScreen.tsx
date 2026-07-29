import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Text, SafeAreaView, ScrollView, Platform, ImageBackground, TouchableOpacity, Image, Pressable, useWindowDimensions, FlatList, Animated } from 'react-native';
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
  const { chapters, progress, books } = useStudyStore();
  const setSelectedBookId = useStudyStore((state) => state.setSelectedBookId);

  const streak = profile?.streak?.current ?? 0;
  const username = profile?.displayName ?? 'Learner';

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [activeIndex, setActiveIndex] = useState(0);

  const customFeaturedSlides = useMemo(() => [
    {
      id: 'feat_japan_traffic_signs',
      title: { en: 'Master Japanese Traffic Signs', ja: '日本の道路標識をマスターしよう', zh: '掌握日本交通标志', pt: 'Domine os Sinais de Trânsito do Japão' },
      subtitle: { en: 'Stop signs, speed limits & warning indicators', ja: '一時停止、速度制限、警告標識', zh: '停止标志、限速与警告标志', pt: 'Sinais de paragem e limites de velocidade' },
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&q=80',
      targetBookId: 'book_traffic_rules_full',
      badge: 'ESSENTIAL',
    },
    {
      id: 'feat_expressway_rules',
      title: { en: 'Expressway & ETC Toll Gate Rules', ja: '高速道路とETC料金所規則', zh: '高速公路与ETC收费站规则', pt: 'Regras de Vias Rápidas e Portagens ETC' },
      subtitle: { en: 'Speed controls, merging lanes & breakdown safety', ja: '速度規制、車線合流、故障安全策', zh: '速度控制、车道汇入与故障安全', pt: 'Limites de velocidade e manobras' },
      image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1000&q=80',
      targetBookId: 'book_rules_of_road_part2',
      badge: 'PRO GUIDE',
    },
    {
      id: 'feat_safety_regulations',
      title: { en: 'Zero Tolerance Traffic Laws', ja: '交通安全ゼロ容認ルール', zh: '零容忍交通安全法规', pt: 'Leis de Trânsito de Tolerância Zero' },
      subtitle: { en: 'DUI laws, phone restrictions & emergency contacts', ja: '飲酒運転禁止、スマホ規制、緊急通報110/119', zh: '严禁酒驾、手机限制与紧急电话', pt: 'Regras sobre álcool e telemóvel' },
      image: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?w=1000&q=80',
      targetBookId: 'book_traffic_rules_full',
      badge: 'SAFETY',
    }
  ], []);

  const featuredQueue = useMemo(() => {
    const queue: any[] = [];
    const bookList = books || [];
    
    // Interleave custom slides and book covers
    customFeaturedSlides.forEach((slide, idx) => {
      queue.push(slide);
      if (bookList[idx]) {
        queue.push({
          id: 'book-' + bookList[idx].id,
          title: bookList[idx].title,
          subtitle: { en: 'Tap to open Official Study Handbook', ja: 'タップして公式学習ハンドブックを開く', zh: '点击打开官方学习手册', pt: 'Toque para abrir o Manual Oficial' },
          image: bookList[idx].coverImage || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800',
          targetBookId: bookList[idx].id,
          badge: 'HANDBOOK',
        });
      }
    });

    // Append any remaining books
    for (let i = customFeaturedSlides.length; i < bookList.length; i++) {
      queue.push({
        id: 'book-' + bookList[i].id,
        title: bookList[i].title,
        subtitle: { en: 'Tap to open Official Study Handbook', ja: 'タップして公式学習ハンドブックを開く', zh: '点击打开官方学习手册', pt: 'Toque para abrir o Manual Oficial' },
        image: bookList[i].coverImage || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800',
        targetBookId: bookList[i].id,
        badge: 'HANDBOOK',
      });
    }

    return queue;
  }, [books, customFeaturedSlides]);

  useEffect(() => {
    if (!featuredQueue || featuredQueue.length <= 1) return;
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0.2,
        duration: 350,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        setActiveIndex((prev) => (prev + 1) % featuredQueue.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 450,
          useNativeDriver: Platform.OS !== 'web',
        }).start();
      });
    }, 3800);
    return () => clearInterval(interval);
  }, [featuredQueue]);


  const currentLangLoc = useLanguageStore((state) => state.language);

  const loc = (field: any): string => {
    if (!field) return '';
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        if (typeof parsed === 'object' && parsed !== null) {
          return loc(parsed);
        }
      } catch (e) {
        const translated = t(field);
        if (translated && translated !== field) return translated;
        const lowerField = field.trim().toLowerCase();
        if (currentLangLoc === 'zh') {
           if (lowerField === 'rules of the road') return '道路规则';
           if (lowerField === 'federal rules of the road') return '联邦交通规则';
           if (lowerField === 'traffic rules') return '交通法规';
        }
        if (currentLangLoc === 'ja') {
           if (lowerField === 'rules of the road') return '道路交通法';
           if (lowerField === 'federal rules of the road') return '連邦交通法';
           if (lowerField === 'traffic rules') return '交通ルール';
        }
        if (currentLangLoc === 'pt') {
           if (lowerField === 'rules of the road') return 'Regras da Estrada';
           if (lowerField === 'federal rules of the road') return 'Regras Federais';
           if (lowerField === 'traffic rules') return 'Regras de Trânsito';
        }
      }
      return field;
    }
    if (typeof field === 'object') {
      const val = field[currentLangLoc] ?? field.en ?? Object.values(field)[0] ?? '';
      if (typeof val === 'object') {
        const valInner = val[currentLangLoc] ?? val.en ?? Object.values(val)[0] ?? '';
        if (typeof valInner === 'object') return JSON.stringify(valInner);
        return String(valInner);
      }
      return String(val);
    }
    return String(field);
  };

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

        

        
        
        {/* Single Box Smooth Auto-Transition Featured Hero Box (Mixed Custom Slides & Book Covers) */}
        {featuredQueue && featuredQueue.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: 20 }}>
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => {
                const currentSlide = featuredQueue[activeIndex % featuredQueue.length];
                if (currentSlide) {
                  if (currentSlide.targetBookId) {
                    setSelectedBookId(currentSlide.targetBookId);
                  }
                  if (onNavigateToTab) onNavigateToTab('study');
                }
              }}
              style={{ 
                height: 190, 
                borderRadius: 24, 
                overflow: 'hidden', 
                backgroundColor: colors.backgroundElement,
                position: 'relative',
                ...Platform.select({
                  web: {
                    boxShadow: theme === 'dark' ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.08)',
                  } as any,
                  default: {
                    shadowColor: '#000',
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    elevation: 4,
                  }
                })
              }}
            >
              {/* Background Image with Smooth Fade Animation */}
              <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
                <Image 
                  source={{ uri: featuredQueue[activeIndex % featuredQueue.length]?.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800' }} 
                  style={StyleSheet.absoluteFill} 
                  resizeMode="cover" 
                />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.52)' }]} />
              </Animated.View>

              {/* Card Content Overlay */}
              <View style={{ padding: 20, flex: 1, justifyContent: 'space-between', zIndex: 2 }}>
                <View style={{ backgroundColor: `${colors.primary}E0`, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>
                    {featuredQueue[activeIndex % featuredQueue.length]?.badge || 'FEATURED'}
                  </Text>
                </View>

                <Animated.View style={{ opacity: fadeAnim }}>
                  <Text style={{ fontSize: 22, fontWeight: '900', color: '#FFFFFF', marginBottom: 4 }} numberOfLines={1}>
                    {loc(featuredQueue[activeIndex % featuredQueue.length]?.title)}
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255, 255, 255, 0.85)' }} numberOfLines={1}>
                    {loc(featuredQueue[activeIndex % featuredQueue.length]?.subtitle) || t('home.startLearning')}
                  </Text>
                </Animated.View>

                {/* Pagination Dots Indicator */}
                {featuredQueue.length > 1 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 8, gap: 6 }}>
                    {featuredQueue.map((item, idx) => (
                      <TouchableOpacity
                        key={'dot-' + item.id + '-' + idx}
                        onPress={() => setActiveIndex(idx)}
                        style={{
                          width: idx === (activeIndex % featuredQueue.length) ? 20 : 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: idx === (activeIndex % featuredQueue.length) ? colors.primary : 'rgba(255, 255, 255, 0.5)',
                        }}
                      />
                    ))}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Stable Manual Scrollable Handbooks Cards (Users scroll left/right) */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 16, paddingHorizontal: 16 }}>
            {t('home.featuredHandbooks')}
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
          >
             {books.map((book) => (
                 <View key={'card-' + book.id} style={{ width: 220 }}>
                   <Card 
                     variant="glass" 
                     onPress={() => {
                       setSelectedBookId(book.id);
                       if (onNavigateToTab) {
                           onNavigateToTab('study');
                       }
                     }} 
                     style={{ height: 160, padding: 0, justifyContent: 'space-between', margin: 0, overflow: 'hidden', borderRadius: 20 }}
                   >
                     {book.coverImage ? (
                       <Image source={{ uri: book.coverImage }} style={[StyleSheet.absoluteFill]} resizeMode="cover" />
                     ) : null}
                     <View style={{ padding: 16, flex: 1, justifyContent: 'space-between', backgroundColor: book.coverImage ? 'rgba(0,0,0,0.4)' : 'transparent' }}>
                       <View>
                          <View style={{ backgroundColor: `${colors.primary}40`, alignSelf: 'flex-start', padding: 8, borderRadius: 12 }}>
                            <Ionicons name={book.icon as any || 'book'} size={20} color="#FFF" />
                          </View>
                          <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff', marginTop: 10 }} numberOfLines={2}>{loc(book.title)}</Text>
                       </View>
                       <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{ color: '#eee', fontSize: 13, fontWeight: '600' }}>{t('study.chaptersCount', { count: book.chapters.length })}</Text>
                          <Ionicons name="arrow-forward-circle" size={24} color="#eee" />
                       </View>
                     </View>
                   </Card>
                 </View>
             ))}
          </ScrollView>
        </View>

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

          

          {/* Huge Call to Action Row */}
          <TouchableOpacity activeOpacity={0.9} onPress={() => onNavigateToTab?.('study')} style={{ marginTop: 8 }}>
            <View style={[styles.ctaContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.border, borderWidth: 1 }]}>
               <View style={styles.ctaIconBg}>
                  <Ionicons name="car-sport" size={32} color={colors.primary} />
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
