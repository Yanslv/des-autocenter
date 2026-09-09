import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import type { Database } from '../types/database';
import { SERVICOS_ORCAMENTO } from '../utils/orcamento';
import { formatBRL, rotuloEstoque } from '../utils/formatters';
import { Campo, inputCompactClass } from './Campo';
import { FotoProduto } from './PecasServicosForm';

const botaoLaranja =
  'w-full py-2.5 rounded-lg bg-[#cd3f00] text-white text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm active:bg-[#a83300]';
const botaoEscuro =
  'w-full py-2.5 rounded-lg bg-neutral-900 text-white text-sm font-semibold flex items-center justify-center shadow-sm active:bg-neutral-800';

type Produto = Database['public']['Tables']['produtos']['Row'];

export type ItemOrcamentoForm = {
  id: string;
  tipo: string;
  descricao: string;
  detalhe?: string | null;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  produto_id?: string | null;
  origem_peca?: string | null;
};

export const OrcamentoItensForm: React.FC<{
  itens: ItemOrcamentoForm[];
  produtos: Produto[];
  podeEditar: boolean;
  onErro: (mensagem: string) => void;
  onAddServico: (descricao: string, detalhe: string, quantidade: number, valor: number) => Promise<void>;
  onAddPecaComprar: (descricao: string, quantidade: number, valor: number) => Promise<void>;
  onAddPecaEstoque: (produto: Produto, ehCaixa: boolean, quantidadePedido: number) => Promise<void>;
  onAddTerceiro: (descricao: string, quantidade: number, valor: number) => Promise<void>;
  onRemover: (id: string) => Promise<void>;
}> = ({
  itens,
  produtos,
  podeEditar,
  onErro,
  onAddServico,
  onAddPecaComprar,
  onAddPecaEstoque,
  onAddTerceiro,
  onRemover,
}) => {
  const servicos = itens.filter((i) => i.tipo === 'servico');
  const pecas = itens.filter((i) => i.tipo === 'produto');
  const terceiros = itens.filter((i) => i.tipo === 'terceiro');

  const [servicoNome, setServicoNome] = useState('');
  const [servicoDetalhe, setServicoDetalhe] = useState('');
  const [servicoQtd, setServicoQtd] = useState(1);
  const [servicoValor, setServicoValor] = useState(0);
  const [buscaPeca, setBuscaPeca] = useState('');
  const [pecaQtd, setPecaQtd] = useState(1);
  const [pecaValor, setPecaValor] = useState(0);
  const [pendente, setPendente] = useState<Produto | null>(null);
  const [terceiroNome, setTerceiroNome] = useState('');
  const [terceiroValor, setTerceiroValor] = useState(0);
  const [formServicoAberto, setFormServicoAberto] = useState(false);
  const [formPecaAberto, setFormPecaAberto] = useState(false);

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

  const limparServico = () => {
    setServicoNome('');
    setServicoDetalhe('');
    setServicoValor(0);
    setServicoQtd(1);
  };

  const gravarServico = async () => {
    if (!servicoNome.trim()) throw new Error('Informe o serviço');
    await onAddServico(servicoNome.trim(), servicoDetalhe.trim(), servicoQtd, servicoValor);
    limparServico();
  };

  const limparPeca = () => {
    setBuscaPeca('');
    setPecaValor(0);
    setPecaQtd(1);
    setPendente(null);
  };

  const gravarPecaComprar = async () => {
    if (buscaPeca.trim().length < 2) throw new Error('Informe a peça ou material');
    if (pecasFiltradas.length > 0) throw new Error('Selecione a peça da lista');
    await onAddPecaComprar(buscaPeca.trim(), pecaQtd, pecaValor);
    limparPeca();
  };

  return (
    <div className="space-y-3">
      <section className="bg-white border border-neutral-200 rounded-xl p-3 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">O que será feito no veículo</h3>
        {servicos.map((it) => (
          <LinhaItem key={it.id} item={it} podeEditar={podeEditar} onRemover={() => void run(() => onRemover(it.id))} />
        ))}
        {servicos.length === 0 && <p className="text-xs text-neutral-400">Nenhum serviço ainda.</p>}
        {podeEditar && !formServicoAberto && (
          <button type="button" className={botaoLaranja} onClick={() => setFormServicoAberto(true)}>
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Adicionar serviço
          </button>
        )}
        {podeEditar && formServicoAberto && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {SERVICOS_ORCAMENTO.map((s) => (
                <button
                  key={s.nome}
                  type="button"
                  onClick={() => {
                    setServicoNome(s.nome);
                    setServicoDetalhe(s.detalhe);
                  }}
                  className="px-2.5 py-1.5 rounded-full bg-neutral-50 border border-neutral-200 text-xs"
                >
                  {s.nome}
                </button>
              ))}
            </div>
            <Campo label="Serviço">
              <input className={inputCompactClass} value={servicoNome} onChange={(e) => setServicoNome(e.target.value)} />
            </Campo>
            <Campo label="Descrição (o que o cliente precisa entender)">
              <textarea
                className={`${inputCompactClass} min-h-16`}
                value={servicoDetalhe}
                onChange={(e) => setServicoDetalhe(e.target.value)}
              />
            </Campo>
            <div className="grid grid-cols-2 gap-2">
              <Campo label="Quantidade">
                <input
                  className={inputCompactClass}
                  type="number"
                  min={1}
                  value={servicoQtd}
                  onChange={(e) => setServicoQtd(Number(e.target.value))}
                />
              </Campo>
              <Campo label="Valor">
                <input
                  className={inputCompactClass}
                  type="number"
                  step="0.01"
                  min={0}
                  value={servicoValor}
                  onChange={(e) => setServicoValor(Number(e.target.value))}
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
                    if (servicoNome.trim()) await gravarServico();
                    setFormServicoAberto(false);
                  })
                }
              >
                Salvar
              </button>
            </div>
          </>
        )}
        <p className="text-right text-sm font-semibold">Total dos serviços {formatBRL(soma(servicos))}</p>
      </section>

      <section className="bg-white border border-neutral-200 rounded-xl p-3 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Peças e materiais</h3>
        {pecas.map((it) => (
          <LinhaItem key={it.id} item={it} produtos={produtos} podeEditar={podeEditar} onRemover={() => void run(() => onRemover(it.id))} />
        ))}
        {pecas.length === 0 && <p className="text-xs text-neutral-400">Nenhuma peça ou material ainda.</p>}
        {podeEditar && !formPecaAberto && (
          <button type="button" className={botaoLaranja} onClick={() => setFormPecaAberto(true)}>
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Adicionar peça / material
          </button>
        )}
        {podeEditar && formPecaAberto && (
          <>
            <Campo label="Buscar no estoque ou informar peça">
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
                  void run(async () => {
                    await onAddPecaEstoque(p, false, 1);
                    setBuscaPeca('');
                  });
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
                <p className="text-xs font-medium">{pendente.nome} — caixa ou unidade?</p>
                <Campo label="Quantidade">
                  <input
                    className={inputCompactClass}
                    type="number"
                    min={1}
                    value={pecaQtd}
                    onChange={(e) => setPecaQtd(Number(e.target.value))}
                  />
                </Campo>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    className="py-1.5 rounded-lg bg-[#cd3f00] text-white text-xs font-semibold"
                    onClick={() =>
                      void run(async () => {
                        await onAddPecaEstoque(pendente, true, pecaQtd);
                        setPendente(null);
                        setBuscaPeca('');
                      })
                    }
                  >
                    Caixa
                  </button>
                  <button
                    type="button"
                    className="py-1.5 rounded-lg border border-neutral-200 text-xs font-semibold"
                    onClick={() =>
                      void run(async () => {
                        await onAddPecaEstoque(pendente, false, pecaQtd);
                        setPendente(null);
                        setBuscaPeca('');
                      })
                    }
                  >
                    Unidade
                  </button>
                </div>
              </div>
            )}
            {buscaPeca.trim().length >= 2 && pecasFiltradas.length === 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] text-neutral-500">Fora do estoque. Entra como material a comprar.</p>
                <div className="grid grid-cols-2 gap-2">
                  <Campo label="Quantidade">
                    <input
                      className={inputCompactClass}
                      type="number"
                      min={1}
                      value={pecaQtd}
                      onChange={(e) => setPecaQtd(Number(e.target.value))}
                    />
                  </Campo>
                  <Campo label="Valor unitário">
                    <input
                      className={inputCompactClass}
                      type="number"
                      step="0.01"
                      min={0}
                      value={pecaValor}
                      onChange={(e) => setPecaValor(Number(e.target.value))}
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
                      await onAddPecaComprar(buscaPeca.trim(), pecaQtd, pecaValor);
                      limparPeca();
                    }
                    setFormPecaAberto(false);
                  })
                }
              >
                Salvar
              </button>
            </div>
          </>
        )}
        <p className="text-right text-sm font-semibold">Total de peças e materiais {formatBRL(soma(pecas))}</p>
      </section>

      <section className="bg-white border border-neutral-200 rounded-xl p-3 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Serviços de terceiros</h3>
        {terceiros.map((it) => (
          <LinhaItem key={it.id} item={it} podeEditar={podeEditar} onRemover={() => void run(() => onRemover(it.id))} />
        ))}
        {podeEditar && (
          <>
            <Campo label="Descrição">
              <input className={inputCompactClass} value={terceiroNome} onChange={(e) => setTerceiroNome(e.target.value)} />
            </Campo>
            <Campo label="Valor">
              <input
                className={inputCompactClass}
                type="number"
                step="0.01"
                min={0}
                value={terceiroValor}
                onChange={(e) => setTerceiroValor(Number(e.target.value))}
              />
            </Campo>
            <button
              type="button"
              className="w-full py-2 rounded-lg border border-neutral-200 text-xs font-semibold"
              onClick={() =>
                void run(async () => {
                  if (!terceiroNome.trim()) throw new Error('Informe o serviço de terceiro');
                  await onAddTerceiro(terceiroNome.trim(), 1, terceiroValor);
                  setTerceiroNome('');
                  setTerceiroValor(0);
                })
              }
            >
              Adicionar terceiro
            </button>
          </>
        )}
        <p className="text-right text-sm font-semibold">Total de terceiros {formatBRL(soma(terceiros))}</p>
      </section>
    </div>
  );
};

const LinhaItem: React.FC<{
  item: ItemOrcamentoForm;
  produtos?: Produto[];
  podeEditar: boolean;
  onRemover: () => void;
}> = ({ item, produtos, podeEditar, onRemover }) => {
  const fotoUrl = produtos?.find((p) => p.id === item.produto_id)?.foto_url;
  return (
    <div className="flex items-start gap-2 py-1 border-b border-neutral-100 last:border-0">
      {item.produto_id ? <FotoProduto url={fotoUrl} /> : null}
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium leading-tight">{item.descricao}</div>
        {item.detalhe ? <div className="text-[11px] text-neutral-500 leading-snug">{item.detalhe}</div> : null}
        <div className="text-[10px] text-neutral-400">{item.quantidade}x</div>
      </div>
      <div className="text-[11px] font-mono shrink-0">{formatBRL(Number(item.valor_total))}</div>
      {podeEditar && (
        <button type="button" className="text-[10px] text-red-700 shrink-0" onClick={onRemover}>
          Tirar
        </button>
      )}
    </div>
  );
};

function soma(itens: ItemOrcamentoForm[]) {
  return itens.reduce((s, i) => s + Number(i.valor_total), 0);
}
