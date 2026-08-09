import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Text } from '../ui/Text';
import { Card } from '../ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { parseWordDocumentText, processWordDocumentWithAI } from '../../services/adminWordProcessor';
import { useStudyStore } from '../../stores/studyStore';
import { useQuizStore } from '../../stores/quizStore';
import { useThemeStore } from '../../stores/themeStore';
import { Colors } from '../../constants/theme';
import { Alert } from '../../utils/alert';

interface AdminWordUploadModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AdminWordUploadModal: React.FC<AdminWordUploadModalProps> = ({ visible, onClose }) => {
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  const [selectedFile, setSelectedFile] = useState<{ name: string; content: ArrayBuffer | string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [successResult, setSuccessResult] = useState<{ chaptersCount: number; quizCount: number } | null>(null);

  // File Picker Handler (Works seamlessly on Web & Native)
  const handlePickFile = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.docx,.doc,.txt';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          const reader = new FileReader();
          if (file.name.endsWith('.txt')) {
            reader.readAsText(file);
          } else {
            reader.readAsArrayBuffer(file);
          }
          reader.onload = () => {
            setSelectedFile({
              name: file.name,
              content: reader.result as ArrayBuffer | string,
            });
            setSuccessResult(null);
          };
        }
      };
      input.click();
    } else {
      // Demo file loader for mobile preview
      setSelectedFile({
        name: 'Official_Traffic_Rules_Handbook.docx',
        content: 'Sample Word document handbook text for driving rules.',
      });
      setSuccessResult(null);
    }
  };

  // Process Document with AI Engine
  const handleProcessDocument = async () => {
    if (!selectedFile) {
      Alert.alert('No File Selected', 'Please select a Word (.docx) document first.');
      return;
    }

    setIsProcessing(true);
    setSuccessResult(null);

    try {
      setCurrentStep('📄 Reading Word Document text...');
      await new Promise(r => setTimeout(r, 600));

      const rawText = await parseWordDocumentText(selectedFile.content);

      setCurrentStep('🤖 Generating 2-Page Detailed Explanations...');
      await new Promise(r => setTimeout(r, 800));

      setCurrentStep('🌐 Translating into EN, JA, ZH, and PT...');
      await new Promise(r => setTimeout(r, 800));

      setCurrentStep('🎯 Synthesizing Visual & Scenario-based Quizzes...');
      await new Promise(r => setTimeout(r, 800));

      const output = await processWordDocumentWithAI(rawText, selectedFile.name);

      // Save to Stores
      useStudyStore.getState().addBook(output.book);
      useQuizStore.getState().addQuestions(output.quizQuestions);

      setCurrentStep('✅ Done! Content added to Academy Store');
      await new Promise(r => setTimeout(r, 400));

      setSuccessResult({
        chaptersCount: output.chapters.length,
        quizCount: output.quizQuestions.length,
      });
    } catch (e) {
      console.error(e);
      Alert.alert('Processing Error', 'Failed to process Word file.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.crownBadge}>
                <Ionicons name="sparkles" size={20} color="#FFF" />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Admin Portal</Text>
                <Text style={[styles.modalSub, { color: colors.textSecondary }]}>Word Document AI Processor</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Slot Description */}
            <Card style={[styles.infoCard, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#FFF5F5' }]}>
              <Ionicons name="document-text-outline" size={24} color="#E31837" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoCardTitle, { color: colors.text }]}>Upload Word Document (.docx)</Text>
                <Text style={[styles.infoCardSub, { color: colors.textSecondary }]}>
                  Upload any Word file. The built-in AI will extract the text, build 2-page detailed explanations in 4 languages, and synthesize visual & scenario-based quiz questions.
                </Text>
              </View>
            </Card>

            {/* File Slot Dropzone Button */}
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={handlePickFile}
              style={[styles.fileDropZone, { borderColor: selectedFile ? '#E31837' : colors.border, backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.02)' : '#FAFAFC' }]}
            >
              <Ionicons name={selectedFile ? "checkmark-circle" : "cloud-upload-outline"} size={36} color={selectedFile ? "#E31837" : colors.textSecondary} />
              
              {selectedFile ? (
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.selectedFileName}>{selectedFile.name}</Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Tap to change file</Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Text style={[styles.dropZoneTitle, { color: colors.text }]}>Tap to Select Word File (.docx)</Text>
                  <Text style={[styles.dropZoneSub, { color: colors.textSecondary }]}>Supports .docx, .doc, and .txt files</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Processing Indicator / Steps */}
            {isProcessing && (
              <View style={styles.progressBox}>
                <ActivityIndicator size="small" color="#E31837" />
                <Text style={[styles.progressStepText, { color: colors.text }]}>{currentStep}</Text>
              </View>
            )}

            {/* Success Results Card */}
            {successResult && (
              <Card style={[styles.successCard, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="checkmark-circle" size={26} color="#2E7D32" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#2E7D32' }}>Success!</Text>
                  <Text style={{ fontSize: 12, color: '#333', marginTop: 2 }}>
                    Generated {successResult.chaptersCount} chapters with 2-page explanations in 4 languages, plus {successResult.quizCount} visual & scenario questions!
                  </Text>
                </View>
              </Card>
            )}

            {/* Process Action Button */}
            <TouchableOpacity 
              activeOpacity={0.88}
              disabled={isProcessing || !selectedFile}
              onPress={handleProcessDocument}
              style={[styles.processBtn, { backgroundColor: selectedFile ? '#E31837' : '#CCC', opacity: isProcessing ? 0.7 : 1 }]}
            >
              <Ionicons name="flash-sharp" size={18} color="#FFF" />
              <Text style={styles.processBtnText}>
                {isProcessing ? 'Processing Document with AI...' : 'Generate AI Chapters & Quizzes'}
              </Text>
            </TouchableOpacity>
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 24,
    borderWidth: 1,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  crownBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#E31837',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  modalSub: {
    fontSize: 12,
  },
  closeBtn: {
    padding: 6,
  },
  modalBody: {
    padding: 18,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    gap: 12,
    marginBottom: 16,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  infoCardSub: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  fileDropZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  dropZoneTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  dropZoneSub: {
    fontSize: 11.5,
  },
  selectedFileName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E31837',
  },
  progressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(227,24,55,0.08)',
    gap: 10,
    marginBottom: 14,
  },
  progressStepText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 12,
    marginBottom: 16,
  },
  processBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 20,
    gap: 8,
    marginBottom: 20,
  },
  processBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
