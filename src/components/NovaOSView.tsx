import React, { useMemo, useState } from 'react';
import { useOficina, type ItemAbrirOS } from '../context/OficinaContext';
import { QUEIXAS_RAPIDAS } from '../types';
import { Campo, inputClass, inputCompactClass } from './Campo';
import { CorPicker } from './CorPicker';
import { PecasServicosForm, type ItemPecaServico } from './PecasServicosForm';
import { maskKmInput, maskPlaca, parseKm, placaValida, unidadesDoPedido } from '../utils/formatters';
import { novoId } from '../utils/id';

type RascunhoItem = ItemPecaServico & {
  ehCaixa?: boolean;
};

const PRAZOS_RAPIDOS = [
  { d: 0, l: 'Hoje' },
  { d: 1, l: 'Amanhã' },
  { d: 2, l: '2 dias' },
  { d: 3, l: '3 dias' },
];

export const NovaOSView: React.FC<{ onAbriu: (osId: string) => void; onBack?: () => void }> = ({
  onAbriu,
  onBack,
}) => {
  const { buscarIdentidade, abrirOS, veiculos, clientes, produtos } = useOficina();
  const [placa, setPlaca] = useState('');
  const [clienteNome, setClienteNome] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [veiculoId, setVeiculoId] = useState('');
  const [problema, setProblema] = useState('');
  const [prazo, setPrazo] = useState(0);
  const [km, setKm] = useState('');
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [endereco, setEndereco] = useState('');
  const [itens, setItens] = useState<RascunhoItem[]>([]);
  const [erro, setErro] = useState('');
  const [busy, setBusy] = useState(false);

  const hitsPlaca = useMemo(() => buscarIdentidade(placa), [placa, buscarIdentidade]);
  const hitsNome = useMemo(() => buscarIdentidade(clienteNome), [clienteNome, buscarIdentidade]);
  const veiculosDoCliente = useMemo(
    () => (clienteId ? veiculos.filter((v) => v.cliente_id === clienteId) : []),
    [clienteId, veiculos]
  );

  const preencherCliente = (id: string, nome: string) => {
    const c = clientes.find((x) => x.id === id);
    setClienteId(id);
    setClienteNome(nome);
    setTelefone(c?.telefone || '');
    setCpf(c?.cpf_cnpj || '');
    setEndereco(c?.endereco || '');
  };

  const preencherVeiculo = (id: string, placaAtual: string) => {
    const v = veiculos.find((x) => x.id === id);
    setVeiculoId(id);
    setPlaca(maskPlaca(placaAtual));
    setModelo(v?.modelo || '');
    setCor(v?.cor || '');
  };

  const toItensAbrir = (): ItemAbrirOS[] =>
    itens.map((i) => {
      if (i.tipo === 'servico') {
        return { tipo: 'servico', descricao: i.descricao, quantidade: i.quantidade, valor: i.valor_unitario };
      }
      if (i.origem_peca === 'estoque' && i.produto_id) {
        return {
          tipo: 'estoque',
          produtoId: i.produto_id,
          quantidadeUnidades: i.quantidade,
          ehCaixa: !!i.ehCaixa,
        };
      }
      return { tipo: 'comprar', descricao: i.descricao, quantidade: i.quantidade, valor: i.valor_unitario };
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placaValida(placa)) {
      setErro('Placa obrigatória e válida');
      return;
    }
    if (!clienteNome.trim()) {
      setErro('Nome do cliente obrigatório');
      return;
    }
    if (!problema.trim()) {
      setErro('Descreva a queixa');
      return;
    }
    if (!Number.isFinite(prazo) || prazo < 0) {
      setErro('Informe o prazo em dias');
      return;
    }
    setBusy(true);
    setErro('');
    try {
      const id = await abrirOS({
        placa,
        clienteNome,
        clienteId: clienteId || undefined,
        veiculoId: veiculoId || undefined,
        problema,
        prazoDias: prazo,
        km: parseKm(km),
        modelo,
        cor,
        telefone,
        cpf,
        endereco,
        itens: toItensAbrir(),
      });
      onAbriu(id);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao abrir OS');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key !== 'Enter') return;
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'BUTTON' || tag === 'TEXTAREA') return;
        e.preventDefault();
      }}
      className="space-y-4 pb-4"
    >
      <div>
        {onBack ? (
          <button type="button" onClick={onBack} className="text-sm text-[#cd3f00] font-medium">
            Voltar
          </button>
        ) : null}
        <h2 className="text-lg font-semibold">Nova OS</h2>
        <p className="text-xs text-neutral-500">Preencha o atendimento completo. Um cliente pode ter vários veículos.</p>
      </div>

      <Campo label="Placa">
        <input
          className={inputClass}
          value={placa}
          onChange={(e) => {
            setPlaca(maskPlaca(e.target.value));
            setVeiculoId('');
          }}
          autoFocus
          required
        />
      </Campo>

      {hitsPlaca.length > 0 && !veiculoId && placa.length >= 3 && (
        <div className="space-y-2">
          {hitsPlaca.map((hit) =>
            hit.veiculos
              .filter((v) =>
                (v.placa || '')
                  .replace(/[^A-Za-z0-9]/g, '')
                  .toUpperCase()
                  .includes(placa.replace(/[^A-Za-z0-9]/g, ''))
              )
              .map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className="w-full text-left bg-white border border-neutral-200 rounded-xl p-3"
                  onClick={() => {
                    const c = clientes.find((x) => x.id === v.cliente_id) || hit.cliente;
                    preencherCliente(c.id, c.nome);
                    preencherVeiculo(v.id, v.placa || '');
                  }}
                >
                  <div className="font-medium text-sm">{v.placa}</div>
                  <div className="text-xs text-neutral-500">
                    {hit.cliente.nome}
                    {v.modelo ? ` • ${v.modelo}` : ''}
                  </div>
                </button>
              ))
          )}
        </div>
      )}

      <Campo label="Cliente">
        <input
          className={inputClass}
          value={clienteNome}
          onChange={(e) => {
            setClienteNome(e.target.value);
            setClienteId('');
            setVeiculoId('');
          }}
          required
        />
      </Campo>

      {hitsNome.length > 0 && !clienteId && clienteNome.length >= 2 && (
        <div className="space-y-2">
          {hitsNome.map((hit) => (
            <button
              key={hit.cliente.id}
              type="button"
              className="w-full text-left bg-white border border-neutral-200 rounded-xl p-3"
              onClick={() => {
                preencherCliente(hit.cliente.id, hit.cliente.nome);
                setVeiculoId('');
              }}
            >
              <div className="font-medium text-sm">{hit.cliente.nome}</div>
              <div className="text-xs text-neutral-500">
                {hit.cliente.telefone || 'sem telefone'}
                {hit.veiculos.length > 0
                  ? ` • ${hit.veiculos.length} veículo${hit.veiculos.length > 1 ? 's' : ''}`
                  : ''}
              </div>
            </button>
          ))}
        </div>
      )}

      {clienteId && veiculosDoCliente.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-neutral-600">
            Veículos deste cliente — escolha um ou informe outra placa
          </p>
          {veiculosDoCliente.map((v) => {
            const ativo = v.id === veiculoId;
            return (
              <button
                key={v.id}
                type="button"
                className={`w-full text-left rounded-xl p-3 border ${
                  ativo ? 'border-[#cd3f00] bg-orange-50' : 'bg-white border-neutral-200'
                }`}
                onClick={() => preencherVeiculo(v.id, v.placa || '')}
              >
                <div className="font-medium text-sm">{v.placa || 'sem placa'}</div>
                <div className="text-xs text-neutral-500">
                  {[v.modelo, v.cor].filter(Boolean).join(' • ') || 'sem modelo'}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {QUEIXAS_RAPIDAS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setProblema(q)}
            className="px-2.5 py-1.5 rounded-full bg-white border border-neutral-200 text-xs"
          >
            {q}
          </button>
        ))}
      </div>

      <Campo label="Queixa / o que precisa fazer">
        <textarea
          className={`${inputClass} min-h-24`}
          value={problema}
          onChange={(e) => setProblema(e.target.value)}
          required
        />
      </Campo>

      <div className="bg-white border border-neutral-200 rounded-xl p-3 space-y-2">
        <h3 className="text-xs font-semibold">Entrada do carro</h3>
        <div className="grid grid-cols-2 gap-2">
          <Campo label="KM">
            <input
              className={inputCompactClass}
              inputMode="numeric"
              value={km}
              onChange={(e) => setKm(maskKmInput(e.target.value))}
            />
          </Campo>
          <Campo label="Modelo">
            <input
              className={inputCompactClass}
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              placeholder="Onix, Civic, Gol..."
            />
          </Campo>
        </div>
        <CorPicker value={cor} onChange={setCor} />
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-3 space-y-2">
        <h3 className="text-xs font-semibold">Cliente (nota / Zap)</h3>
        <Campo label="Telefone">
          <input className={inputCompactClass} value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        </Campo>
        <Campo label="CPF/CNPJ">
          <input className={inputCompactClass} value={cpf} onChange={(e) => setCpf(e.target.value)} />
        </Campo>
        <Campo label="Endereço">
          <input className={inputCompactClass} value={endereco} onChange={(e) => setEndereco(e.target.value)} />
        </Campo>
      </div>

      <PecasServicosForm
        itens={itens}
        produtos={produtos}
        podeEditar
        podeEditarPreco
        onErro={setErro}
        onAddServico={async (descricao, quantidade, valor) => {
          const id = novoId();
          setItens((prev) => [
            ...prev,
            {
              id,
              descricao,
              quantidade,
              valor_unitario: valor,
              valor_total: quantidade * valor,
              tipo: 'servico',
              origem_peca: null,
            },
          ]);
        }}
        onAddPecaComprar={async (descricao, quantidade, valor) => {
          const id = novoId();
          setItens((prev) => [
            ...prev,
            {
              id,
              descricao,
              quantidade,
              valor_unitario: valor,
              valor_total: quantidade * valor,
              tipo: 'produto',
              origem_peca: 'comprar',
            },
          ]);
        }}
        onAddPecaEstoque={async (produto, ehCaixa, quantidadePedido) => {
          const id = novoId();
          const unidades = unidadesDoPedido(produto, ehCaixa, quantidadePedido);
          setItens((prev) => [
            ...prev,
            {
              id,
              descricao: ehCaixa ? `${produto.nome} (caixa)` : produto.nome,
              quantidade: unidades,
              valor_unitario: Number(produto.preco_venda),
              valor_total: unidades * Number(produto.preco_venda),
              tipo: 'produto',
              origem_peca: 'estoque',
              produto_id: produto.id,
              ehCaixa,
            },
          ]);
        }}
        onRemover={async (id) => {
          setItens((prev) => prev.filter((i) => i.id !== id));
        }}
        onAtualizarPreco={async (id, valor) => {
          setItens((prev) =>
            prev.map((i) =>
              i.id === id ? { ...i, valor_unitario: valor, valor_total: i.quantidade * valor } : i
            )
          );
        }}
      />

      <div>
        <p className="text-xs font-medium text-neutral-600 mb-2">Prazo</p>
        <div className="grid grid-cols-4 gap-2">
          {PRAZOS_RAPIDOS.map((p) => (
            <button
              key={p.d}
              type="button"
              onClick={() => setPrazo(p.d)}
              className={`py-2 rounded-xl text-xs font-semibold border ${
                prazo === p.d ? 'bg-[#cd3f00] text-white border-[#cd3f00]' : 'bg-white border-neutral-200'
              }`}
            >
              {p.l}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Campo label="Dias em aberto">
            <input
              className={inputCompactClass}
              type="number"
              min={0}
              inputMode="numeric"
              value={prazo}
              onChange={(e) => setPrazo(Math.max(0, Number(e.target.value) || 0))}
            />
          </Campo>
        </div>
      </div>

      {erro && <p className="text-sm text-red-700">{erro}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full py-3 rounded-xl bg-[#cd3f00] text-white font-semibold disabled:opacity-60"
      >
        {busy ? 'Abrindo…' : 'Abrir OS'}
      </button>
    </form>
  );
};
