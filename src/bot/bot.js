/**
 * Bot de Gestión de Vendedores para WhatsApp
 * 
 * Características principales:
 * - Manejo robusto de sesiones
 * - Sistema de logs mejorado
 * - Reintentos automáticos
 * - Manejo de señales del sistema
 * - Configuración centralizada
 */

// Dependencias principales
const path = require('path');
const fs = require('fs-extra');
const wppconnect = require('@wppconnect-team/wppconnect');
const { format } = require('date-fns');
const { es } = require('date-fns/locale');

// Configuración
const CONFIG = {
  SESSION_NAME: 'bot-vendedor',
  CHROME_PATH: process.env.CHROME_PATH || '/home/codespace/.cache/puppeteer/chrome/linux-121.0.6167.85/chrome-linux64/chrome',
  PREFIX: '!',
  ALLOWED_GROUPS: (process.env.ALLOWED_GROUPS || 'VENDEDORES VERIFICADOS').split(',').map(g => g.trim()),
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '3'),
  RETRY_DELAY: parseInt(process.env.RETRY_DELAY_MS || '5000'),
  DEBUG: process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development'
};

// Rutas
const PATHS = {
  TOKENS: path.join(__dirname, '../../tokens'),
  SESSION: path.join(__dirname, '../../tokens', CONFIG.SESSION_NAME),
  LOGS: path.join(__dirname, '../../logs'),
  IMAGES: path.join(__dirname, '../images'),
  DATA: path.join(__dirname, '../data')
};

// Asegurar que existan los directorios necesarios
Object.values(PATHS).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Directorio creado: ${dir}`);
  }
});

// Sistema de logs mejorado
const logger = {
  info: (message) => console.log(`[${new Date().toISOString()}] ℹ️ INFO: ${message}`),
  error: (message, error = null) => {
    console.error(`[${new Date().toISOString()}] ❌ ERROR: ${message}`);
    if (error) console.error(error);
    
    // Guardar error en archivo
    const logMessage = `[${new Date().toISOString()}] ERROR: ${message}\n${error ? error.stack || error : ''}\n\n`;
    fs.appendFileSync(path.join(PATHS.LOGS, 'error.log'), logMessage);
  },
  debug: (message) => {
    if (CONFIG.DEBUG) {
      console.debug(`[${new Date().toISOString()}] 🐞 DEBUG: ${message}`);
    }
  }
};

// Limpiar sesiones anteriores
const cleanPreviousSession = () => {
  try {
    if (fs.existsSync(PATHS.SESSION)) {
      logger.info('🧹 Limpiando sesión anterior...');
      fs.removeSync(PATHS.SESSION);
    }
  } catch (error) {
    logger.error('Error al limpiar sesión anterior', error);
  }
};

// Cargar base de datos
const loadDatabase = () => {
  try {
    const dataPath = path.join(PATHS.DATA, 'data.json');
    if (fs.existsSync(dataPath)) {
      return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }
    return { vendedores: [], reportes: [], banned: [] };
  } catch (error) {
    logger.error('Error al cargar la base de datos', error);
    return { vendedores: [], reportes: [], banned: [] };
  }
};

// Inicializar el cliente de WhatsApp
const initializeWhatsApp = async (retryCount = 0) => {
  try {
    cleanPreviousSession();
    
    logger.info('🚀 Iniciando sesión en WhatsApp...');
    
    const client = await wppconnect.create({
      session: CONFIG.SESSION_NAME,
      headless: true,
      devtools: false,
      useChrome: true,
      logQR: true,
      disableWelcome: true,
      updatesLog: true,
      autoClose: 60000,
      createPathFileToken: true,
      waitForLogin: true,
      debug: CONFIG.DEBUG,
      browserArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-notifications',
        '--disable-web-security',
        '--disable-extensions',
        '--disable-infobars',
        '--window-size=1024,768',
        '--start-maximized'
      ],
      puppeteerOptions: {
        executablePath: CONFIG.CHROME_PATH,
        headless: true,
        defaultViewport: null,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-notifications',
          '--disable-web-security',
          '--disable-extensions',
          '--disable-infobars',
          '--window-size=1024,768',
          '--start-maximized'
        ]
      }
    });

    logger.info('✅ Conectado a WhatsApp Web');
    
    // Configurar manejadores de eventos
    setupEventHandlers(client);
    
    return client;
    
  } catch (error) {
    logger.error(`❌ Error al conectar con WhatsApp (Intento ${retryCount + 1}/${CONFIG.MAX_RETRIES})`, error);
    
    if (retryCount < CONFIG.MAX_RETRIES - 1) {
      logger.info(`⏳ Reintentando en ${CONFIG.RETRY_DELAY / 1000} segundos...`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
      return initializeWhatsApp(retryCount + 1);
    } else {
      throw new Error('Número máximo de reintentos alcanzado');
    }
  }
};

// Configurar manejadores de eventos
const setupEventHandlers = (client) => {
  const database = loadDatabase();
  
  // Evento cuando se recibe un mensaje
  client.onMessage(async (message) => {
    try {
      logger.debug(`Mensaje recibido de ${message.from}: ${message.body || '[Sin texto]'}`);
      
      // Aquí irá la lógica para manejar los mensajes
      
    } catch (error) {
      logger.error('Error al procesar mensaje', error);
    }
  });
  
  // Evento cuando se agrega un participante al grupo
  client.onParticipantsChanged((event) => {
    try {
      logger.debug(`Cambio en participantes: ${JSON.stringify(event)}`);
      // Lógica para manejar nuevos participantes
    } catch (error) {
      logger.error('Error en evento de participantes', error);
    }
  });
  
  // Manejar cierre inesperado
  process.on('SIGINT', async () => {
    logger.info('Recibida señal SIGINT. Cerrando sesión...');
    try {
      await client.close();
      process.exit(0);
    } catch (error) {
      logger.error('Error al cerrar la sesión', error);
      process.exit(1);
    }
  });
};

// Función principal
const main = async () => {
  try {
    logger.info('🚀 Iniciando Bot de Vendedores');
    
    const client = await initializeWhatsApp();
    
    // Notificar inicio exitoso
    const activationImage = path.join(PATHS.IMAGES, 'bot_activado.png');
    if (fs.existsSync(activationImage)) {
      await client.sendImage(
        CONFIG.ALLOWED_GROUPS[0],
        activationImage,
        'bot_activado.png',
        '🤖 *Bot activo y operativo*\n' +
        `🕒 ${format(new Date(), 'PPPPpppp', { locale: es })}\n` +
        '✅ Sistema estable y funcionando correctamente'
      );
    }
    
  } catch (error) {
    logger.error('Error crítico en la aplicación', error);
    process.exit(1);
  }
};

// Iniciar la aplicación
main();

// Manejar errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});
