import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { OsProgressoCabecalho } from './OsProgressoResumo';

export type ItemChecklist = {
  id: string;
  descricao: string;
  tipo: string;
  quantidade: number;
  executado: boolean;
};

const Linha: React.FC<{
  item: ItemChecklist;
  podeMarcar: boolean;
  onToggle: (id: string, executado: boolean) => void;
}> = ({ item, podeMarcar, onToggle }) => (
  <button
    type="button"
    disabled={!podeMarcar}
    onClick={() => onToggle(item.id, !item.executado)}
    className="w-full flex items-center gap-2.5 py-2.5 border-b border-neutral-100 last:border-0 text-left disabled:opacity-60"
  >
    <span
      className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 ${
        item.executado ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-neutral-300 bg-white'
      }`}
    >
      {item.executado ? <Check className="w-4 h-4" strokeWidth={3} /> : null}
    </span>
    <span className="min-w-0 flex-1">
      <span className={`block text-xs font-medium leading-tight ${item.executado ? 'text-neutral-400 line-through' : ''}`}>
        {item.descricao}
      </span>
      <span className="text-[10px] text-neutral-500">
        {item.quantidade}x • {item.executado ? (item.tipo === 'servico' ? 'Feito' : 'Aplicada') : 'Pendente'}
      </span>
    </span>
  </button>
);

export const OficinaChecklist: React.FC<{
  itens: ItemChecklist[];
  podeMarcar: boolean;
  onToggle: (id: string, executado: boolean) => void;
}> = ({ itens, podeMarcar, onToggle }) => {
  const [aberto, setAberto] = useState(true);
  const servicos = itens.filter((i) => i.tipo === 'servico');
  const pecas = itens.filter((i) => i.tipo !== 'servico');

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-3 space-y-3">
      {itens.length === 0 ? (
        <p className="text-[11px] text-neutral-500">Nenhum serviço ou peça nesta OS.</p>
      ) : (
        <OsProgressoCabecalho itens={itens} expandido={aberto} onToggle={() => setAberto((v) => !v)} />
      )}
      {aberto && itens.length > 0 ? (
        <>
          {servicos.length > 0 ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Serviços</p>
              {servicos.map((it) => (
                <Linha key={it.id} item={it} podeMarcar={podeMarcar} onToggle={onToggle} />
              ))}
            </div>
          ) : null}
          {pecas.length > 0 ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Peças</p>
              {pecas.map((it) => (
                <Linha key={it.id} item={it} podeMarcar={podeMarcar} onToggle={onToggle} />
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
};
