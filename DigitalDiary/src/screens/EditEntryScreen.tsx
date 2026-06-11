import React, { useState, useRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView, Image, Switch, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import SignatureScreen from 'react-native-signature-canvas';
import api, { BASE_URL } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../theme/ThemeContext';

export default function EditEntryScreen({ route, navigation }: any) {
  const { theme } = React.useContext(ThemeContext);
  const { entry } = route.params || {};
  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || '');
  const [imageUri, setImageUri] = useState<string | null>(entry?.image ? `${BASE_URL}${entry.image}` : null);
  const [isHandwritten, setIsHandwritten] = useState(entry?.isHandwritten || false);
  const [mood, setMood] = useState(entry?.mood || '');
  const [tags, setTags] = useState(entry?.tags ? entry.tags.join(', ') : '');
  const [loading, setLoading] = useState(false);
  const [drawingModalVisible, setDrawingModalVisible] = useState(false);
  const [initialSignature, setInitialSignature] = useState<string | null>(null);
  const [isErasing, setIsErasing] = useState(false);
  const signatureRef = useRef<any>(null);

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

  const openDrawingModal = async () => {
    if (imageUri && isHandwritten) {
      try {
        setLoading(true);
        let base64 = '';
        if (imageUri.startsWith('file://')) {
          base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
        } else if (imageUri.startsWith('http')) {
          const localPath = `${FileSystem.cacheDirectory}temp_download_${Date.now()}.png`;
          const result = await FileSystem.downloadAsync(imageUri, localPath);
          base64 = await FileSystem.readAsStringAsync(result.uri, { encoding: FileSystem.EncodingType.Base64 });
        }
        if (base64) {
          setInitialSignature(`data:image/png;base64,${base64}`);
        }
      } catch (e) {
        console.error("Failed to load signature to canvas:", e);
      } finally {
        setLoading(false);
      }
    } else {
      setInitialSignature(null);
    }
    setDrawingModalVisible(true);
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
      Alert.alert('Error', 'Please provide a title.');
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

      // If user selected a new local image, the URI will start with 'file://'
      const isNewImage = imageUri && imageUri.startsWith('file://');

      if (isNewImage) {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('isHandwritten', String(isHandwritten));
        formData.append('mood', mood);
        formData.append('tags', tags);
        
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
        data = { title, content, isHandwritten, mood, tags };
      }

      await api.put(`/diary/${entry._id}`, data, { headers });
      navigation.navigate('MainTabs');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update the entry.');
      setLoading(false);
    }
  };

  const calculateTotal = (text: string) => {
    const matches = text.match(/-?\d+(\.\d+)?/g);
    if (!matches) return 0;
    return matches.reduce((acc, val) => acc + parseFloat(val), 0);
  };

  const total = calculateTotal(content);

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {imageUri && (
          <View style={[styles.imageContainer, { backgroundColor: theme.surface }]}>
            <Image source={{ uri: imageUri }} style={[styles.previewImage, { backgroundColor: theme.surface }]} />
            <TouchableOpacity style={styles.removeImageButton} onPress={() => setImageUri(null)}>
              <Text style={styles.removeImageText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={[styles.addImageButton, { backgroundColor: theme.primaryLight, borderColor: theme.border }]} onPress={pickImage}>
            <Text style={[styles.addImageText, { color: theme.primary }]}>{imageUri && !isHandwritten ? 'Change Image' : '+ Add Photo'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.addImageButton, { backgroundColor: theme.primaryLight, borderColor: theme.border }]} onPress={openDrawingModal}>
            <Text style={[styles.addImageText, { color: theme.primary }]}>{isHandwritten && imageUri ? 'Edit Draw Note' : '+ Draw Note'}</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={[styles.titleInput, { color: theme.text, borderBottomColor: theme.border }]}
          placeholder="Entry Title"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor={theme.textLight}
        />

        <View style={styles.moodTagsContainer}>
          <Text style={[styles.sectionLabel, { color: theme.text }]}>Mood</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodScroll}>
            {['😊', '😔', '😡', '😌', '🤔', '💼', '🤒', '🎉'].map(emoji => (
              <TouchableOpacity 
                key={emoji} 
                style={[
                  styles.moodButton, 
                  mood === emoji && { backgroundColor: theme.primary, borderColor: theme.primary }
                ]}
                onPress={() => setMood(emoji)}
              >
                <Text style={styles.moodEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.sectionLabel, { color: theme.text, marginTop: 15 }]}>Tags</Text>
          <TextInput
            style={[styles.titleInput, { color: theme.text, borderBottomColor: theme.border, fontSize: 16 }]}
            placeholder="e.g. personal, work (comma separated)"
            placeholderTextColor={theme.textLight}
            value={tags}
            onChangeText={setTags}
          />
        </View>

        <View style={[styles.switchContainer, { backgroundColor: theme.surface }]}>
          <Text style={[styles.switchLabel, { color: theme.text }]}>Is this a handwritten note?</Text>
          <Switch
            value={isHandwritten}
            onValueChange={setIsHandwritten}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={isHandwritten ? theme.background : "#f4f3f4"}
          />
        </View>
        
        <TextInput
          style={[styles.contentInput, { color: theme.text }]}
          placeholder="Write your thoughts here..."
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          placeholderTextColor={theme.textLight}
        />
      </ScrollView>

      {total !== 0 && (
        <View style={[styles.totalContainer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <Text style={[styles.totalLabel, { color: theme.textMuted }]}>Auto-calculated Total:</Text>
          <Text style={[styles.totalValue, { color: theme.primary }]}>{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
        </View>
      )}

      <View style={[styles.buttonContainer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <TouchableOpacity onPress={handleSave} disabled={loading} activeOpacity={0.8}>
          <LinearGradient
            colors={['#208AEF', '#1560A6']}
            style={styles.saveButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Update Entry</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Modal visible={drawingModalVisible} animationType="slide" onRequestClose={() => setDrawingModalVisible(false)}>
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => { setDrawingModalVisible(false); setIsErasing(false); }}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Draw Note</Text>
            <TouchableOpacity onPress={() => { signatureRef.current?.readSignature(); }}>
              <Text style={{ ...styles.modalCloseText, color: theme.primary }}>Save</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.drawingToolbar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => signatureRef.current?.undo()} style={styles.toolbarButton}>
              <Ionicons name="arrow-undo-outline" size={20} color={theme.textMuted} />
              <Text style={[styles.toolbarText, { color: theme.textMuted }]}>Undo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => signatureRef.current?.clearSignature()} style={styles.toolbarButton}>
              <Ionicons name="trash-outline" size={20} color={theme.danger} />
              <Text style={[styles.toolbarText, { color: theme.danger }]}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { 
              setIsErasing(false); 
              signatureRef.current?.draw(); 
              signatureRef.current?.changePenSize(1, 3);
            }} style={[styles.toolbarButton, !isErasing && { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="pencil-outline" size={20} color={!isErasing ? theme.primary : theme.textMuted} />
              <Text style={[styles.toolbarText, !isErasing ? { color: theme.primary, fontWeight: 'bold' } : { color: theme.textMuted }]}>Pen</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { 
              setIsErasing(true); 
              signatureRef.current?.erase(); 
              signatureRef.current?.changePenSize(15, 25);
            }} style={[styles.toolbarButton, isErasing && { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="backspace-outline" size={20} color={isErasing ? theme.primary : theme.textMuted} />
              <Text style={[styles.toolbarText, isErasing ? { color: theme.primary, fontWeight: 'bold' } : { color: theme.textMuted }]}>Erase</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
            {drawingModalVisible && (
              <SignatureScreen
                ref={signatureRef}
                dataURL={initialSignature || undefined}
                onOK={handleSignature}
                onEmpty={() => Alert.alert('Error', 'Please draw something before saving.')}
                descriptionText=""
                clearText="Clear"
                confirmText="Save Drawing"
                webStyle={`.m-signature-pad--footer { display: none; margin: 0px; }
                           .m-signature-pad {box-shadow: none; border: none; margin: 0;} 
                           .m-signature-pad--body {border: none;}`}
              />
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  contentInput: {
    flex: 1,
    minHeight: 300,
    fontSize: 18,
    color: '#555',
    lineHeight: 28,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  saveButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#208AEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    color: '#208AEF',
    fontWeight: 'bold',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  addImageButton: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bce0fd',
  },
  addImageText: {
    color: '#208AEF',
    fontSize: 15,
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    backgroundColor: '#f8f9fa',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: '600',
  },
  drawingToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  toolbarButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  toolbarButtonActive: {
    backgroundColor: '#e6f2ff',
  },
  toolbarText: {
    fontSize: 12,
    marginTop: 4,
    color: '#555',
  },
});
