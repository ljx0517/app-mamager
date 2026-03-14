// 统一跨平台通信服务
// 处理键盘扩展与主应用之间的通信

import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import {
  KeyboardRequest,
  KeyboardResponse,
  KeyboardRequestType,
  CommunicationError,
  CommunicationStatus,
  SharedPrefsKeys,
  IntentActions,
  URLSchemeParams,
} from '../types/communication';
import { generateReply } from './api';
import { createConversation, addMessage } from './storage';

/**
 * 通信服务类
 * 处理键盘扩展与主应用之间的跨平台通信
 */
class CommunicationService {
  private static instance: CommunicationService;
  private requestQueue: Map<string, KeyboardRequest> = new Map();
  private responseQueue: Map<string, KeyboardResponse> = new Map();
  private listeners: Map<string, Function[]> = new Map();

  private constructor() {
    this.initialize();
  }

  static getInstance(): CommunicationService {
    if (!CommunicationService.instance) {
      CommunicationService.instance = new CommunicationService();
    }
    return CommunicationService.instance;
  }

  /**
   * 初始化通信服务
   */
  private async initialize(): Promise<void> {
    // 加载待处理的请求和响应
    await this.loadPendingData();

    // 设置定期清理
    this.setupCleanupInterval();

    // 设置平台特定的初始化
    if (Platform.OS === 'ios') {
      await this.initializeIOS();
    } else if (Platform.OS === 'android') {
      await this.initializeAndroid();
    }
  }

  /**
   * iOS平台初始化
   */
  private async initializeIOS(): Promise<void> {
    try {
      // 检查App Groups是否可用
      const canAccessAppGroups = await this.checkIOSAppGroupsAccess();
      if (!canAccessAppGroups) {
        console.warn('iOS App Groups不可用，将使用备用通信方案');
      }

      // 注册URL Scheme处理器
      this.registerURLSchemeHandler();
    } catch (error) {
      console.error('iOS通信初始化失败:', error);
    }
  }

  /**
   * Android平台初始化
   */
  private async initializeAndroid(): Promise<void> {
    try {
      // 检查SharedPreferences访问
      const canAccessSharedPrefs = await this.checkAndroidSharedPrefsAccess();
      if (!canAccessSharedPrefs) {
        console.warn('Android SharedPreferences访问受限');
      }

      // 注册Intent接收器
      this.registerIntentReceiver();
    } catch (error) {
      console.error('Android通信初始化失败:', error);
    }
  }

  /**
   * 处理键盘扩展请求
   */
  async handleKeyboardRequest(request: KeyboardRequest): Promise<KeyboardResponse> {
    try {
      // 验证请求
      this.validateRequest(request);

      // 保存请求到队列
      this.requestQueue.set(request.requestId, request);
      await this.saveRequestToStorage(request);

      // 根据请求类型处理
      let response: KeyboardResponse;
      switch (request.type) {
        case 'generate_reply':
          response = await this.handleGenerateReply(request);
          break;
        case 'save_conversation':
          response = await this.handleSaveConversation(request);
          break;
        case 'get_history':
          response = await this.handleGetHistory(request);
          break;
        case 'check_status':
          response = await this.handleCheckStatus(request);
          break;
        default:
          throw new Error(`未知请求类型: ${request.type}`);
      }

      // 保存响应
      this.responseQueue.set(request.requestId, response);
      await this.saveResponseToStorage(response);

      // 通知监听器
      this.notifyListeners('response_received', response);

      return response;
    } catch (error) {
      const errorResponse: KeyboardResponse = {
        requestId: request.requestId,
        success: false,
        data: { error: error.message },
        timestamp: Date.now(),
      };

      this.responseQueue.set(request.requestId, errorResponse);
      await this.saveResponseToStorage(errorResponse);

      return errorResponse;
    }
  }

  /**
   * 处理生成回复请求
   */
  private async handleGenerateReply(request: KeyboardRequest): Promise<KeyboardResponse> {
    try {
      const { content } = request;

      // 注意：这里的content已经是AI回复文本（来自ChatContext）
      // 不再重新生成回复，直接使用传入的内容
      const reply = content;

      // 构建响应
      const response: KeyboardResponse = {
        requestId: request.requestId,
        success: true,
        data: {
          reply: reply,
          // conversationId由ChatContext已经创建，这里不重复创建
        },
        timestamp: Date.now(),
      };

      return response;
    } catch (error) {
      throw new Error(`处理回复失败: ${error.message}`);
    }
  }

  /**
   * 处理保存对话请求
   */
  private async handleSaveConversation(request: KeyboardRequest): Promise<KeyboardResponse> {
    // 实现保存对话逻辑
    return {
      requestId: request.requestId,
      success: true,
      data: { message: '对话已保存' },
      timestamp: Date.now(),
    };
  }

  /**
   * 处理获取历史请求
   */
  private async handleGetHistory(request: KeyboardRequest): Promise<KeyboardResponse> {
    // 实现获取历史逻辑
    return {
      requestId: request.requestId,
      success: true,
      data: { history: [] },
      timestamp: Date.now(),
    };
  }

  /**
   * 处理状态检查请求
   */
  private async handleCheckStatus(request: KeyboardRequest): Promise<KeyboardResponse> {
    return {
      requestId: request.requestId,
      success: true,
      data: { status: 'ready' },
      timestamp: Date.now(),
    };
  }

  /**
   * 验证请求
   */
  private validateRequest(request: KeyboardRequest): void {
    if (!request.requestId || !request.type) {
      throw new Error('请求缺少必要字段');
    }

    if (request.type === 'generate_reply' && !request.content) {
      throw new Error('生成回复请求需要内容');
    }

    // 检查时间戳是否合理（不超过24小时）
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (request.timestamp < now - twentyFourHours || request.timestamp > now + 60000) {
      throw new Error('无效的时间戳');
    }
  }

  /**
   * 从键盘扩展发送请求
   */
  async sendRequestFromKeyboard(type: KeyboardRequestType, content: string): Promise<string> {
    const requestId = this.generateRequestId();
    const platform = Platform.OS as 'ios' | 'android';

    const request: KeyboardRequest = {
      type,
      requestId,
      content,
      timestamp: Date.now(),
      platform,
    };

    // 保存到剪贴板（备选方案）
    await this.saveToClipboard(requestId, content);

    // 根据平台使用不同的通信方式
    if (platform === 'ios') {
      await this.sendRequestIOS(request);
    } else {
      await this.sendRequestAndroid(request);
    }

    return requestId;
  }

  /**
   * iOS发送请求
   */
  private async sendRequestIOS(request: KeyboardRequest): Promise<void> {
    try {
      // 使用URL Scheme打开主应用
      const url = `com.anonymous.your-keeboard://keyboard?requestId=${request.requestId}&action=${request.type}`;
      // 这里需要调用原生模块打开URL
      await Linking.openURL(url);

      // 同时保存到App Groups
      await this.saveToIOSAppGroups(request);
    } catch (error) {
      console.error('iOS发送请求失败:', error);
      throw error;
    }
  }

  /**
   * Android发送请求
   */
  private async sendRequestAndroid(request: KeyboardRequest): Promise<void> {
    try {
      // 使用Intent打开主应用
      // 这里需要调用原生模块发送Intent

      // 同时保存到SharedPreferences
      await this.saveToAndroidSharedPrefs(request);
    } catch (error) {
      console.error('Android发送请求失败:', error);
      throw error;
    }
  }

  /**
   * 获取响应
   */
  async getResponse(requestId: string): Promise<KeyboardResponse | null> {
    // 首先检查内存中的响应队列
    if (this.responseQueue.has(requestId)) {
      return this.responseQueue.get(requestId)!;
    }

    // 然后检查存储中的响应
    const storedResponse = await this.getResponseFromStorage(requestId);
    if (storedResponse) {
      this.responseQueue.set(requestId, storedResponse);
      return storedResponse;
    }

    return null;
  }

  /**
   * 注册事件监听器
   */
  addEventListener(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(event: string, callback: Function): void {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * 通知监听器
   */
  private notifyListeners(event: string, data: any): void {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)!;
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`事件监听器执行失败 (${event}):`, error);
        }
      });
    }
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 保存到剪贴板
   */
  private async saveToClipboard(requestId: string, content: string): Promise<void> {
    try {
      const data = JSON.stringify({ requestId, content, timestamp: Date.now() });
      await Clipboard.setString(data);
    } catch (error) {
      console.warn('保存到剪贴板失败:', error);
    }
  }

  /**
   * 保存到iOS App Groups
   */
  private async saveToIOSAppGroups(request: KeyboardRequest): Promise<void> {
    // 实现iOS App Groups保存逻辑
    console.log('保存到iOS App Groups:', request);
  }

  /**
   * 保存到Android SharedPreferences
   */
  private async saveToAndroidSharedPrefs(request: KeyboardRequest): Promise<void> {
    // 实现Android SharedPreferences保存逻辑
    console.log('保存到Android SharedPreferences:', request);
  }

  /**
   * 保存请求到存储
   */
  private async saveRequestToStorage(request: KeyboardRequest): Promise<void> {
    try {
      const key = `keyboard_request_${request.requestId}`;
      await AsyncStorage.setItem(key, JSON.stringify(request));
    } catch (error) {
      console.error('保存请求到存储失败:', error);
    }
  }

  /**
   * 保存响应到存储
   */
  private async saveResponseToStorage(response: KeyboardResponse): Promise<void> {
    try {
      const key = `keyboard_response_${response.requestId}`;
      await AsyncStorage.setItem(key, JSON.stringify(response));
    } catch (error) {
      console.error('保存响应到存储失败:', error);
    }
  }

  /**
   * 从存储获取响应
   */
  private async getResponseFromStorage(requestId: string): Promise<KeyboardResponse | null> {
    try {
      const key = `keyboard_response_${requestId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('从存储获取响应失败:', error);
      return null;
    }
  }

  /**
   * 加载待处理数据
   */
  private async loadPendingData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const requestKeys = keys.filter(key => key.startsWith('keyboard_request_'));
      const responseKeys = keys.filter(key => key.startsWith('keyboard_response_'));

      // 加载请求
      for (const key of requestKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const request: KeyboardRequest = JSON.parse(data);
          this.requestQueue.set(request.requestId, request);
        }
      }

      // 加载响应
      for (const key of responseKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const response: KeyboardResponse = JSON.parse(data);
          this.responseQueue.set(response.requestId, response);
        }
      }
    } catch (error) {
      console.error('加载待处理数据失败:', error);
    }
  }

  /**
   * 检查iOS App Groups访问
   */
  private async checkIOSAppGroupsAccess(): Promise<boolean> {
    // 实现iOS App Groups访问检查
    return true; // 临时返回true
  }

  /**
   * 检查Android SharedPreferences访问
   */
  private async checkAndroidSharedPrefsAccess(): Promise<boolean> {
    // 实现Android SharedPreferences访问检查
    return true; // 临时返回true
  }

  /**
   * 注册URL Scheme处理器
   */
  private registerURLSchemeHandler(): void {
    // 实现URL Scheme处理器注册
    console.log('注册URL Scheme处理器');
  }

  /**
   * 注册Intent接收器
   */
  private registerIntentReceiver(): void {
    // 实现Intent接收器注册
    console.log('注册Intent接收器');
  }

  /**
   * 设置清理间隔
   */
  private setupCleanupInterval(): void {
    // 每24小时清理一次过期数据
    setInterval(() => {
      this.cleanupExpiredData();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * 清理过期数据
   */
  private cleanupExpiredData(): void {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    // 清理过期的请求
    for (const [requestId, request] of this.requestQueue.entries()) {
      if (now - request.timestamp > twentyFourHours) {
        this.requestQueue.delete(requestId);
        AsyncStorage.removeItem(`keyboard_request_${requestId}`).catch(() => {});
      }
    }

    // 清理过期的响应
    for (const [requestId, response] of this.responseQueue.entries()) {
      if (now - response.timestamp > twentyFourHours) {
        this.responseQueue.delete(requestId);
        AsyncStorage.removeItem(`keyboard_response_${requestId}`).catch(() => {});
      }
    }
  }

  /**
   * 获取通信状态
   */
  async getStatus(): Promise<CommunicationStatus> {
    return {
      isConnected: true,
      lastSyncTime: Date.now(),
      pendingCount: this.requestQueue.size,
      platform: Platform.OS as 'ios' | 'android' | 'web',
    };
  }
}

// 导出单例实例
export const communicationService = CommunicationService.getInstance();

// 导出便捷函数
export async function handleKeyboardRequest(request: KeyboardRequest): Promise<KeyboardResponse> {
  return communicationService.handleKeyboardRequest(request);
}

export async function sendRequestFromKeyboard(type: KeyboardRequestType, content: string): Promise<string> {
  return communicationService.sendRequestFromKeyboard(type, content);
}

export async function getResponse(requestId: string): Promise<KeyboardResponse | null> {
  return communicationService.getResponse(requestId);
}

export function addCommunicationListener(event: string, callback: Function): void {
  communicationService.addEventListener(event, callback);
}

export function removeCommunicationListener(event: string, callback: Function): void {
  communicationService.removeEventListener(event, callback);
}

export async function getCommunicationStatus(): Promise<CommunicationStatus> {
  return communicationService.getStatus();
}