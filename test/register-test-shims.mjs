import { register } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

register('./resolve-server-only.mjs', import.meta.url);
