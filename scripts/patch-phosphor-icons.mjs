#!/usr/bin/env node
/**
 * @phosphor-icons/webcomponents ships with an incomplete pnpm virtual store —
 * it's missing reactive-element.mjs which lit-element.mjs tries to import.
 * This script creates a re-export shim so the project builds correctly.
 *
 * Run automatically via "postinstall" in package.json.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const shimPath = resolve(
  root,
  'node_modules/@phosphor-icons/webcomponents/dist/node_modules/.pnpm/@lit_reactive-element@2.0.4/node_modules/@lit/reactive-element/reactive-element.mjs'
);

const shimContent = `// Compatibility shim — see scripts/patch-phosphor-icons.mjs
export * from '../../../../../../../../../@lit/reactive-element/reactive-element.js';
`;

mkdirSync(dirname(shimPath), { recursive: true });
writeFileSync(shimPath, shimContent);
console.log('Patched @phosphor-icons/webcomponents: created reactive-element.mjs shim');
