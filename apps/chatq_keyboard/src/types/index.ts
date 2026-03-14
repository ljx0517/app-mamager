// 对话消息类型
export interface ChatMessage {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

// 对话类型
export interface Conversation {
  id: number;
  title: string;
  createdAt: number;
  updatedAt: number;
}

// 键盘状态
export interface KeyboardState {
  isVisible: boolean;
  clipboardContent: string;
  isGenerating: boolean;
  currentReply: string | null;
}

// AI 生成请求
export interface GenerateRequest {
  content: string;
}

// AI 生成响应
export interface GenerateResponse {
  reply: string;
}

// 应用状态
export interface AppState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: ChatMessage[];
  keyboard: KeyboardState;
}

// Action 类型
export type AppAction =
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'SET_CURRENT_CONVERSATION'; payload: Conversation | null }
  | { type: 'ADD_CONVERSATION'; payload: Conversation }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_KEYBOARD_VISIBLE'; payload: boolean }
  | { type: 'SET_CLIPBOARD_CONTENT'; payload: string }
  | { type: 'SET_GENERATING'; payload: boolean }
  | { type: 'SET_CURRENT_REPLY'; payload: string | null };

// 通信相关类型
export * from './communication';
