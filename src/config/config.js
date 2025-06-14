import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs-extra';

// Configurar dotenv
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.warn('Archivo .env no encontrado. Usando valores por defecto.');
}

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
    const rootDir = path.dirname(new URL(import.meta.url).pathname);
    const dirs = Object.values(CONFIG.directories);

    for (const dir of dirs) {
        const fullPath = path.join(rootDir, dir);
        try {
            await fs.ensureDir(fullPath);
            console.log(`Directorio creado: ${fullPath}`);
        } catch (error) {
            console.error(`Error al crear directorio ${fullPath}:`, error);
        }
    }
}

// Inicializar base de datos
async function initDatabase() {
    try {
        const rootDir = path.dirname(new URL(import.meta.url).pathname);
        const dbPath = path.join(rootDir, CONFIG.directories.data, 'database.json');
        
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
        }
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
        throw error;
    }
}

export {
    CONFIG,
    createDirectories,
    initDatabase
};
