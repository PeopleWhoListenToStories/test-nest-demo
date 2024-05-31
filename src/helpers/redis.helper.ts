import Redis from 'ioredis';
import { RedisDBEnum } from 'src/constant';
const { config: envConfig } = require('../../config/env')

export const buildRedis = (db: RedisDBEnum): Promise<Redis> => {
  const config = envConfig
  const redisConfig = {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    username: "default",
    password: config.REDIS_PASSWORD,
    db: 1
  };
  if (!redisConfig.host || !redisConfig.port || !redisConfig.password) {
    console.error('[xl-online-editing-server] Redis 未配置，无法启动 Redis 服务');
    return;
  }

  return new Promise((resolve, reject) => {
    const redis = new Redis({
      ...redisConfig,
      showFriendlyErrorStack: true,
      lazyConnect: true,
      db,
    });
    redis.on('ready', () => {
      resolve(redis);
    });
    redis.on('error', (err) => {
      reject(err);
    });
    redis.connect().catch((err) => {
      reject(err);
    });
  });
};
