# TrismaProposals

Sitio estático con las propuestas comerciales de **Trisma Soluciones**.
Cada propuesta es un archivo HTML autocontenido, generado a partir de
[`plantilla_propuestas.html`](plantilla_propuestas.html) y publicado
en `propuestas/`.

Ver [AGENTS.md](AGENTS.md) para el detalle de convenciones,
placeholders y el feature obligatorio de notificación por Telegram
que debe incluir toda propuesta nueva.

Para generar una propuesta nueva, usar el skill de Claude Code
`/creador-propuestas-comerciales` (ver
[.claude/skills/creador-propuestas-comerciales/SKILL.md](.claude/skills/creador-propuestas-comerciales/SKILL.md)),
que automatiza todo el flujo a partir de una grabación, una
transcripción o un prospecto del Excel de clientes.

## Estructura

```
plantilla_propuestas.html      # Plantilla base
propuestas/                    # Propuestas ya generadas
  slug-yyyymmddID.html          # ej: banco-abc-2026072901.html (ID = consecutivo del cliente ese día)
grabaciones/                   # Grabaciones de llamadas (no versionado)
transcripciones/               # Transcripciones generadas (no versionado)
clientes/                      # Excel de prospectos (no versionado)
scripts/
  transcribe.js                 # Transcribe audio con AssemblyAI (diarización)
  telegram-notify.js            # Envía la notificación de "propuesta creada"
netlify/functions/
  notify-telegram.js           # Notifica a Telegram cuando se abre una propuesta
netlify.toml                   # Configuración de Netlify
.env.example                   # Variables de entorno requeridas
.claude/skills/creador-propuestas-comerciales/
  SKILL.md                      # Skill que automatiza la creación de propuestas
```

## Variables de entorno

Copiar `.env.example` a `.env` y completar:

- `ASSEMBLYAI_API_KEY` — transcripción de audio (`scripts/transcribe.js`, solo local)
- `TELEGRAM_BOT_TOKEN` / `TELEGRAM_USER_ID` — notificaciones de Telegram (creación y apertura de propuesta)

En producción, estas mismas variables se configuran en Netlify:
**Site settings → Environment variables**.

## Desarrollo local

El sitio es HTML estático, se puede abrir directamente en el
navegador. Para probar la notificación de Telegram (que depende de
la Netlify Function) hace falta correr el emulador de Netlify:

```bash
npm install -g netlify-cli
netlify dev
```

Esto levanta el sitio junto con `netlify/functions/notify-telegram.js`,
leyendo las variables de `.env`.

## Despliegue

El sitio se despliega en **Netlify**, conectado a este repositorio
de GitHub. Al hacer push a `main`, Netlify publica automáticamente
(no requiere build). Configurar las variables de entorno de Telegram
y AssemblyAI en el panel de Netlify antes del primer deploy en
producción.
