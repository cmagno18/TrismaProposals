# Instrucciones para agentes — Proyecto TrismaProposals

Este repositorio genera páginas web de propuestas comerciales para
Trisma Soluciones, siempre duplicando y rellenando la plantilla base
[`plantilla_propuestas.html`](plantilla_propuestas.html).

## Tratamiento formal ("usted")

Todo el texto dirigido al cliente — tanto el de la plantilla como el
que se redacta al llenar los placeholders — debe usar siempre la
forma formal "usted" (y sus derivados: "su", "sus", conjugaciones de
tercera persona). Nunca usar "tú"/"vos" ni sus conjugaciones o
posesivos ("tu", "tus", "te", "recuperas", "buscas", etc.). Revisar
esto también en el contenido generado por IA (párrafos, diferenciadores,
notas), no solo en los textos fijos de la plantilla.

## Cómo crear una nueva propuesta

La forma recomendada es invocar el skill
[`/creador-propuestas-comerciales`](.claude/skills/creador-propuestas-comerciales/SKILL.md),
que ya implementa todo el flujo (recopilar datos, transcribir si hace
falta, redactar el diagnóstico, validar con el usuario, generar el
archivo y notificar). Si se hace manualmente, seguir el mismo
resultado:

1. Duplicar `plantilla_propuestas.html`.
2. Guardar la copia en `propuestas/` con el nombre:
   `propuestas/<slug>-<yyyymmdd><ID>.html`
   (slug del cliente en minúsculas separado por guiones; fecha
   compacta `yyyymmdd`; `ID` un consecutivo de 2 dígitos que empieza
   en `01` y cuenta las propuestas **de ese mismo cliente** ese
   mismo día — no es un consecutivo global). Ejemplo: primera
   propuesta de "Banco ABC" el 29 de julio de 2026 →
   `propuestas/banco-abc-2026072901.html`; una segunda propuesta del
   mismo cliente ese día → `propuestas/banco-abc-2026072902.html`.
3. Reemplazar todos los placeholders `[VARIABLE]` según el listado
   documentado en el comentario al inicio del `<body>` de la
   plantilla, usando la transcripción de la llamada de negocio como
   fuente.
4. **No modificar la estructura, los títulos de sección, los textos
   de interfaz, ni los elementos marcados como fijos** (el bloque
   "Ecosistema de Capacidades Trisma", el enlace de WhatsApp del CTA
   final y su script de mensaje prellenado, ni el script de
   notificación de Telegram).

## CTA final de WhatsApp

El botón `[TEXTO_CTA]` de la sección 09 enlaza siempre a
`https://wa.me/573028337824` (número fijo de Trisma, no es un
placeholder). Un `<script>` justo después del botón arma el mensaje
prellenado de WhatsApp ("Hola, he revisado la propuesta comercial de
Trisma para [nombre] y quisiera agendar una llamada...") tomando el
nombre del cliente del mismo `data-client-name` que usa la
notificación de Telegram — no crear un placeholder nuevo para esto,
y no tocar este script al duplicar la plantilla.

## Feature obligatorio: notificaciones por Telegram

Hay **dos** notificaciones independientes, y toda propuesta debe
mantener ambas funcionales:

### 1. Propuesta abierta (frontend, en vivo)

**Toda propuesta creada a partir de la plantilla debe conservar,
intactos, los siguientes dos elementos:**

- El atributo `data-client-name="[NOMBRE_CLIENTE]"` en la etiqueta
  `<body>`.
- El `<script>` ubicado justo después de `<body>` que hace `fetch`
  a `/.netlify/functions/notify-telegram` al cargar la página,
  enviando el nombre del cliente, la fecha/hora (generada en el
  navegador del cliente) y la ruta (`window.location.pathname`).

Este script llama a la función serverless
[`netlify/functions/notify-telegram.js`](netlify/functions/notify-telegram.js),
que arma y envía el mensaje a Telegram (cliente, fecha y hora, y
ruta de la propuesta) usando las variables de entorno
`TELEGRAM_BOT_TOKEN` y `TELEGRAM_USER_ID` (fijas para todas las
propuestas — no se deben pedir ni sobrescribir por cliente).

No se debe implementar el envío del mensaje directamente desde el
navegador (expondría el Bot Token). Siempre debe pasar por la
función serverless.

### 2. Propuesta creada (backend, al generarla)

Al terminar de generar el archivo HTML de una propuesta nueva, se
debe notificar de inmediato desde la máquina local (no depende de
Netlify ni de que el cliente abra la página):

```bash
node --env-file=.env scripts/telegram-notify.js "Propuesta creada: [Nombre Cliente] | [yyyy-mm-dd] | propuestas/[archivo].html"
```

## Variables de entorno

Definidas en `.env` (local, no versionado) y como variables de
entorno del sitio en Netlify (producción, solo las de Telegram —
AssemblyAI no se usa en producción):

| Variable              | Uso                                                                |
|-----------------------|---------------------------------------------------------------------|
| `ASSEMBLYAI_API_KEY`  | Transcripción de audio de llamadas (`scripts/transcribe.js`, local)|
| `TELEGRAM_BOT_TOKEN`  | Bot de Telegram de Trisma (ambas notificaciones)                   |
| `TELEGRAM_USER_ID`    | Chat/usuario destino de la notificación                            |

Ver `.env.example` como referencia de las variables requeridas.

## Scripts disponibles

| Script                        | Uso                                                                          |
|--------------------------------|-------------------------------------------------------------------------------|
| `scripts/transcribe.js`        | Transcribe audio/video de `grabaciones/` con AssemblyAI (diarización activada) y guarda el resultado en `transcripciones/`. |
| `scripts/telegram-notify.js`   | Envía un mensaje de texto libre a Telegram (usado para la notificación de "propuesta creada"). |

Ambos se ejecutan con `node --env-file=.env <script>` (requiere
Node ≥ 20.6) para leer las variables de entorno sin depender de
librerías externas.

## Datos fijos de la empresa (no son placeholders)

- WhatsApp del CTA final: `https://wa.me/573028337824`
- Bloque "Ecosistema de Capacidades Trisma" (sección 04): los 7
  pilares del portafolio completo de Trisma.
- Imagen de la sección 03 (Visión): `img/Imagen_01.jpg`. Desde
  `plantilla_propuestas.html` (raíz) la ruta es `img/Imagen_01.jpg`;
  al duplicar el archivo en `propuestas/` hay que ajustarla a
  `../img/Imagen_01.jpg` (un nivel más abajo).
- El botón "Ver la propuesta" del hero enlaza a la sección 04
  (`#alcance`), no a la 07 (Inversión).

## Propuestas preliminares vs. definitivas

El `<h1>` del hero incluye el placeholder `[ETIQUETA_PROPUESTA]`:
vacío para una propuesta definitiva, o `"Preliminar "` (con espacio
al final) para que el título quede "Propuesta Preliminar de...".

## Sección 07 (Inversión) cuando el precio es 0

Si `[PRECIO]` es 0 (ej. diagnóstico gratuito, o un caso donde no
aplica mostrar cifra), la sección 07 completa se omite del archivo
generado — no se deja vacía ni con "$0". Esto no rompe ningún enlace
interno: el botón del hero ya apunta a la sección 04, no a la 07.

## Nota de esquema por comisión (sección 07)

`[NOTA_ESQUEMA_COMISION]` es opcional, pero se incluye siempre que el
esquema tenga un componente de comisión sobre recaudo (puro o mixto).
Texto base (esquema 100% comisión, sin costo fijo inicial):

> "Nuestro modelo comercial se basa principalmente en una comisión
> sobre el éxito del recaudo. Solo ganamos si usted recupera su
> dinero. Eliminamos las barreras de presupuesto inicial, convirtiendo
> a Trisma en un socio que autofinancia su operación."

Si el esquema es **mixto** (hay un costo fijo/setup además de la
comisión), adaptar solo la última frase para no afirmar algo falso —
ej. "...Descontando la inversión inicial fija, solo ganamos si usted
recupera su dinero. Esto convierte a Trisma en un socio que
autofinancia gran parte de su operación." Se omite el bloque completo
únicamente si el esquema es 100% fijo/retainer, sin ningún componente
de comisión sobre recaudo.

## Despliegue

El sitio es estático y se despliega en Netlify conectado a este
repositorio de GitHub (`cmagno18/TrismaProposals`). No requiere paso
de build (`netlify.toml` ya está configurado). Cada nueva propuesta
subida a `propuestas/` queda disponible automáticamente en el deploy
siguiente, en `https://<sitio>.netlify.app/propuestas/archivo.html`.

## Carpetas excluidas del repositorio

Contienen datos sensibles o pesados de clientes — nunca deben
versionarse (ver `.gitignore`):

- `grabaciones/`: grabaciones de llamadas (archivos pesados).
- `transcripciones/`: transcripciones de llamadas de clientes.
- `clientes/`: bases de datos de prospectos en Excel.
