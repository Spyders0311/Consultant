'use client';

import { useCallback, useState } from 'react';

export default function usePrefillableForm(initialForm) {
  const [form, setForm] = useState(initialForm);
  const [prefilledFields, setPrefilledFields] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  const setFieldValue = useCallback((name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    setPrefilledFields((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const resetForm = useCallback((nextForm) => {
    setForm(nextForm);
    setPrefilledFields({});
    setTouchedFields({});
  }, []);

  const applyPrefill = useCallback((patch, sourceLabel) => {
    const entries = Object.entries(patch || {}).filter(([, value]) => value !== undefined && value !== null && value !== '');
    if (entries.length === 0) return;

    setForm((prev) => {
      const next = { ...prev };
      for (const [field, value] of entries) {
        next[field] = value;
      }
      return next;
    });

    setPrefilledFields((prev) => {
      const next = { ...prev };
      for (const [field] of entries) {
        next[field] = sourceLabel || 'Linked worksheet';
      }
      return next;
    });

    setTouchedFields((prev) => {
      const next = { ...prev };
      for (const [field] of entries) {
        delete next[field];
      }
      return next;
    });
  }, []);

  const clearPrefillTracking = useCallback(() => {
    setPrefilledFields({});
    setTouchedFields({});
  }, []);

  return {
    form,
    setForm,
    setFieldValue,
    resetForm,
    applyPrefill,
    clearPrefillTracking,
    prefilledFields,
    touchedFields,
  };
}
