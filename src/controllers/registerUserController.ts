import express, { Request, Response } from 'express';
import { registerUser } from '../services/userService.js';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;
    const response = await registerUser(name, email);
    res.status(200).json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
