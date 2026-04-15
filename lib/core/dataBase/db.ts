// ============================================================
//  db.ts — Instancia compartida de SQLite
// ============================================================

import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('makana.db');
