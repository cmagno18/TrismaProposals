// Transcribe un archivo de audio/video de grabaciones/ usando AssemblyAI,
// con diarización (identificación de interlocutores) activada, y guarda
// el resultado en transcripciones/.
//
// Uso: node --env-file=.env scripts/transcribe.js "grabaciones/<archivo>" "transcripciones/<salida>.md"
//
// Nota: la API de AssemblyAI no tiene un modelo llamado literalmente
// "Universal-3.5 pro" — sus valores válidos de speech_model son 'best'
// (el más preciso, usado aquí) y 'nano'. Usamos 'best'.

const fs = require('fs');
const path = require('path');

const apiKey = process.env.ASSEMBLYAI_API_KEY;
const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  console.error('Uso: node --env-file=.env scripts/transcribe.js <ruta-audio> <ruta-salida.md>');
  process.exit(1);
}

if (!apiKey) {
  console.error('Falta ASSEMBLYAI_API_KEY en .env');
  process.exit(1);
}

if (!fs.existsSync(inputPath)) {
  console.error(`No existe el archivo de entrada: ${inputPath}`);
  process.exit(1);
}

const API_BASE = 'https://api.assemblyai.com/v2';
const POLL_INTERVAL_MS = 5000;

async function uploadFile(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: { authorization: apiKey, 'content-type': 'application/octet-stream' },
    body: fileBuffer,
  });
  if (!response.ok) {
    throw new Error(`Error al subir el archivo: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  return data.upload_url;
}

async function requestTranscript(audioUrl) {
  const response = await fetch(`${API_BASE}/transcript`, {
    method: 'POST',
    headers: { authorization: apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({
      audio_url: audioUrl,
      speaker_labels: true,
      speech_model: 'best',
      language_code: 'es',
    }),
  });
  if (!response.ok) {
    throw new Error(`Error al solicitar la transcripción: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  return data.id;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollTranscript(id) {
  while (true) {
    const response = await fetch(`${API_BASE}/transcript/${id}`, {
      headers: { authorization: apiKey },
    });
    if (!response.ok) {
      throw new Error(`Error al consultar la transcripción: ${response.status} ${await response.text()}`);
    }
    const data = await response.json();
    if (data.status === 'completed') return data;
    if (data.status === 'error') throw new Error(`AssemblyAI reportó un error: ${data.error}`);
    console.log(`Transcribiendo... estado: ${data.status}`);
    await sleep(POLL_INTERVAL_MS);
  }
}

function formatTranscript(data) {
  if (Array.isArray(data.utterances) && data.utterances.length > 0) {
    return data.utterances
      .map((u) => `**Interlocutor ${u.speaker}:** ${u.text}`)
      .join('\n\n');
  }
  return data.text || '';
}

async function main() {
  console.log(`Subiendo ${inputPath} a AssemblyAI...`);
  const audioUrl = await uploadFile(inputPath);

  console.log('Solicitando transcripción con diarización...');
  const transcriptId = await requestTranscript(audioUrl);

  console.log(`Transcripción en cola (id: ${transcriptId}). Esperando resultado...`);
  const result = await pollTranscript(transcriptId);

  const markdown = formatTranscript(result);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, markdown, 'utf8');

  console.log(`Transcripción guardada en ${outputPath}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
