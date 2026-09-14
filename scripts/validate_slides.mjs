#!/usr/bin/env node
// Offline checks for Lecture 04. Run from any directory with Node.js 20+.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const allowMissingLinks = process.argv.includes('--allow-missing-links');
const unknownArgs = process.argv.slice(2).filter(arg => arg !== '--allow-missing-links');
const errors = [];
const warnings = [];
const activities = new Set(['pipeline', 'path', 'streams', 'control', 'environments']);
const wordLimit = 45;
const definitionLimit = 18;
const sourceSlideCount = 57;
const stats = { scenes: 0, builds: 0, maxWords: 0, minutes: 0, htmlFiles: 0, localLinks: 0 };
const fail = (label, message) => errors.push(`${label}: ${message}`);
const words = value => String(value ?? '').match(/\S+/gu)?.length ?? 0;
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

if (unknownArgs.length) fail('Arguments', `unknown option(s): ${unknownArgs.join(', ')}`);

function checkSource(value, label) {
  if (!nonempty(value)) return fail(label, 'source must be a nonempty URL or repository-relative path');
  if (/^https?:/i.test(value)) {
    try {
      const url = new URL(value);
      if (!url.hostname) fail(label, `invalid source URL ${JSON.stringify(value)}`);
    } catch {
      fail(label, `invalid source URL ${JSON.stringify(value)}`);
    }
    return;
  }
  if (/^[a-z][a-z\d+.-]*:/i.test(value) || value.startsWith('//')) {
    return fail(label, `source must use http(s) or a repository-relative path: ${value}`);
  }
  checkLocalLink(path.join(root, 'index.html'), value, label);
}

function checkDrawing(items, label, knownKeys) {
  if (!Array.isArray(items) || !items.length) {
    fail(label, 'build has no diagram elements');
    return;
  }
  const keys = new Set();
  let visibleWords = 0;
  const numericAttrs = new Set(['x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'font-size', 'stroke-width', 'opacity', 'fill-opacity', 'stroke-opacity', 'dx', 'dy']);
  const sizes = new Set(['r', 'rx', 'ry', 'width', 'height', 'font-size', 'stroke-width']);
  for (const item of items) {
    if (!item || typeof item !== 'object') {
      fail(label, 'diagram element must be an object');
      continue;
    }
    const keyLabel = `${label}, element ${JSON.stringify(item.key)}`;
    if (!nonempty(item.key)) fail(label, 'every element needs a nonempty string key');
    if (keys.has(item.key)) fail(keyLabel, 'duplicate key within build');
    keys.add(item.key);
    if (knownKeys.has(item.key) && knownKeys.get(item.key) !== item.tag) {
      fail(keyLabel, `key changed element type from ${knownKeys.get(item.key)} to ${item.tag}`);
    }
    knownKeys.set(item.key, item.tag);
    const attrs = item.attrs;
    if (!attrs || typeof attrs !== 'object') {
      fail(keyLabel, 'missing SVG attributes');
      continue;
    }
    for (const [name, value] of Object.entries(attrs)) {
      if ((typeof value === 'number' || numericAttrs.has(name)) && !Number.isFinite(Number(value))) {
        fail(keyLabel, `${name} must be finite; received ${String(value)}`);
      }
      if (sizes.has(name) && Number(value) < 0) fail(keyLabel, `${name} must not be negative`);
      if (['d', 'points', 'transform', 'viewBox'].includes(name)) {
        const numbers = String(value).match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi) ?? [];
        if (/\b(?:NaN|Infinity)\b/.test(String(value)) || numbers.some(n => !Number.isFinite(Number(n)))) {
          fail(keyLabel, `${name} contains non-finite geometry`);
        }
      }
    }
    if (item.tag !== 'text') continue;
    const size = Number(attrs['font-size']);
    if (!Number.isFinite(size) || size < 16) fail(keyLabel, `text must be at least 16px: ${JSON.stringify(item.text)}`);
    const hidden = attrs.display === 'none' || attrs.visibility === 'hidden' || (own(attrs, 'opacity') && Number(attrs.opacity) === 0);
    if (hidden) continue;
    visibleWords += words(item.text);
    const x = Number(attrs.x);
    const y = Number(attrs.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      fail(keyLabel, 'text requires finite x and y coordinates');
      continue;
    }
    // A heuristic, not a substitute for inspecting the deck in a browser.
    const glyphFactor = /mono|courier|consolas/i.test(attrs['font-family'] ?? '') ? 0.61 : 0.51;
    const estimatedWidth = Array.from(String(item.text ?? '')).length * size * glyphFactor;
    const anchor = attrs['text-anchor'] ?? 'start';
    const left = anchor === 'middle' ? x - estimatedWidth / 2 : anchor === 'end' ? x - estimatedWidth : x;
    const middle = attrs['dominant-baseline'] === 'middle' || attrs['dominant-baseline'] === 'central';
    const top = middle ? y - size / 2 : y - size;
    const bottom = middle ? y + size / 2 : y + size * 0.25;
    if (left < 0 || left + estimatedWidth > 1280 || top < 0 || bottom > 720) {
      fail(keyLabel, `estimated text bounds exceed 1280×720: ${JSON.stringify(item.text)} (x ${left.toFixed(1)}–${(left + estimatedWidth).toFixed(1)}, y ${top.toFixed(1)}–${bottom.toFixed(1)})`);
    }
  }
  if (visibleWords > wordLimit) fail(label, `${visibleWords} visible words exceeds the ${wordLimit}-word limit (includes rendered titles, labels, and code)`);
  stats.maxWords = Math.max(stats.maxWords, visibleWords);
  stats.builds++;
}

function validateDeck() {
  const context = vm.createContext({ window: {}, console });
  for (const relative of ['slides/_shared/visuals.js', 'slides/decks/lecture-04.js']) {
    const filename = path.join(root, relative);
    if (!fs.existsSync(filename)) return fail('Deck', `missing ${relative}`);
    try {
      vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename: relative, timeout: 2000 });
    } catch (error) {
      return fail(relative, `could not load: ${error.message}`);
    }
  }
  const deck = context.window.COURSE_DECKS?.[4];
  if (!deck) return fail('Deck', 'window.COURSE_DECKS[4] is missing');
  if (deck.id !== 4) fail('Deck', `expected id 4, received ${JSON.stringify(deck.id)}`);
  if (!nonempty(deck.title)) fail('Deck', 'title is missing');
  if (!Array.isArray(deck.scenes) || !deck.scenes.length) return fail('Deck', 'scenes must be a nonempty array');
  if (deck.source !== undefined) checkSource(deck.source, 'Deck source');
  const ids = new Set();
  const covered = new Set();
  const hasSourceSlides = deck.scenes.some(sc => own(sc, 'sourceSlides'));
  for (const [index, sc] of deck.scenes.entries()) {
    const label = `Slide ${index + 1} ${JSON.stringify(sc.title ?? '')}`;
    stats.scenes++;
    if (!nonempty(sc.id) || /\s/.test(sc.id)) fail(label, 'scene id must be a nonempty stable string without whitespace');
    if (ids.has(sc.id)) fail(label, `duplicate scene id ${JSON.stringify(sc.id)}`);
    ids.add(sc.id);
    if (!nonempty(sc.title)) fail(label, 'title is missing');
    if (!nonempty(sc.notes)) fail(label, 'presenter notes are missing');
    if (!Number.isFinite(sc.minutes) || sc.minutes <= 0) fail(label, 'minutes must be a positive finite number');
    else stats.minutes += sc.minutes;
    if (sc.activity !== undefined && !activities.has(sc.activity)) fail(label, `unknown activity ${JSON.stringify(sc.activity)}; use ${[...activities].join(', ')}`);
    if (sc.sources !== undefined) {
      if (!Array.isArray(sc.sources)) fail(label, 'sources must be an array');
      else sc.sources.forEach((source, i) => checkSource(source, `${label}, source ${i + 1}`));
    }
    if (hasSourceSlides) {
      if (!Array.isArray(sc.sourceSlides) || !sc.sourceSlides.length) fail(label, 'sourceSlides must be a nonempty array when source coverage is supplied');
      else {
        const seen = new Set();
        for (const source of sc.sourceSlides) {
          if (!Number.isInteger(source) || source < 1 || source > sourceSlideCount) fail(label, `sourceSlides contains invalid PPTX slide ${JSON.stringify(source)}; expected 1–${sourceSlideCount}`);
          else covered.add(source);
          if (seen.has(source)) fail(label, `duplicate sourceSlides entry ${source}`);
          seen.add(source);
        }
      }
    }
    if (sc.kind === 'definition') {
      if (!nonempty(sc.term) || !nonempty(sc.definition)) fail(label, 'definition scenes need term and definition');
      if (words(sc.definition) > definitionLimit) fail(label, `definition has ${words(sc.definition)} words; limit is ${definitionLimit}`);
    }
    if (!Number.isInteger(sc.steps) || sc.steps < 1) {
      fail(label, 'steps must be a positive integer');
      continue;
    }
    if (!Array.isArray(sc.states) || sc.states.length !== sc.steps || sc.states.some(state => !nonempty(state))) fail(label, 'states must contain one nonempty description per build');
    if (typeof sc.draw !== 'function') {
      fail(label, 'draw must be a function');
      continue;
    }
    const knownKeys = new Map();
    for (let step = 0; step < sc.steps; step++) {
      const buildLabel = `${label}, build ${step + 1}/${sc.steps}`;
      context.__scene = sc;
      context.__step = step;
      try {
        const draw = () => vm.runInContext('window.DeckViz.sceneDrawing(__scene, __step)', context, { timeout: 1000 });
        const items = draw();
        const signature = JSON.stringify(items);
        if (signature !== JSON.stringify(draw())) fail(buildLabel, 'drawing is not deterministic across repeated renders');
        checkDrawing(items, buildLabel, knownKeys);
      } catch (error) {
        fail(buildLabel, `drawing failed: ${error.message}`);
      }
    }
  }
  if (hasSourceSlides) {
    const missing = Array.from({ length: sourceSlideCount }, (_, i) => i + 1).filter(i => !covered.has(i));
    if (missing.length) fail('Source coverage', `PPTX slides not mapped by sourceSlides: ${missing.join(', ')}`);
  }
}

function decodeEntities(value) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, entity => {
    const name = entity.slice(1, -1).toLowerCase();
    const named = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' };
    if (own(named, name)) return named[name];
    const code = name.startsWith('#x') ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
    return code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
  });
}

function checkLocalLink(from, raw, label) {
  const value = decodeEntities(raw).trim();
  if (!value || value.startsWith('#') || value.startsWith('?') || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) return;
  let target;
  try {
    const pathname = decodeURIComponent(value.split(/[?#]/, 1)[0]);
    target = pathname.startsWith('/') ? path.resolve(root, `.${pathname}`) : path.resolve(path.dirname(from), pathname);
  } catch {
    return fail(label, `malformed local URL ${JSON.stringify(raw)}`);
  }
  stats.localLinks++;
  if (target !== root && !target.startsWith(root + path.sep)) return fail(label, `local link escapes repository: ${JSON.stringify(raw)}`);
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
  if (!fs.existsSync(target)) {
    const message = `${label}: missing local target ${JSON.stringify(raw)} → ${path.relative(root, target)}`;
    (allowMissingLinks ? warnings : errors).push(message);
  }
}

function checkHtml(directory) {
  const skipped = new Set(['.git', '.agents', '.codex', 'node_modules', '.venv', '__pycache__']);
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (skipped.has(entry.name) || entry.isSymbolicLink()) continue;
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) checkHtml(filename);
    else if (entry.isFile() && /\.html?$/i.test(entry.name)) {
      stats.htmlFiles++;
      const html = fs.readFileSync(filename, 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/(<(?:script|style)\b[^>]*>)[\s\S]*?<\/(?:script|style)\s*>/gi, '$1');
      for (const tag of html.matchAll(/<[a-z][^>]*>/gi)) {
        for (const attr of tag[0].matchAll(/\s(href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) {
          checkLocalLink(filename, attr[2] ?? attr[3] ?? attr[4], `${path.relative(root, filename)} ${attr[1]}`);
        }
      }
    }
  }
}

validateDeck();
checkHtml(root);
console.log(`Lecture 04 · ${stats.scenes} scenes · ${stats.builds} builds · ${stats.minutes} planned minutes · maximum ${stats.maxWords}/${wordLimit} visible words`);
console.log(`${stats.htmlFiles} HTML files · ${stats.localLinks} local links checked · source URLs checked without network requests`);
for (const warning of warnings) console.warn(`PENDING ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);
if (errors.length) {
  console.error(`Validation failed: ${errors.length} error(s).`);
  process.exitCode = 1;
} else if (warnings.length) {
  console.log(`Deck checks pass; ${warnings.length} missing link(s) allowed during authoring. Rerun without --allow-missing-links before publishing.`);
} else {
  console.log('All deck contracts, estimated text bounds, and local links pass. Inspect rendered slides before publishing.');
}
