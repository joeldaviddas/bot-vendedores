import { Database } from './database.js';

export class MessageHandler {
    constructor() {
        this.keywords = ['comprar', 'estafa', 'plataforma'];
    }

    async handleNewMessage(message, client) {
        try {
            // Guardar imagen si es una imagen
            if (message.type === 'image') {
                await Database.saveLastImage(message.from, message.body);
            }

            // Detectar palabras clave
            if (this.keywords.some(keyword => message.body.toLowerCase().includes(keyword))) {
                await this.handleKeyword(message, client);
            }

            // Registrar mensaje en logs
            await Database.logMessage(message);

        } catch (error) {
            console.error('Error al procesar mensaje:', error);
            await client.sendText(message.from, 'Error al procesar el mensaje. Por favor, intenta de nuevo.');
        }
    }

    async handleKeyword(message, client) {
        try {
            // Si alguien menciona comprar, mencionar a los vendedores
            if (message.body.toLowerCase().includes('comprar')) {
                const vendedores = await Database.obtenerVendedoresActivos();
                if (vendedores.length > 0) {
                    const mentionText = `¡Hola! Los vendedores disponibles son: ${vendedores.map(v => `@${v.numero}`).join(' ')}`;
                    await client.sendText(message.from, mentionText);
                }
            }

            // Si alguien menciona estafa, advertir al grupo
            if (message.body.toLowerCase().includes('estafa')) {
                await client.sendText(message.from, '🚨 Alerta de posible estafa. Por favor, verifiquen siempre a los vendedores antes de realizar compras.');
            }

        } catch (error) {
            console.error('Error al manejar palabra clave:', error);
            await client.sendText(message.from, 'Error al procesar la palabra clave. Por favor, intenta de nuevo.');
        }
    }
}
