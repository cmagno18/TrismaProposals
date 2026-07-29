// Función serverless (Netlify Functions) que envía la notificación de
// Telegram cuando se abre una propuesta comercial. Mantiene el
// TELEGRAM_BOT_TOKEN fuera del navegador: solo vive como variable de
// entorno del lado servidor (.env en local, variables de entorno de
// Netlify en producción).
//
// Feature obligatorio para todas las propuestas creadas a partir de
// la plantilla — ver AGENTS.md.

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_USER_ID;

  if (!botToken || !chatId) {
    console.error('Faltan TELEGRAM_BOT_TOKEN o TELEGRAM_USER_ID en las variables de entorno.');
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'Telegram no configurado' }) };
  }

  let clientName = 'un cliente';
  try {
    const payload = JSON.parse(event.body || '{}');
    if (payload.clientName && String(payload.clientName).trim()) {
      clientName = String(payload.clientName).trim();
    }
  } catch (err) {
    // body inválido: se envía igual con el nombre genérico
  }

  const text = `El cliente ${clientName} acaba de abrir la propuesta comercial`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Error al enviar mensaje a Telegram:', errorBody);
      return { statusCode: 502, body: JSON.stringify({ ok: false, error: 'Telegram API error' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('Error al llamar a la API de Telegram:', err);
    return { statusCode: 502, body: JSON.stringify({ ok: false, error: 'network error' }) };
  }
};
