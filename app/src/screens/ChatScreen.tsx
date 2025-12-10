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
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../theme';
import { storage } from '../services/storage';
import { aiService } from '../services/ai';
import { User, ChatMessage, ChatSession } from '../types';
import { scale, fontScale } from '../utils/responsive';

interface ChatScreenProps {
  user: User;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  
  // Tab bar height: 85 on iOS, 65 on Android + bottom safe area
  const tabBarHeight = Platform.OS === 'ios' ? scale(85) + insets.bottom : scale(65);

  useEffect(() => {
    initChat();
  }, []);

  const initChat = async () => {
    await storage.init();
    
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: 'Nova conversa',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setSession(newSession);

    const welcomeMsg: ChatMessage = {
      id: 'welcome',
      content: `Olá ${user.name}! 👋\n\nSou o assistente do UEMA Digital. Como posso ajudar?`,
      role: 'assistant',
      timestamp: new Date().toISOString(),
    };
    setMessages([welcomeMsg]);
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isLoading) return;

    Keyboard.dismiss();

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      content: messageText,
      role: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const docs = await storage.getDocuments();
      const response = await aiService.chat(messageText, docs.slice(0, 5));

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_response`,
        content: response,
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (session) {
        const updatedSession = {
          ...session,
          messages: [...messages, userMessage, assistantMessage],
          updatedAt: new Date().toISOString(),
        };
        await storage.saveChatSession(updatedSession);
        setSession(updatedSession);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.messageContainer, isUser && styles.messageContainerUser]}>
        {!isUser && (
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.avatar}
            >
              <Ionicons name="sparkles" size={scale(14)} color="#fff" />
            </LinearGradient>
          </View>
        )}
        
        <View style={[
          styles.messageBubble, 
          isUser ? styles.userBubble : styles.assistantBubble
        ]}>
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isUser && styles.userMessageTime]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>

        {isUser && (
          <View style={styles.avatarContainer}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderTypingIndicator = () => (
    <View style={styles.messageContainer}>
      <View style={styles.avatarContainer}>
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={styles.avatar}
        >
          <Ionicons name="sparkles" size={scale(14)} color="#fff" />
        </LinearGradient>
      </View>
      <View style={[styles.messageBubble, styles.assistantBubble, styles.typingBubble]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.typingText}>Digitando...</Text>
      </View>
    </View>
  );

  const suggestions = [
    { text: 'Listar documentos', icon: 'document-text-outline' },
    { text: 'Processos pendentes', icon: 'time-outline' },
    { text: 'Resumo geral', icon: 'analytics-outline' },
    { text: 'Ajuda', icon: 'help-circle-outline' },
  ];

  const renderSuggestions = () => (
    <View style={styles.suggestionsSection}>
      <Text style={styles.suggestionsLabel}>Sugestões rápidas:</Text>
      <View style={styles.suggestionsRow}>
        {suggestions.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionChip}
            onPress={() => sendMessage(item.text)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={item.icon as any} 
              size={scale(14)} 
              color={colors.primary} 
            />
            <Text style={styles.suggestionText}>{item.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.headerAvatar}
          >
            <Ionicons name="sparkles" size={scale(18)} color="#fff" />
          </LinearGradient>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Assistente UEMA</Text>
            <View style={styles.statusIndicator}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Online</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.newChatButton} onPress={initChat}>
          <Ionicons name="refresh" size={scale(18)} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Chat Content */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={isLoading ? renderTypingIndicator : null}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
        />

        {/* Suggestions - only show at start */}
        {messages.length <= 1 && !isLoading && renderSuggestions()}

        {/* Input Area */}
        <View style={[styles.inputArea, { marginBottom: tabBarHeight }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Digite sua mensagem..."
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled
              ]}
              onPress={() => sendMessage()}
              disabled={!inputText.trim() || isLoading}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="send" 
                size={scale(18)} 
                color={inputText.trim() && !isLoading ? '#fff' : colors.textMuted} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.backgroundLight,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerAvatar: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    gap: scale(2),
  },
  headerTitle: {
    fontSize: fontScale(16),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  statusDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: colors.success,
  },
  statusText: {
    fontSize: fontScale(11),
    color: colors.success,
  },
  newChatButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Chat
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexGrow: 1,
  },

  // Messages
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  messageContainerUser: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginBottom: scale(2),
  },
  avatar: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#fff',
    fontSize: fontScale(12),
    fontWeight: '600',
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  assistantBubble: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: fontScale(14),
    color: colors.textPrimary,
    lineHeight: scale(20),
  },
  userMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: fontScale(10),
    color: colors.textMuted,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
  userMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },

  // Typing indicator
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  typingText: {
    fontSize: fontScale(13),
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  // Suggestions
  suggestionsSection: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundLight,
  },
  suggestionsLabel: {
    fontSize: fontScale(12),
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  suggestionText: {
    fontSize: fontScale(12),
    color: colors.primary,
    fontWeight: '500',
  },

  // Input
  inputArea: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.backgroundDark,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.backgroundLight,
    borderRadius: scale(25),
    borderWidth: 2,
    borderColor: colors.primary + '50',
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    minHeight: scale(50),
  },
  textInput: {
    flex: 1,
    fontSize: fontScale(15),
    color: colors.textPrimary,
    maxHeight: scale(100),
    minHeight: scale(40),
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
});
