---
name: creador-propuestas-comerciales
description: Genera propuestas comerciales HTML hiper-personalizadas para Trisma Soluciones a partir de una grabación de llamada, una transcripción ya guardada, o un prospecto del Excel de clientes. Usa este skill siempre que el usuario pida crear, armar, generar o redactar una propuesta comercial para un cliente de Trisma — incluso si no invoca `/creador-propuestas-comerciales` explícitamente, o si solo menciona un archivo en grabaciones/, transcripciones/ o clientes/, o pide "hacer la propuesta de [cliente]".
---

# Creador de Propuestas Comerciales — Trisma Soluciones

Comando: `/creador-propuestas-comerciales`

Este skill convierte información de un prospecto (llamada grabada, transcripción, o fila de un Excel) en una propuesta comercial HTML lista para enviar, duplicando `plantilla_propuestas.html` y rellenando sus placeholders `[VARIABLE]`. El resultado debe sentirse hecho a la medida — como si quien la escribió hubiera escuchado de verdad al cliente — nunca genérico ni "de relleno".

Contexto del proyecto que debes conocer antes de ejecutar cualquier paso: lee [AGENTS.md](../../../AGENTS.md) en la raíz del repo. Ahí está documentada la arquitectura de notificaciones de Telegram, la convención de nombres de archivo, y qué partes de la plantilla son fijas y no se deben tocar.

## 1. Recopilar los parámetros iniciales

Antes de procesar nada, confirma que tienes estos tres datos. Si falta alguno, pregúntalo directamente al usuario (en español):

1. **Nombre o razón social del cliente.**
2. **Precio y esquema comercial** (ej: % de comisión sobre recaudo, retainer fijo, o esquema mixto).
3. **Origen de la información** — cuál de los tres escenarios aplica:
   - **A. Grabación** — archivo de audio/video en `grabaciones/`.
   - **B. Transcripción** — archivo de texto/markdown ya existente en `transcripciones/`.
   - **C. Excel de prospecto** — fila de un archivo en `clientes/`.

Si el usuario ya dio estos datos en su mensaje (ej. "arma la propuesta para Banco ABC con 15% de comisión, usa la grabación llamada_banco_abc.mp3"), no se los vuelvas a preguntar — solo confirma cuáles faltan.

## 2. Procesar según el escenario

### Escenario A — Grabación (`grabaciones/`)

1. Transcribe el archivo con AssemblyAI ejecutando:
   ```
   node --env-file=.env scripts/transcribe.js "grabaciones/<archivo>" "transcripciones/<nombre-cliente>-<yyyy-mm-dd>.md"
   ```
   El script sube el audio, activa diarización (identificación de interlocutores) y guarda el resultado en `transcripciones/`. Usa el modelo más avanzado disponible de AssemblyAI — no existe un modelo literal llamado "Universal-3.5 pro" en su API, así que el script usa el mejor modelo real disponible; no lo cuestiones ni lo cambies manualmente.
2. Continúa con el **Paso 3 (Análisis Cualitativo)** usando la transcripción recién guardada.

### Escenario B — Transcripción directa (`transcripciones/`)

1. Lee el archivo indicado en `transcripciones/`.
2. Continúa con el **Paso 3 (Análisis Cualitativo)**.

### Escenario C — Excel de prospecto (`clientes/`)

Aquí no hay conversación que analizar — el diagnóstico se construye a partir de datos estructurados y las heurísticas de sector. Sigue este orden estricto:

**a) Ubicar al cliente.** Usa el skill `xlsx` para leer el archivo indicado en `clientes/` y buscar la fila por ID/número de fila o por nombre/razón social.
- Si hay varias coincidencias parecidas, lístalas con su ID y pregunta al usuario cuál procesar.
- Si no hay ninguna coincidencia, dile al usuario que el cliente no está en la base y **detente ahí**. No inventes un cliente ni tomes datos de una fila contigua "parecida" — un dato mal atribuido a la empresa equivocada es peor que no tener el dato.

**b) Detectar el sector.** Busca columnas como `ACTIVIDAD ECONOMICA`, `SECTOR`, `CIIU`, `INDUSTRIA` o `DESCRIPCIÓN`. Si la columna no existe, está vacía o es ambigua, pregunta explícitamente:
> "No encontré el sector o actividad económica para [Nombre Cliente]. Por favor indícame el sector o escribe 'omitir' para usar el enfoque genérico de Trisma."

Si el usuario omite o no responde con un sector claro, no lo adivines — redacta un diagnóstico genérico centrado en las capacidades universales de Trisma (conversión de liquidez en papel a caja real, eficiencia operativa, gobernanza de recaudo). Si sí obtienes el sector, normalízalo a un macro-sector coherente (Banca, Retail, Educación, Propiedad Horizontal, Alimenticio, Infraestructura, etc.).

**c) Redactar el diagnóstico.** Cruza el sector con los 4 buyer personas de Trisma (ver sección 3 de este documento) y redacta:
- `[PARRAFO_ENTENDIMIENTO]`: menciona la razón social, el sector (si está verificado) y la oportunidad estratégica de optimización de caja.
- `[PARRAFO_VISION]`: conecta el dolor típico de ese perfil con la solución de Trisma. No menciones el nombre del cliente en este párrafo — es una descripción de la visión de resultado, no una repetición de quién es.

**Regla de privacidad financiera**: nunca menciones en los párrafos cifras financieras exactas internas del Excel (ingresos, razón corriente, utilidades). Esos datos son para tu análisis interno, no para el texto de cara al cliente.

## 3. Análisis cualitativo y mapeo de buyer personas (Escenarios A y B)

De la transcripción, extrae:
1. El proyecto o línea de cartera/ciclo de ingresos que el cliente necesita optimizar.
2. Deseos profundos (tranquilidad en nómina, reducir DSO, recuperar caja sin perder clientes).
3. Dolores y frustraciones (malas experiencias con cobranza tradicional, desgaste operativo, falta de visibilidad).
4. Objeciones o dudas (riesgo reputacional, comisiones, integración tecnológica).
5. Citas textuales con carga emocional, útiles para `[PARRAFO_ENTENDIMIENTO]`.
6. Restricciones prácticas (tiempos, volumen de facturas, sistemas ERP actuales).

Los 4 buyer personas de Trisma, para cruzar con lo anterior:

| Perfil | Dolor típico |
|---|---|
| **Ricardo** (dueño PYME) | Iliquidez en papel, costo alto de crédito bancario, carga operativa por cobrar |
| **Andrés** (director retail / centros comerciales) | Ineficiencia en volumen masivo, DSO alto, riesgo de vacancia de locales |
| **Jorge / Marta** (sector educación) | Riesgo reputacional, mora en pensiones que afecta nómina docente, falta de trazabilidad |
| **Gloria** (propiedad horizontal) | Conflicto vecinal, desgaste emocional al cobrar, presión del consejo de administración |

Redacta `[PARRAFO_ENTENDIMIENTO]` y `[PARRAFO_VISION]` alineados exactamente al perfil y dolor identificados — no un texto genérico con el nombre del cliente pegado encima.

## 4. Checklist de validación antes de renderizar (todos los escenarios)

Nunca generes el archivo final sin este paso. Muestra al usuario un resumen y espera su confirmación:

```
Cliente: [nombre]
Esquema comercial: [precio/comisión]
Sector / contexto: [sector detectado u "omitido"]
Buyer persona identificado: [perfil Trisma]
Párrafo de entendimiento: [resumen breve]
Párrafo de visión: [resumen breve]
```

Luego pregunta textualmente:
> "Tengo toda la información validada para crear la propuesta comercial de **[Nombre Cliente]**. ¿Deseas hacer alguna aclaración, ajuste o añadir un dato adicional antes de proceder?"

Espera la respuesta. Si pide cambios, ajústalos y vuelve a confirmar. Solo con confirmación explícita pasas al siguiente paso.

**Regla anti-alucinación**: no asumas, adivines ni inventes ningún dato que no esté en la grabación, la transcripción, el Excel o en lo que el usuario te confirmó explícitamente. Si falta un dato para un placeholder, pregúntalo — no lo rellenes con contenido plausible.

## 5. Construir y guardar la propuesta

1. Lee `plantilla_propuestas.html` completo, incluyendo el comentario inicial que lista todos los placeholders disponibles.
2. Completa cada `[VARIABLE]` con la información validada: `[NOMBRE_CLIENTE]`, `[NOMBRE_PROYECTO]`, `[FECHA]`, `[PARRAFO_ENTENDIMIENTO]`, `[PARRAFO_VISION]`, `[LISTA_ALCANCE]`, `[LISTA_EXCLUSIONES]`, `[FASES]`, `[NOTA_TIEMPOS]`, `[PRECIO]`, `[FORMA_DE_PAGO]`, `[DIFERENCIADOR_1/2/3]`, `[GARANTIA]`, `[PARRAFO_CIERRE]`, `[TEXTO_CTA]`, `[NOMBRE_EMPRESA]`, `[CONTACTO]`, y cualquier otro que exista en la plantilla — no dejes ninguno sin reemplazar.
3. **No toques lo que ya es fijo**: el enlace de WhatsApp del CTA final (`https://wa.me/573028337824`), el bloque "Ecosistema de Capacidades Trisma" de la sección 04, el Design System (tipografías, colores, animaciones), y el `<body data-client-name="...">` junto con el `<script>` de notificación que va justo después — ese script ya está en la plantilla y **solo debes reemplazar `[NOMBRE_CLIENTE]` dentro del atributo `data-client-name`**, no reescribir ni duplicar el script.
4. Guarda el archivo en `propuestas/<nombre-cliente-slug>-<yyyy-mm-dd>.html`, donde el slug es el nombre del cliente en minúsculas separado por guiones y la fecha es la fecha de creación de la propuesta en formato `yyyy-mm-dd`. Ejemplo: propuesta para "Banco ABC" creada el 29 de julio de 2026 → `propuestas/banco-abc-2026-07-29.html`. Crea la carpeta `propuestas/` si no existe.

## 6. Notificaciones por Telegram

Hay dos notificaciones independientes — no las confundas:

**a) Notificación de "propuesta creada"** (la envías tú, el agente, justo después de guardar el archivo en el paso anterior — ocurre en tu máquina local, antes de cualquier deploy):
```
node --env-file=.env scripts/telegram-notify.js "Propuesta creada: [Nombre Cliente] | [fecha yyyy-mm-dd] | propuestas/[archivo].html"
```
Ejecútalo siempre, sin preguntar — es parte obligatoria de terminar el skill. Si falla (por ejemplo, `TELEGRAM_BOT_TOKEN` vacío en `.env`), avisa al usuario pero no bloquees la entrega de la propuesta por eso.

**b) Notificación de "propuesta abierta"** (frontend, ya resuelta por la arquitectura del proyecto — no requiere que hagas nada adicional): el `<script>` heredado de la plantilla, más la función serverless `netlify/functions/notify-telegram.js`, se disparan solos cada vez que el cliente abre el HTML en su navegador, e incluyen nombre del cliente, fecha/hora exacta y la ruta del archivo. Tu única responsabilidad es no romper ese script al duplicar la plantilla (ver paso 5.3).

## 7. Confirmación y entrega

Cierra con una respuesta profesional y breve en español:

1. Confirma que la propuesta se creó y se notificó correctamente.
2. Da la ruta del archivo generado: `propuestas/<archivo>.html`.
3. Resume en máximo 40 palabras la solución configurada (esquema comercial, enfoque, buyer persona).

## Referencia rápida de scripts

| Script | Uso |
|---|---|
| `scripts/transcribe.js` | Transcribe audio/video con AssemblyAI, diarización activada, guarda en `transcripciones/`. |
| `scripts/telegram-notify.js` | Envía un mensaje de texto libre a Telegram usando `TELEGRAM_BOT_TOKEN`/`TELEGRAM_USER_ID` del `.env`. |

Ambos se ejecutan con `node --env-file=.env <script>` para que lean las variables de entorno del proyecto sin depender de librerías externas.
