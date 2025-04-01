import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { StreamChat } from 'stream-chat';


dotenv.config();

const app = express();

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Initialize Stream Chat client
const streamApiKey = process.env.STREAM_API_KEY;
const streamApiSecret = process.env.STREAM_API_SECRET;

if (!streamApiKey || !streamApiSecret) {
  throw new Error('Missing Stream API key or secret');
}

// Initialize Stream Chat client
const chatClient = StreamChat.getInstance(streamApiKey, streamApiSecret);

// Register user with Stream Chat
app.post('/register-user', async (req: Request, res: Response): Promise<any> => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    // Create a user object
    const user = {
      id: email.replace(/[^a-zA-Z0-9]/g, '_'),
      name,
      email,
    }

    // Check if user already exists
    const existingUser = await chatClient.queryUsers({ id: user.id });
    if (existingUser.users.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create a new user
    await chatClient.upsertUser(user);

    res.status(200).json({
      message: `User ${name} registered successfully with ${email}`,
    });
  }
  catch (error) {
    return res.status(500).json({ error: 'Failed to register user' });
  }
})

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}
);
