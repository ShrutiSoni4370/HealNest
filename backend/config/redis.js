import redis from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = redis.createClient({
  url: process.env.REDIS_URL, // Use the full Redis Cloud URL
  password: process.env.REDIS_PASSWORD, // if separate
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

export async function connectRedis() {
  try {
    await redisClient.connect();
    console.log('✅ Connected to Redis Cloud');
  } catch (err) {
    console.error('❌ Failed to connect to Redis:', err);
  }
}

export default redisClient;
