// graficos.js — Generación de gráficos de ventas
const QuickChart = require('quickchart-js');
const { database } = require('./utils');

async function generarGraficoVentas(client, chatId) {
  if (!database.ventas.length || !database.vendedores.length) {
    return client.sendText(chatId, '⚠️ No hay datos suficientes para graficar.');
  }

  const labels = database.vendedores.map(v => v.nombre);
  const data = labels.map(name =>
    database.ventas
      .filter(s => s.vendedorName === name)
      .reduce((sum, s) => sum + s.monto, 0)
  );

  const chart = new QuickChart()
    .setConfig({
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Ventas (COP)', data }]
      },
      options: { title: { display: true, text: 'Ventas por Vendedor' } }
    })
    .setWidth(800)
    .setHeight(400)
    .setBackgroundColor('white');

  const url = chart.getUrl();
  return client.sendText(chatId, `📊 *Gráfico de Ventas*:\n${url}`);
}

module.exports = {
  generarGraficoVentas
};