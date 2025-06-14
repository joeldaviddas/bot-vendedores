import fs from 'fs-extra';
import path from 'path';
import qrcode from 'qrcode-terminal';
import { Database } from '../utils/database.js';
import { MessageHandler } from '../utils/messageHandler.js';
import { CommandHandler } from '../commands/commandHandler.js';
import wppconnect from '@wppconnect-team/wppconnect/dist/wppconnect.cjs';
import { CONFIG } from '../config/config.js';

export class Bot {
    constructor() {
        this.client = new wppconnect.Client({
            session: CONFIG.wpp.sessionId,
            headless: true,
            retryQR: CONFIG.wpp.maxRetries,
            qrTimeout: CONFIG.wpp.qrTimeout,
            browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
            logQR: true,
            statusFind: true,
            statusFindTimeout: 30000,
            killProcess: true,
            killProcessTimeout: 20000,
            waitForLogin: true,
            waitForLoginTimeout: 60000,
            waitForConnection: true,
            waitForConnectionTimeout: 60000,
            waitForMessage: true,
            waitForMessageTimeout: 60000,
            waitForMessageSent: true,
            waitForMessageSentTimeout: 60000
        });

        // Eventos del cliente
        this.client.on('qr', (qr) => {
            console.log('QR generado. Escanea con tu teléfono WhatsApp:');
            qrcode.generate(qr, { small: true });
        });

        this.client.on('ready', () => {
            console.log('Bot conectado y listo');
        });

        this.client.on('message', async (message) => {
            try {
                await this.messageHandler.handleNewMessage(message, this.client);
            } catch (error) {
                console.error('Error al procesar mensaje:', error);
            }
        });

        this.client.on('error', (error) => {
            console.error('Error del cliente:', error);
        });

        this.client.on('disconnected', () => {
            console.log('Bot desconectado');
        });

        // Inicializar cliente
        this.client.initialize();

        // Eventos del cliente
        this.client.on('ready', () => {
            console.log('Bot conectado y listo');
        });

        this.client.on('message', async (message) => {
            try {
                await this.messageHandler.handleNewMessage(message, this.client);
            } catch (error) {
                console.error('Error al procesar mensaje:', error);
            }
        });

        this.client.on('error', (error) => {
            console.error('Error del cliente:', error);
        });

        this.client.on('disconnected', () => {
            console.log('Bot desconectado');
        });
        this.db = new Database();
        this.messageHandler = new MessageHandler();
        this.commandHandler = new CommandHandler();
        this.isRunning = false;
    }

    async start() {
        try {
            if (this.isRunning) {
                console.log('El bot ya está en ejecución.');
                return;
            }

            await this.client.initialize();
            this.isRunning = true;

            // Evento de conexión
            this.client.on('ready', () => {
                console.log('Bot conectado y listo para usar.');
            });

            // Evento de mensaje
            this.client.on('message', async message => {
                try {
                    // Verificar si es un mensaje de grupo
                    if (message.isGroup) {
                        // Verificar si es el grupo permitido
                        const groupInfo = await this.client.getGroupInfo(message.from);
                        if (groupInfo.title === CONFIG.groupPermitted) {
                            await this.handleGroupMessage(message);
                        } else {
                            console.log(`Mensaje ignorado - Grupo no permitido: ${groupInfo.title}`);
                            return;
                        }
                    } else {
                        // Manejar mensajes privados
                        await this.handlePrivateMessage(message);
                    }
                } catch (error) {
                    console.error('Error al procesar mensaje:', error);
                    await this.client.sendText(message.from, CONFIG.messages.error);
                }
            });

            // Evento de desconexión
            this.client.on('disconnected', () => {
                console.log('Bot desconectado. Intentando reconectar...');
                this.isRunning = false;
            });

        } catch (error) {
            console.error('Error al iniciar el bot:', error);
            throw error;
        }
    }

    async handleGroupMessage(message) {
        try {
            const groupInfo = await this.client.getGroupInfo(message.from);
            if (groupInfo.title !== CONFIG.groupPermitted) {
                console.log(`Mensaje ignorado - Grupo no permitido: ${groupInfo.title}`);
                return;
            }

            if (message.isGroupAdmin) {
                await this.commandHandler.handleCommand(message, this.client, this.db);
            } else {
                await this.messageHandler.handleNewMessage(message, this.client);
            }
        } catch (error) {
            console.error('Error al manejar mensaje de grupo:', error);
            await this.client.sendText(message.from, CONFIG.messages.error);
        }
    }

    async handlePrivateMessage(message) {
        try {
            await this.commandHandler.handleCommand(message, this.client, this.db);
        } catch (error) {
            console.error('Error al manejar mensaje privado:', error);
            await this.client.sendText(message.from, CONFIG.messages.error);
        }
    }

    async stop() {
        if (this.client) {
            await this.client.close();
        }
        this.isRunning = false;
    }
}