import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { initDatabase } from './src/services/storage';
import { ChatProvider, useChat } from './src/context/ChatContext';

function MainScreen() {
  const {
    state,
    createNewConversation,
    selectConversation,
    deleteConversation,
    loadConversations,
    handleKeyboardRequest,
  } = useChat();
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');

  useEffect(() => {
    initDatabase().catch(console.error);
  }, []);

  // 处理深度链接（键盘扩展请求）
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      console.log('收到深度链接:', event.url);
      handleDeepLinkURL(event.url);
    };

    // 添加事件监听器
    Linking.addEventListener('url', handleDeepLink);

    // 检查初始URL（应用从深度链接启动时）
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('初始URL:', url);
        handleDeepLinkURL(url);
      }
    });

    // Android Intent处理
    if (Platform.OS === 'android') {
      // 监听自定义Intent
      // 这里可以添加Intent处理逻辑
    }

    return () => {
      Linking.removeEventListener('url', handleDeepLink);
    };
  }, []);

  // 处理深度链接URL
  const handleDeepLinkURL = (url: string) => {
    try {
      console.log('处理深度链接URL:', url);

      // 解析URL
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);

      const requestId = params.get('requestId');
      const action = params.get('action');
      const content = params.get('content');

      console.log('解析参数:', { requestId, action, content });

      if (requestId && action === 'generate_reply' && content) {
        // 处理键盘扩展请求
        handleKeyboardRequest(requestId, content);
      } else if (action === 'settings') {
        // 打开设置
        console.log('打开设置');
      }
    } catch (error) {
      console.error('处理深度链接失败:', error);
    }
  };

  const handleNewChat = async () => {
    if (!newChatTitle.trim()) {
      Alert.alert('提示', '请输入对话标题');
      return;
    }
    await createNewConversation(newChatTitle.trim());
    setNewChatTitle('');
    setShowNewChat(false);
  };

  const handleDeleteConversation = (id: number) => {
    Alert.alert('确认删除', '确定要删除这个对话吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => deleteConversation(id),
      },
    ]);
  };

  const renderConversationItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => selectConversation(item)}
      onLongPress={() => handleDeleteConversation(item.id)}
    >
      <View style={styles.conversationInfo}>
        <Text style={styles.conversationTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.conversationDate}>
          {new Date(item.updatedAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Keeboard</Text>
        <Text style={styles.headerSubtitle}>AI 回复键盘</Text>
      </View>

      {/* 对话历史列表 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>对话历史</Text>
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={() => setShowNewChat(true)}
          >
            <Text style={styles.newChatButtonText}>+ 新建</Text>
          </TouchableOpacity>
        </View>

        {state.conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>暂无对话记录</Text>
            <Text style={styles.emptyStateHint}>
              点击"AI 回复"键盘按钮开始对话
            </Text>
          </View>
        ) : (
          <FlatList
            data={state.conversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.conversationList}
          />
        )}
      </View>

      {/* 当前对话消息 */}
      {state.currentConversation && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{state.currentConversation.title}</Text>
          {state.messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageItem,
                msg.role === 'user' ? styles.userMessage : styles.assistantMessage,
              ]}
            >
              <Text style={styles.messageRole}>
                {msg.role === 'user' ? '你' : 'AI'}
              </Text>
              <Text style={styles.messageContent}>{msg.content}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 键盘使用说明 */}
      <View style={styles.keyboardSection}>
        <Text style={styles.sectionTitle}>键盘使用说明</Text>
        <View style={styles.keyboardInfo}>
          <Text style={styles.infoText}>1. 在 iOS 设备中：设置 → 通用 → 键盘 → 键盘 → 添加新键盘 → 选择 "Your Keeboard"</Text>
          <Text style={styles.infoText}>2. 启用"允许完全访问"以支持剪贴板功能</Text>
          <Text style={styles.infoText}>3. 在任何应用中使用键盘时，点击 "✨ AI 回复" 按钮生成回复</Text>
        </View>
      </View>

      {/* 新建对话弹窗 */}
      <Modal visible={showNewChat} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>新建对话</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="输入对话标题"
              value={newChatTitle}
              onChangeText={setNewChatTitle}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowNewChat(false);
                  setNewChatTitle('');
                }}
              >
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleNewChat}
              >
                <Text style={styles.modalConfirmText}>创建</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  return (
    <ChatProvider>
      <MainScreen />
    </ChatProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  newChatButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  newChatButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  conversationList: {
    maxHeight: 200,
  },
  conversationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  conversationDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
  },
  emptyStateHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  messageItem: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  userMessage: {
    backgroundColor: '#e3f2fd',
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  assistantMessage: {
    backgroundColor: '#f5f5f5',
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  messageRole: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 14,
    color: '#333',
  },
  keyboardSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    flex: 1,
  },
  keyboardInfo: {
    flex: 1,
    marginTop: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
  },
  modalConfirmButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
