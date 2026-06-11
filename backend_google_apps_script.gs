/**
 * Verbópolis Aula · Backend gratuito con Google Sheets + Apps Script
 *
 * Uso:
 * 1. Crea una hoja de cálculo en Google Drive: "Verbópolis Aula".
 * 2. Extensiones > Apps Script.
 * 3. Pega este código completo.
 * 4. Cambia SPREADSHEET_ID por el ID de tu hoja, o deja vacío si el script está vinculado a esa hoja.
 * 5. Ejecuta setup() una vez y acepta permisos.
 * 6. Implementar > Nueva implementación > Tipo: Aplicación web.
 *    - Ejecutar como: Yo.
 *    - Quién tiene acceso: Cualquier usuario con el enlace.
 * 7. Copia la URL terminada en /exec y pégala en Verbópolis > Zona maestro/a.
 */

const SPREADSHEET_ID = ''; // Opcional. Ejemplo: '1abcDEF...' Si está vacío, usa la hoja activa.
const SHEETS = {
  students: 'Alumnos',
  attempts: 'Intentos',
  summary: 'Resumen',
  raw: 'Eventos_raw'
};

function setup() {
  const ss = getSpreadsheet_();
  ensureSheet_(ss, SHEETS.students, ['studentId', 'nombre', 'avatar', 'classCode', 'firstSeen', 'lastSeen']);
  ensureSheet_(ss, SHEETS.attempts, [
    'timestamp', 'classCode', 'studentId', 'nombre', 'tipoEvento', 'modo', 'dificultad',
    'ronda', 'verbo', 'tiempo', 'persona', 'tipoPregunta', 'respuestaCorrecta',
    'respuestaAlumno', 'acierto', 'xp', 'aciertosTotales', 'intentosTotales', 'racha'
  ]);
  ensureSheet_(ss, SHEETS.summary, [
    'studentId', 'nombre', 'avatar', 'classCode', 'xp', 'aciertos', 'intentos',
    '% acierto', 'mejorRachaVista', 'ultimoEvento', 'ultimaSincronizacion'
  ]);
  ensureSheet_(ss, SHEETS.raw, ['timestamp', 'eventId', 'type', 'json']);
  return 'Verbópolis preparado correctamente.';
}

function doGet(e) {
  const action = (e.parameter.action || 'ping').toLowerCase();
  let result;
  if (action === 'ping') {
    result = { ok: true, message: 'Backend de Verbópolis activo', now: new Date().toISOString() };
  } else if (action === 'students') {
    result = { ok: true, students: readStudents_(e.parameter.classCode || '') };
  } else {
    result = { ok: false, error: 'Acción no reconocida' };
  }
  return output_(result, e.parameter.callback);
}

function doPost(e) {
  try {
    setup();
    const payload = JSON.parse(e.postData && e.postData.contents ? e.postData.contents : '{}');
    if (payload.action !== 'logBatch' || !Array.isArray(payload.events)) {
      return output_({ ok: false, error: 'Payload inválido' });
    }
    const saved = saveEvents_(payload.events, payload.classCode || '');
    return output_({ ok: true, saved });
  } catch (err) {
    return output_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function saveEvents_(events, fallbackClassCode) {
  const ss = getSpreadsheet_();
  const shRaw = ss.getSheetByName(SHEETS.raw);
  const shAttempts = ss.getSheetByName(SHEETS.attempts);
  let saved = 0;

  events.forEach(ev => {
    const data = ev.data || {};
    const classCode = ev.classCode || fallbackClassCode || '';
    const stamp = ev.createdAt ? new Date(ev.createdAt) : new Date();
    shRaw.appendRow([stamp, ev.eventId || '', ev.type || '', JSON.stringify(ev)]);

    upsertStudent_(ss, {
      studentId: ev.studentId || data.studentId || '',
      nombre: ev.studentName || data.studentName || '',
      avatar: ev.avatar || data.avatar || '',
      classCode,
      seen: stamp
    });

    if (ev.type === 'answer') {
      shAttempts.appendRow([
        stamp, classCode, ev.studentId || '', ev.studentName || '', ev.type || '',
        data.mode || '', data.difficulty || '', data.round || '', data.verb || '',
        data.tense || '', data.person || '', data.questionType || '',
        data.correctAnswer || '', data.givenAnswer || '', data.isCorrect === true,
        data.xp || 0, data.correctTotal || 0, data.total || 0, data.streak || 0
      ]);
      updateSummary_(ss, ev, data, stamp, classCode);
    }

    if (ev.type === 'game_finished') updateSummary_(ss, ev, data, stamp, classCode);
    saved++;
  });
  return saved;
}

function upsertStudent_(ss, s) {
  if (!s.studentId) return;
  const sh = ss.getSheetByName(SHEETS.students);
  const values = sh.getDataRange().getValues();
  let row = -1;
  for (let i = 1; i < values.length; i++) if (values[i][0] === s.studentId) row = i + 1;
  if (row === -1) {
    sh.appendRow([s.studentId, s.nombre, s.avatar, s.classCode, s.seen, s.seen]);
  } else {
    sh.getRange(row, 2, 1, 5).setValues([[s.nombre, s.avatar, s.classCode, values[row - 1][4] || s.seen, s.seen]]);
  }
}

function updateSummary_(ss, ev, data, stamp, classCode) {
  if (!ev.studentId) return;
  const sh = ss.getSheetByName(SHEETS.summary);
  const values = sh.getDataRange().getValues();
  let row = -1;
  for (let i = 1; i < values.length; i++) if (values[i][0] === ev.studentId) row = i + 1;
  const xp = Number(data.xp || 0);
  const correct = Number(data.correctTotal || data.correctInGame || 0);
  const total = Number(data.total || data.roundsPlayed || 0);
  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  const streak = Number(data.streak || 0);
  const next = [ev.studentId, ev.studentName || '', ev.avatar || '', classCode, xp, correct, total, accuracy, streak, ev.type || '', stamp];
  if (row === -1) sh.appendRow(next);
  else sh.getRange(row, 1, 1, next.length).setValues([next]);
}

function readStudents_(classCode) {
  const ss = getSpreadsheet_();
  const sh = ss.getSheetByName(SHEETS.students);
  if (!sh) return [];
  const values = sh.getDataRange().getValues();
  return values.slice(1)
    .filter(r => !classCode || r[3] === classCode)
    .map(r => ({ studentId: r[0], name: r[1], avatar: r[2], classCode: r[3] }));
}

function ensureSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(headers);
  const existing = sh.getRange(1, 1, 1, Math.max(headers.length, sh.getLastColumn())).getValues()[0];
  let changed = false;
  headers.forEach((h, i) => { if (existing[i] !== h) { existing[i] = h; changed = true; } });
  if (changed) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  sh.setFrozenRows(1);
}

function getSpreadsheet_() {
  if (SPREADSHEET_ID) return SpreadsheetApp.openById(SPREADSHEET_ID);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('No hay hoja activa. Vincula el script a una hoja o rellena SPREADSHEET_ID.');
  return ss;
}

function output_(obj, callback) {
  const json = JSON.stringify(obj);
  const body = callback ? `${callback}(${json});` : json;
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JAVASCRIPT);
}
