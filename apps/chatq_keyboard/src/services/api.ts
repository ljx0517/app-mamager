import { GenerateRequest, GenerateResponse } from '../types';

// API 基础地址 - 可在设置中配置
let API_BASE_URL = 'https://api.example.com';

// 设置 API 基础地址
export function setApiBaseUrl(url: string): void {
  API_BASE_URL = url;
}

// 获取 API 基础地址
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

// 模拟 AI 生成回复（开发阶段使用）
async function mockGenerateReply(content: string): Promise<string> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 生成简单的模拟回复
  const replies = [
    `好的，我理解您说的是："${content.slice(0, 50)}${content.length > 50 ? '...' : ''}"`,
    `收到您的消息：${content.slice(0, 30)}${content.length > 30 ? '...' : ''}`,
    `感谢您的分享。基于您提供的内容，我会这样回复...`,
    `我已收到：${content.slice(0, 20)}${content.length > 20 ? '...' : ''}。这是我的回复建议。`,
  ];

  return replies[Math.floor(Math.random() * replies.length)];
}

// 生成回复
export async function generateReply(request: GenerateRequest): Promise<GenerateResponse> {
  const { content } = request;

  if (!content || content.trim() === '') {
    throw new Error('内容不能为空');
  }

  // TODO: 当有真实 API 时，替换为以下代码：
  // const response = await fetch(`${API_BASE_URL}/chat`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     // 'Authorization': `Bearer ${apiKey}`
  //   },
  //   body: JSON.stringify({ message: content }),
  // });
  //
  // if (!response.ok) {
  //   throw new Error(`API 请求失败: ${response.status}`);
  // }
  //
  // return response.json();

  // 当前使用模拟回复
  const reply = await mockGenerateReply(content);
  return { reply };
}
