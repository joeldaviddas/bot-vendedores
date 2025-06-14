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

// src/bot/bot.js
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
Object.entries(PATHS).forEach(([key, dir]) => {
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
            logger.info('✅ Sesión anterior eliminada correctamente');
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

// Configuración de Puppeteer
const PUPPETEER_OPTIONS = {
    headless: true,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-software-rasterizer',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-web-security',
        '--disable-notifications',
        '--disable-infobars',
        '--window-size=1024,768',
        '--remote-debugging-port=0'
    ],
    ignoreDefaultArgs: ['--disable-extensions'],
    executablePath: CONFIG.CHROME_PATH
};

// Inicializar WhatsApp
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
            browserArgs: PUPPETEER_OPTIONS.args,
            puppeteerOptions: PUPPETEER_OPTIONS
        });

        logger.info('✅ WhatsApp Web conectado correctamente');
        return client;

    } catch (error) {
        if (error.message.includes('SingletonLock') && retryCount > 0) {
            logger.info('⚠️ Advertencia: Bloqueo de sesión detectado, pero continuando...');
            return null;
        }

        logger.error(`❌ Error al conectar (Intento ${retryCount + 1}/${CONFIG.MAX_RETRIES}):`, error.message);

        if (retryCount < CONFIG.MAX_RETRIES - 1) {
            await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
            return initializeWhatsApp(retryCount + 1);
        }
        throw error;
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
            if (message.body === '!ping') {
                await client.sendText(message.from, '🏓 Pong!');
            }

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
};

// Función principal
const main = async () => {
    try {
        logger.info('🚀 Iniciando Bot de Vendedores');

        // Limpiar sesiones anteriores
        cleanPreviousSession();

        // Iniciar WhatsApp
        const client = await initializeWhatsApp();

        if (!client) {
            logger.error('No se pudo conectar a WhatsApp después de varios intentos');
            process.exit(1);
        }

        // Configurar manejadores de eventos
        setupEventHandlers(client);

        logger.info('✅ Bot iniciado correctamente');

    } catch (error) {
        logger.error('Error crítico en la aplicación:', error);
        process.exit(1);
    }
};

// Iniciar la aplicación
main();

// Manejar errores no capturados
process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});