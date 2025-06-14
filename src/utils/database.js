import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { CONFIG } from '../config/config.js';

// Simular __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Database {
    constructor() {
        this.dbPath = path.resolve(__dirname, '..', '..', CONFIG.directories.data, 'database.json');
        this.db = null;
    }

    async init() {
        if (!this.db) {
            try {
                this.db = await fs.readJSON(this.dbPath);
            } catch {
                // Si no existe, lo inicializamos vacío
                this.db = {
                    vendedores: [],
                    bloqueados: [],
                    logs: [],
                    lastImages: {}
                };
                await fs.writeJSON(this.dbPath, this.db);
            }
        }
        return this.db;
    }

    async save() {
        await fs.writeJSON(this.dbPath, this.db);
    }

    async saveLastImage(sender, imageUrl) {
        await this.init();
        this.db.lastImages[sender] = imageUrl;
        await this.save();
    }

    async getLastImage(sender) {
        await this.init();
        return this.db.lastImages[sender];
    }

    async registrarVendedor(nombre, numero) {
        await this.init();

        if (this.db.vendedores.some(v => v.numero === numero)) {
            return 'Este número ya está registrado.';
        }

        if (this.db.bloqueados.includes(numero)) {
            return 'Este número está bloqueado.';
        }

        this.db.vendedores.push({
            nombre,
            numero,
            categoria: CONFIG.categoriaDescriptions.default,
            fechaRegistro: new Date().toISOString(),
            estado: 'activo',
            estadisticas: {
                mensajes: 0,
                imagenes: 0,
                interacciones: 0,
                ultimaInteraccion: null
            }
        });

        await this.save();
        return `Vendedor registrado exitosamente. Número: ${numero}`;
    }

    async bloquearVendedor(numero) {
        await this.init();
        if (this.db.bloqueados.includes(numero)) return 'Este vendedor ya está bloqueado.';
        if (!this.db.vendedores.some(v => v.numero === numero)) return 'No se encontró ningún vendedor con ese número.';

        this.db.bloqueados.push(numero);
        await this.save();
        return `Vendedor ${numero} bloqueado exitosamente.`;
    }

    async desbloquearVendedor(numero) {
        await this.init();
        const index = this.db.bloqueados.indexOf(numero);
        if (index === -1) return 'Este vendedor no está bloqueado.';

        this.db.bloqueados.splice(index, 1);
        await this.save();
        return `Vendedor ${numero} desbloqueado exitosamente.`;
    }

    async obtenerListaVendedores() {
        await this.init();
        return `Lista de vendedores:\n` +
            this.db.vendedores.map(v => `${v.nombre} (${v.numero})`).join('\n');
    }

    async obtenerVendedoresPorNombre(nombre) {
        await this.init();
        return this.db.vendedores.filter(v =>
            v.nombre.toLowerCase().includes(nombre.toLowerCase())
        );
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
        await this.save();
    }
}