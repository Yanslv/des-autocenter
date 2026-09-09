import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useOficina } from '../context/OficinaContext';
import {
  STATUS_ORCAMENTO_COR,
  STATUS_ORCAMENTO_LABEL,
  formatarNumeroOrcamento,
  orcamentoCombinaBusca,
  statusOrcamentoEfetivo,
  type StatusOrcamento,
} from '../utils/orcamento';
import { formatBRL } from '../utils/formatters';
import { inputCompactClass } from './Campo';
import type { Database } from '../types/database';

type Orcamento = Database['public']['Tables']['orcamentos']['Row'];
type Veiculo = Database['public']['Tables']['veiculos']['Row'];

export const OrcamentoResumoCard: React.FC<{
  orc: Orcamento;
  clienteNome?: string;
  veiculo?: Veiculo;
  onClick: () => void;
}> = ({ orc, clienteNome, veiculo, onClick }) => {
  const status = statusOrcamentoEfetivo(
    orc.status as StatusOrcamento,
    orc.validade_dias,
    orc.data_emissao
  );
  const cor = STATUS_ORCAMENTO_COR[status];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left bg-white border border-neutral-200 border-l-2 rounded-sm px-2.5 py-2 ${cor.borda}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold">
          ORC-{formatarNumeroOrcamento(orc.numero_orcamento)}
        </span>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm ${cor.badge}`}>
          {STATUS_ORCAMENTO_LABEL[status]}
        </span>
      </div>
      <div className="text-sm font-medium text-neutral-900 leading-tight">
        {clienteNome || 'Sem cliente'}
      </div>
      <div className="text-xs text-neutral-500">
        {veiculo?.placa || 'sem placa'}
        {veiculo?.modelo ? ` • ${veiculo.modelo}` : ''}
        {' · '}
        {formatBRL(Number(orc.valor_total))}
      </div>
    </button>
  );
};

export const OrcamentosListaView: React.FC<{
  onBack: () => void;
  onOpenOrcamento: (id: string) => void;
}> = ({ onBack, onOpenOrcamento }) => {
  const { orcamentos, clientes, veiculos } = useOficina();
  const [busca, setBusca] = useState('');

  const lista = useMemo(
    () =>
      orcamentos.filter((orc) => {
        const cliente = clientes.find((c) => c.id === orc.cliente_id);
        const veiculo = veiculos.find((v) => v.id === orc.veiculo_id);
        return orcamentoCombinaBusca(busca, cliente?.nome, veiculo);
      }),
    [orcamentos, clientes, veiculos, busca]
  );

  const quantidade =
    busca.trim() && lista.length !== orcamentos.length
      ? `${lista.length} de ${orcamentos.length}`
      : String(orcamentos.length);

  return (
    <div className="space-y-3 pb-4">
      <div>
        <button type="button" onClick={onBack} className="text-sm text-[#cd3f00] font-medium">
          Voltar
        </button>
        <div className="flex items-baseline justify-between gap-2 mt-1">
          <h2 className="text-lg font-semibold text-neutral-900">Orçamentos</h2>
          <span className="text-sm font-medium text-neutral-500">{quantidade}</span>
        </div>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
        <input
          className={`${inputCompactClass} pl-8`}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por cliente ou carro"
        />
      </div>
      {lista.length === 0 ? (
        <p className="text-sm text-neutral-400 text-center py-8">
          {busca.trim() ? 'Nenhum orçamento com esse cliente ou carro.' : 'Nenhum orçamento.'}
        </p>
      ) : (
        <div className="space-y-1.5">
          {lista.map((orc) => (
            <OrcamentoResumoCard
              key={orc.id}
              orc={orc}
              clienteNome={clientes.find((c) => c.id === orc.cliente_id)?.nome}
              veiculo={veiculos.find((v) => v.id === orc.veiculo_id)}
              onClick={() => onOpenOrcamento(orc.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
