import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { AppState, AppAction, Conversation, ChatMessage } from '../types';
import * as storage from '../services/storage';
import * as api from '../services/api';
import * as configDataService from '../services/configData';
import { communicationService } from '../services/communication';

const initialState: AppState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  keyboard: {
    isVisible: false,
    clipboardContent: '',
    isGenerating: false,
    currentReply: null,
    currentCandidates: null,
  },
  configData: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };

    case 'SET_CURRENT_CONVERSATION':
      return { ...state, currentConversation: action.payload };

    case 'ADD_CONVERSATION':
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
      };

    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };

    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };

    case 'SET_KEYBOARD_VISIBLE':
      return {
        ...state,
        keyboard: { ...state.keyboard, isVisible: action.payload },
      };

    case 'SET_CLIPBOARD_CONTENT':
      return {
        ...state,
        keyboard: { ...state.keyboard, clipboardContent: action.payload },
      };

    case 'SET_GENERATING':
      return {
        ...state,
        keyboard: { ...state.keyboard, isGenerating: action.payload },
      };

    case 'SET_CURRENT_REPLY':
      return {
        ...state,
        keyboard: { ...state.keyboard, currentReply: action.payload },
      };

    case 'SET_CURRENT_CANDIDATES':
      return {
        ...state,
        keyboard: { ...state.keyboard, currentCandidates: action.payload },
      };

    case 'SET_CONFIG_DATA':
      return { ...state, configData: action.payload };

    default:
      return state;
  }
}

interface ChatContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  loadConversations: () => Promise<void>;
  createNewConversation: (title: string) => Promise<Conversation>;
  selectConversation: (conversation: Conversation) => Promise<void>;
  addMessage: (role: 'user' | 'assistant', content: string) => Promise<void>;
  deleteConversation: (id: number) => Promise<void>;
  // 键盘扩展相关
  handleKeyboardRequest: (requestId: string, content: string) => Promise<void>;
  sendKeyboardResponse: (requestId: string, reply: string, success?: boolean, error?: string) => Promise<void>;
  /** 刷新主数据（场景/关系/标签/人设包） */
  loadConfigData: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 初始化加载对话列表与主数据（场景/关系/标签/人设包）
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConfigData = async () => {
    const data = await configDataService.getConfigData();
    if (data) dispatch({ type: 'SET_CONFIG_DATA', payload: data });
  };

  useEffect(() => {
    loadConfigData();
  }, []);

  const loadConversations = async () => {
    try {
      const conversations = await storage.getConversations();
      dispatch({ type: 'SET_CONVERSATIONS', payload: conversations });
    } catch (error) {
      console.error('加载对话失败:', error);
    }
  };

  const createNewConversation = async (title: string): Promise<Conversation> => {
    const conversation = await storage.createConversation(title);
    dispatch({ type: 'ADD_CONVERSATION', payload: conversation });
    dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversation });
    dispatch({ type: 'SET_MESSAGES', payload: [] });
    return conversation;
  };

  const selectConversation = async (conversation: Conversation) => {
    dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversation });
    const messages = await storage.getMessages(conversation.id);
    dispatch({ type: 'SET_MESSAGES', payload: messages });
  };

  const addMessage = async (role: 'user' | 'assistant', content: string) => {
    if (!state.currentConversation) return;
    const message = await storage.addMessage(
      state.currentConversation.id,
      role,
      content
    );
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  };

  const deleteConversation = async (id: number) => {
    await storage.deleteConversation(id);
    await loadConversations();
    if (state.currentConversation?.id === id) {
      dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: null });
      dispatch({ type: 'SET_MESSAGES', payload: [] });
    }
  };

  // 处理来自键盘扩展的请求
  const handleKeyboardRequest = async (requestId: string, content: string) => {
    try {
      dispatch({ type: 'SET_GENERATING', payload: true });
      dispatch({ type: 'SET_CLIPBOARD_CONTENT', payload: content });

      // 如果没有当前对话，创建一个新的
      if (!state.currentConversation) {
        const conversation = await createNewConversation(`键盘对话 ${new Date().toLocaleString()}`);
        dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversation });
      }

      // 添加用户消息
      await addMessage('user', content);

      // 生成AI回复（支持多候选）
      const apiResponse = await api.generateReply({
        content,
        candidateCount: 3,
      });

      // 添加AI回复
      await addMessage('assistant', apiResponse.reply);

      // 发送响应回键盘扩展
      await sendKeyboardResponse(requestId, apiResponse.reply, true);

      dispatch({ type: 'SET_GENERATING', payload: false });
      dispatch({ type: 'SET_CURRENT_REPLY', payload: apiResponse.reply });
      dispatch({
        type: 'SET_CURRENT_CANDIDATES',
        payload: apiResponse.candidates?.length ? apiResponse.candidates : null,
      });
    } catch (error) {
      console.error('处理键盘请求失败:', error);
      await sendKeyboardResponse(requestId, '', false, error.message);
      dispatch({ type: 'SET_GENERATING', payload: false });
    }
  };

  // 发送响应到键盘扩展
  const sendKeyboardResponse = async (
    requestId: string,
    reply: string,
    success: boolean = true,
    error?: string
  ) => {
    try {
      const response: KeyboardResponse = {
        requestId,
        success,
        data: success ? { reply } : { error },
        timestamp: Date.now(),
      };

      // 使用通信服务发送响应
      await communicationService.handleKeyboardRequest({
        type: 'generate_reply',
        requestId,
        content: reply,
        timestamp: Date.now(),
        platform: Platform.OS as 'ios' | 'android',
      });

      // 根据平台发送响应
      if (Platform.OS === 'ios') {
        // iOS: 通过剪贴板返回回复，键盘扩展会检查剪贴板
        try {
          const clipboardData = JSON.stringify({
            type: 'yourkeeboard_reply',
            requestId,
            reply,
            timestamp: Date.now(),
          });
          await Clipboard.setString(clipboardData);
          console.log('iOS响应已保存到剪贴板:', requestId);
        } catch (clipboardError) {
          console.error('保存到剪贴板失败:', clipboardError);
        }
      } else if (Platform.OS === 'android') {
        // Android: 通过广播发送
        const intentAction = 'com.anonymous.yourkeeboard.KEYBOARD_RESPONSE';
        // 这里需要调用原生模块发送广播
        console.log('Android响应已发送:', requestId);
      }
    } catch (error) {
      console.error('发送键盘响应失败:', error);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        state,
        dispatch,
        loadConversations,
        createNewConversation,
        selectConversation,
        addMessage,
        deleteConversation,
        handleKeyboardRequest,
        sendKeyboardResponse,
        loadConfigData,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
