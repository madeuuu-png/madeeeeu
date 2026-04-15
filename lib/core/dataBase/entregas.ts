// ============================================================
//  entregas.ts — Operaciones SQLite + Supabase sobre entregas
// ============================================================

import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../supabase/supabase';
import { db } from './db';

export type Entrega = {
  id:           number;
  numDocumento: string;
  fecha:        string;
  sincronizado: number;
};

export function inicializarEntregas(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS entregas (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      numDocumento   TEXT    NOT NULL,
      fecha          TEXT    NOT NULL,
      sincronizado   INTEGER DEFAULT 0
    );
  `);
}

export function guardarEntregaLocal(numDocumento: string, fecha: string): void {
  db.runSync(
    `INSERT INTO entregas (numDocumento, fecha, sincronizado) VALUES (?, ?, 0)`,
    [numDocumento, fecha]
  );
  console.log(`💾 Entrega guardada local: ${numDocumento} — ${fecha}`);
}

export function obtenerUltimaEntregaLocal(numDocumento: string): string | null {
  const row = db.getFirstSync<{ fecha: string }>(
    `SELECT fecha FROM entregas WHERE numDocumento = ? ORDER BY id DESC LIMIT 1`,
    [numDocumento]
  );
  return row?.fecha ?? null;
}

export function listarEntregas(): Entrega[] {
  return db.getAllSync<Entrega>(`SELECT * FROM entregas ORDER BY id DESC`);
}

export async function sincronizarConSupabase(): Promise<void> {
  const net = await NetInfo.fetch();
  if (!net.isConnected) {
    console.log('📵 Sin internet — sincronización pospuesta');
    return;
  }

  const pendientes = db.getAllSync<Entrega>(
    `SELECT id, numDocumento, fecha FROM entregas WHERE sincronizado = 0`
  );
  if (pendientes.length === 0) return;

  console.log(`🔄 Sincronizando ${pendientes.length} entrega(s)...`);

  for (const entrega of pendientes) {
    try {
      const { error } = await supabase
        .from('estudiantes')
        .update({ UltimaEntrega: entrega.fecha })
        .eq('NumDocumento', entrega.numDocumento);

      if (!error) {
        db.runSync(`DELETE FROM entregas WHERE id = ?`, [entrega.id]);
        console.log(`🗑️  Entrega ${entrega.id} sincronizada y borrada`);
      }
    } catch {
      console.log(`❌ Entrega ${entrega.id} — se reintenta después`);
    }
  }
}
