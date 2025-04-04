import { db } from '../config/database.js';
import { users } from '../db/schema.js';
import { initChatClient } from '../utils/initClients.js';
import { eq } from 'drizzle-orm';

export const registerUser = async (name: string, email: string) => {
  if (!name || !email) {
    throw new Error('Name and email are required');
  }

  const userId = email.replace(/[^a-zA-Z0-9]/g, '_');
  const chatClient = initChatClient();

  const user = { id: userId, name, email };
  const existingUser = await chatClient.queryUsers({ id: user.id });

  // if (existingUser.users.length > 0) {
  //   throw new Error('User already exists in Stream, please use a different email');
  // }

  if (!existingUser.users.length) {
    await chatClient.upsertUser(user);
  }

  const existingUserInDb = await db.select().from(users).where(eq(users.userId, user.id));

  // if (existingUserInDb.length > 0) {
  //   throw new Error('User already exists in the Neon DB, please use a different email');
  // }

  if (!existingUserInDb.length) {
    await db.insert(users).values({ userId, name, email });
  }

  return { userId, name, email };
};
