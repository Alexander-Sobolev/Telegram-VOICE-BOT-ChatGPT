import { Telegraf, session } from 'telegraf'
import { message } from 'telegraf/filters'
import { code } from 'telegraf/format'
import config from 'config'
import { ogg } from './ogg.js'
import { openai } from './openai.js'
import { initCommand } from './utils.js'

console.log(config.get('TEST_ENV'))

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'))
const INITIAL_SESSION = {
  messages: [],
  conversations: [],
}

bot.use(session())

bot.command(
  'new',
  initCommand('Начат новый диалог. Жду голосовое или текстовое сообщение.')
)

bot.command(
  'start',
  initCommand(
    'Добро пожаловать в бота. Отправьте голосовое или текстовое сообщение для общение с ChatGPT.'
  )
)

bot.on(message('voice'), async (ctx) => {
  ctx.session ??= INITIAL_SESSION
  try {
    await ctx.reply(code('Я тебя услышал. Жду ответ от сервера...'))
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id)
    const userId = String(ctx.message.from.id)
    console.log(link.href)
    const oggPath = await ogg.create(link.href, userId)
    const mp3Path = await ogg.toMp3(oggPath, userId)

    const text = await openai.transcription(mp3Path)
    await ctx.reply(code(`Ваш вопрос: ${text}`))

    ctx.session.messages.push({role: openai.roles.USER, content: text})
    const response = await openai.chat(ctx.session.messages)
    ctx.session.messages.push({role: openai.roles.ASSISTANT, content: response.content})
    
    await ctx.reply(response.content)
  } catch (e) {
    console.log(`Error while voice message`, e.message)
  }
})

bot.on(message('text'), async (ctx) => {
  ctx.session ??= INITIAL_SESSION
  try {
    await ctx.reply(code('Я тебя услышал. Жду ответ от сервера...'))

    const text = await openai.transcription()

    ctx.session.messages.push({role: openai.roles.USER, content: ctx.message.text})
    const response = await openai.chat(ctx.session.messages)
    ctx.session.messages.push({role: openai.roles.ASSISTANT, content: response.content})
    
    await ctx.reply(response.content)
  } catch (e) {
    console.log(`Error while voice message`, e.message)
  }
})

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))