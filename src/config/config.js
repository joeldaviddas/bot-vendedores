import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs-extra';

dotenv.config();

const CONFIG = {
    // Directorios
    directories: {
        logs: process.env.LOGS_DIR || './logs',
        tokens: process.env.TOKENS_DIR || './tokens',
        images: process.env.IMAGES_DIR || './images',
        data: process.env.DATA_DIR || './data'
    },

    // Configuración de WPPConnect
    wpp: {
        sessionId: process.env.SESSION_ID || 'whatsapp-session',
        maxRetries: parseInt(process.env.MAX_RETRIES) || 5,
        qrTimeout: parseInt(process.env.QR_TIMEOUT) || 30000
    },

    // Mensajes
    messages: {
        welcome: process.env.WELCOME_MESSAGE || '¡Bienvenido/a {name}! 🎉 Soy JoelBot, tu asistente de ventas.',
        error: process.env.ERROR_MESSAGE || 'Lo siento, ha ocurrido un error. Por favor, intenta de nuevo.',
        help: process.env.HELP_MESSAGE || '/verificar - Registra un nuevo vendedor\n/ban - Bloquea a un vendedor\n/unban - Desbloquea a un vendedor\n/sticker - Crea sticker de la última imagen\n/lista - Muestra lista de vendedores'
    }
};

// Crear directorios si no existen
async function createDirectories() {
    try {
        const dirs = Object.values(CONFIG.directories);
        for (const dir of dirs) {
            await fs.ensureDir(path.resolve(__dirname, '..', dir));
        }
    } catch (error) {
        console.error('Error al crear directorios:', error);
        throw error;
    }
}

// Inicializar base de datos
async function initDatabase() {
    try {
        const dbPath = path.resolve(__dirname, '..', CONFIG.directories.data, 'database.json');
        if (!await fs.pathExists(dbPath)) {
            await fs.writeJSON(dbPath, {
                vendedores: [],
                bloqueados: [],
                logs: [],
                lastImages: {}
            });
        }
    } catch (error) {
        console.error('Error al inicializar base de datos:', error);
        throw error;
    }
}

export {
    CONFIG,
    createDirectories,
    initDatabase
};
