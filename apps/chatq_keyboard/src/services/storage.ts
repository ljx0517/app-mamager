import * as SQLite from 'expo-sqlite';
import { ChatMessage, Conversation } from '../types';

const DB_NAME = 'yourkeeboard.db';

let db: SQLite.SQLiteDatabase | null = null;

// 初始化数据库
export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync(DB_NAME);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversationId INTEGER NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE
    );
  `);
}

// 创建新对话
export async function createConversation(title: string): Promise<Conversation> {
  if (!db) throw new Error('Database not initialized');

  const now = Date.now();
  const result = await db.runAsync(
    'INSERT INTO conversations (title, createdAt, updatedAt) VALUES (?, ?, ?)',
    [title, now, now]
  );

  return {
    id: result.lastInsertRowId,
    title,
    createdAt: now,
    updatedAt: now,
  };
}

// 获取所有对话
export async function getConversations(): Promise<Conversation[]> {
  if (!db) throw new Error('Database not initialized');

  const rows = await db.getAllAsync<Conversation>(
    'SELECT * FROM conversations ORDER BY updatedAt DESC'
  );
  return rows;
}

// 获取对话的消息
export async function getMessages(conversationId: number): Promise<ChatMessage[]> {
  if (!db) throw new Error('Database not initialized');

  const rows = await db.getAllAsync<ChatMessage>(
    'SELECT * FROM messages WHERE conversationId = ? ORDER BY createdAt ASC',
    [conversationId]
  );
  return rows;
}

// 添加消息
export async function addMessage(
  conversationId: number,
  role: 'user' | 'assistant',
  content: string
): Promise<ChatMessage> {
  if (!db) throw new Error('Database not initialized');

  const now = Date.now();
  const result = await db.runAsync(
    'INSERT INTO messages (conversationId, role, content, createdAt) VALUES (?, ?, ?, ?)',
    [conversationId, role, content, now]
  );

  // 更新对话的更新时间
  await db.runAsync(
    'UPDATE conversations SET updatedAt = ? WHERE id = ?',
    [now, conversationId]
  );

  return {
    id: result.lastInsertRowId,
    conversationId,
    role,
    content,
    createdAt: now,
  };
}

// 删除对话及其消息
export async function deleteConversation(id: number): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync('DELETE FROM messages WHERE conversationId = ?', [id]);
  await db.runAsync('DELETE FROM conversations WHERE id = ?', [id]);
}

// 更新对话标题
export async function updateConversationTitle(
  id: number,
  title: string
): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync(
    'UPDATE conversations SET title = ?, updatedAt = ? WHERE id = ?',
    [title, Date.now(), id]
  );
}
