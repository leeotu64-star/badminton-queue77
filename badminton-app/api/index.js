import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const STORAGE_KEY = "badminton_queue_data";

const defaultData = {
  list: [],
  locks: {
    "1번 코트": false,
    "2번 코트": false,
    "3번 코트": false,
    "4번 코트": false,
    "5번 코트": false
  },
  maxLimit: 5
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let rawData = await redis.get(STORAGE_KEY);
    let data = rawData ? (typeof rawData === 'string' ? JSON.parse(rawData) : rawData) : defaultData;

    if (req.method === 'GET') {
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { action, nickname, court, game, id, locked, value } = req.body || {};

      switch (action) {
        case 'add':
          if (!nickname || !court || !game) {
            return res.status(400).json({ success: false, message: "필수 값이 누락되었습니다." });
          }
          if (data.locks && data.locks[court]) {
            return res.status(400).json({ success: false, message: "해당 코트는 잠겼습니다." });
          }
          
          const newItem = {
            id: Math.random().toString(36).substring(2, 9),
            nickname,
            court,
            game
          };
          data.list.push(newItem);
          await redis.set(STORAGE_KEY, JSON.stringify(data));
          return res.status(200).json({ success: true });

        case 'delete':
          data.list = data.list.filter(item => item.id !== id);
          await redis.set(STORAGE_KEY, JSON.stringify(data));
          return res.status(200).json({ success: true });

        case 'setLock':
          if (data.locks) data.locks[court] = locked;
          await redis.set(STORAGE_KEY, JSON.stringify(data));
          return res.status(200).json({ success: true });

        case 'clearCourt':
          data.list = data.list.filter(item => item.court !== court);
          if (data.locks) data.locks[court] = false;
          await redis.set(STORAGE_KEY, JSON.stringify(data));
          return res.status(200).json({ success: true });

        case 'clearAll':
          data.list = [];
          Object.keys(data.locks || {}).forEach(k => data.locks[k] = false);
          await redis.set(STORAGE_KEY, JSON.stringify(data));
          return res.status(200).json({ success: true });

        case 'setLimit':
          data.maxLimit = Number(value);
          await redis.set(STORAGE_KEY, JSON.stringify(data));
          return res.status(200).json({ success: true });

        default:
          return res.status(400).json({ success: false, message: "잘못된 요청입니다." });
      }
    }
  } catch (error) {
    console.error("Server Error:", error);
    // 이제 에러가 나도 HTML이 아니라 JSON형식으로 에러를 보내서 위와 같은 'Unexpected token' 에러를 막아줍니다.
    return res.status(500).json({ success: false, message: error.message });
  }
}