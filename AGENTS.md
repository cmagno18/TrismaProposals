# Instrucciones para agentes — Proyecto TrismaProposals

Este repositorio genera páginas web de propuestas comerciales para
Trisma Soluciones, siempre duplicando y rellenando la plantilla base
[`plantilla_propuestas.html`](plantilla_propuestas.html).

## Cómo crear una nueva propuesta

1. Duplicar `plantilla_propuestas.html`.
2. Guardar la copia en `propuestas/` con el nombre:
   `propuestas/nombre-cliente-yyyy-mm-dd.html`
   (slug del cliente en minúsculas, separado por guiones; fecha en
   formato `yyyy-mm-dd`). Ejemplo: propuesta para "Banco ABC" del
   29 de julio de 2026 → `propuestas/banco-abc-2026-07-29.html`.
3. Reemplazar todos los placeholders `[VARIABLE]` según el listado
   documentado en el comentario al inicio del `<body>` de la
   plantilla, usando la transcripción de la llamada de negocio como
   fuente.
4. **No modificar la estructura, los títulos de sección, los textos
   de interfaz, ni los elementos marcados como fijos** (el bloque
   "Ecosistema de Capacidades Trisma", el enlace de WhatsApp del CTA
   final, ni el script de notificación de Telegram).

## Feature obligatorio: notificación por Telegram

**Toda propuesta creada a partir de la plantilla debe conservar,
intactos, los siguientes dos elementos:**

1. El atributo `data-client-name="[NOMBRE_CLIENTE]"` en la etiqueta
   `<body>`.
2. El `<script>` ubicado justo después de `<body>` que hace `fetch`
   a `/.netlify/functions/notify-telegram` al cargar la página.

Este script llama a la función serverless
[`netlify/functions/notify-telegram.js`](netlify/functions/notify-telegram.js),
que envía el mensaje **"El cliente [NOMBRE_CLIENTE] acaba de abrir la
propuesta comercial"** al chat de Telegram de Trisma, usando las
variables de entorno `TELEGRAM_BOT_TOKEN` y `TELEGRAM_USER_ID`
(fijas para todas las propuestas — no se deben pedir ni sobrescribir
por cliente).

No se debe implementar el envío del mensaje directamente desde el
navegador (expondría el Bot Token). Siempre debe pasar por la
función serverless.

## Variables de entorno

Definidas en `.env` (local, no versionado) y como variables de
entorno del sitio en Netlify (producción):

| Variable              | Uso                                                              |
|-----------------------|-------------------------------------------------------------------|
| `ASSEMBLYAI_API_KEY`  | Transcripción de audio de llamadas (scripts locales de generación de propuestas) |
| `TELEGRAM_BOT_TOKEN`  | Bot de Telegram de Trisma (notificación de apertura de propuesta) |
| `TELEGRAM_USER_ID`    | Chat/usuario destino de la notificación                          |

Ver `.env.example` como referencia de las variables requeridas.

## Datos fijos de la empresa (no son placeholders)

- WhatsApp del CTA final: `https://wa.me/573028337824`
- Bloque "Ecosistema de Capacidades Trisma" (sección 04): los 7
  pilares del portafolio completo de Trisma.

## Despliegue

El sitio es estático y se despliega en Netlify conectado a este
repositorio de GitHub (`cmagno18/TrismaProposals`). No requiere paso
de build (`netlify.toml` ya está configurado). Cada nueva propuesta
subida a `propuestas/` queda disponible automáticamente en el deploy
siguiente, en `https://<sitio>.netlify.app/propuestas/archivo.html`.

## Carpetas excluidas del repositorio

- `grabaciones/`: grabaciones de llamadas (archivos pesados). Nunca
  debe versionarse — ver `.gitignore`.
