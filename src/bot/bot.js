import WPPConnect from '@wppconnect-team/wppconnect';
import fs from 'fs-extra';
import path from 'path';
import { CONFIG } from '../config/config.js';
import { Database } from '../utils/database.js';
import { CommandHandler } from '../commands/commandHandler.js';
import { MessageHandler } from '../utils/messageHandler.js';

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
            this.client = WPPConnect.create({
                session: CONFIG.wpp.sessionId,
                headless: true,
                browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
                qrTimeout: CONFIG.wpp.qrTimeout,
                logQR: true,
                singletonLock: true
            });

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
                if (message.fromMe) return;

                await messageHandler.handleNewMessage(message, this.client);

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
