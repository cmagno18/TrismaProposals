// Envía un mensaje de texto libre al Telegram de Trisma.
// Uso: node --env-file=.env scripts/telegram-notify.js "texto del mensaje"
//
// Usado por el skill creador-propuestas-comerciales para la notificación
// de "propuesta creada" (backend), que se envía directo desde la máquina
// local justo después de guardar el archivo — a diferencia de la
// notificación de "propuesta abierta", que corre en el navegador del
// cliente vía netlify/functions/notify-telegram.js.

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_USER_ID;
const text = process.argv[2];

if (!text) {
  console.error('Uso: node --env-file=.env scripts/telegram-notify.js "texto del mensaje"');
  process.exit(1);
}

if (!botToken || !chatId) {
  console.error('Faltan TELEGRAM_BOT_TOKEN o TELEGRAM_USER_ID en .env');
  process.exit(1);
}

async function main() {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Error al enviar mensaje a Telegram:', errorBody);
    process.exit(1);
  }

  console.log('Notificación enviada a Telegram.');
}

main().catch((err) => {
  console.error('Error al llamar a la API de Telegram:', err);
  process.exit(1);
});
