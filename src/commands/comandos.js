// bot.js — Bot con espera dinámica y carga confiable de grupos (ahora configurable y con múltiples grupos)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../config/.env') });
const wppconnect = require('@wppconnect-team/wppconnect');
const fs = require('fs');

const { cargarBase, logError, obtenerFechaLocal, database } = require('../utils/utils');
const { iniciarFlujoVenta } = require('../bot/flujos');
const { obtenerMentions, agregarVendedor } = require('./vendedores');

const SESSION_NAME = 'bot-vendedor';
const CHROME_PATH = '/home/codespace/.cache/puppeteer/chrome/linux-121.0.6167.85/chrome-linux64/chrome';
const ACTIVATION_IMAGE = path.join(__dirname, '../images/bot_activado.png');
const STICKER_PATH = path.join(__dirname, '../images/imagen-estafado.png');
const PREFIX = '!';
const DELAY_LISTA_GRUPOS_MS = parseInt(process.env.SYNC_DELAY_MS || '3000');
const GRUPOS_PERMITIDOS = (process.env.ALLOWED_GROUPS || 'VENDEDORES VERIFICADOS')
  .split(',')
  .map(g => g.trim());

let grupoIdPermitido = null;
let lastImageByUser = {};
const sessionDir = path.join(__dirname, 'tokens', SESSION_NAME);

cargarBase();

function iniciarBot() {
  if (fs.existsSync(sessionDir)) {
    console.warn('🧹 Eliminando carpeta de sesión completa para evitar bloqueo...');
    fs.rmSync(sessionDir, { recursive: true, force: true });
  }

  wppconnect.create({
    session: SESSION_NAME,
    headless: true,
    protocolTimeout: 60000,
    puppeteerOptions: {
      executablePath: CHROME_PATH,
      args: ['--no-sandbox']
    }
  }).then(async client => {
    global.client = client;
    console.log('✅ Conectado a WhatsApp Web');

    // Espera inicial para cargar grupos
    console.log(`⏱ Esperando sincronización de grupos...`);

    let chats = [];
    for (let i = 0; i < 5; i++) {
      await new Promise(res => setTimeout(res, DELAY_LISTA_GRUPOS_MS));
      chats = await client.listChats();
      const grupos = chats.filter(c => c.isGroup);
      if (grupos.length) break;
    }

    console.log('🔍 Lista de grupos detectados por el bot:');
    chats.filter(c => c.isGroup).forEach(g => console.log('•', g.name));

    const grupo = chats.find(c => GRUPOS_PERMITIDOS.includes(c.name));
    if (!grupo) {
      console.warn(`⚠️ Ninguno de los grupos permitidos fue encontrado: ${GRUPOS_PERMITIDOS.join(', ')}`);
      return;
    }

    grupoIdPermitido = grupo.id._serialized;

    if (fs.existsSync(ACTIVATION_IMAGE)) {
      await client.sendImage(grupoIdPermitido, ACTIVATION_IMAGE, path.basename(ACTIVATION_IMAGE), '🤖 Bot activo y operativo');
    }
    await client.sendText(grupoIdPermitido, `✅ *BOT ENCENDIDO* — ${obtenerFechaLocal()}`);

    client.onParticipantsChanged(async ({ id, participants, action }) => {
      if (id === grupoIdPermitido && action === 'add') {
        for (const p of participants) {
          await client.sendTextWithMentions(grupoIdPermitido, `👋 ¡Bienvenido @${p}!
Preséntate y dinos qué plataforma te interesa.`);
        }
      }
    });

    client.onMessage(async message => {
      try {
        const chatId = message.from;
        const senderId = message.sender?.id;
        const text = message.body?.trim() || '';

        if (chatId !== grupoIdPermitido) return;
        if (tieneFlujo(chatId, senderId)) return manejarPaso(message, client);

        if (message.type === 'image') {
          const media = await client.decryptFile(message);
          lastImageByUser[senderId] = `data:${message.mimetype};base64,${media.toString('base64')}`;
          return client.sendText(chatId, '✅ Imagen recibida. Usa *!sticker* para crear sticker.');
        }

        if (database.banned.includes(senderId)) return client.sendText(chatId, '⛔ Usuario bloqueado.');

        if (/^[a-záéíóúñ\s]{3,}\s+\d{7,15}$/i.test(text)) {
          const [nombre, telefono] = text.trim().split(/\s+/);
          if (agregarVendedor(nombre, telefono)) {
            return client.sendText(chatId, `✅ ¡Gracias ${nombre}, ahora estás verificado como vendedor!`);
          } else {
            return client.sendText(chatId, `👤 Ya estás registrado como vendedor.`);
          }
        }

        if (text.toLowerCase().includes('estafa') && fs.existsSync(STICKER_PATH)) {
          return client.sendImageAsSticker(chatId, STICKER_PATH);
        }

        if (/plataforma|comprar|quiero/i.test(text) && !text.startsWith(PREFIX)) {
          const mentions = obtenerMentions();
          if (!mentions.length) return client.sendText(chatId, '⚠️ No hay vendedores registrados.');
          return client.sendMentioned(chatId, `📢 ¡Un cliente está interesado!\n${mentions.map(id => `@${id}`).join(' ')}`, mentions);
        }

        if (text.startsWith(PREFIX)) {
          const [cmd, ...args] = text.slice(1).split(/\s+/);
          const meta = await client.getGroupMetadata(chatId);
          const senderIsAdmin = meta.participants.some(p => p.id === senderId && (p.isAdmin || p.isSuperAdmin));
          return ejecutarComando(client, chatId, cmd.toLowerCase(), args, senderId, senderIsAdmin, message);
        }
      } catch (e) {
        logError(e);
      }
    });
  }).catch(err => {
    console.error('❌ Error al iniciar:', err.message);
    console.warn('♻️ Reintentando en 3 segundos...');
    setTimeout(iniciarBot, 3000);
  });
}

iniciarBot();
