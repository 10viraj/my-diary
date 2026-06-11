import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView, Image, Switch, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import SignatureScreen from 'react-native-signature-canvas';
import api from '../services/api';

export default function AddEntryScreen({ navigation }: any) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isHandwritten, setIsHandwritten] = useState(false);
  const [loading, setLoading] = useState(false);
  const [drawingModalVisible, setDrawingModalVisible] = useState(false);

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
      const base64Data = signature.replace('data:image/png;base64,', '');
      const path = FileSystem.cacheDirectory + 'sign_' + Date.now() + '.png';
      await FileSystem.writeAsStringAsync(path, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setImageUri(path);
      setIsHandwritten(true);
      setDrawingModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to save drawing');
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please provide both a title and content.');
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
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save the entry.');
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <TouchableOpacity style={styles.removeImageButton} onPress={() => setImageUri(null)}>
              <Text style={styles.removeImageText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
            <Text style={styles.addImageText}>{imageUri && !isHandwritten ? 'Change Image' : '+ Add Photo'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addImageButton} onPress={() => setDrawingModalVisible(true)}>
            <Text style={styles.addImageText}>+ Draw Note</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.titleInput}
          placeholder="Entry Title"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor="#999"
        />

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Is this a handwritten note?</Text>
          <Switch
            value={isHandwritten}
            onValueChange={setIsHandwritten}
            trackColor={{ false: '#d3d3d3', true: '#82c4f8' }}
            thumbColor={isHandwritten ? '#208AEF' : '#f4f3f4'}
          />
        </View>
        
        <TextInput
          style={styles.contentInput}
          placeholder="Write your thoughts here..."
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          placeholderTextColor="#999"
        />
      </ScrollView>

      {total !== 0 && (
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Auto-calculated Total:</Text>
          <Text style={styles.totalValue}>{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
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
              <Text style={styles.saveButtonText}>Save Entry</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Modal visible={drawingModalVisible} animationType="slide" onRequestClose={() => setDrawingModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Draw Note</Text>
            <TouchableOpacity onPress={() => setDrawingModalVisible(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <SignatureScreen
            onOK={handleSignature}
            onEmpty={() => Alert.alert('Error', 'Please draw something before saving.')}
            descriptionText="Draw your note here"
            clearText="Clear"
            confirmText="Save Drawing"
            webStyle={`.m-signature-pad {box-shadow: none; border: none; margin: 0;} 
                       .m-signature-pad--body {border: none;}
                       .m-signature-pad--footer {margin: 0px; padding: 10px; display: flex; justify-content: space-between;}`
            }
          />
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
});
