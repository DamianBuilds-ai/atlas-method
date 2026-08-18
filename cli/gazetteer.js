// gazetteer.js - read and write the gazetteer.repos manifest
// Format: JSONL, one entry per line.
// Header line: {"schema":"gazetteer","version":1}
// Entry: {"path":"/abs/path","visibility":"private"|"public","remote":"https://..."}
// "remote" is optional - local-only repos omit it.
// Lines starting with # are comments (stripped before JSON parse).

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

/** Default gazetteer location: ~/.atlas/gazetteer.repos */
export function defaultGazetteerPath() {
  return join(homedir(), '.atlas', 'gazetteer.repos');
}

/** Installed template location (relative to this file). */
export function templateGazetteerPath() {
  const thisDir = dirname(fileURLToPath(import.meta.url));
  return join(thisDir, '..', 'templates', 'gazetteer.repos');
}

/**
 * Read the gazetteer manifest. Returns an array of entry objects.
 * If the user manifest does not exist, falls back to the installed template.
 * Each entry: { path, visibility, remote? }
 */
export function readGazetteer(manifestPath) {
  let resolvedPath = manifestPath;
  if (!resolvedPath || !existsSync(resolvedPath)) {
    // Try the template as a last resort (will only index the method repo itself).
    const tmpl = templateGazetteerPath();
    if (existsSync(tmpl)) {
      resolvedPath = tmpl;
      console.warn(`atlas: no gazetteer at ${manifestPath}, using installed template: ${tmpl}`);
    } else {
      console.warn(`atlas: no gazetteer found; indexing nothing. Create ~/.atlas/gazetteer.repos.`);
      return [];
    }
  }

  let raw;
  try { raw = readFileSync(resolvedPath, 'utf8'); } catch (err) {
    console.error(`atlas: cannot read gazetteer: ${err.message}`);
    return [];
  }

  const entries = [];
  for (const line of raw.split('\n')) {
    const stripped = line.trim();
    if (!stripped || stripped.startsWith('#')) continue;
    let obj;
    try { obj = JSON.parse(stripped); } catch { continue; }
    if (obj.schema === 'gazetteer') continue; // header line
    if (!obj.path) continue;
    entries.push({
      path: obj.path,
      visibility: obj.visibility || 'private',
      remote: obj.remote || null,
    });
  }
  return entries;
}
