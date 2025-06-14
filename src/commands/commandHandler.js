import { validatePhoneNumber } from '../utils/validation.js';
import { createSticker } from '../utils/stickerGenerator.js';
import { MenuHandler } from '../utils/menuHandler.js';

export class CommandHandler {
    constructor() {
        this.menuHandler = new MenuHandler();
        this.commands = {
            '/verificar': this.verificarVendedor,
            '/ban': this.banVendedor,
            '/unban': this.unbanVendedor,
            '/sticker': this.crearSticker,
            '/lista': this.mostrarLista,
            '/help': this.mostrarAyuda,
            '/menu': this.mostrarMenu
        };
    }

    async handleCommand(message, client, db) {
        try {
            const [command, ...args] = message.body.split(' ');
            const handler = this.commands[command.toLowerCase()];

            if (!handler) {
                // Verificar si es un número para el menú
                const number = parseInt(command);
                if (!isNaN(number)) {
                    await this.menuHandler.handleNumberInput(message, client);
                    return;
                }

                await client.sendText(message.from, 'Comando no reconocido. Escribe /help para ver los comandos disponibles.');
                return;
            }

            await handler(message, client, db, args);
        } catch (error) {
            console.error('Error al ejecutar comando:', error);
            await client.sendText(message.from, 'Error al ejecutar el comando. Por favor, intenta de nuevo.');
        }
    }

    async mostrarMenu(message, client) {
        await this.menuHandler.showPrincipalMenu(message, client);
    }

    async verificarVendedor(message, client, db, args) {
        try {
            if (args.length < 2) {
                await client.sendText(message.from, 'Uso: /verificar nombre número');
                return;
            }

            const nombre = args[0];
            const numero = args[1];

            if (!await db.validatePhoneNumber(numero)) {
                await client.sendText(message.from, 'Número de teléfono inválido. Debe ser un número con código de país.');
                return;
            }

            const resultado = await db.registrarVendedor(nombre, numero);
            await client.sendText(message.from, resultado);
        } catch (error) {
            console.error('Error al verificar vendedor:', error);
            await client.sendText(message.from, 'Error al registrar vendedor. Por favor, intenta de nuevo.');
        }
    }

    async banVendedor(message, client, db, args) {
        try {
            if (!message.isGroupAdmin) {
                await client.sendText(message.from, 'Solo los administradores pueden usar este comando.');
                return;
            }

            if (args.length < 1) {
                await client.sendText(message.from, 'Uso: /ban número');
                return;
            }

            const numero = args[0];
            if (!await db.validatePhoneNumber(numero)) {
                await client.sendText(message.from, 'Número de teléfono inválido.');
                return;
            }

            const resultado = await db.bloquearVendedor(numero);
            await client.sendText(message.from, resultado);
        } catch (error) {
            console.error('Error al banear vendedor:', error);
            await client.sendText(message.from, 'Error al bloquear vendedor. Por favor, intenta de nuevo.');
        }
    }

    async unbanVendedor(message, client, db, args) {
        try {
            if (!message.isGroupAdmin) {
                await client.sendText(message.from, 'Solo los administradores pueden usar este comando.');
                return;
            }

            if (args.length < 1) {
                await client.sendText(message.from, 'Uso: /unban número');
                return;
            }

            const numero = args[0];
            if (!await db.validatePhoneNumber(numero)) {
                await client.sendText(message.from, 'Número de teléfono inválido.');
                return;
            }

            const resultado = await db.desbloquearVendedor(numero);
            await client.sendText(message.from, resultado);
        } catch (error) {
            console.error('Error al desbanear vendedor:', error);
            await client.sendText(message.from, 'Error al desbloquear vendedor. Por favor, intenta de nuevo.');
        }
    }

    async crearSticker(message, client, db, args) {
        try {
            const lastImage = await db.getLastImage(message.from);
            if (!lastImage) {
                await client.sendText(message.from, 'No hay ninguna imagen para convertir en sticker.');
                return;
            }

            const sticker = await createSticker(lastImage);
            await client.sendFileFromUrl(message.from, sticker.url, 'sticker.webp');
        } catch (error) {
            console.error('Error al crear sticker:', error);
            await client.sendText(message.from, 'Error al crear el sticker. Por favor, intenta de nuevo.');
        }
    }

    async mostrarLista(message, client, db) {
        try {
            const lista = await db.obtenerListaVendedores();
            await client.sendText(message.from, lista);
        } catch (error) {
            console.error('Error al mostrar lista:', error);
            await client.sendText(message.from, 'Error al mostrar la lista de vendedores. Por favor, intenta de nuevo.');
        }
    }

    async mostrarAyuda(message, client) {
        try {
            const ayuda = `
📌 *Ayuda - Vendedores de Streaming*

👤 *Comandos de Vendedor:*
/actualizar - Actualizar información
/categoria - Ver o cambiar categoría
/estadisticas - Ver tus estadísticas

👥 *Comandos de Admin:*
/ban - Bloquear vendedor
/unban - Desbloquear vendedor
/lista - Mostrar lista de vendedores
/estadisticas - Ver estadísticas del grupo

📝 *Formatos:*
1 *nombre* *número* - Registro
/categoria *nombre* - Cambiar categoría
/actualizar *nombre* *número* - Actualizar datos

💡 *Recuerda:*
- No hay comisiones, solo conectamos vendedores con clientes
- Mantén un comportamiento profesional
- Respeta a los demás vendedores
- No hacer spam
- Ser transparente con tus precios
- Este es un espacio para vendedores de streaming
`;
            await client.sendText(message.from, ayuda);
        } catch (error) {
            console.error('Error al mostrar ayuda:', error);
            await client.sendText(message.from, 'Error al mostrar la ayuda. Por favor, intenta de nuevo.');
        }
    }
}
