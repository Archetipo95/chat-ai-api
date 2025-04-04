import express, { Request, Response } from 'express';
import { sendMessageToChat } from '../services/chatService.js';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, userId } = req.body;
    const response = await sendMessageToChat(message, userId);
    res.status(200).json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
