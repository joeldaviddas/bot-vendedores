const fs = require('fs');
const { obtenerFechaLocal, guardarBase, database } = require('./utils');

function registrarVenta(cliente, monto, vendedorName) {
  database.ventas.push({
    id: Date.now(),
    cliente,
    monto,
    vendedorName,
    fecha: obtenerFechaLocal()
  });
  guardarBase();
}

function buscarVentasPorVendedor(nombre) {
  return database.ventas.filter(v =>
    v.vendedorName.toLowerCase().includes(nombre.toLowerCase())
  );
}

function ventasEntreFechas(desde, hasta) {
  return database.ventas.filter(v => v.id >= desde && v.id <= hasta);
}

function ultimasVentas(n = 10) {
  return database.ventas.slice(-n);
}

module.exports = {
  registrarVenta,
  buscarVentasPorVendedor,
  ventasEntreFechas,
  ultimasVentas
};