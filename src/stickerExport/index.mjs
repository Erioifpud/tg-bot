import { Telegraf } from 'telegraf'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { message } from 'telegraf/filters'
import axios from 'axios'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import config from '../../config.json'

const agent = new HttpsProxyAgent(config.httpProxy);

const bot = new Telegraf(config.botToken, {
  telegram: {
    agent
  }
})

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFile = (file) => {
  return path.resolve(__dirname, '../temp', file)
}

bot.on(message('sticker'), async (ctx) => {
  const fileId = ctx.message.sticker.file_id;

  // 获取文件路径
  const fileData = await ctx.telegram.getFile(fileId);
  const filePath = fileData.file_path;
  const downloadUrl = `https://api.telegram.org/file/bot${bot.token}/${filePath}`;

  const response = await axios.get(downloadUrl, {
    responseType: 'arraybuffer',
    httpsAgent: agent,
    httpAgent: agent
  });
  const buffer = Buffer.from(response.data, 'binary');

  // 将webp格式的sticker转换为png格式
  const imageBuffer = await sharp(buffer).png().toBuffer();

  const fileName = 'sticker.png';

  // 将图片保存到本地
  fs.writeFileSync(getFile(fileName), imageBuffer);

  ctx.replyWithPhoto({
    source: fs.createReadStream(getFile(fileName))
  });
})

bot.launch(() => {
  console.log('Bot started')
})

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))