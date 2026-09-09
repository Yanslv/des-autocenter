import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import type { Database } from '../types/database';
import { Campo, inputCompactClass } from './Campo';
import { formatBRL, rotuloEstoque } from '../utils/formatters';

const botaoLaranja =
  'w-full py-2.5 rounded-lg bg-[#cd3f00] text-white text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm active:bg-[#a83300]';
const botaoEscuro =
  'w-full py-2.5 rounded-lg bg-neutral-900 text-white text-sm font-semibold flex items-center justify-center shadow-sm active:bg-neutral-800';

type Produto = Database['public']['Tables']['produtos']['Row'];

export type ItemPecaServico = {
  id: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  tipo: string;
  origem_peca: string | null;
  produto_id?: string | null;
};

export const FotoProduto: React.FC<{ url: string | null | undefined }> = ({ url }) => {
  const src = url && /^https?:\/\//i.test(url) ? url : null;
  if (!src) {
    return <div className="w-12 h-12 shrink-0 rounded-md bg-neutral-100" aria-hidden />;
  }
  return <img src={src} alt="" className="w-12 h-12 shrink-0 rounded-md object-cover bg-neutral-100" />;
};

export const PecasServicosForm: React.FC<{
  itens: ItemPecaServico[];
  produtos: Produto[];
  podeEditar: boolean;
  podeEditarPreco: boolean;
  onAddServico?: (descricao: string, quantidade: number, valor: number) => Promise<void>;
  onAddPecaComprar?: (descricao: string, quantidade: number, valor: number) => Promise<void>;
  onAddPecaEstoque?: (produto: Produto, ehCaixa: boolean, quantidadePedido: number) => Promise<void>;
  onRemover?: (id: string) => Promise<void>;
  onAtualizarPreco?: (id: string, valor: number) => Promise<void>;
  onErro: (mensagem: string) => void;
}> = ({
  itens,
  produtos,
  podeEditar,
  podeEditarPreco,
  onAddServico,
  onAddPecaComprar,
  onAddPecaEstoque,
  onRemover,
  onAtualizarPreco,
  onErro,
}) => {
  const [tipoAdd, setTipoAdd] = useState<'servico' | 'peca' | null>(null);
  const [buscaPeca, setBuscaPeca] = useState('');
  const [desc, setDesc] = useState('');
  const [qtd, setQtd] = useState(1);
  const [valor, setValor] = useState(0);
  const [pendente, setPendente] = useState<Produto | null>(null);

  const total = itens.reduce((s, i) => s + Number(i.valor_total), 0);

  const pecasFiltradas = useMemo(() => {
    const t = buscaPeca.trim().toLowerCase();
    if (t.length < 2) return [];
    return produtos
      .filter((p) => p.nome.toLowerCase().includes(t) || (p.codigo || '').toLowerCase().includes(t))
      .slice(0, 8);
  }, [buscaPeca, produtos]);

  const run = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (e) {
      onErro(e instanceof Error ? e.message : 'Erro');
    }
  };

  const amarrarEstoque = async (p: Produto, ehCaixa: boolean, quantidadePedido: number) => {
    if (!onAddPecaEstoque) return;
    await onAddPecaEstoque(p, ehCaixa, quantidadePedido);
    setBuscaPeca('');
    setPendente(null);
    setQtd(1);
  };

  const limparServico = () => {
    setDesc('');
    setValor(0);
    setQtd(1);
  };

  const gravarServico = async () => {
    if (!desc.trim()) throw new Error('Descreva o serviço');
    if (!onAddServico) return;
    await onAddServico(desc.trim(), qtd, valor);
    limparServico();
  };

  const limparPeca = () => {
    setBuscaPeca('');
    setValor(0);
    setQtd(1);
    setPendente(null);
  };

  const gravarPecaComprar = async () => {
    if (buscaPeca.trim().length < 2) throw new Error('Informe a peça ou material');
    if (pecasFiltradas.length > 0) throw new Error('Selecione a peça da lista');
    if (!onAddPecaComprar) return;
    await onAddPecaComprar(buscaPeca.trim(), qtd, valor);
    limparPeca();
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-3 space-y-2">
      <h3 className="text-xs font-semibold">Peças e serviços</h3>
      {itens.map((it) => {
        const precoJaDoCatalogo = it.origem_peca === 'estoque' && Number(it.valor_unitario) > 0;
        const precisaInformarPreco = podeEditarPreco && !precoJaDoCatalogo;
        const origem =
          it.tipo === 'servico' ? 'Mão de obra' : it.origem_peca === 'estoque' ? 'Estoque' : 'Para comprar';
        const fotoUrl = produtos.find((p) => p.id === it.produto_id)?.foto_url;
        return (
          <div key={it.id} className="flex items-center gap-2 py-1 border-b border-neutral-100 last:border-0">
            {it.produto_id ? <FotoProduto url={fotoUrl} /> : null}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium leading-tight truncate">{it.descricao}</div>
              <div className="text-[10px] text-neutral-500">
                {origem} • {it.quantidade}x
              </div>
            </div>
            {precisaInformarPreco ? (
              <input
                className="w-20 shrink-0 rounded-md border border-neutral-200 bg-white px-1.5 py-1 text-[11px] font-mono text-right"
                type="number"
                step="0.01"
                aria-label="Preço unitário"
                defaultValue={Number(it.valor_unitario)}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isNaN(v) && v !== Number(it.valor_unitario)) {
                    if (onAtualizarPreco) void run(() => onAtualizarPreco(it.id, v));
                  }
                }}
              />
            ) : (
              <div className="text-[11px] font-mono shrink-0">{formatBRL(Number(it.valor_total))}</div>
            )}
            {podeEditar && (
              <button
                type="button"
                className="text-[10px] text-red-700 shrink-0"
                onClick={() => {
                  if (onRemover) void run(() => onRemover(it.id));
                }}
              >
                Tirar
              </button>
            )}
          </div>
        );
      })}

      {podeEditar && tipoAdd === null && (
        <div className="space-y-2">
          <button type="button" className={botaoLaranja} onClick={() => setTipoAdd('peca')}>
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Adicionar peça / material
          </button>
          <button type="button" className={botaoLaranja} onClick={() => setTipoAdd('servico')}>
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Adicionar serviço
          </button>
        </div>
      )}

      {podeEditar && tipoAdd === 'peca' && (
        <>
          <Campo label="Nome da peça">
            <input
              className={inputCompactClass}
              value={buscaPeca}
              onChange={(e) => {
                setBuscaPeca(e.target.value);
                setPendente(null);
              }}
            />
          </Campo>
          {pecasFiltradas.map((p) => (
            <button
              key={p.id}
              type="button"
              className="w-full text-left bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5"
              onClick={() => {
                if (p.eh_caixa && p.unidades_por_caixa > 1) {
                  setPendente(p);
                  return;
                }
                void run(() => amarrarEstoque(p, false, 1));
              }}
            >
              <div className="flex items-center gap-2">
                <FotoProduto url={p.foto_url} />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <span className="text-xs font-medium truncate">{p.nome}</span>
                    <span className="text-xs font-mono shrink-0">{formatBRL(Number(p.preco_venda))}</span>
                  </div>
                  <div className="text-[10px] text-neutral-500">{rotuloEstoque(p)}</div>
                </div>
              </div>
            </button>
          ))}
          {pendente && (
            <div className="border border-[#cd3f00] rounded-lg p-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <FotoProduto url={pendente.foto_url} />
                <p className="text-xs font-medium">{pendente.nome} — caixa ou unidade?</p>
              </div>
              <Campo label="Quantidade">
                <input
                  className={inputCompactClass}
                  type="number"
                  min={1}
                  value={qtd}
                  onChange={(e) => setQtd(Number(e.target.value))}
                />
              </Campo>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  className="py-1.5 rounded-lg bg-[#cd3f00] text-white text-xs font-semibold"
                  onClick={() => void run(() => amarrarEstoque(pendente, true, qtd))}
                >
                  Caixa
                </button>
                <button
                  type="button"
                  className="py-1.5 rounded-lg border border-neutral-200 text-xs font-semibold"
                  onClick={() => void run(() => amarrarEstoque(pendente, false, qtd))}
                >
                  Unidade
                </button>
              </div>
            </div>
          )}
          {buscaPeca.trim().length >= 2 && pecasFiltradas.length === 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] text-neutral-500">Não encontrada. Vai como Para comprar.</p>
              <div className="grid grid-cols-2 gap-2">
                <Campo label="Quantidade">
                  <input
                    className={inputCompactClass}
                    type="number"
                    min={1}
                    value={qtd}
                    onChange={(e) => setQtd(Number(e.target.value))}
                  />
                </Campo>
                <Campo label="Preço">
                  <input
                    className={inputCompactClass}
                    type="number"
                    step="0.01"
                    min={0}
                    value={valor}
                    onChange={(e) => setValor(Number(e.target.value))}
                  />
                </Campo>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={`${botaoLaranja} text-xs px-2`} onClick={() => void run(gravarPecaComprar)}>
              <Plus className="w-4 h-4 shrink-0" strokeWidth={2.5} />
              Adicionar peça
            </button>
            <button
              type="button"
              className={botaoEscuro}
              onClick={() =>
                void run(async () => {
                  if (buscaPeca.trim().length >= 2 && pecasFiltradas.length === 0) {
                    if (!onAddPecaComprar) return;
                    await onAddPecaComprar(buscaPeca.trim(), qtd, valor);
                    limparPeca();
                  }
                  setTipoAdd(null);
                })
              }
            >
              Salvar
            </button>
          </div>
        </>
      )}

      {podeEditar && tipoAdd === 'servico' && (
        <>
          <Campo label="Descrição do serviço">
            <input className={inputCompactClass} value={desc} onChange={(e) => setDesc(e.target.value)} />
          </Campo>
          <div className="grid grid-cols-2 gap-2">
            <Campo label="Quantidade">
              <input
                className={inputCompactClass}
                type="number"
                min={1}
                value={qtd}
                onChange={(e) => setQtd(Number(e.target.value))}
              />
            </Campo>
            <Campo label="Preço">
              <input
                className={inputCompactClass}
                type="number"
                step="0.01"
                min={0}
                value={valor}
                onChange={(e) => setValor(Number(e.target.value))}
              />
            </Campo>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={botaoLaranja} onClick={() => void run(gravarServico)}>
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Adicionar serviço
            </button>
            <button
              type="button"
              className={botaoEscuro}
              onClick={() =>
                void run(async () => {
                  if (desc.trim()) await gravarServico();
                  setTipoAdd(null);
                })
              }
            >
              Salvar
            </button>
          </div>
        </>
      )}
      <div className="text-right text-sm font-semibold">Total {formatBRL(total)}</div>
    </div>
  );
};
