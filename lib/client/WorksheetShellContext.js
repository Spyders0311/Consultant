'use client';

import { createContext, useContext } from 'react';

/** @type {import('react').Context<WorksheetShellContextValue|null>} */
export const WorksheetShellContext = createContext(null);

/**
 * @typedef {Object} WorksheetShellContextValue
 * @property {(values: Record<string, unknown>) => void} setFormValues
 * @property {(loader: ((run: Record<string, unknown>) => void) | null) => void} setRunLoader
 */

/**
 * @returns {WorksheetShellContextValue|null}
 */
export function useWorksheetShellContext() {
  return useContext(WorksheetShellContext);
}
