import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

dotenv.config();

// __dirname para módulos ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CONFIG = {
    directories: {
        logs: process.env.LOGS_DIR || './logs',
        tokens: process.env.TOKENS_DIR || './tokens',
        images: process.env.IMAGES_DIR || './images',
        data: process.env.DATA_DIR || './data'
    },

    wpp: {
        sessionId: process.env.SESSION_ID || 'whatsapp-session',
        maxRetries: parseInt(process.env.MAX_RETRIES) || 5,
        qrTimeout: parseInt(process.env.QR_TIMEOUT) || 30000
    },

    groupPermitted: process.env.GROUP_PERMITTED || 'VENDEDORES VERIFICADOS',

    messages: {
        welcome: process.env.WELCOME_MESSAGE || '¡Bienvenido/a {name}! 🎉 Soy JoelBot, tu asistente de ventas.',
        error: process.env.ERROR_MESSAGE || 'Lo siento, ha ocurrido un error. Por favor, intenta de nuevo.',
        help: process.env.HELP_MESSAGE || '/verificar nombre número\n/ban número\n/unban número\n/sticker\n/lista',
        ban: process.env.BAN_MESSAGE || 'Has sido bloqueado temporalmente.',
        maxVendedores: process.env.MAX_VENDEDORES_MESSAGE || 'Se alcanzó el máximo de vendedores.',
        registroExitoso: process.env.REGISTRO_EXITOSO_MESSAGE || '¡Registro exitoso!'
    },

    limites: {
        maxVendedores: parseInt(process.env.MAX_VENDEDORES) || 100,
        registroTimeout: parseInt(process.env.REGISTRO_TIMEOUT) || 300000,
        banTimeout: parseInt(process.env.BAN_TIMEOUT) || 86400000
    },

    stats: {
        interval: parseInt(process.env.STATS_INTERVAL) || 3600000,
        maxMessages: parseInt(process.env.STATS_MAX_MESSAGES) || 100,
        maxImages: parseInt(process.env.STATS_MAX_IMAGES) || 50
    },

    categorias: (process.env.CATEGORIAS || 'streamer,youtuber,instagram,twitch').split(','),
    categoriaDescriptions: {
        default: process.env.CATEGORIA_DEFAULT || 'streamer',
        streamer: process.env.CATEGORIA_STREAMER || 'Streamer\n- Plataformas: Twitch, YouTube\n- Límite de ventas: 100',
        youtuber: process.env.CATEGORIA_YOUTUBER || 'Youtuber\n- Plataformas: YouTube\n- Límite de ventas: 80',
        instagram: process.env.CATEGORIA_INSTAGRAM || 'Instagram\n- Plataformas: Instagram\n- Límite de ventas: 60',
        twitch: process.env.CATEGORIA_TWITCH || 'Twitch\n- Plataformas: Twitch\n- Límite de ventas: 100'
    }
};

// Crear directorios si no existen
export async function createDirectories() {
    const dirs = Object.values(CONFIG.directories);
    for (const dir of dirs) {
        const fullPath = path.resolve(__dirname, '..', dir);
        try {
            await fs.ensureDir(fullPath);
            console.log(`📁 Directorio asegurado: ${fullPath}`);
        } catch (error) {
            console.error(`❌ Error al crear directorio ${fullPath}:`, error);
        }
    }
}

// Inicializar base de datos
export async function initDatabase() {
    try {
        const dbPath = path.resolve(__dirname, '..', CONFIG.directories.data, 'database.json');

        if (!await fs.pathExists(dbPath)) {
            await fs.writeJSON(dbPath, {
                vendedores: [],
                estadisticas: {
                    mensajes: 0,
                    imagenes: 0,
                    interacciones: 0,
                    ultimaInteraccion: null
                },
                ultimaActualizacion: new Date().toISOString()
            });
            console.log(`📄 Base de datos creada en: ${dbPath}`);
        }
    } catch (error) {
        console.error('❌ Error al inicializar la base de datos:', error);
        throw error;
    }
}