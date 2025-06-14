// flujos.js — Control de flujos paso a paso de conversación
const { registrarVenta } = require('./ventas');
const { database } = require('./utils');

const conversationStates = new Map();

function iniciarFlujoVenta(chatId, senderId) {
  const key = `${chatId}|${senderId}`;
  conversationStates.set(key, { action: 'venta.step1', data: {} });
}

function cancelarFlujo(chatId, senderId) {
  const key = `${chatId}|${senderId}`;
  conversationStates.delete(key);
}

function tieneFlujo(chatId, senderId) {
  return conversationStates.has(`${chatId}|${senderId}`);
}

async function manejarPaso(message, client) {
  const chatId = message.from;
  const senderId = message.sender.id;
  const key = `${chatId}|${senderId}`;
  const { action, data } = conversationStates.get(key);
  const text = message.body.trim();

  switch (action) {
    case 'venta.step1':
      data.cliente = text;
      conversationStates.set(key, { action: 'venta.step2', data });
      return client.sendText(chatId, '✏️ ¿Cuál es el monto de la venta?');

    case 'venta.step2':
      const monto = parseFloat(text.replace(/[^0-9.]/g, ''));
      if (isNaN(monto)) {
        return client.sendText(chatId, '❌ Monto inválido. Intenta de nuevo.');
      }
      data.monto = monto;
      conversationStates.set(key, { action: 'venta.confirm', data });
      return client.sendText(chatId, `⚠️ Confirma:\n• Cliente: ${data.cliente}\n• Monto: $${data.monto}\nResponde *sí* para confirmar o *no* para cancelar.`);

    case 'venta.confirm':
      if (/^s[ií]$/i.test(text)) {
        const vendedor = database.vendedores.find(v => v.idWhatsApp === senderId) || {};
        registrarVenta(data.cliente, data.monto, vendedor.nombre || 'Admin');
        cancelarFlujo(chatId, senderId);
        return client.sendText(chatId, '✅ Venta registrada exitosamente.');
      } else {
        cancelarFlujo(chatId, senderId);
        return client.sendText(chatId, '❌ Venta cancelada.');
      }

    default:
      cancelarFlujo(chatId, senderId);
      return client.sendText(chatId, '❌ Flujo desconocido cancelado.');
  }
}

module.exports = {
  iniciarFlujoVenta,
  cancelarFlujo,
  tieneFlujo,
  manejarPaso
};