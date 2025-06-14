// utils.js — Funciones utilitarias comunes
const fs = require('fs');

const DATA_FILE = './data.json';

const database = {
  ventas: [],
  vendedores: [],
  reportes: [],
  banned: []
};

function cargarBase() {
  if (fs.existsSync(DATA_FILE)) {
    Object.assign(database, JSON.parse(fs.readFileSync(DATA_FILE)));
  }
}

function guardarBase() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(database, null, 2));
}

function obtenerFechaLocal() {
  return new Date().toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    hour12: false
  });
}

function logError(e) {
  fs.appendFileSync('bot.log', `[${new Date().toISOString()}] ${e.stack || e}\n`);
}

function setLastImage(senderId, imageData) {
  global.lastImageByUser = global.lastImageByUser || {};
  global.lastImageByUser[senderId] = imageData;
}

function getLastImage(senderId) {
  return global.lastImageByUser?.[senderId];
}

function clearLastImage(senderId) {
  if (global.lastImageByUser) {
    delete global.lastImageByUser[senderId];
  }
}

module.exports = {
  cargarBase,
  guardarBase,
  obtenerFechaLocal,
  logError,
  database,
  setLastImage,
  getLastImage,
  clearLastImage
};