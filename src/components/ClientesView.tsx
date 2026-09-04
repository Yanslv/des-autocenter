import React, { useMemo, useState } from 'react';
import { Car, Search } from 'lucide-react';
import { useOficina } from '../context/OficinaContext';
import { CORES_CARRO } from '../types';
import { inputCompactClass } from './Campo';
import type { Database } from '../types/database';

type Cliente = Database['public']['Tables']['clientes']['Row'];
type Veiculo = Database['public']['Tables']['veiculos']['Row'];

const VeiculoChip: React.FC<{ veiculo: Veiculo }> = ({ veiculo }) => {
  const hex = CORES_CARRO.find((c) => c.nome === veiculo.cor)?.hex;
  const n = hex ? Number.parseInt(hex.slice(1), 16) : 0xf4f4f4;
  const iconeClaro =
    ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 > 160;
  const rotulo = [veiculo.placa || 'sem placa', veiculo.modelo].filter(Boolean).join(' ');

  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-neutral-600">
      <span
        className="w-4 h-4 rounded-sm border border-black/10 flex items-center justify-center shrink-0"
        style={{ backgroundColor: hex || '#F4F4F4' }}
      >
        <Car className="w-2.5 h-2.5" strokeWidth={2.4} style={{ color: iconeClaro ? '#171717' : '#FFFFFF' }} />
      </span>
      {rotulo}
    </span>
  );
};

const ClienteCard: React.FC<{ cliente: Cliente; veiculos: Veiculo[] }> = ({ cliente, veiculos }) => {
  const digits = (cliente.telefone || '').replace(/\D/g, '');
  const extra = [cliente.cpf_cnpj, cliente.endereco].filter(Boolean).join(' • ');

  return (
    <div className="bg-white border border-neutral-200 rounded-sm px-2.5 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-neutral-900 leading-tight truncate">{cliente.nome}</span>
        {digits ? (
          <a href={`tel:${digits}`} className="text-[11px] text-neutral-500 shrink-0">
            {cliente.telefone}
          </a>
        ) : (
          <span className="text-[11px] text-neutral-400 shrink-0">sem telefone</span>
        )}
      </div>
      {extra ? <p className="text-[11px] text-neutral-400 truncate">{extra}</p> : null}
      {veiculos.length === 0 ? (
        <p className="text-[11px] text-neutral-400 mt-0.5">Nenhum veículo</p>
      ) : (
        <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 mt-0.5">
          {veiculos.map((v) => (
            <VeiculoChip key={v.id} veiculo={v} />
          ))}
        </div>
      )}
    </div>
  );
};

export const ClientesView: React.FC = () => {
  const { clientes, veiculos } = useOficina();
  const [nome, setNome] = useState('');

  const todos = useMemo(
    () => clientes.filter((c) => !c.eh_balcao),
    [clientes]
  );

  const lista = useMemo(() => {
    const termo = nome.trim().toLowerCase();
    return todos
      .filter((c) => !termo || c.nome.toLowerCase().includes(termo))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [todos, nome]);

  const quantidade =
    nome.trim() && lista.length !== todos.length
      ? `${lista.length} de ${todos.length}`
      : String(todos.length);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Clientes</h2>
        <span className="text-sm font-medium text-neutral-500">{quantidade}</span>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
        <input
          className={`${inputCompactClass} pl-8`}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Filtrar por nome"
        />
      </div>
      {lista.length === 0 ? (
        <p className="text-sm text-neutral-400 text-center py-8">
          {nome.trim() ? 'Nenhum cliente com esse nome.' : 'Nenhum cliente cadastrado.'}
        </p>
      ) : (
        <div className="space-y-1.5">
          {lista.map((cliente) => (
            <ClienteCard
              key={cliente.id}
              cliente={cliente}
              veiculos={veiculos.filter((v) => v.cliente_id === cliente.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
