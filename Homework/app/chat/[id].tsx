import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  Modal,
  TouchableWithoutFeedback,
  Linking,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ThemedView } from '@/components/shared/ThemedView';
import Animated, { FadeInRight, FadeInLeft, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '@/utils/api';
import * as SecureStore from 'expo-secure-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Attachment {
  type: 'image' | 'video' | 'document';
  uri: string;
  name: string;
  mimeType?: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: string;
  attachment?: Attachment;
}

export default function ChatScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [message, setMessage] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [currentAttachment, setCurrentAttachment] = useState<Attachment | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [isDocOptionsVisible, setDocOptionsVisible] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Attachment | null>(null);
  const [isMessageOptionsVisible, setMessageOptionsVisible] = useState(false);
  const [selectedMessageText, setSelectedMessageText] = useState('');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  const flatListRef = useRef<FlatList>(null);

  // Cargar historial de mensajes desde el backend
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoadingMessages(true);
        const response = await api.get(`/messages/${id}`);
        const mapped = response.data.map((m: any) => ({
          id: m.id,
          text: m.text,
          sender: m.sender?.id === id ? 'other' : 'me',
          timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          attachment: m.attachment ? {
            type: m.attachment.mimeType?.startsWith('image/') ? 'image' : 
                  m.attachment.mimeType?.startsWith('video/') ? 'video' : 'document',
            uri: m.attachment.fileUrl,
            name: m.attachment.fileName,
            mimeType: m.attachment.mimeType,
          } : undefined,
        }));
        setMessages(mapped);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoadingMessages(false);
      }
    };
    loadMessages();
  }, [id]);

  const sendMessage = async () => {
    if (message.trim().length === 0 && !currentAttachment) return;

    try {
      let attachmentData;

      // Si hay adjunto, subirlo primero
      if (currentAttachment) {
        const formData = new FormData();
        formData.append('file', {
          uri: currentAttachment.uri,
          name: currentAttachment.name,
          type: currentAttachment.mimeType || 'application/octet-stream',
        } as any);

        const uploadRes = await api.post('/uploads', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        attachmentData = uploadRes.data;
      }

      // Enviar mensaje vía REST (mientras no esté WebSocket integrado en frontend)
      const response = await api.post(`/messages/${id}`, {
        text: message.trim() || (currentAttachment ? 'Archivo adjunto' : ''),
        receiverId: id,
        attachment: attachmentData,
      });

      // Agregar localmente al chat
      const m = response.data;
      const newMessage: Message = {
        id: m.id,
        text: m.text,
        sender: 'me',
        timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attachment: m.attachment ? {
          type: m.attachment.mimeType?.startsWith('image/') ? 'image' :
                m.attachment.mimeType?.startsWith('video/') ? 'video' : 'document',
          uri: m.attachment.fileUrl,
          name: m.attachment.fileName,
          mimeType: m.attachment.mimeType,
        } : undefined,
      };

      setMessages(prev => [...prev, newMessage]);
      setMessage('');
      setCurrentAttachment(null);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('Error sending message:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.response?.data?.message || 'No se pudo enviar el mensaje.',
        position: 'bottom'
      });
    }
  };

  const handleAttachment = () => {
    setModalVisible(true);
  };

  const pickDocument = async () => {
    try {
      setModalVisible(false);
      const result = await DocumentPicker.getDocumentAsync({});
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCurrentAttachment({
          type: 'document',
          uri: result.assets[0].uri,
          name: result.assets[0].name,
          mimeType: result.assets[0].mimeType || 'application/octet-stream',
        });
      }
    } catch (error) {
      console.error('Error al seleccionar documento:', error);
    }
  };

  const pickMedia = async () => {
    try {
      setModalVisible(false);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const type = asset.type === 'video' ? 'video' : 'image';
        setCurrentAttachment({
          type: type,
          uri: asset.uri,
          name: asset.uri.split('/').pop() || 'media_file',
          mimeType: asset.mimeType || (type === 'image' ? 'image/jpeg' : 'video/mp4'),
        });
      }
    } catch (error) {
      console.error('Error al seleccionar multimedia:', error);
    }
  };

  const handleOpenDoc = async (doc: Attachment) => {
    try {
      if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(doc.uri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1,
          type: doc.mimeType || '*/*',
        });
      } else {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(doc.uri);
        }
      }
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('Error', 'No se pudo abrir el archivo de forma directa.');
    }
  };

  const handleShareDoc = async (doc: Attachment) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(doc.uri, { dialogTitle: 'Compartir documento' });
      }
    } catch (error) {
      console.error('Error sharing document:', error);
    }
  };

  const handleCopyText = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Toast.show({
      type: 'success',
      text1: 'Copiado',
      text2: 'Texto copiado al portapapeles',
      position: 'bottom',
    });
    setMessageOptionsVisible(false);
  };

  const renderAttachmentPreview = () => {
    if (!currentAttachment) return null;

    return (
      <View style={[styles.previewContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        {currentAttachment.type === 'image' || currentAttachment.type === 'video' ? (
          <View style={styles.imagePreviewWrapper}>
            <Image source={{ uri: currentAttachment.uri }} style={styles.imagePreview} />
            {currentAttachment.type === 'video' && (
              <View style={styles.videoIconOverlay}>
                <Ionicons name="play-circle" size={24} color="#FFFFFF" />
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.docPreview, { backgroundColor: theme.colors.primaryLight }]}>
            <Ionicons name="document-text" size={30} color={theme.colors.primary} />
          </View>
        )}
        <View style={styles.previewInfo}>
          <Text style={[styles.previewName, { color: theme.colors.text }]} numberOfLines={1}>
            {currentAttachment.name}
          </Text>
          <Text style={[styles.previewType, { color: theme.colors.textSecondary }]}>
            {currentAttachment.type === 'image' ? 'Imagen' : currentAttachment.type === 'video' ? 'Video' : 'Documento'} adjunto
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.removePreviewBtn, { backgroundColor: theme.colors.background }]} 
          onPress={() => setCurrentAttachment(null)}
        >
          <Ionicons name="close" size={16} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.sender === 'me';
    
    return (
      <Animated.View 
        entering={isMe ? FadeInRight.delay(index * 50) : FadeInLeft.delay(index * 50)}
        style={[
          styles.messageContainer,
          isMe ? styles.myMessageContainer : styles.otherMessageContainer
        ]}
      >
        <View style={[
          styles.messageBubble,
          isMe 
            ? [styles.myBubble, { backgroundColor: theme.colors.primary }] 
            : [styles.otherBubble, { backgroundColor: theme.colors.card }]
        ]}>
          {item.attachment && (
            <View style={styles.messageAttachment}>
              {(item.attachment.type === 'image' || item.attachment.type === 'video') ? (
                <TouchableOpacity 
                  style={styles.messageImageWrapper}
                  onPress={() => {
                    if (item.attachment?.type === 'image') {
                      setFullScreenImage(item.attachment.uri);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: item.attachment.uri }} style={styles.messageImage} />
                  {item.attachment.type === 'video' && (
                    <View style={styles.videoIconOverlay}>
                      <Ionicons name="play-circle" size={32} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.messageDoc, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                  onPress={() => item.attachment && handleOpenDoc(item.attachment)}
                  onLongPress={() => {
                    if (item.attachment) {
                      setSelectedDoc(item.attachment);
                      setDocOptionsVisible(true);
                    }
                  }}
                  delayLongPress={1000}
                  activeOpacity={0.7}
                >
                  <Ionicons name="document-text" size={24} color={isMe ? '#FFFFFF' : theme.colors.primary} />
                  <Text style={[styles.messageDocText, { color: isMe ? '#FFFFFF' : theme.colors.text }]}>
                    {item.attachment.name}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {item.text.length > 0 && (
            <TouchableOpacity 
              onLongPress={() => {
                setSelectedMessageText(item.text);
                setMessageOptionsVisible(true);
              }}
              delayLongPress={600}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.messageText,
                { color: isMe ? '#FFFFFF' : theme.colors.text, marginTop: item.attachment ? 8 : 0 }
              ]}>
                {item.text}
              </Text>
            </TouchableOpacity>
          )}

          <Text style={[
            styles.timestamp,
            { color: isMe ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary }
          ]}>
            {item.timestamp}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <BackgroundShapes />
      <KeyboardAvoidingView 
        behavior="padding"
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerInfo}
            onPress={() => router.push({
              pathname: '/collaborator/[id]',
              params: { id, name }
            })}
          >
            <View style={[styles.avatarHeader, { backgroundColor: theme.colors.primaryLight }]}>
              <Text style={[styles.avatarTextHeader, { color: theme.colors.primary }]}>
                {name?.charAt(0)}
              </Text>
            </View>
            <View>
              <Text style={[styles.headerName, { color: theme.colors.text }]}>{name}</Text>
              <Text style={[styles.headerStatus, { color: theme.colors.success }]}>En línea</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Message List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Input Area with Preview */}
        <View style={[styles.inputWrapper, { backgroundColor: theme.colors.background, paddingBottom: Math.max(insets.bottom, 12) }]}>
          {renderAttachmentPreview()}
          
          <View style={[styles.inputContainer, { backgroundColor: theme.colors.card }]}>
            <TouchableOpacity style={styles.attachButton} onPress={handleAttachment}>
              <Ionicons name="add" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder={currentAttachment ? "Escribe un mensaje..." : "Mensaje..."}
              placeholderTextColor={theme.colors.textSecondary}
              value={message}
              onChangeText={setMessage}
              multiline
            />
            
            <TouchableOpacity 
              onPress={sendMessage}
              style={[
                styles.sendButton, 
                { backgroundColor: (message.trim() || currentAttachment) ? theme.colors.primary : theme.colors.border }
              ]}
              disabled={!message.trim() && !currentAttachment}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Attachment Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: theme.colors.card, paddingBottom: Math.max(insets.bottom, 20) }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Adjuntar</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close-circle" size={24} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalOptions}>
                  <TouchableOpacity style={styles.modalOption} onPress={pickDocument}>
                    <View style={[styles.modalOptionIcon, { backgroundColor: theme.colors.primaryLight }]}>
                      <Ionicons name="document-text" size={28} color={theme.colors.primary} />
                    </View>
                    <Text style={[styles.modalOptionText, { color: theme.colors.text }]}>Documento</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.modalOption} onPress={pickMedia}>
                    <View style={[styles.modalOptionIcon, { backgroundColor: theme.colors.primaryLight }]}>
                      <Ionicons name="images" size={28} color={theme.colors.primary} />
                    </View>
                    <Text style={[styles.modalOptionText, { color: theme.colors.text }]}>Foto / Video</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Full Screen Image Modal */}
      <Modal
        visible={fullScreenImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullScreenImage(null)}
      >
        <View style={styles.fullScreenImageContainer}>
          <TouchableOpacity 
            style={styles.closeFullScreenBtn} 
            onPress={() => setFullScreenImage(null)}
          >
            <Ionicons name="close" size={30} color="#FFFFFF" />
          </TouchableOpacity>
          {fullScreenImage && (
            <Image 
              source={{ uri: fullScreenImage }} 
              style={styles.fullScreenImage} 
              resizeMode="contain" 
            />
          )}
        </View>
      </Modal>

      {/* Document Options Modal */}
      <Modal
        visible={isDocOptionsVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDocOptionsVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDocOptionsVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: theme.colors.card, paddingBottom: Math.max(insets.bottom, 20) }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Opciones de archivo</Text>
                  <TouchableOpacity onPress={() => setDocOptionsVisible(false)}>
                    <Ionicons name="close-circle" size={24} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {selectedDoc && (
                  <View style={styles.docInfoContainer}>
                    <Ionicons name="document" size={40} color={theme.colors.primary} />
                    <Text style={[styles.docNameTitle, { color: theme.colors.text }]} numberOfLines={2}>
                      {selectedDoc.name}
                    </Text>
                  </View>
                )}
                
                <View style={styles.optionsList}>
                  <TouchableOpacity 
                    style={[styles.optionItem, { backgroundColor: theme.colors.primaryLight }]}
                    onPress={() => {
                      setDocOptionsVisible(false);
                      if (selectedDoc) handleOpenDoc(selectedDoc);
                    }}
                  >
                    <Ionicons name="eye" size={24} color={theme.colors.primary} />
                    <Text style={[styles.optionText, { color: theme.colors.primary }]}>Visualizar archivo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.optionItem, { backgroundColor: theme.colors.primaryLight, marginTop: 12 }]}
                    onPress={() => {
                      setDocOptionsVisible(false);
                      if (selectedDoc) handleShareDoc(selectedDoc);
                    }}
                  >
                    <Ionicons name="share-social" size={24} color={theme.colors.primary} />
                    <Text style={[styles.optionText, { color: theme.colors.primary }]}>Compartir archivo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Message Options Modal */}
      <Modal
        visible={isMessageOptionsVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMessageOptionsVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMessageOptionsVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: theme.colors.card, paddingBottom: Math.max(insets.bottom, 20) }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Opciones de mensaje</Text>
                  <TouchableOpacity onPress={() => setMessageOptionsVisible(false)}>
                    <Ionicons name="close-circle" size={24} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.optionsList}>
                  <TouchableOpacity 
                    style={[styles.optionItem, { backgroundColor: theme.colors.primaryLight }]}
                    onPress={() => handleCopyText(selectedMessageText)}
                  >
                    <Ionicons name="copy" size={24} color={theme.colors.primary} />
                    <Text style={[styles.optionText, { color: theme.colors.primary }]}>Copiar texto</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  backButton: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  avatarHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarTextHeader: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: SCREEN_WIDTH * 0.75,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  myBubble: {
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  messageAttachment: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageImageWrapper: {
    width: '100%',
    aspectRatio: 4/3,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  messageImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  messageDoc: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  messageDocText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
  },
  videoIconOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  inputWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  imagePreviewWrapper: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  docPreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  previewName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  previewType: {
    fontSize: 12,
  },
  removePreviewBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  modalOption: {
    alignItems: 'center',
  },
  modalOptionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  fullScreenImageContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  closeFullScreenBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  docInfoContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  docNameTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  optionsList: {
    width: '100%',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
