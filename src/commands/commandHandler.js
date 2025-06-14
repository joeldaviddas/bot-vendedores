const { validatePhoneNumber } = require('../utils/validation');
const { createSticker } = require('../utils/stickerGenerator');

export class CommandHandler {
    constructor() {
        this.commands = {
            '/verificar': this.verificarVendedor,
            '/ban': this.banVendedor,
            '/unban': this.unbanVendedor,
            '/sticker': this.crearSticker,
            '/lista': this.mostrarLista,
            '/help': this.mostrarAyuda
        };
    }

    async handleCommand(message, client, db) {
        const [command, ...args] = message.body.split(' ');
        const handler = this.commands[command.toLowerCase()];

        if (!handler) {
            await client.sendText(message.from, 'Comando no reconocido. Escribe /help para ver los comandos disponibles.');
            return;
        }

        try {
            await handler(message, client, db, args);
        } catch (error) {
            console.error('Error al ejecutar comando:', error);
            await client.sendText(message.from, 'Error al ejecutar el comando. Por favor, intenta de nuevo.');
        }
    }

    async verificarVendedor(message, client, db, args) {
        if (args.length < 2) {
            await client.sendText(message.from, 'Uso: /verificar nombre número');
            return;
        }

        const nombre = args[0];
        const numero = args[1];

        if (!validatePhoneNumber(numero)) {
            await client.sendText(message.from, 'Número de teléfono inválido. Debe ser un número con código de país.');
            return;
        }

        const resultado = await db.registrarVendedor(nombre, numero);
        await client.sendText(message.from, resultado);
    }

    async banVendedor(message, client, db, args) {
        if (!message.isGroupAdmin) {
            await client.sendText(message.from, 'Solo los administradores pueden usar este comando.');
            return;
        }

        if (args.length < 1) {
            await client.sendText(message.from, 'Uso: /ban número');
            return;
        }

        const numero = args[0];
        if (!validatePhoneNumber(numero)) {
            await client.sendText(message.from, 'Número de teléfono inválido.');
            return;
        }

        const resultado = await db.bloquearVendedor(numero);
        await client.sendText(message.from, resultado);
    }

    async unbanVendedor(message, client, db, args) {
        if (!message.isGroupAdmin) {
            await client.sendText(message.from, 'Solo los administradores pueden usar este comando.');
            return;
        }

        if (args.length < 1) {
            await client.sendText(message.from, 'Uso: /unban número');
            return;
        }

        const numero = args[0];
        if (!validatePhoneNumber(numero)) {
            await client.sendText(message.from, 'Número de teléfono inválido.');
            return;
        }

        const resultado = await db.desbloquearVendedor(numero);
        await client.sendText(message.from, resultado);
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
            await client.sendText(message.from, 'Error al crear el sticker.');
        }
    }

    async mostrarLista(message, client, db) {
        const lista = await db.obtenerListaVendedores();
        await client.sendText(message.from, lista);
    }

    async mostrarAyuda(message, client) {
        await client.sendText(message.from, CONFIG.messages.help);
    }
}
