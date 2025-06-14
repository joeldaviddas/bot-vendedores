const WPPConnect = require('@wppconnect-team/wppconnect');
const fs = require('fs-extra');
const path = require('path');
const { CONFIG } = require('../config/config');
const { Database } = require('../utils/database');
const { CommandHandler } = require('../commands/commandHandler');
const { MessageHandler } = require('../utils/messageHandler');

const db = new Database();
const commandHandler = new CommandHandler();
const messageHandler = new MessageHandler();

const BOT_NAME = 'JoelBot';

export class Bot {
    constructor() {
        this.client = null;
        this.isRunning = false;
    }

    async start() {
        if (this.isRunning) {
            throw new Error('El bot ya está en ejecución');
        }

        try {
            // Configurar cliente WPPConnect
            this.client = WPPConnect.create({
                session: CONFIG.wpp.sessionId,
                headless: true,
                browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
                qrTimeout: CONFIG.wpp.qrTimeout,
                logQR: true,
                singletonLock: true
            });

            // Eventos del bot
            this.setupEvents();

            this.isRunning = true;
            console.log('Bot iniciado correctamente');

        } catch (error) {
            console.error('Error al iniciar el bot:', error);
            throw error;
        }
    }

    setupEvents() {
        this.client.onMessage(async (message) => {
            try {
                // Ignorar mensajes propios
                if (message.fromMe) return;

                // Manejar mensajes nuevos
                await messageHandler.handleNewMessage(message, this.client);

                // Manejar comandos
                if (message.body?.startsWith('/')) {
                    await commandHandler.handleCommand(message, this.client, db);
                }

            } catch (error) {
                console.error('Error al procesar mensaje:', error);
                await this.client.sendText(message.from, CONFIG.messages.error);
            }
        });

        this.client.onAddedToGroup(async (group) => {
            try {
                const welcomeMessage = CONFIG.messages.welcome.replace('{name}', group.name);
                await this.client.sendText(group.id._serialized, welcomeMessage);

                // Enviar imagen de bienvenida
                const imagePath = path.resolve(__dirname, '..', 'assets', 'welcome.png');
                if (await fs.pathExists(imagePath)) {
                    await this.client.sendFileFromUrl(group.id._serialized, imagePath, 'welcome.png');
                }
            } catch (error) {
                console.error('Error al procesar nuevo grupo:', error);
            }
        });

        this.client.onAuthFailed(async () => {
            console.error('Error de autenticación. Reintentando...');
            await this.restart();
        });
    }

    async restart() {
        if (this.client) {
            await this.client.close();
        }
        this.isRunning = false;
        await this.start();
    }

    async stop() {
        if (this.client) {
            await this.client.close();
        }
        this.isRunning = false;
    }
}