import fs from 'fs-extra';
import path from 'path';

export class Database {
    constructor() {
        this.dbPath = path.resolve(__dirname, '..', '..', CONFIG.directories.data, 'database.json');
        this.db = null;
    }

    async init() {
        try {
            if (!this.db) {
                this.db = await fs.readJSON(this.dbPath);
            }
            return this.db;
        } catch (error) {
            console.error('Error al inicializar base de datos:', error);
            throw error;
        }
    }

    async saveLastImage(sender, imageUrl) {
        try {
            await this.init();
            this.db.lastImages[sender] = imageUrl;
            await fs.writeJSON(this.dbPath, this.db);
        } catch (error) {
            console.error('Error al guardar imagen:', error);
            throw error;
        }
    }

    async getLastImage(sender) {
        try {
            await this.init();
            return this.db.lastImages[sender];
        } catch (error) {
            console.error('Error al obtener imagen:', error);
            throw error;
        }
    }

    async registrarVendedor(nombre, numero) {
        try {
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
        } catch (error) {
            console.error('Error al registrar vendedor:', error);
            throw error;
        }
    }

    async bloquearVendedor(numero) {
        try {
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
        } catch (error) {
            console.error('Error al bloquear vendedor:', error);
            throw error;
        }
    }

    async desbloquearVendedor(numero) {
        try {
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
        } catch (error) {
            console.error('Error al desbloquear vendedor:', error);
            throw error;
        }
    }

    async obtenerListaVendedores() {
        try {
            await this.init();
            const lista = this.db.vendedores.map(v => `${v.nombre} (${v.numero})`).join('\n');
            return `Lista de vendedores:\n${lista}`;
        } catch (error) {
            console.error('Error al obtener lista de vendedores:', error);
            throw error;
        }
    }

    async obtenerVendedoresActivos() {
        try {
            await this.init();
            return this.db.vendedores.filter(v => !this.db.bloqueados.includes(v.numero));
        } catch (error) {
            console.error('Error al obtener vendedores activos:', error);
            throw error;
        }
    }

    async logMessage(message) {
        try {
            await this.init();
            this.db.logs.push({
                from: message.from,
                body: message.body,
                type: message.type,
                timestamp: new Date().toISOString()
            });
            await fs.writeJSON(this.dbPath, this.db);
        } catch (error) {
            console.error('Error al registrar mensaje:', error);
            throw error;
        }
    }
}
