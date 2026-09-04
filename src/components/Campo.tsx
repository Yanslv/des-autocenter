import React from 'react';

export const Campo: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <label className="block space-y-1">
    <span className="text-xs font-medium text-neutral-600">{label}</span>
    {children}
  </label>
);

export const inputClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-base text-neutral-900';

export const inputCompactClass =
  'w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-sm text-neutral-900';
