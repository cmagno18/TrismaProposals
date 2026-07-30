---
name: creador-propuestas-comerciales
description: Genera propuestas comerciales HTML hiper-personalizadas para Trisma Soluciones a partir de una grabación de llamada, una transcripción ya guardada, o un prospecto del Excel de clientes. Usa este skill siempre que el usuario pida crear, armar, generar o redactar una propuesta comercial para un cliente de Trisma — incluso si no invoca `/creador-propuestas-comerciales` explícitamente, o si solo menciona un archivo en grabaciones/, transcripciones/ o clientes/, o pide "hacer la propuesta de [cliente]".
---

# Creador de Propuestas Comerciales — Trisma Soluciones

Comando: `/creador-propuestas-comerciales`

Este skill convierte información de un prospecto (llamada grabada, transcripción, o fila de un Excel) en una propuesta comercial HTML lista para enviar, duplicando `plantilla_propuestas.html` y rellenando sus placeholders `[VARIABLE]`. El resultado debe sentirse hecho a la medida — como si quien la escribió hubiera escuchado de verdad al cliente — nunca genérico ni "de relleno".

Contexto del proyecto que debes conocer antes de ejecutar cualquier paso: lee [AGENTS.md](../../../AGENTS.md) en la raíz del repo. Ahí está documentada la arquitectura de notificaciones de Telegram, la convención de nombres de archivo, y qué partes de la plantilla son fijas y no se deben tocar.

## 1. Recopilar los parámetros iniciales

Antes de procesar nada, confirma que tienes estos cuatro datos. Si falta alguno, pregúntalo directamente al usuario (en español):

1. **Nombre o razón social del cliente.**
2. **Precio y esquema comercial** (ej: % de comisión sobre recaudo, retainer fijo, o esquema mixto). Si el usuario indica que el precio es 0 (o que no aplica mostrar cifra en esta etapa), tenlo en cuenta: la sección 07 (Inversión) no se incluirá en el archivo generado (ver paso 5).
3. **¿La propuesta es preliminar o definitiva?** Si es preliminar (un borrador para validar internamente o con el cliente antes de la versión final), el título de la propuesta debe decirlo explícitamente ("Propuesta Preliminar de..." — ver paso 5).
4. **Origen de la información** — cuál de los tres escenarios aplica, **y el nombre del archivo a usar**:
   - **A. Grabación** — archivo de audio/video en `grabaciones/`.
   - **B. Transcripción** — archivo de texto/markdown ya existente en `transcripciones/`.
   - **C. Excel de prospecto** — fila de un archivo en `clientes/`.

Si el usuario ya dio estos datos en su mensaje (ej. "arma la propuesta preliminar para Banco ABC con 15% de comisión, usa la grabación llamada_banco_abc.mp3"), no se los vuelvas a preguntar — solo confirma cuáles faltan.

**No explores por tu cuenta las carpetas `grabaciones/`, `transcripciones/` o `clientes/` para adivinar qué archivo usar.** Si el usuario indicó el escenario pero no el nombre del archivo, sigue esta regla antes de leer nada:

- Lista (con `ls`/`Glob`, sin abrir ningún archivo) el contenido de la carpeta correspondiente al escenario elegido.
- Si hay **15 archivos o menos**, muéstraselos al usuario en una lista numerada y pregúntale cuál quiere usar. Espera su respuesta — no elijas tú por él, ni siquiera si un nombre "se parece" al cliente.
- Si hay **más de 15 archivos**, no los listes: dile al usuario que hay demasiados archivos en esa carpeta y pídele que te indique el nombre exacto.
- En ningún caso leas el contenido de un archivo de esa carpeta hasta que el usuario haya confirmado explícitamente cuál es.

## 2. Procesar según el escenario

### Escenario A — Grabación (`grabaciones/`)

1. Transcribe el archivo ya confirmado con AssemblyAI ejecutando:
   ```
   node --env-file=.env scripts/transcribe.js "grabaciones/<archivo>" "transcripciones/<nombre-cliente>-<yyyy-mm-dd>.md"
   ```
   El script sube el audio, activa diarización (identificación de interlocutores) y guarda el resultado en `transcripciones/`. Usa el modelo más avanzado disponible de AssemblyAI — no existe un modelo literal llamado "Universal-3.5 pro" en su API, así que el script usa el mejor modelo real disponible; no lo cuestiones ni lo cambies manualmente.
2. Continúa con el **Paso 3 (Análisis Cualitativo)** usando la transcripción recién guardada.

### Escenario B — Transcripción directa (`transcripciones/`)

1. Lee el archivo ya confirmado en `transcripciones/`.
2. Continúa con el **Paso 3 (Análisis Cualitativo)**.

### Escenario C — Excel de prospecto (`clientes/`)

Aquí no hay conversación que analizar — el diagnóstico se construye a partir de datos estructurados y las heurísticas de sector. El archivo Excel ya fue confirmado en el paso 1 (o listado/elegido siguiendo la regla de arriba si el usuario no lo especificó). Sigue este orden estricto:

**a) Ubicar al cliente.** Usa el skill `xlsx` para leer el archivo confirmado en `clientes/` y buscar la fila por ID/número de fila o por nombre/razón social.
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
Tipo de propuesta: [preliminar / definitiva]
Esquema comercial: [precio/comisión, o "sin cifra (precio 0)"]
Sector / contexto: [sector detectado u "omitido"]
Buyer persona identificado: [perfil Trisma]
Párrafo de entendimiento: [resumen breve]
Párrafo de visión: [resumen breve]
```

Luego pregunta textualmente:
> "Tengo toda la información validada para crear la propuesta comercial de **[Nombre Cliente]**. ¿Deseas hacer alguna aclaración, ajuste o añadir un dato adicional antes de proceder?"

Espera la respuesta. Si pide cambios, ajústalos y vuelve a confirmar. Solo con confirmación explícita pasas al siguiente paso.

**Regla anti-alucinación**: no asumas, adivines ni inventes ningún dato que no esté en la grabación, la transcripción, el Excel o en lo que el usuario te confirmó explícitamente. Si falta un dato para un placeholder, pregúntalo — no lo rellenes con contenido plausible.

**Regla de tratamiento formal**: todo el texto dirigido al cliente (párrafos, diferenciadores, notas, cualquier placeholder que redactes) debe usar siempre "usted" — nunca "tú"/"vos" ni sus conjugaciones o posesivos ("tu", "tus", "te", "buscas", "recuperas", etc.). Revisa tu propio texto antes de insertarlo en la plantilla.

## 5. Construir y guardar la propuesta

1. Lee `plantilla_propuestas.html` completo, incluyendo el comentario inicial que lista todos los placeholders disponibles.
2. Completa cada `[VARIABLE]` con la información validada: `[NOMBRE_CLIENTE]`, `[NOMBRE_PROYECTO]`, `[FECHA]`, `[PARRAFO_ENTENDIMIENTO]`, `[PARRAFO_VISION]`, `[LISTA_ALCANCE]`, `[LISTA_EXCLUSIONES]`, `[FASES]`, `[NOTA_TIEMPOS]`, `[PRECIO]`, `[FORMA_DE_PAGO]`, `[DIFERENCIADOR_1/2/3]`, `[GARANTIA]`, `[PARRAFO_CIERRE]`, `[TEXTO_CTA]`, `[NOMBRE_EMPRESA]`, `[CONTACTO]`, y cualquier otro que exista en la plantilla — no dejes ninguno sin reemplazar. Casos especiales:
   - `[ETIQUETA_PROPUESTA]` (en el `<h1>` del hero): déjalo vacío si la propuesta es definitiva, o escribe `Preliminar ` (con espacio al final) si es preliminar, para que el título quede "Propuesta Preliminar de...".
   - `[NOTA_ESQUEMA_COMISION]` (sección 07): inclúyelo siempre que el esquema tenga un componente de comisión sobre recaudo (puro o mixto). Texto base (esquema 100% comisión, sin costo fijo inicial): *"Nuestro modelo comercial se basa principalmente en una comisión sobre el éxito del recaudo. Solo ganamos si usted recupera su dinero. Eliminamos las barreras de presupuesto inicial, convirtiendo a Trisma en un socio que autofinancia su operación."* Si el esquema es **mixto** (hay costo fijo/setup además de la comisión), adapta solo la última frase para no afirmar algo falso — ej. *"...Descontando la inversión inicial fija, solo ganamos si usted recupera su dinero. Esto convierte a Trisma en un socio que autofinancia gran parte de su operación."* Elimina el `<div class="investment-commission-note">` completo solo si el esquema es 100% fijo/retainer, sin ningún componente de comisión sobre recaudo.
   - Si el precio acordado es **0** (o el usuario indicó que no aplica mostrar cifra), elimina la sección 07 completa (`<section class="investment on-dark" id="inversion">...</section>`) del archivo generado. No la dejes vacía ni con "$0". Esto no rompe nada más: el botón "Ver la propuesta" del hero ya apunta a la sección 04, no a la 07.
   - La imagen de la sección 03 (`img/Imagen_01.jpg`) es fija, no un placeholder — pero al guardar el archivo en `propuestas/` (un nivel más abajo que la plantilla), ajusta su ruta a `../img/Imagen_01.jpg` para que siga resolviendo correctamente.
3. **No toques lo que ya es fijo**: el enlace de WhatsApp del CTA final (`https://wa.me/573028337824`) y el `<script>` justo después que arma su mensaje prellenado, el bloque "Ecosistema de Capacidades Trisma" de la sección 04, el botón "Ver la propuesta" del hero (enlaza a `#alcance`), el Design System (tipografías, colores, animaciones), y el `<body data-client-name="...">` junto con el `<script>` de notificación de Telegram que va justo después — esos dos scripts ya están en la plantilla y ambos leen el nombre del cliente del mismo atributo `data-client-name`, así que **solo debes reemplazar `[NOMBRE_CLIENTE]` dentro de ese atributo**, no reescribir ni duplicar ninguno de los dos scripts.
4. Guarda el archivo en `propuestas/<slug>-<yyyymmdd><ID>.html`, donde:
   - `<slug>` es el nombre del cliente en minúsculas separado por guiones.
   - `<yyyymmdd>` es la fecha de creación de la propuesta, compacta (sin guiones).
   - `<ID>` es un consecutivo de 2 dígitos (`01`, `02`, ...) que cuenta cuántas propuestas de **ese mismo cliente** ya existen **ese mismo día** — no es un consecutivo global del día, cada cliente lleva el suyo. Para calcularlo, lista `propuestas/` y busca archivos que empiecen con `<slug>-<yyyymmdd>`; toma el ID más alto que encuentres y súmale 1. Si no hay ninguno, empieza en `01`.

   Ejemplo: primera propuesta de "Banco ABC" creada el 29 de julio de 2026 → `propuestas/banco-abc-2026072901.html`. Si ese mismo día se genera una segunda propuesta para Banco ABC, sería `propuestas/banco-abc-2026072902.html` — mientras que la primera propuesta de "Tienda XYZ" ese mismo día sería `propuestas/tienda-xyz-2026072901.html` (su propio consecutivo, no choca con el de Banco ABC).

   Crea la carpeta `propuestas/` si no existe.

## 6. Notificaciones por Telegram

Hay dos notificaciones independientes — no las confundas:

**a) Notificación de "propuesta creada"** (la envías tú, el agente, justo después de guardar el archivo en el paso anterior — ocurre en tu máquina local, antes de cualquier deploy):
```
node --env-file=.env scripts/telegram-notify.js "Propuesta creada: [Nombre Cliente] | Fecha creación: [fecha yyyy-mm-dd] | Propuesta: propuestas/[archivo].html"
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
