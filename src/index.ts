import express from 'express';
import cors from 'cors';
import dotenvConfig from './config/dotenv.js';
import chatRouter from './controllers/chatController.js';
import userRouter from './controllers/registerUserController.js';

dotenvConfig();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/register-user', userRouter);
app.use('/chat', chatRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
