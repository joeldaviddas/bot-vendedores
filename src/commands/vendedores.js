// vendedores.js — Gestión de vendedores
const { database, guardarBase } = require('../utils/utils');

function agregarVendedor(nombre, telefono) {
  const idWhatsApp = `${telefono}@c.us`;
  if (!database.vendedores.find(v => v.idWhatsApp === idWhatsApp)) {
    database.vendedores.push({ nombre, telefono, idWhatsApp });
    guardarBase();
    return true;
  }
  return false;
}

function obtenerVendedores() {
  return database.vendedores;
}

function estaRegistrado(telefono) {
  const idWhatsApp = `${telefono}@c.us`;
  return !!database.vendedores.find(v => v.idWhatsApp === idWhatsApp);
}

function obtenerMentions() {
  return database.vendedores.map(v => v.idWhatsApp);
}

module.exports = {
  agregarVendedor,
  obtenerVendedores,
  estaRegistrado,
  obtenerMentions
};
