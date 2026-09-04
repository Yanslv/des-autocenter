import React, { useMemo, useState } from 'react';
import { CORES_CARRO } from '../types';
import { Campo, inputCompactClass } from './Campo';

export const CorPicker: React.FC<{
  value: string;
  onChange: (nome: string) => void;
}> = ({ value, onChange }) => {
  const [busca, setBusca] = useState('');
  const cores = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return CORES_CARRO;
    return CORES_CARRO.filter((c) => c.nome.toLowerCase().includes(t));
  }, [busca]);

  return (
    <div className="space-y-1.5">
      <Campo label="Buscar cor">
        <input
          className={inputCompactClass}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Nome da cor"
        />
      </Campo>
      {value && (
        <p className="text-xs font-medium text-neutral-800">
          Cor selecionada: {value}
        </p>
      )}
      <div className="grid grid-cols-6 gap-1">
        {cores.map((c) => {
          const ativo = value === c.nome;
          return (
            <button
              key={c.nome}
              type="button"
              onClick={() => onChange(c.nome)}
              className={`flex flex-col items-center gap-0.5 rounded-lg p-1 border ${
                ativo ? 'border-[#cd3f00] bg-orange-50' : 'border-neutral-200 bg-white'
              }`}
            >
              <span
                className="w-5 h-5 rounded-md border border-black/10"
                style={{ backgroundColor: c.hex }}
              />
              <span className="text-[9px] text-neutral-700 leading-tight text-center truncate w-full">{c.nome}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
