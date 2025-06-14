import { Database } from './database.js';

export class MessageHandler {
    constructor() {
        this.keywords = ['comprar', 'estafa', 'plataforma'];
        this.db = new Database();
    }

    async handleNewMessage(message, client) {
        try {
            // Guardar imagen si es una imagen
            if (message.type === 'image') {
                await this.db.saveLastImage(message.from, message.body);
            }

            // Detectar palabras clave
            if (this.keywords.some(keyword => message.body.toLowerCase().includes(keyword))) {
                await this.handleKeyword(message, client);
            }

            // Registrar mensaje en logs
            await this.db.logMessage(message);

            // Verificar si es un nuevo miembro
            if (message.isGroup && message.body === 'Hola') {
                await this.handleNuevoMiembro(message, client);
            }

        } catch (error) {
            console.error('Error al procesar mensaje:', error);
            await client.sendText(message.from, 'Error al procesar el mensaje. Por favor, intenta de nuevo.');
        }
    }

    async handleKeyword(message, client) {
        try {
            // Si alguien menciona comprar, mencionar a los vendedores
            if (message.body.toLowerCase().includes('comprar')) {
                const vendedores = await this.db.obtenerVendedoresActivos();
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

    async handleNuevoMiembro(message, client) {
        try {
            // Verificar si el usuario ya está registrado
            const vendedor = await this.db.obtenerVendedorPorNumero(message.from);
            if (vendedor) {
                await client.sendText(message.from, '¡Hola! Ya estás registrado como vendedor. ¿Necesitas ayuda con algo?');
                return;
            }

            // Enviar mensaje de bienvenida y registro
            const mensajeRegistro = `
👋 ¡Bienvenido/a al grupo!

¿Te gustaría registrarte como vendedor?

Para registrarte, por favor responde con:

1 *nombre* *número*

📌 *Ejemplo:*
1 Joel 521234567890

💡 *Importante:*
- El número debe incluir código de país
- Solo se permite un registro por número
- Los vendedores deben ser responsables
`;

            await client.sendText(message.from, mensajeRegistro);
        } catch (error) {
            console.error('Error al manejar nuevo miembro:', error);
            await client.sendText(message.from, 'Error al procesar tu registro. Por favor, intenta de nuevo.');
        }
    }
}
