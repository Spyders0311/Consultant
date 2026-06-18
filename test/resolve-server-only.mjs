import path from 'node:path';
import { pathToFileURL } from 'node:url';

const shimRoot = pathToFileURL(path.join(process.cwd(), 'test/shims/server-only/index.js')).href;

/**
 * @param {string} specifier
 * @param {import('node:module').ResolveHookContext} context
 * @param {import('node:module').ResolveHook} nextResolve
 */
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'server-only') {
    return { shortCircuit: true, url: shimRoot };
  }
  return nextResolve(specifier, context);
}
