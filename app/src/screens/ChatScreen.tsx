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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, typography } from '../theme';
import { storage } from '../services/storage';
import { aiService } from '../services/ai';
import { User, ChatMessage, ChatSession } from '../types';
import { scale, fontScale, getStatusBarHeight, getBottomSpace } from '../utils/responsive';

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

  useEffect(() => {
    initChat();
  }, []);

  const initChat = async () => {
    await storage.init();
    
    // Create a new session
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: 'Nova conversa',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setSession(newSession);

    // Add welcome message
    const welcomeMsg: ChatMessage = {
      id: 'welcome',
      content: `Olá ${user.name}! 👋\n\nSou o assistente virtual do UEMA Digital. Posso ajudá-lo com:\n\n• Buscar documentos e processos\n• Responder dúvidas sobre procedimentos\n• Gerar resumos e análises\n• Consultar regulamentos\n\nComo posso ajudar você hoje?`,
      role: 'assistant',
      timestamp: new Date().toISOString(),
    };
    setMessages([welcomeMsg]);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      content: inputText.trim(),
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
      // Get documents for context (RAG)
      const docs = await storage.getDocuments();
      const context = docs.slice(0, 5).map(d => `- ${d.title} (${d.sector})`).join('\n');

      // Use AI service
      const response = await aiService.chat(inputText.trim(), context);

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_response`,
        content: response,
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save session
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

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        {!isUser && (
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.avatar}
          >
            <Ionicons name="sparkles" size={scale(16)} color="#fff" />
          </LinearGradient>
        )}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isUser && styles.userMessageTime]}>
            {new Date(item.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {isUser && (
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{user.name.charAt(0)}</Text>
          </View>
        )}
      </View>
    );
  };

  const handleSuggestionPress = (text: string) => {
    setInputText(text);
    // Auto-send after a brief delay
    setTimeout(() => {
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        content: text,
        role: 'user',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);
      setInputText('');
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Process the message
      (async () => {
        try {
          const docs = await storage.getDocuments();
          const context = docs.slice(0, 5).map(d => `- ${d.title} (${d.sector})`).join('\n');
          const response = await aiService.chat(text, context);
          const assistantMessage: ChatMessage = {
            id: `msg_${Date.now()}_response`,
            content: response,
            role: 'assistant',
            timestamp: new Date().toISOString(),
          };
          setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
          const errorMessage: ChatMessage = {
            id: `msg_${Date.now()}_error`,
            content: 'Desculpe, ocorreu um erro. Tente novamente.',
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
      })();
    }, 100);
  };

  const SuggestionChip = ({ text, icon }: { text: string; icon: string }) => (
    <TouchableOpacity 
      style={styles.suggestionChip} 
      onPress={() => handleSuggestionPress(text)} 
      activeOpacity={0.7}
    >
      <Ionicons name={icon as any} size={scale(16)} color={colors.primary} />
      <Text style={styles.suggestionText}>{text}</Text>
    </TouchableOpacity>
  );

  const suggestions = [
    { text: 'Documentos disponíveis', icon: 'document-text-outline' },
    { text: 'Processos pendentes', icon: 'time-outline' },
    { text: 'Resumo do mês', icon: 'calendar-outline' },
    { text: 'Ajuda geral', icon: 'help-circle-outline' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
      {/* Header */}
      <LinearGradient
        colors={['rgba(0, 102, 204, 0.15)', 'transparent']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.headerAvatar}
            >
              <Ionicons name="sparkles" size={scale(20)} color="#fff" />
            </LinearGradient>
            <View>
              <Text style={styles.headerTitle}>Assistente UEMA</Text>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Online • RAG Ativo</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.newChatBtn} onPress={initChat}>
            <Ionicons name="add" size={scale(20)} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          isLoading ? (
            <View style={styles.loadingRow}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.avatar}
              >
                <Ionicons name="sparkles" size={scale(16)} color="#fff" />
              </LinearGradient>
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Pensando...</Text>
              </View>
            </View>
          ) : null
        }
      />

      {/* Suggestions */}
      {messages.length <= 1 && !isLoading && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>💡 Toque para perguntar:</Text>
          <View style={styles.suggestionsGrid}>
            {suggestions.map((item, i) => (
              <SuggestionChip 
                key={i} 
                text={item.text}
                icon={item.icon}
              />
            ))}
          </View>
        </View>
      )}

      {/* Input */}
      <View style={[styles.inputContainer, { paddingBottom: scale(12) + getBottomSpace() }]}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Escreva sua pergunta..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]} 
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={inputText.trim() ? [colors.primary, colors.primaryDark] : ['#555', '#444']}
              style={styles.sendBtnGradient}
            >
              <Ionicons name="send" size={scale(22)} color="#fff" />
            </LinearGradient>
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
  keyboardContainer: {
    flex: 1,
  },
  header: {
    paddingTop: scale(8),
    paddingHorizontal: scale(16),
    paddingBottom: scale(8),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  headerAvatar: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontScale(15),
    color: colors.textPrimary,
    fontWeight: '600',
  },
  statusRow: {
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
  newChatBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(8),
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageList: {
    padding: scale(16),
    paddingBottom: scale(24),
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: scale(12),
    gap: scale(8),
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: fontScale(14),
  },
  messageBubble: {
    maxWidth: '75%',
    padding: scale(12),
    borderRadius: scale(16),
  },
  assistantBubble: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: scale(4),
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: scale(4),
  },
  messageText: {
    fontSize: fontScale(15),
    color: colors.textPrimary,
    lineHeight: scale(22),
  },
  userMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: fontScale(10),
    color: colors.textMuted,
    marginTop: scale(4),
  },
  userMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: scale(8),
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    padding: scale(12),
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingText: {
    fontSize: fontScale(13),
    color: colors.textMuted,
  },
  suggestionsContainer: {
    paddingHorizontal: scale(16),
    paddingBottom: scale(12),
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: scale(12),
  },
  suggestionsTitle: {
    fontSize: fontScale(14),
    color: colors.textSecondary,
    marginBottom: scale(12),
    fontWeight: '500',
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(10),
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
    backgroundColor: colors.surface,
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: colors.primary + '40',
    minWidth: '47%',
    maxWidth: '100%',
  },
  suggestionText: {
    fontSize: fontScale(14),
    color: colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  inputContainer: {
    padding: scale(16),
    paddingTop: scale(12),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: scale(12),
  },
  input: {
    flex: 1,
    minHeight: scale(50),
    maxHeight: scale(120),
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: scale(25),
    paddingHorizontal: scale(20),
    paddingVertical: scale(14),
    paddingRight: scale(16),
    color: colors.textPrimary,
    fontSize: fontScale(16),
    borderWidth: 1.5,
    borderColor: colors.primary + '30',
  },
  sendBtn: {
    marginBottom: scale(3),
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnGradient: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
