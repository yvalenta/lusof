#!/usr/bin/env node
// Lusof Sweet — compila (o comprueba) el CSS de Tailwind.
//
// Entrada única: assets/css/entrada-tailwind.css (el `@import "tailwindcss"` + el
// `@theme static` con la paleta). Salida commiteada: assets/css/tailwind.css (minificada),
// la que sirve index.html — no se edita a mano, se regenera de acá.
//
// Requiere las devDependencies de package.json (`npm install`; no se comitea node_modules,
// ver .gitignore). Es una herramienta de BUILD, no algo que cargue el sitio publicado: el
// contrato «sin build» del sitio en sí no cambia, solo cómo se genera este CSS.
//
// Sin argumentos: compila y escribe assets/css/tailwind.css.
// `--comprobar`: no escribe nada; compila a un archivo temporal y compara byte a byte con
// lo commiteado — sale 1 y avisa si difieren (lo usa .github/workflows/comprobar.yml).
'use strict';

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ruta = (...partes) => join(RAIZ, ...partes);

const ENTRADA = ruta('assets/css/entrada-tailwind.css');
const SALIDA = ruta('assets/css/tailwind.css');
const CLI = ruta('node_modules/.bin/tailwindcss');

if (!existsSync(CLI)) {
  console.error(
    'Falta node_modules/.bin/tailwindcss. Corré `npm install` en la raíz del repo primero ' +
      '(instala las devDependencies fijas de package.json: tailwindcss y @tailwindcss/cli 4.3.3; ' +
      'nunca se comitea node_modules, ver .gitignore).',
  );
  process.exit(1);
}

function compilar(destino) {
  execFileSync(CLI, ['--input', ENTRADA, '--output', destino, '--minify'], { cwd: RAIZ, stdio: 'pipe' });
}

const comprobar = process.argv.includes('--comprobar');

if (!comprobar) {
  compilar(SALIDA);
  console.log('assets/css/tailwind.css actualizado.');
} else {
  const carpetaTmp = mkdtempSync(join(tmpdir(), 'lusof-tailwind-'));
  const destinoTmp = join(carpetaTmp, 'tailwind.css');
  try {
    compilar(destinoTmp);
    const actual = existsSync(SALIDA) ? readFileSync(SALIDA, 'utf8') : null;
    const esperado = readFileSync(destinoTmp, 'utf8');
    if (actual !== esperado) {
      console.error(
        'assets/css/tailwind.css está desactualizado respecto a assets/css/entrada-tailwind.css ' +
          '(o a las clases de index.html/assets/js). Corré `node scripts/css.mjs` y commiteá el resultado.',
      );
      process.exit(1);
    }
    console.log('assets/css/tailwind.css está al día.');
  } finally {
    rmSync(carpetaTmp, { recursive: true, force: true });
  }
}
