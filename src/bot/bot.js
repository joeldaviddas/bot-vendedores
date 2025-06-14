import fs from 'fs-extra';
import path from 'path';
import qrcode from 'qrcode-terminal';
import wppconnect from '@wppconnect-team/wppconnect';
import cron from 'node-cron';
import { Database } from '../utils/database.js';
import { MessageHandler } from '../utils/messageHandler.js';
import { CommandHandler } from '../commands/commandHandler.js';
import { CONFIG } from '../config/config.js';

export class Bot {
    constructor() {
        this.db = new Database();
        this.messageHandler = new MessageHandler();
        this.commandHandler = new CommandHandler();
        this.client = null;
        this.isRunning = false;
    }

    async start() {
        try {
            if (this.isRunning) {
                console.log('El bot ya está en ejecución.');
                return;
            }

            const tokenDir = path.resolve('./tokens', CONFIG.wpp.sessionId);
            const lockPath = path.join(tokenDir, 'SingletonLock');
            if (await fs.pathExists(lockPath)) {
                await fs.remove(lockPath);
                console.warn('⚠️ Archivo SingletonLock eliminado para evitar conflictos de navegador.');
            }

            const session = await wppconnect.create({
                session: CONFIG.wpp.sessionId,
                headless: false, // Para ver el navegador
                retryQR: CONFIG.wpp.maxRetries,
                qrTimeout: CONFIG.wpp.qrTimeout,
                browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
                logQR: true,
                killProcess: true,
                waitForLogin: true,
                waitForConnection: true,
                waitForMessage: true,
                waitForMessageSent: true
            });

            this.client = session;
            this.setupEvents();
            this.scheduleDailyReminder();
            this.isRunning = true;

        } catch (error) {
            console.error('❌ Error al iniciar el bot:', error);
            throw error;
        }
    }

    setupEvents() {
        this.client.on('qr', (qr) => {
            console.log('📲 Escanea este código QR para iniciar sesión:');
            qrcode.generate(qr, { small: true });
        });

        this.client.on('ready', async () => {
            console.log('✅ Bot conectado y listo.');
            try {
                const groups = await this.client.getAllGroups();
                const group = groups.find(g => g.name === CONFIG.groupPermitted);
                if (group) {
                    await this.client.sendText(group.id._serialized, '🤖 ¡El bot se ha iniciado correctamente!');
                    console.log('📢 Mensaje de bienvenida enviado al grupo.');
                } else {
                    console.warn('⚠️ Grupo no encontrado para enviar mensaje de inicio.');
                }
            } catch (error) {
                console.error('❌ Error al enviar mensaje de inicio al grupo:', error);
            }
        });

        this.client.on('message', async (message) => {
            try {
                if (message.isGroup) {
                    const groupInfo = await this.client.getGroupInfo(message.from);
                    if (groupInfo.title === CONFIG.groupPermitted) {
                        await this.handleGroupMessage(message);
                    } else {
                        console.log(`📭 Mensaje ignorado de grupo no permitido: ${groupInfo.title}`);
                    }
                } else {
                    await this.handlePrivateMessage(message);
                }
            } catch (error) {
                console.error('❌ Error al procesar mensaje:', error);
                await this.client.sendText(message.from, CONFIG.messages.error);
            }
        });

        this.client.on('disconnected', () => {
            console.log('⚠️ Bot desconectado. Esperando reconexión...');
            this.isRunning = false;
        });

        this.client.on('error', (error) => {
            console.error('❌ Error del cliente:', error);
        });
    }

    async handleGroupMessage(message) {
        try {
            const groupInfo = await this.client.getGroupInfo(message.from);
            if (groupInfo.title !== CONFIG.groupPermitted) {
                console.log(`📭 Grupo ignorado: ${groupInfo.title}`);
                return;
            }

            if (message.isGroupAdmin) {
                await this.commandHandler.handleCommand(message, this.client, this.db);
            } else {
                await this.messageHandler.handleNewMessage(message, this.client);
            }
        } catch (error) {
            console.error('❌ Error en mensaje de grupo:', error);
            await this.client.sendText(message.from, CONFIG.messages.error);
        }
    }

    async handlePrivateMessage(message) {
        try {
            await this.commandHandler.handleCommand(message, this.client, this.db);
        } catch (error) {
            console.error('❌ Error en mensaje privado:', error);
            await this.client.sendText(message.from, CONFIG.messages.error);
        }
    }

    async stop() {
        if (this.client) {
            await this.client.close();
        }
        this.isRunning = false;
    }

    scheduleDailyReminder() {
        cron.schedule('0 8 * * *', async () => {
            try {
                const groups = await this.client.getAllGroups();
                const targetGroup = groups.find(group => group.name === CONFIG.groupPermitted);
                if (targetGroup) {
                    await this.client.sendText(
                        targetGroup.id._serialized,
                        '📣 ¡Recuerda registrar tus ventas del día! Usa /verificar para reportarlas. ✅'
                    );
                    console.log('📤 Recordatorio diario enviado.');
                } else {
                    console.warn('⚠️ Grupo autorizado no encontrado para enviar recordatorio.');
                }
            } catch (error) {
                console.error('❌ Error al enviar recordatorio automático:', error);
            }
        }, {
            timezone: 'America/Bogota'
        });
    }
}