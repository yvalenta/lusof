// Prueba del CSS de Tailwind compilado (scripts/css.mjs): assets/css/tailwind.css no puede
// divergir de assets/css/entrada-tailwind.css ni de las clases que index.html/assets/js
// realmente usan (la comprobación las escanea de nuevo con el CLI y compara byte a byte).
//
// Necesita node_modules/.bin/tailwindcss (`npm install`, ver README.md → «Correrla»). En un
// clon nuevo o un worktree recién creado sin ese paso, esta prueba se salta con un aviso en
// vez de tumbar toda la suite: `node --test` solo necesita Node para el resto de pruebas, y
// CI (.github/workflows/comprobar.yml) siempre corre `npm ci` antes, así que ahí sí se corre.
'use strict';

import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ruta = (...p) => join(RAIZ, ...p);
const CLI = ruta('node_modules/.bin/tailwindcss');

test(
  'node scripts/css.mjs --comprobar sale 0 (assets/css/tailwind.css está al día)',
  { skip: !existsSync(CLI) && 'falta node_modules/.bin/tailwindcss — corré `npm install` primero (ver README.md → «Correrla»)' },
  () => {
    execFileSync(process.execPath, [ruta('scripts/css.mjs'), '--comprobar'], { cwd: RAIZ });
  },
);
