// Función serverless (Netlify Functions) que envía la notificación de
// Telegram cuando se abre una propuesta comercial. Mantiene el
// TELEGRAM_BOT_TOKEN fuera del navegador: solo vive como variable de
// entorno del lado servidor (.env en local, variables de entorno de
// Netlify en producción).
//
// Feature obligatorio para todas las propuestas creadas a partir de
// la plantilla — ver AGENTS.md.

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseDevice(ua) {
  if (!ua) return 'Dispositivo no especificado';
  let os = 'Desconocido';
  let isMobile = false;

  if (/iPhone/i.test(ua)) {
    os = 'iPhone (iOS)';
    isMobile = true;
  } else if (/iPad/i.test(ua)) {
    os = 'iPad (iPadOS)';
    isMobile = true;
  } else if (/Android/i.test(ua)) {
    os = 'Android';
    isMobile = true;
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = 'Mac (macOS)';
  } else if (/Windows/i.test(ua)) {
    os = 'PC (Windows)';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  let browser = '';
  if (/WhatsApp/i.test(ua)) {
    browser = 'WhatsApp';
  } else if (/Edg/i.test(ua)) {
    browser = 'Edge';
  } else if (/Chrome/i.test(ua)) {
    browser = 'Chrome';
  } else if (/Safari/i.test(ua)) {
    browser = 'Safari';
  } else if (/Firefox/i.test(ua)) {
    browser = 'Firefox';
  }

  const icon = isMobile ? '📱 Móvil' : '💻 Computador';
  return `${icon}: ${os}${browser ? ' · ' + browser : ''}`;
}

function formatReferrer(ref) {
  if (!ref || ref === 'Directo') return 'Directo';
  try {
    const parsed = new URL(ref);
    if (/whatsapp/i.test(parsed.hostname)) return 'WhatsApp';
    if (/mail|gmail|outlook/i.test(parsed.hostname)) return `Correo (${parsed.hostname})`;
    return parsed.hostname;
  } catch (_) {
    return String(ref).slice(0, 60);
  }
}

function isPrivateIp(ip) {
  return /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|::1|fe80)/.test(ip);
}

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
  let slug = '';
  let timestamp = '';
  let screen = '';
  let referrer = '';
  let userAgent = '';

  try {
    const payload = JSON.parse(event.body || '{}');
    if (payload.clientName && String(payload.clientName).trim()) {
      clientName = String(payload.clientName).trim();
    }
    if (payload.slug && String(payload.slug).trim()) {
      slug = String(payload.slug).trim();
    }
    if (payload.timestamp && String(payload.timestamp).trim()) {
      timestamp = String(payload.timestamp).trim();
    }
    if (payload.screen && String(payload.screen).trim()) {
      screen = String(payload.screen).trim();
    }
    if (payload.referrer && String(payload.referrer).trim()) {
      referrer = String(payload.referrer).trim();
    }
    if (payload.userAgent && String(payload.userAgent).trim()) {
      userAgent = String(payload.userAgent).trim();
    }
  } catch (err) {
    // body inválido: se envía igual con los datos genéricos disponibles
  }

  const rawIp = (event.headers && (
    event.headers['x-nf-client-connection-ip'] ||
    event.headers['client-ip'] ||
    event.headers['x-forwarded-for']
  )) || '';
  const clientIp = rawIp ? rawIp.split(',')[0].trim() : '';

  let location = '';
  if (event.headers && event.headers['x-nf-geo']) {
    try {
      const geo = JSON.parse(Buffer.from(event.headers['x-nf-geo'], 'base64').toString('utf8'));
      const parts = [geo.city, geo.subdivision_name, geo.country_name].filter(Boolean);
      if (parts.length > 0) location = parts.join(', ');
    } catch (_) {}
  }

  if (!location && clientIp && !isPrivateIp(clientIp)) {
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,city,regionName,country`, {
        signal: AbortSignal.timeout(1500)
      });
      if (geoRes.ok) {
        const data = await geoRes.json();
        if (data.status === 'success') {
          const parts = [data.city, data.regionName, data.country].filter(Boolean);
          if (parts.length > 0) location = parts.join(', ');
        }
      }
    } catch (_) {}
  }

  const cleanSlug = slug.replace(/^\//, '');
  const proposalUrl = cleanSlug
    ? `https://trismasoluciones.netlify.app/${cleanSlug}`
    : 'https://trismasoluciones.netlify.app/';

  const lines = [
    '👁️ <b>Propuesta Abierta</b>',
    `<b>Cliente:</b> ${escapeHtml(clientName)}`,
  ];
  if (timestamp) {
    lines.push(`<b>Fecha y hora:</b> ${escapeHtml(timestamp)}`);
  }
  lines.push(`<b>Propuesta:</b> <a href="${proposalUrl}">Propuesta Comercial — ${escapeHtml(clientName)}</a>`);

  if (clientIp) {
    let ipText = `🌐 <b>IP y Ubicación:</b> <code>${escapeHtml(clientIp)}</code>`;
    if (location) ipText += ` (${escapeHtml(location)})`;
    lines.push(ipText);
  }

  const uaToParse = userAgent || (event.headers && event.headers['user-agent']) || '';
  if (uaToParse) {
    let devLine = `${parseDevice(uaToParse)}`;
    if (screen) {
      devLine += ` · Pantalla: ${escapeHtml(screen)}`;
    }
    lines.push(devLine);
  }

  if (referrer) {
    lines.push(`🔗 <b>Origen:</b> ${escapeHtml(formatReferrer(referrer))}`);
  }

  const text = lines.join('\n');

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      }),
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
