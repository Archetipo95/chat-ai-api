import { db } from '../config/database.js';
import { chats, users } from '../db/schema.js';
import { initChatClient } from '../utils/initClients.js';
import { eq } from 'drizzle-orm';

const LLM_BASE_URL = 'http://localhost:1234';
const LLM_MODEL = 'deepseek-r1-distill-qwen-7b';

export const sendMessageToChat = async (message: string, userId: string) => {
  if (!message || !userId) {
    throw new Error('Message and user ID are required');
  }

  const chatClient = initChatClient();
  const existingUser = await chatClient.queryUsers({ id: userId });

  if (existingUser.users.length === 0) {
    throw new Error('User not found in Stream, please register first');
  }

  const existingUserInDb = await db.select().from(users).where(eq(users.userId, userId));

  if (existingUserInDb.length === 0) {
    throw new Error('User not found in the database, please register first');
  }

  const response = await fetch(`${LLM_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [{ role: 'user', content: message }],
      temperature: 0.7,
      max_tokens: -1,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get response from LLM');
  }

  const data = await response.json();
  const aiMessage = data.choices[0].message?.content ?? 'No response from LLM';

  await db.insert(chats).values({ userId, message, reply: aiMessage });

  const channel = chatClient.channel('messaging', `chat-${userId}`, {
    name: `Ai chat ${userId}`,
    created_by_id: 'ai_bot',
  });

  await channel.create();
  await channel.sendMessage({ text: aiMessage, user_id: 'ai_bot' });

  return { replay: aiMessage };
};

export const getMessages = async (userId: string) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const chatHistory = await db.select().from(chats).where(eq(chats.userId, userId));

  return { messages: chatHistory };
};
