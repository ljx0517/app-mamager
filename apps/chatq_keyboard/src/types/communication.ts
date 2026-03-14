// 跨平台通信类型定义
// 用于键盘扩展与主应用之间的通信

/**
 * 键盘扩展请求类型
 */
export type KeyboardRequestType = 'generate_reply' | 'save_conversation' | 'get_history' | 'check_status';

/**
 * 键盘扩展请求接口
 */
export interface KeyboardRequest {
  type: KeyboardRequestType;
  requestId: string;
  content: string;
  timestamp: number;
  platform: 'ios' | 'android';
  metadata?: Record<string, any>;
}

/**
 * 键盘扩展响应接口
 */
export interface KeyboardResponse {
  requestId: string;
  success: boolean;
  data: {
    reply?: string;
    conversationId?: number;
    history?: any[];
    error?: string;
    status?: 'ready' | 'processing' | 'error';
  };
  timestamp: number;
}

/**
 * 剪贴板内容接口
 */
export interface ClipboardContent {
  text: string;
  timestamp: number;
  sourceApp?: string;
}

/**
 * App Groups 共享数据接口 (iOS)
 */
export interface AppGroupData {
  lastRequestId?: string;
  lastClipboardContent?: string;
  pendingRequests: KeyboardRequest[];
  completedResponses: KeyboardResponse[];
}

/**
 * SharedPreferences 键名定义 (Android)
 */
export enum SharedPrefsKeys {
  LAST_REQUEST_ID = 'last_request_id',
  LAST_CLIPBOARD_CONTENT = 'last_clipboard_content',
  PENDING_REQUESTS = 'pending_requests',
  COMPLETED_RESPONSES = 'completed_responses',
  KEYBOARD_ENABLED = 'keyboard_enabled',
}

/**
 * URL Scheme 参数接口
 */
export interface URLSchemeParams {
  requestId: string;
  action: KeyboardRequestType;
  content?: string;
  platform?: 'ios' | 'android';
}

/**
 * Intent Action 定义 (Android)
 */
export enum IntentActions {
  GENERATE_REPLY = 'com.anonymous.yourkeeboard.GENERATE_REPLY',
  SAVE_CONVERSATION = 'com.anonymous.yourkeeboard.SAVE_CONVERSATION',
  GET_HISTORY = 'com.anonymous.yourkeeboard.GET_HISTORY',
  KEYBOARD_RESPONSE = 'com.anonymous.yourkeeboard.KEYBOARD_RESPONSE',
}

/**
 * 通信错误类型
 */
export interface CommunicationError {
  code: string;
  message: string;
  requestId?: string;
  timestamp: number;
}

/**
 * 通信状态
 */
export interface CommunicationStatus {
  isConnected: boolean;
  lastSyncTime: number;
  pendingCount: number;
  platform: 'ios' | 'android' | 'web';
}