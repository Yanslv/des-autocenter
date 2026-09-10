import React from 'react';
import { ChevronDown } from 'lucide-react';
import { resumoChecklist } from '../utils/os';

type ItemProgresso = {
  id: string;
  descricao: string;
  tipo: string;
  executado?: boolean | null;
};

const ChipContagem: React.FC<{ feitos: number; total: number; label: string }> = ({
  feitos,
  total,
  label,
}) => {
  if (total === 0) return null;
  const completo = feitos === total;
  return (
    <span
      className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-sm tabular-nums ${
        completo ? 'bg-emerald-50 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
      }`}
    >
      {feitos}/{total} {label}
    </span>
  );
};

export const OsProgressoCabecalho: React.FC<{
  itens: ItemProgresso[];
  expandido: boolean;
  onToggle: () => void;
}> = ({ itens, expandido, onToggle }) => {
  const r = resumoChecklist(itens);
  if (r.total === 0) return null;
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="text-[11px] font-semibold tabular-nums text-neutral-800 shrink-0">{r.pct}%</span>
      <div className="flex-1 h-1 rounded-full bg-neutral-100 overflow-hidden min-w-6">
        <div className="h-full bg-[#cd3f00] rounded-full" style={{ width: `${r.pct}%` }} />
      </div>
      <ChipContagem feitos={r.servicos.feitos} total={r.servicos.total} label="serv." />
      <ChipContagem feitos={r.pecas.feitos} total={r.pecas.total} label="peças" />
      <button
        type="button"
        aria-expanded={expandido}
        aria-label={expandido ? 'Recolher' : 'Expandir'}
        onClick={onToggle}
        className="shrink-0 p-0.5 text-neutral-400"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandido ? '' : '-rotate-90'}`} />
      </button>
    </div>
  );
};

export const OsProgressoItens: React.FC<{ itens: ItemProgresso[] }> = ({ itens }) => (
  <div className="flex flex-wrap gap-1">
    {itens.map((it) => (
      <span
        key={it.id}
        className={`max-w-[11rem] truncate text-[10px] font-medium px-1.5 py-0.5 rounded-sm ${
          it.executado ? 'bg-emerald-50 text-emerald-800' : 'bg-neutral-100 text-neutral-500'
        }`}
      >
        {it.descricao}
      </span>
    ))}
  </div>
);
