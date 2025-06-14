const fs = require('fs-extra');
const path = require('path');

export class Database {
    constructor() {
        this.dbPath = path.resolve(__dirname, '..', '..', CONFIG.directories.data, 'database.json');
        this.db = null;
    }

    async init() {
        if (!this.db) {
            this.db = await fs.readJSON(this.dbPath);
        }
        return this.db;
    }

    async saveLastImage(sender, imageUrl) {
        await this.init();
        this.db.lastImages[sender] = imageUrl;
        await fs.writeJSON(this.dbPath, this.db);
    }

    async getLastImage(sender) {
        await this.init();
        return this.db.lastImages[sender];
    }

    async registrarVendedor(nombre, numero) {
        await this.init();
        
        // Verificar si ya existe
        const existe = this.db.vendedores.some(v => v.numero === numero);
        if (existe) {
            return 'El vendedor ya está registrado.';
        }

        // Verificar si está bloqueado
        const bloqueado = this.db.bloqueados.includes(numero);
        if (bloqueado) {
            return 'Este número está bloqueado y no puede registrarse.';
        }

        // Registrar nuevo vendedor
        this.db.vendedores.push({ nombre, numero, fechaRegistro: new Date().toISOString() });
        await fs.writeJSON(this.dbPath, this.db);
        
        return `Vendedor ${nombre} (${numero}) registrado exitosamente.`;
    }

    async bloquearVendedor(numero) {
        await this.init();
        
        // Verificar si ya está bloqueado
        if (this.db.bloqueados.includes(numero)) {
            return 'Este vendedor ya está bloqueado.';
        }

        // Verificar si existe
        const existe = this.db.vendedores.some(v => v.numero === numero);
        if (!existe) {
            return 'No se encontró ningún vendedor con ese número.';
        }

        // Bloquear vendedor
        this.db.bloqueados.push(numero);
        await fs.writeJSON(this.dbPath, this.db);
        
        return `Vendedor ${numero} bloqueado exitosamente.`;
    }

    async desbloquearVendedor(numero) {
        await this.init();
        
        // Verificar si está bloqueado
        const index = this.db.bloqueados.indexOf(numero);
        if (index === -1) {
            return 'Este vendedor no está bloqueado.';
        }

        // Desbloquear vendedor
        this.db.bloqueados.splice(index, 1);
        await fs.writeJSON(this.dbPath, this.db);
        
        return `Vendedor ${numero} desbloqueado exitosamente.`;
    }

    async obtenerListaVendedores() {
        await this.init();
        const lista = this.db.vendedores.map(v => `${v.nombre} (${v.numero})`).join('\n');
        return `Lista de vendedores:\n${lista}`;
    }

    async obtenerVendedoresActivos() {
        await this.init();
        return this.db.vendedores.filter(v => !this.db.bloqueados.includes(v.numero));
    }

    async logMessage(message) {
        await this.init();
        this.db.logs.push({
            from: message.from,
            body: message.body,
            type: message.type,
            timestamp: new Date().toISOString()
        });
        await fs.writeJSON(this.dbPath, this.db);
    }
}
