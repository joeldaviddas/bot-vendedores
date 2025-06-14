import { Database } from './database.js';

export class MenuHandler {
    constructor() {
        this.menuStates = new Map();
        this.db = new Database();
    }

    async handleMenu(message, client) {
        try {
            const sender = message.from;
            const currentMenu = this.menuStates.get(sender) || 'principal';

            switch (currentMenu) {
                case 'principal':
                    return await this.showPrincipalMenu(message, client);
                case 'registrar':
                    return await this.handleRegistro(message, client);
                case 'buscar':
                    return await this.handleBusqueda(message, client);
                default:
                    return await this.showPrincipalMenu(message, client);
            }
        } catch (error) {
            console.error('Error al manejar menú:', error);
            await client.sendText(message.from, 'Error al procesar el menú. Por favor, intenta de nuevo.');
        }
    }

    async showPrincipalMenu(message, client) {
        const menu = `
📊 *Menú Principal*

1️⃣ *Registrar Vendedor*
   - Registra un nuevo vendedor
   - Verifica si está bloqueado

2️⃣ *Buscar Vendedor*
   - Busca vendedores por nombre
   - Muestra detalles completos

3️⃣ *Lista de Vendedores*
   - Muestra todos los vendedores
   - Incluye bloqueados

4️⃣ *Comandos Rápidos*
   - /verificar - Registro rápido
   - /ban - Bloquear vendedor
   - /unban - Desbloquear vendedor
   - /sticker - Crear sticker

📌 *Para usar menú*
Escribe el número correspondiente:
1 - Registrar
2 - Buscar
3 - Lista
4 - Comandos
`;

        await client.sendText(message.from, menu);
    }

    async handleRegistro(message, client) {
        const sender = message.from;
        const args = message.body.split(' ');

        if (args.length < 3) {
            const subMenu = `
📝 *Registrar Vendedor*

✅ *Formato:*
1 *nombre* *número*

📌 *Ejemplo:*
1 Joel 521234567890
`;
            await client.sendText(message.from, subMenu);
            return;
        }

        const numero = args[2];
        if (!await this.db.validatePhoneNumber(numero)) {
            await client.sendText(message.from, 'Número de teléfono inválido. Debe incluir código de país.');
            return;
        }

        const resultado = await this.db.registrarVendedor(args[1], numero);
        await client.sendText(message.from, resultado);
        this.menuStates.delete(sender);
    }

    async handleBusqueda(message, client) {
        const sender = message.from;
        const args = message.body.split(' ');

        if (args.length < 2) {
            const subMenu = `
🔍 *Buscar Vendedor*

✅ *Formato:*
2 *nombre*

📌 *Ejemplo:*
2 Joel
`;
            await client.sendText(message.from, subMenu);
            return;
        }

        const nombre = args[1];
        const vendedores = await this.db.obtenerVendedoresPorNombre(nombre);
        
        if (vendedores.length === 0) {
            await client.sendText(message.from, 'No se encontraron vendedores con ese nombre.');
            return;
        }

        const resultados = vendedores.map(v => `
👤 *${v.nombre}*
📞 ${v.numero}
⏱️ Registrado: ${new Date(v.fechaRegistro).toLocaleDateString()}
`).join('\n');

        await client.sendText(message.from, resultados);
        this.menuStates.delete(sender);
    }

    async handleNumberInput(message, client) {
        const sender = message.from;
        const number = parseInt(message.body);

        switch (number) {
            case 1:
                this.menuStates.set(sender, 'registrar');
                await this.handleRegistro(message, client);
                break;
            case 2:
                this.menuStates.set(sender, 'buscar');
                await this.handleBusqueda(message, client);
                break;
            case 3:
                await this.db.obtenerListaVendedores().then(lista => client.sendText(message.from, lista));
                break;
            case 4:
                await client.sendText(message.from, CONFIG.messages.help);
                break;
            default:
                await this.showPrincipalMenu(message, client);
        }
    }
}
