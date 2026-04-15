// ============================================================
//  index.ts — Punto de entrada único para el módulo dataBase
//  Uso: import { inicializarDB, existeCedulaLocal, ... } from '../dataBase'
// ============================================================

export * from './cedulas';
export * from './entregas';
export * from './inventario';

import { inicializarCedulas }   from './cedulas';
import { inicializarEntregas }  from './entregas';
import { inicializarInventario } from './inventario';

/** Llama esto UNA SOLA VEZ en _layout.tsx */
export function inicializarDB(): void {
  inicializarEntregas();
  inicializarCedulas();
  inicializarInventario();
  console.log('✅ SQLite inicializado');
}
