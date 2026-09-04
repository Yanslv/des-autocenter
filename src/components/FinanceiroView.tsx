import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useOficina } from '../context/OficinaContext';
import { FORMA_LABEL } from '../types';
import {
  agruparLancamentosPorDia,
  custoMateriais,
  deslocarMes,
  detalharLancamentos,
  dreDoCaixa,
  formatDelta,
  horaDoLancamento,
  lancamentosDoPeriodo,
  mesAtualLocal,
  rotuloMes,
  somarCaixa,
  somarPorForma,
  variacaoPct,
  type GrupoDia,
  type Lancamento,
  type LinhaVenda,
} from '../utils/financeiro';
import { formatBRL } from '../utils/formatters';

type AbaFin = 'vendas' | 'dre' | 'fechamento';

const LinhaDre: React.FC<{
  label: string;
  valor: string;
  destaque?: boolean;
  tom?: 'entrada' | 'saida' | 'neutro';
}> = ({ label, valor, destaque, tom = 'neutro' }) => {
  const cor =
    tom === 'entrada' ? 'text-emerald-700' : tom === 'saida' ? 'text-red-700' : 'text-neutral-900';
  return (
    <div className={`flex items-baseline justify-between gap-3 py-1.5 ${destaque ? 'border-t border-neutral-200 mt-1 pt-2' : ''}`}>
      <span className={`text-sm ${destaque ? 'font-semibold' : 'text-neutral-600'}`}>{label}</span>
      <span className={`text-sm tabular-nums ${destaque ? 'font-bold' : 'font-medium'} ${cor}`}>{valor}</span>
    </div>
  );
};

const Kpi: React.FC<{ label: string; valor: string; detalhe?: string }> = ({ label, valor, detalhe }) => (
  <div className="rounded-xl border border-neutral-200 bg-white p-2.5">
    <p className="text-[10px] text-neutral-500 font-medium leading-tight">{label}</p>
    <p className="text-sm font-bold tabular-nums text-neutral-900 leading-tight">{valor}</p>
    {detalhe ? <p className="text-[10px] text-neutral-400 mt-0.5 leading-tight">{detalhe}</p> : null}
  </div>
);

const VendaItemLinha: React.FC<{ linha: LinhaVenda }> = ({ linha }) => (
  <div className="flex items-baseline justify-between gap-2 pl-11">
    <p className="min-w-0 text-xs text-neutral-800">
      <span className="font-medium">{linha.descricao}</span>
      <span className="text-neutral-400">{` ${linha.quantidade} un. × ${formatBRL(linha.valorUnitario)}`}</span>
    </p>
    <span className="shrink-0 text-xs tabular-nums text-neutral-600">{formatBRL(linha.valorTotal)}</span>
  </div>
);

const VendaLinha: React.FC<{
  item: Lancamento;
  clienteNome?: string;
  onOpen?: () => void;
}> = ({ item, clienteNome, onOpen }) => {
  const forma = item.forma && item.forma in FORMA_LABEL ? FORMA_LABEL[item.forma as keyof typeof FORMA_LABEL] : item.forma;
  const origem =
    item.tipo === 'os' ? `${item.rotulo}${clienteNome ? ` · ${clienteNome}` : ''}` : clienteNome ? `Balcão · ${clienteNome}` : 'Balcão';
  const corpo = (
    <div className="space-y-1 py-2.5">
      <div className="flex items-center gap-2">
        <span className="w-10 shrink-0 text-xs tabular-nums text-neutral-500">{horaDoLancamento(item.data)}</span>
        <span className="min-w-0 flex-1 truncate text-xs text-neutral-500">{origem}</span>
        {forma ? (
          <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
            {forma}
          </span>
        ) : null}
        <span className="shrink-0 text-sm font-semibold tabular-nums text-emerald-700">{formatBRL(item.valor)}</span>
      </div>
      {item.linhas.map((linha, i) => (
        <VendaItemLinha key={`${item.id}-${i}`} linha={linha} />
      ))}
      {item.desconto > 0 ? (
        <div className="flex items-baseline justify-between gap-2 pl-11 text-xs font-medium text-red-600">
          <span>Desconto</span>
          <span className="tabular-nums">- {formatBRL(item.desconto)}</span>
        </div>
      ) : null}
    </div>
  );
  const classe = 'w-full text-left border-t border-neutral-100 px-3';
  if (!onOpen) return <div className={classe}>{corpo}</div>;
  return (
    <button type="button" onClick={onOpen} className={classe}>
      {corpo}
    </button>
  );
};

const GrupoDiaBloco: React.FC<{
  grupo: GrupoDia;
  margem: number;
  aberto: boolean;
  onToggle: () => void;
  nomeCliente: (id: string) => string | undefined;
  onOpenOS: (id: string) => void;
}> = ({ grupo, margem, aberto, onToggle, nomeCliente, onOpenOS }) => (
  <div className="border-t border-neutral-100">
    <button type="button" onClick={onToggle} aria-expanded={aberto} className="flex w-full items-center gap-2 px-3 py-3 text-left">
      <ChevronDown className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${aberto ? '' : '-rotate-90'}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-neutral-900">{grupo.rotulo}</span>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-neutral-100 px-1.5 text-[10px] font-medium text-neutral-600">
            {grupo.qtd}
          </span>
        </div>
        <p className="text-[11px] text-neutral-400">
          {`ticket ${formatBRL(grupo.ticket)} · margem ${margem.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}
        </p>
      </div>
      <span className="shrink-0 text-sm font-bold tabular-nums text-emerald-700">{formatBRL(grupo.total)}</span>
    </button>
    {aberto
      ? grupo.itens.map((l) => (
          <VendaLinha
            key={l.id}
            item={l}
            clienteNome={l.clienteId ? nomeCliente(l.clienteId) : undefined}
            onOpen={l.osId ? () => onOpenOS(l.osId as string) : undefined}
          />
        ))
      : null}
  </div>
);

export const FinanceiroView: React.FC<{ onOpenOS: (id: string) => void }> = ({ onOpenOS }) => {
  const { ordens, clientes, produtos, itens, vendas, vendaItens } = useOficina();
  const teto = mesAtualLocal();
  const [mes, setMes] = useState(teto);
  const [aba, setAba] = useState<AbaFin>('vendas');

  const [diaAberto, setDiaAberto] = useState<string | null>(null);

  const pred = (iso: string) => iso.slice(0, 7) === mes;
  const mesPassado = deslocarMes(mes, -1);
  const predAnterior = (iso: string) => iso.slice(0, 7) === mesPassado;

  const caixa = useMemo(() => somarCaixa(vendas, ordens, pred), [vendas, ordens, mes]);
  const caixaAnterior = useMemo(
    () => somarCaixa(vendas, ordens, predAnterior),
    [vendas, ordens, mesPassado]
  );
  const materiais = useMemo(
    () => custoMateriais(caixa.osIds, caixa.vendaIds, itens, vendaItens, produtos),
    [caixa, itens, vendaItens, produtos]
  );
  const materiaisAnterior = useMemo(
    () =>
      custoMateriais(caixaAnterior.osIds, caixaAnterior.vendaIds, itens, vendaItens, produtos),
    [caixaAnterior, itens, vendaItens, produtos]
  );
  const dre = dreDoCaixa(caixa.total, materiais);
  const dreAnterior = dreDoCaixa(caixaAnterior.total, materiaisAnterior);
  const ticket = caixa.qtd > 0 ? caixa.total / caixa.qtd : 0;
  const lancamentos = useMemo(
    () => detalharLancamentos(lancamentosDoPeriodo(vendas, ordens, pred), itens, vendaItens, produtos),
    [vendas, ordens, itens, vendaItens, produtos, mes]
  );
  const vendasPorDia = useMemo(() => agruparLancamentosPorDia(lancamentos), [lancamentos]);
  const porForma = useMemo(() => somarPorForma(lancamentos), [lancamentos]);
  const deltaFat = variacaoPct(caixa.total, caixaAnterior.total);
  const deltaRes = variacaoPct(dre.lucroBruto, dreAnterior.lucroBruto);
  const nomeCliente = (id: string) => clientes.find((c) => c.id === id)?.nome;

  const abas: { id: AbaFin; label: string }[] = [
    { id: 'vendas', label: 'Vendas' },
    { id: 'dre', label: 'DRE' },
    { id: 'fechamento', label: 'Fechamento' },
  ];

  return (
    <div className="space-y-4 pb-4">
      <h2 className="text-lg font-semibold text-neutral-900">Financeiro</h2>

      <div className="flex items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white px-2 py-1.5">
        <button
          type="button"
          aria-label="Mês anterior"
          onClick={() => setMes((m) => deslocarMes(m, -1))}
          className="p-1.5 text-neutral-600"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold">{rotuloMes(mes)}</span>
        <button
          type="button"
          aria-label="Mês seguinte"
          disabled={mes >= teto}
          onClick={() => setMes((m) => deslocarMes(m, 1))}
          className="p-1.5 text-neutral-600 disabled:opacity-30"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <Kpi label="Faturamento" valor={formatBRL(caixa.total)} detalhe={`${caixa.qtd} venda${caixa.qtd === 1 ? '' : 's'}`} />
        <Kpi
          label="Resultado"
          valor={formatBRL(dre.lucroBruto)}
          detalhe={`margem ${dre.margem.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}
        />
        <Kpi label="OS entregues" valor={formatBRL(caixa.totalOs)} detalhe={`${caixa.qtdOs} OS`} />
        <Kpi label="Balcão" valor={formatBRL(caixa.totalBalcao)} detalhe={`${caixa.qtdBalcao} venda${caixa.qtdBalcao === 1 ? '' : 's'}`} />
      </div>

      <div className="flex gap-1.5">
        {abas.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAba(a.id)}
            className={`flex-1 py-1.5 rounded-sm text-[11px] font-semibold ${
              aba === a.id ? 'bg-[#cd3f00] text-white' : 'bg-white border border-neutral-200 text-neutral-600'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {aba === 'vendas' && (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <div className="px-3 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-neutral-900">Vendas por dia</h3>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
                {caixa.qtd} venda{caixa.qtd === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-xs text-neutral-400">Detalhe das vendas agrupadas por data</p>
          </div>
          {vendasPorDia.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-neutral-400">Nenhuma venda neste mês.</p>
          )}
          {vendasPorDia.map((grupo, i) => {
            const osIds = grupo.itens.filter((l) => l.tipo === 'os').map((l) => l.id);
            const vendaIds = grupo.itens.filter((l) => l.tipo === 'balcao').map((l) => l.id);
            const margem = dreDoCaixa(grupo.total, custoMateriais(osIds, vendaIds, itens, vendaItens, produtos)).margem;
            const aberto = diaAberto === null ? i === 0 : diaAberto === grupo.dia;
            return (
              <GrupoDiaBloco
                key={grupo.dia}
                grupo={grupo}
                margem={margem}
                aberto={aberto}
                onToggle={() => setDiaAberto(aberto ? '' : grupo.dia)}
                nomeCliente={nomeCliente}
                onOpenOS={onOpenOS}
              />
            );
          })}
        </div>
      )}

      {aba === 'dre' && (
        <div className="rounded-2xl border border-neutral-200 bg-white px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-neutral-500 font-semibold mb-1">
            Demonstração do resultado
          </p>
          <LinhaDre label="Receita de OS" valor={formatBRL(caixa.totalOs)} tom="entrada" />
          <LinhaDre label="Receita de balcão" valor={formatBRL(caixa.totalBalcao)} tom="entrada" />
          <LinhaDre label="Receita bruta" valor={formatBRL(dre.receita)} destaque />
          <LinhaDre label="(-) CMV (peças e insumos)" valor={formatBRL(dre.materiais)} tom="saida" />
          <LinhaDre
            label="Lucro bruto"
            valor={formatBRL(dre.lucroBruto)}
            destaque
            tom={dre.lucroBruto >= 0 ? 'entrada' : 'saida'}
          />
          <LinhaDre
            label="Margem bruta"
            valor={`${dre.margem.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}
          />
          <p className="text-[10px] text-neutral-400 mt-2">
            Ticket médio {formatBRL(ticket)} · CMV pelo custo cadastrado das peças.
          </p>
        </div>
      )}

      {aba === 'fechamento' && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-neutral-200 bg-white px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-neutral-500 font-semibold mb-1">
              Versus {rotuloMes(mesPassado)}
            </p>
            <LinhaDre label="Faturamento anterior" valor={formatBRL(caixaAnterior.total)} />
            <LinhaDre
              label="Variação do faturamento"
              valor={formatDelta(deltaFat)}
              tom={deltaFat === null || deltaFat === 0 ? 'neutro' : deltaFat > 0 ? 'entrada' : 'saida'}
            />
            <LinhaDre label="Resultado anterior" valor={formatBRL(dreAnterior.lucroBruto)} />
            <LinhaDre
              label="Variação do resultado"
              valor={formatDelta(deltaRes)}
              tom={deltaRes === null || deltaRes === 0 ? 'neutro' : deltaRes > 0 ? 'entrada' : 'saida'}
            />
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-neutral-500 font-semibold mb-1">
              Por forma de pagamento
            </p>
            {porForma.length === 0 && (
              <p className="text-sm text-neutral-400 py-2">Sem recebimentos neste mês.</p>
            )}
            {porForma.map((item) => (
              <LinhaDre
                key={item.forma}
                label={item.forma in FORMA_LABEL ? FORMA_LABEL[item.forma as keyof typeof FORMA_LABEL] : item.forma}
                valor={formatBRL(item.valor)}
                tom="entrada"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
