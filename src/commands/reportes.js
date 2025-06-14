// reportes.js — Gestión de reportes
const { database, guardarBase, obtenerFechaLocal } = require('./utils');

function agregarReporte(numero, motivo) {
  database.reportes.push({
    id: Date.now(),
    numero,
    motivo,
    fecha: obtenerFechaLocal()
  });
  guardarBase();
}

function obtenerReportes() {
  return database.reportes;
}

function contarReportesDe(numero) {
  return database.reportes.filter(r => r.numero === numero).length;
}

module.exports = {
  agregarReporte,
  obtenerReportes,
  contarReportesDe
};