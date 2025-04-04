import { StreamChat } from 'stream-chat';

export const initChatClient = () => {
  const streamApiKey = process.env.STREAM_API_KEY;
  const streamApiSecret = process.env.STREAM_API_SECRET;

  if (!streamApiKey || !streamApiSecret) {
    throw new Error('Missing Stream API key or secret');
  }

  return StreamChat.getInstance(streamApiKey, streamApiSecret);
};
