// ============================================================
//  inventario.ts — Operaciones SQLite sobre el inventario
// ============================================================

import { db } from './db';

export type Inventario = { motor1: number; motor2: number };

export function inicializarInventario(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS inventario (
      id     INTEGER PRIMARY KEY CHECK (id = 1),
      motor1 INTEGER DEFAULT 8,
      motor2 INTEGER DEFAULT 8
    );
  `);

  const { total } = db.getFirstSync<{ total: number }>(
    `SELECT COUNT(*) as total FROM inventario`
  ) ?? { total: 0 };

  if (total === 0) {
    db.runSync(`INSERT INTO inventario (id, motor1, motor2) VALUES (1, 8, 8)`);
    console.log('✅ Inventario inicializado: 8+8 toallas');
  }
}

export function obtenerInventario(): Inventario {
  return db.getFirstSync<Inventario>(
    `SELECT motor1, motor2 FROM inventario WHERE id = 1`
  ) ?? { motor1: 0, motor2: 0 };
}

/** Agota motor1 primero; si está vacío, descuenta motor2 */
export function descontarToalla(): Inventario {
  const { motor1, motor2 } = obtenerInventario();

  if (motor1 > 0) {
    db.runSync(`UPDATE inventario SET motor1 = motor1 - 1 WHERE id = 1`);
    console.log(`📦 Motor1 → quedan ${motor1 - 1}`);
  } else if (motor2 > 0) {
    db.runSync(`UPDATE inventario SET motor2 = motor2 - 1 WHERE id = 1`);
    console.log(`📦 Motor2 → quedan ${motor2 - 1}`);
  } else {
    console.log('⚠️ Sin toallas para descontar');
  }

  return obtenerInventario();
}

export function recargarInventario(motor1 = 8, motor2 = 8): void {
  db.runSync(
    `UPDATE inventario SET motor1 = ?, motor2 = ? WHERE id = 1`,
    [motor1, motor2]
  );
  console.log(`✅ Inventario recargado: M1=${motor1} M2=${motor2}`);
}
