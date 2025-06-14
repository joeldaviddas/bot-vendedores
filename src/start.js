import { CONFIG, createDirectories, initDatabase } from './config/config.js';
import { Bot } from './bot/bot.js';
import path from 'path';

async function main() {
    try {
        console.log('🔧 Preparando entorno...');
        await createDirectories();
        await initDatabase();

        const bot = new Bot();
        let retryCount = 0;

        const startBot = async () => {
            try {
                console.log('🚀 Iniciando bot...');
                await bot.start();
            } catch (error) {
                retryCount++;
                console.error(`❌ Error al iniciar el bot (intento ${retryCount}/${CONFIG.wpp.maxRetries}): ${error.message}`);

                if (retryCount < CONFIG.wpp.maxRetries) {
                    console.log('⏳ Reintentando en 5 segundos...');
                    setTimeout(startBot, 5000);
                } else {
                    console.log('🛑 Máximo de reintentos alcanzado. El bot no pudo iniciar.');
                    process.exit(1);
                }
            }
        };

        startBot();
    } catch (error) {
        console.error('❌ Error crítico al iniciar el entorno:', error);
        process.exit(1);
    }
}

main();
