import React, { useState, useRef, useContext } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Switch,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import SignatureScreen from 'react-native-signature-canvas';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../theme/ThemeContext';

export default function AddEntryScreen({ navigation }: any) {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const { width } = useWindowDimensions();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isHandwritten, setIsHandwritten] = useState(false);
  const [loading, setLoading] = useState(false);
  const [drawingModalVisible, setDrawingModalVisible] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const signatureRef = useRef<any>(null);

  const isDesktop = Platform.OS === 'web' && width >= 768;

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setIsHandwritten(false);
    }
  };

  const handleSignature = async (signature: string) => {
    try {
      const base64Data = signature.split(',')[1] || signature;
      const path = `${FileSystem.cacheDirectory}sign_${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(path, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setImageUri(path);
      setIsHandwritten(true);
      setDrawingModalVisible(false);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', `Failed to save drawing: ${e?.message || e}`);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please provide an entry title.');
      return;
    }
    if (!content.trim() && !imageUri) {
      Alert.alert('Error', 'Please provide either text content or an image/drawing.');
      return;
    }

    try {
      setLoading(true);
      let data: any;
      let headers = {};

      if (imageUri) {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('isHandwritten', String(isHandwritten));

        const filename = imageUri.split('/').pop() || 'upload.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('image', {
          uri: imageUri,
          name: filename,
          type,
        } as any);

        data = formData;
        headers = { 'Content-Type': 'multipart/form-data' };
      } else {
        data = { title, content, isHandwritten };
      }

      await api.post('/diary', data, { headers });
      navigation.goBack();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save the entry.');
      setLoading(false);
    }
  };

  const calculateTotal = (text: string) => {
    const matches = text.match(/-?\d+(\.\d+)?/g);
    if (!matches) return 0;
    return matches.reduce((acc, val) => acc + parseFloat(val), 0);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const total = calculateTotal(content);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDesktop ? (isDarkMode ? '#0f172a' : '#f0f4f8') : theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.webCard, isDesktop && styles.desktopCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Editor Header Navigation */}
          <View style={[styles.editorHeader, { borderBottomColor: theme.border }]}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={[styles.backButton, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={20} color={theme.text} />
              </TouchableOpacity>
              <View>
                <Text style={[styles.headerTitle, { color: theme.text }]}>New Diary Entry</Text>
                <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
                  Write your thoughts, upload media, or sketch drawings.
                </Text>
              </View>
            </View>

            {isDesktop && (
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: theme.border }]}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={[styles.cancelBtnText, { color: theme.textMuted }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSave} disabled={loading} activeOpacity={0.85}>
                  <LinearGradient
                    colors={['#1a73e8', '#2563eb']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.desktopSaveBtn}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={18} color="#fff" />
                        <Text style={styles.saveBtnText}>Save Entry</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Form Content Area */}
          <View style={styles.formBody}>
            {/* Toolbar Buttons */}
            <View style={styles.toolbarRow}>
              <TouchableOpacity
                style={[styles.toolChip, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={pickImage}
              >
                <Ionicons name="image-outline" size={18} color={theme.primary} />
                <Text style={[styles.toolChipText, { color: theme.primary }]}>
                  {imageUri && !isHandwritten ? 'Change Photo' : '+ Add Photo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toolChip, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={() => setDrawingModalVisible(true)}
              >
                <Ionicons name="pencil-outline" size={18} color={theme.primary} />
                <Text style={[styles.toolChipText, { color: theme.primary }]}>+ Draw Note</Text>
              </TouchableOpacity>

              <View style={[styles.switchChip, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Text style={[styles.switchChipText, { color: theme.textMuted }]}>Sketch Note?</Text>
                <Switch
                  value={isHandwritten}
                  onValueChange={setIsHandwritten}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor={isHandwritten ? '#fff' : '#f4f3f4'}
                />
              </View>
            </View>

            {/* Image / Drawing Preview */}
            {imageUri && (
              <View style={[styles.imagePreviewWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeImgBtn} onPress={() => setImageUri(null)}>
                  <Ionicons name="close" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* Title Input */}
            <TextInput
              style={[styles.titleInput, { color: theme.text, borderBottomColor: theme.border }]}
              placeholder="Entry Title..."
              placeholderTextColor={theme.textLight}
              value={title}
              onChangeText={setTitle}
            />

            {/* Content Textarea */}
            <TextInput
              style={[styles.contentInput, { color: theme.text }]}
              placeholder="Start writing your thoughts, memories, or daily reflections here..."
              placeholderTextColor={theme.textLight}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />

            {/* Live Word & Character Counter */}
            <View style={styles.editorFooterRow}>
              <Text style={[styles.counterText, { color: theme.textMuted }]}>
                {wordCount} {wordCount === 1 ? 'word' : 'words'} • {charCount} characters
              </Text>
            </View>

            {/* Auto-calculated Total Badge */}
            {total !== 0 && (
              <View style={[styles.totalCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Text style={[styles.totalLabel, { color: theme.textMuted }]}>Auto-calculated Total:</Text>
                <Text style={[styles.totalValue, { color: theme.primary }]}>
                  {total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </Text>
              </View>
            )}
          </View>

          {/* Mobile Bottom Save Button */}
          {!isDesktop && (
            <View style={[styles.mobileFooter, { borderTopColor: theme.border }]}>
              <TouchableOpacity onPress={handleSave} disabled={loading} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#1a73e8', '#2563eb']}
                  style={styles.mobileSaveBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Entry</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Drawing Canvas Modal */}
      <Modal visible={drawingModalVisible} animationType="fade" onRequestClose={() => setDrawingModalVisible(false)}>
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
            <TouchableOpacity onPress={() => { setDrawingModalVisible(false); setIsErasing(false); }}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Draw Note Canvas</Text>
            <TouchableOpacity onPress={() => { signatureRef.current?.readSignature(); }}>
              <Text style={[styles.modalSaveText, { color: theme.primary }]}>Save Drawing</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.drawingToolbar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => signatureRef.current?.undo()} style={styles.toolbarButton}>
              <Ionicons name="arrow-undo-outline" size={20} color={theme.textMuted} />
              <Text style={[styles.toolbarText, { color: theme.textMuted }]}>Undo</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => signatureRef.current?.clearSignature()} style={styles.toolbarButton}>
              <Ionicons name="trash-outline" size={20} color={theme.danger} />
              <Text style={[styles.toolbarText, { color: theme.danger }]}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setIsErasing(false);
                signatureRef.current?.draw();
                signatureRef.current?.changePenSize(2, 4);
              }}
              style={[styles.toolbarButton, !isErasing && { backgroundColor: theme.primaryLight }]}
            >
              <Ionicons name="pencil-outline" size={20} color={!isErasing ? theme.primary : theme.textMuted} />
              <Text style={[styles.toolbarText, !isErasing ? { color: theme.primary, fontWeight: 'bold' } : { color: theme.textMuted }]}>
                Pen
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setIsErasing(true);
                signatureRef.current?.erase();
                signatureRef.current?.changePenSize(15, 25);
              }}
              style={[styles.toolbarButton, isErasing && { backgroundColor: theme.primaryLight }]}
            >
              <Ionicons name="backspace-outline" size={20} color={isErasing ? theme.primary : theme.textMuted} />
              <Text style={[styles.toolbarText, isErasing ? { color: theme.primary, fontWeight: 'bold' } : { color: theme.textMuted }]}>
                Erase
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
            <SignatureScreen
              ref={signatureRef}
              onOK={handleSignature}
              onEmpty={() => Alert.alert('Error', 'Please draw something before saving.')}
              descriptionText=""
              clearText="Clear"
              confirmText="Save Drawing"
              webStyle={`.m-signature-pad--footer { display: none; margin: 0px; }
                         .m-signature-pad {box-shadow: none; border: none; margin: 0;} 
                         .m-signature-pad--body {border: none;}`}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: Platform.OS === 'web' ? 24 : 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webCard: {
    width: '100%',
    flex: 1,
  },
  desktopCard: {
    maxWidth: 920,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
    marginVertical: 12,
  },

  /* ── Header ── */
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  desktopSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },

  /* ── Form Body ── */
  formBody: {
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  toolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  toolChipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  switchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  switchChipText: {
    fontSize: 14,
    fontWeight: '600',
  },

  /* ── Image Preview ── */
  imagePreviewWrapper: {
    position: 'relative',
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 320,
    resizeMode: 'contain',
  },
  removeImgBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Inputs ── */
  titleInput: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 20,
    borderBottomWidth: 1.5,
    paddingBottom: 12,
  },
  contentInput: {
    minHeight: 280,
    fontSize: 17,
    lineHeight: 28,
  },
  editorFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    marginBottom: 16,
  },
  counterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  totalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
  },

  /* ── Mobile Footer ── */
  mobileFooter: {
    padding: 20,
    borderTopWidth: 1,
  },
  mobileSaveBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  /* ── Modal ── */
  modalContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalCancelText: {
    fontSize: 15,
    color: '#e74c3c',
    fontWeight: '600',
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '700',
  },
  drawingToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  toolbarButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  toolbarText: {
    fontSize: 12,
    marginTop: 4,
  },
});
