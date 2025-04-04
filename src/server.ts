import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { StreamChat } from 'stream-chat';
// import OpenAI from 'openai';
import { db } from './config/database.js'
import { chats, users } from './db/schema.js';
import { eq } from 'drizzle-orm';

// constants
const API_REGISTER_USER = '/register-user';
const API_CHAT = '/chat';
const LLM_BASE_URL = 'http://localhost:1234';
const LLM_MODEL = 'deepseek-r1-distill-qwen-7b';

const initChatClient = () => {
  const streamApiKey = process.env.STREAM_API_KEY;
  const streamApiSecret = process.env.STREAM_API_SECRET;

  if (!streamApiKey || !streamApiSecret) {
    throw new Error('Missing Stream API key or secret');
  }

  const chatClient = StreamChat.getInstance(streamApiKey, streamApiSecret);
  return chatClient;
}

// const initOpenAIClient = () => {
//   const openAiApiKey = process.env.OPENAI_API_KEY;

//   if (!openAiApiKey) {
//     throw new Error('Missing OpenAI API key');
//   }

//   const openAiClient = new OpenAI({
//     apiKey: openAiApiKey,
//   });

//   return openAiClient;
// }

dotenv.config();

const app = express();

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

const chatClient = initChatClient();
// const openAiClient = initOpenAIClient();

// Register user to Stream Chat and Neon DB
app.post(API_REGISTER_USER, async (req: Request, res: Response): Promise<any> => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const userId = email.replace(/[^a-zA-Z0-9]/g, '_')

  try {
    // Create a user object
    const user = {
      id: userId,
      name,
      email,
    }

    // Check if user already exists
    const existingUser = await chatClient.queryUsers({ id: user.id });
    if (existingUser.users.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create a new user in the Stream Chat
    await chatClient.upsertUser(user);

    // Check if user already exists in the database
    const existingUserInDb = await db
      .select()
      .from(users)
      .where(eq(users.userId, user.id));

    if (existingUserInDb.length > 0) {
      return res.status(400).json({ error: 'User already exists in the database' });
    }

    // Insert user into the database
    await db.insert(users).values({ userId, name, email });

    res.status(200).json({
      message: `User ${name} registered successfully with ${email} on Neon DB, and Stream Chat with ID ${user.id}`,
    });
  }
  catch (error) {
    return res.status(500).json({ error: `Failed to register user: ${error}` });
  }
})

// Send message to LLM
app.post(API_CHAT, async (req: Request, res: Response): Promise<any> => {
  const { message, userId } = req.body;

  if (!message || !userId) {
    return res.status(400).json({ error: 'Message and user ID are required' });
  }

  try {
    // Check if user exists
    const existingUser = await chatClient.queryUsers({ id: userId });

    if (existingUser.users.length === 0) {
      return res.status(404).json({ error: 'User not found in Stream, please register first' });
    }

    // Check if user exists in the database
    // Check if user already exists in the database
    const existingUserInDb = await db
      .select()
      .from(users)
      .where(eq(users.userId, userId));

    if (existingUserInDb.length === 0) {
      return res.status(404).json({ error: 'User not found in the database, please register first' });
    }

    // Send message to LLM
    const response = await fetch(`${LLM_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: -1,
        stream: false,
      }),
    });

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to get response from LLM' });
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message?.content ?? 'No response from LLM';

    // Save chat to Neon DB
    await db.insert(chats).values({ userId, message, reply: aiMessage });

    // Create or Get channel
    const channel = chatClient.channel('messaging', `chat-${userId}`, {
      name: `Ai chat ${userId}`,
      created_by_id: 'ai_bot',
    });

    await channel.create();
    await channel.sendMessage({
      text: aiMessage,
      user_id: 'ai_bot',
    })

    // Send response back to the client
    res.status(200).json({
      replay: aiMessage,
    });
  }
  catch (error) {
    return res.status(500).json({ error: `Failed to send message to LLM: ${error}` });
  }
})


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
