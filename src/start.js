const { CONFIG, createDirectories, initDatabase } = require('./config/config');
const { Bot } = require('./bot/bot');
const path = require('path');

async function main() {
    try {
        // Crear directorios necesarios
        await createDirectories();
        await initDatabase();

        // Inicializar bot
        const bot = new Bot();
        
        // Manejar reinicios
        let retryCount = 0;
        
        const startBot = async () => {
            try {
                console.log('Iniciando bot...');
                await bot.start();
            } catch (error) {
                retryCount++;
                if (retryCount <= CONFIG.wpp.maxRetries) {
                    console.error(`Error al iniciar el bot. Intento ${retryCount}/${CONFIG.wpp.maxRetries}`);
                    console.error(error.message);
                    console.log(`Reintentando en 5 segundos...`);
                    setTimeout(startBot, 5000);
                } else {
                    console.error('Máximo de reintentos alcanzado. El bot no pudo iniciar.');
                    process.exit(1);
                }
            }
        };

        startBot();

    } catch (error) {
        console.error('Error al iniciar el bot:', error);
        process.exit(1);
    }
}

main();
