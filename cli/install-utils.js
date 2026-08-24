/**
 * install-utils.js
 *
 * Shared helpers for atlas init and atlas update.
 *
 * Keeping this in one place prevents the two commands from diverging on which
 * manifest keys map to which target paths. Any change here affects both.
 */

/**
 * Map a manifest key to its target-relative install path.
 *
 * Examples:
 *   templates/AGENTS.md              -> AGENTS.md
 *   templates/.gemini/settings.json  -> .gemini/settings.json
 *   templates/hooks/datetime.sh      -> .atlas/hooks/datetime.sh
 *   cli/atlas.js                     -> .atlas/cli/atlas.js
 *   adapters/jobs.json               -> null (not directly installed)
 *
 * Returns null for keys that are not directly installed as files
 * (e.g. adapters/jobs.json, which is only used for adapter generation).
 */
export function templateRelToTargetRel(templateRel) {
  if (templateRel === 'adapters/jobs.json') return null;
  if (templateRel.startsWith('templates/hooks/')) {
    return '.atlas/hooks/' + templateRel.slice('templates/hooks/'.length);
  }
  if (templateRel.startsWith('templates/')) {
    return templateRel.slice('templates/'.length);
  }
  // CLI files are copied project-locally so the hook can invoke them without
  // a global atlas install. cli/X in the method repo -> .atlas/cli/X in targets.
  if (templateRel.startsWith('cli/')) {
    return '.atlas/cli/' + templateRel.slice('cli/'.length);
  }
  return null;
}
