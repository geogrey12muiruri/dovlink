import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL, // Will use the Upstash URL from .env
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
  await redisClient.connect();
  console.log('Connected to Upstash Redis');
})();

export default redisClient;