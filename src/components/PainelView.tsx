import React, { useMemo, useState } from 'react';
import { ChevronDown, DollarSign, Receipt, ShoppingCart, TrendingUp } from 'lucide-react';
import { useOficina } from '../context/OficinaContext';
import { STATUS_COR, STATUS_LABEL, type StatusOS } from '../types';
import { formatDateBR } from '../utils/dateUtils';
import {
  custoMateriais,
  formatDelta,
  mesmoDia,
  mesmoMes,
  somarCaixa,
  variacaoPct,
  ymdMaisDias,
} from '../utils/financeiro';
import { formatBRL, rotuloEstoque, saldoLivre } from '../utils/formatters';
import { OrcamentoResumoCard } from './OrcamentosListaView';

function diasDesde(iso: string | null) {
  if (!iso) return 0;
  const d = new Date(iso);
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function formatMargem(pct: number) {
  return `${pct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}

function corMargem(pct: number, semBase: boolean) {
  if (semBase) return { icon: 'bg-neutral-400', ativo: 'bg-neutral-50 border-neutral-300 ring-1 ring-neutral-300' };
  if (pct >= 50) return { icon: 'bg-emerald-500', ativo: 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-300' };
  if (pct >= 30) return { icon: 'bg-orange-500', ativo: 'bg-orange-50 border-orange-200 ring-1 ring-orange-300' };
  return { icon: 'bg-red-500', ativo: 'bg-red-50 border-red-200 ring-1 ring-red-300' };
}

function corDelta(pct: number | null) {
  if (pct === null || pct === 0) return 'text-neutral-500';
  return pct > 0 ? 'text-emerald-600' : 'text-red-600';
}

const KpiMini: React.FC<{
  label: string;
  valor: string;
  icon: React.ReactNode;
  iconBg: string;
  ativo: boolean;
  ativoClass: string;
  onClick: () => void;
}> = ({ label, valor, icon, iconBg, ativo, ativoClass, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left rounded-xl border p-2 transition-colors ${
      ativo ? ativoClass : 'border-neutral-200 bg-white hover:bg-neutral-50'
    }`}
  >
    <div className="flex items-center gap-2 min-w-0">
      <span className={`w-7 h-7 rounded-lg ${iconBg} text-white flex items-center justify-center shrink-0`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] text-neutral-500 font-medium leading-tight truncate">{label}</p>
        <p className="text-sm font-semibold text-neutral-900 leading-tight truncate tabular-nums">{valor}</p>
      </div>
    </div>
  </button>
);

const MesCard: React.FC<{
  label: string;
  valor: string;
  detalhe?: string;
  tom: 'entrada' | 'saida';
  ativo: boolean;
  onClick: () => void;
}> = ({ label, valor, detalhe, tom, ativo, onClick }) => {
  const valorClass = tom === 'entrada' ? 'text-emerald-600' : 'text-red-600';
  const ativoClass =
    tom === 'entrada' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-2 transition-colors ${
        ativo ? ativoClass : 'border-neutral-200 bg-white hover:bg-neutral-50'
      }`}
    >
      <p className="text-[10px] text-neutral-500 font-medium leading-tight">{label}</p>
      <p className={`text-sm font-bold tabular-nums ${valorClass}`}>{valor}</p>
      {detalhe ? <p className="text-[10px] text-neutral-400 mt-0.5 leading-tight">{detalhe}</p> : null}
    </button>
  );
};

export const PainelView: React.FC<{
  onOpenOS: (id: string) => void;
  onOpenOrcamento: (id: string) => void;
  onVerTodosOrcamentos: () => void;
  onEstoqueCritico: (produtoId: string) => void;
}> = ({ onOpenOS, onOpenOrcamento, onVerTodosOrcamentos, onEstoqueCritico }) => {
  const {
    isVendedor,
    ordens,
    clientes,
    veiculos,
    produtos,
    itens,
    vendas,
    vendaItens,
    orcamentos,
    marcarPosVenda,
  } = useOficina();
  const [filtro, setFiltro] = useState<'cotar' | 'oficina' | 'pronto' | 'saiu'>(
    isVendedor ? 'cotar' : 'oficina'
  );
  const [blocoHoje, setBlocoHoje] = useState(false);
  const [blocoMes, setBlocoMes] = useState(false);
  const [kpiHoje, setKpiHoje] = useState<string | null>(null);
  const [kpiMes, setKpiMes] = useState<string | null>(null);

  const hoje = new Date().toISOString().slice(0, 10);
  const ontem = ymdMaisDias(hoje, -1);

  const caixaHoje = useMemo(
    () => somarCaixa(vendas, ordens, (iso) => mesmoDia(iso, hoje)),
    [vendas, ordens, hoje]
  );
  const caixaOntem = useMemo(
    () => somarCaixa(vendas, ordens, (iso) => mesmoDia(iso, ontem)),
    [vendas, ordens, ontem]
  );
  const caixaMes = useMemo(
    () => somarCaixa(vendas, ordens, (iso) => mesmoMes(iso, hoje)),
    [vendas, ordens, hoje]
  );

  const materiaisMes = useMemo(
    () => custoMateriais(caixaMes.osIds, caixaMes.vendaIds, itens, vendaItens, produtos),
    [caixaMes, itens, vendaItens, produtos]
  );

  const despesasMes = 0;
  const resultadoMes = caixaMes.total - materiaisMes - despesasMes;
  const ticketHoje = caixaHoje.qtd > 0 ? caixaHoje.total / caixaHoje.qtd : 0;
  const ticketMes = caixaMes.qtd > 0 ? caixaMes.total / caixaMes.qtd : 0;
  const margemMes = caixaMes.total > 0 ? (resultadoMes / caixaMes.total) * 100 : 0;
  const deltaHoje = variacaoPct(caixaHoje.total, caixaOntem.total);
  const margemVisual = corMargem(margemMes, caixaMes.total === 0);
  const hojeTom = deltaHoje === null || deltaHoje === 0 ? 'neutro' : deltaHoje > 0 ? 'alta' : 'baixa';
  const mesTom = resultadoMes >= 0 ? 'alta' : 'baixa';

  const criticos = useMemo(
    () =>
      produtos.filter(
        (p) => p.avisar_estoque_baixo && saldoLivre(p) <= p.estoque_minimo
      ),
    [produtos]
  );

  const posVenda = useMemo(() => {
    return ordens.filter((o) => {
      if (o.status !== 'Entregue' || !o.data_entrega || o.pos_venda_ligado_em) return false;
      const dias = diasDesde(o.data_entrega);
      return dias >= 90 && dias <= 130;
    });
  }, [ordens]);

  const filas = useMemo(() => {
    const cotar = ordens.filter((o) => o.status === 'AguardandoCotar');
    const oficina = ordens.filter((o) =>
      ['Aberta', 'AguardandoCotar', 'AguardandoCliente', 'Fazendo', 'TravadoPeca'].includes(o.status)
    );
    const pronto = ordens.filter((o) => o.status === 'Pronto');
    const saiu = ordens.filter(
      (o) => o.status === 'Entregue' && (o.data_entrega || '').slice(0, 10) === hoje
    );
    return { cotar, oficina, pronto, saiu };
  }, [ordens, hoje]);

  const lista = filas[filtro];
  const filtros: { id: typeof filtro; label: string; show: boolean }[] = [
    { id: 'cotar', label: `Cotar (${filas.cotar.length})`, show: isVendedor },
    { id: 'oficina', label: `Na oficina (${filas.oficina.length})`, show: true },
    { id: 'pronto', label: `Pronto (${filas.pronto.length})`, show: true },
    { id: 'saiu', label: `Saiu hoje (${filas.saiu.length})`, show: isVendedor },
  ];

  const tomBloco = (tom: 'alta' | 'baixa' | 'neutro', aberto: boolean) => {
    if (!aberto) return 'border-neutral-200 bg-white';
    if (tom === 'alta') return 'border-emerald-200 bg-emerald-50/60';
    if (tom === 'baixa') return 'border-red-200 bg-red-50/60';
    return 'border-neutral-200 bg-white';
  };

  return (
    <div className="space-y-4 pb-4">
      <h2 className="text-lg font-semibold text-neutral-900">Painel</h2>

      <div className={`rounded-2xl border overflow-hidden transition-colors ${tomBloco(hojeTom, blocoHoje)}`}>
        <button
          type="button"
          onClick={() => setBlocoHoje((v) => !v)}
          className="w-full flex items-center gap-2 px-3 py-2"
        >
          <span className="text-[11px] uppercase tracking-wide text-neutral-500 font-semibold">Hoje</span>
          <span className="ml-auto text-xs font-semibold tabular-nums text-neutral-800">{formatBRL(caixaHoje.total)}</span>
          <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${blocoHoje ? 'rotate-0' : '-rotate-90'}`} />
        </button>
        {blocoHoje && (
          <div className="px-2 pb-2 space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <KpiMini
                label="Faturamento (caixa)"
                valor={formatBRL(caixaHoje.total)}
                icon={<DollarSign className="w-3.5 h-3.5" />}
                iconBg="bg-emerald-500"
                ativo={kpiHoje === 'fatura'}
                ativoClass="bg-emerald-50 border-emerald-200 ring-1 ring-emerald-300"
                onClick={() => setKpiHoje((v) => (v === 'fatura' ? null : 'fatura'))}
              />
              <KpiMini
                label="Vendas hoje"
                valor={String(caixaHoje.qtd)}
                icon={<ShoppingCart className="w-3.5 h-3.5" />}
                iconBg="bg-sky-500"
                ativo={kpiHoje === 'vendas'}
                ativoClass="bg-sky-50 border-sky-200 ring-1 ring-sky-300"
                onClick={() => setKpiHoje((v) => (v === 'vendas' ? null : 'vendas'))}
              />
              <KpiMini
                label="Ticket médio"
                valor={formatBRL(ticketHoje)}
                icon={<Receipt className="w-3.5 h-3.5" />}
                iconBg="bg-indigo-500"
                ativo={kpiHoje === 'ticket'}
                ativoClass="bg-indigo-50 border-indigo-200 ring-1 ring-indigo-300"
                onClick={() => setKpiHoje((v) => (v === 'ticket' ? null : 'ticket'))}
              />
              <KpiMini
                label="Margem % mês"
                valor={formatMargem(margemMes)}
                icon={<TrendingUp className="w-3.5 h-3.5" />}
                iconBg={margemVisual.icon}
                ativo={kpiHoje === 'margem'}
                ativoClass={margemVisual.ativo}
                onClick={() => setKpiHoje((v) => (v === 'margem' ? null : 'margem'))}
              />
            </div>
            <p className="text-[11px] text-neutral-500 px-1">
              vs ontem:{' '}
              <span className={`font-semibold ${corDelta(deltaHoje)}`}>{formatDelta(deltaHoje)}</span>
              {' · '}ontem {formatBRL(caixaOntem.total)} · {caixaOntem.qtd} venda
              {caixaOntem.qtd === 1 ? '' : 's'}
            </p>
          </div>
        )}
      </div>

      <div className={`rounded-2xl border overflow-hidden transition-colors ${tomBloco(mesTom, blocoMes)}`}>
        <button
          type="button"
          onClick={() => setBlocoMes((v) => !v)}
          className="w-full flex items-center gap-2 px-3 py-2"
        >
          <span className="text-[11px] uppercase tracking-wide text-neutral-500 font-semibold">Resumo do mês</span>
          <span className={`ml-auto text-xs font-semibold tabular-nums ${resultadoMes >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {formatBRL(resultadoMes)}
          </span>
          <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${blocoMes ? 'rotate-0' : '-rotate-90'}`} />
        </button>
        {blocoMes && (
          <div className="px-2 pb-2 grid grid-cols-2 gap-1.5">
            <MesCard
              label="Faturamento (caixa)"
              valor={formatBRL(caixaMes.total)}
              detalhe={`${caixaMes.qtd} venda${caixaMes.qtd === 1 ? '' : 's'} · ticket ${formatBRL(ticketMes)}`}
              tom="entrada"
              ativo={kpiMes === 'fatura'}
              onClick={() => setKpiMes((v) => (v === 'fatura' ? null : 'fatura'))}
            />
            <MesCard
              label="Materiais usados"
              valor={formatBRL(materiaisMes)}
              detalhe="Custo das peças e insumos"
              tom="saida"
              ativo={kpiMes === 'materiais'}
              onClick={() => setKpiMes((v) => (v === 'materiais' ? null : 'materiais'))}
            />
            <MesCard
              label="Despesas do mês"
              valor={formatBRL(despesasMes)}
              tom="saida"
              ativo={kpiMes === 'despesas'}
              onClick={() => setKpiMes((v) => (v === 'despesas' ? null : 'despesas'))}
            />
            <MesCard
              label="Resultado estimado"
              valor={formatBRL(resultadoMes)}
              tom={resultadoMes >= 0 ? 'entrada' : 'saida'}
              ativo={kpiMes === 'resultado'}
              onClick={() => setKpiMes((v) => (v === 'resultado' ? null : 'resultado'))}
            />
          </div>
        )}
      </div>

      {criticos.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 space-y-2">
          <p className="text-sm font-semibold text-amber-900">Estoque crítico ({criticos.length})</p>
          {criticos.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onEstoqueCritico(p.id)}
              className="w-full text-left text-sm flex justify-between gap-2"
            >
              <span className="font-medium">{p.nome}</span>
              <span className="text-amber-800 shrink-0">{rotuloEstoque(p)}</span>
            </button>
          ))}
        </div>
      )}

      {orcamentos.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Orçamentos</p>
          {orcamentos.slice(0, 4).map((orc) => {
            const cliente = clientes.find((c) => c.id === orc.cliente_id);
            const veiculo = veiculos.find((v) => v.id === orc.veiculo_id);
            return (
              <OrcamentoResumoCard
                key={orc.id}
                orc={orc}
                clienteNome={cliente?.nome}
                veiculo={veiculo}
                onClick={() => onOpenOrcamento(orc.id)}
              />
            );
          })}
          {orcamentos.length > 4 ? (
            <button
              type="button"
              onClick={onVerTodosOrcamentos}
              className="w-full text-center text-sm font-medium text-[#cd3f00] py-1.5"
            >
              e mais ({orcamentos.length - 4})
            </button>
          ) : null}
        </div>
      )}

      {posVenda.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
          <p className="text-sm font-semibold text-amber-900">Ligar essa semana ({posVenda.length})</p>
          {posVenda.slice(0, 5).map((os) => {
            const cliente = clientes.find((c) => c.id === os.cliente_id);
            const digits = (cliente?.telefone || '').replace(/\D/g, '');
            return (
              <div key={os.id} className="flex items-center justify-between gap-2">
                <button type="button" onClick={() => onOpenOS(os.id)} className="text-left text-sm">
                  OS-{os.numero_os} • {cliente?.nome}
                </button>
                <div className="flex items-center gap-3 shrink-0">
                  {digits ? (
                    <a href={`tel:${digits}`} className="text-xs font-semibold text-amber-900">
                      Ligar
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void marcarPosVenda(os.id)}
                    className="text-xs font-semibold text-amber-800"
                  >
                    Já liguei
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {filtros
          .filter((f) => f.show)
          .map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              className={`shrink-0 px-2 py-1 rounded-sm text-[11px] font-semibold ${
                filtro === f.id ? 'bg-[#cd3f00] text-white' : 'bg-white border border-neutral-200 text-neutral-600'
              }`}
            >
              {f.label}
            </button>
          ))}
      </div>

      <div className="space-y-1.5">
        {lista.length === 0 && (
          <p className="text-sm text-neutral-400 text-center py-8">Nada nesta fila.</p>
        )}
        {lista.map((os) => {
          const cliente = clientes.find((c) => c.id === os.cliente_id);
          const veiculo = veiculos.find((v) => v.id === os.veiculo_id);
          const status = os.status as StatusOS;
          const cor = STATUS_COR[status];
          const atrasada =
            os.status !== 'Entregue' && os.data_previsao_entrega && os.data_previsao_entrega < hoje;
          return (
            <button
              key={os.id}
              type="button"
              onClick={() => onOpenOS(os.id)}
              className={`w-full text-left bg-white border border-neutral-200 border-l-2 rounded-sm px-2.5 py-2 ${cor.borda}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold">OS-{os.numero_os}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm ${cor.badge}`}>
                  {STATUS_LABEL[status]}
                </span>
              </div>
              <div className="text-sm font-medium text-neutral-900 leading-tight">
                {cliente?.nome || 'Cliente'}
              </div>
              <div className="text-xs text-neutral-500">
                {veiculo?.placa || 'sem placa'} {veiculo?.modelo ? `• ${veiculo.modelo}` : ''}
              </div>
              {atrasada && <div className="text-[11px] font-semibold text-red-700">Prazo atrasado</div>}
              {status === 'TravadoPeca' && os.travado_observacao ? (
                <div className="text-[11px] text-red-700 truncate">{os.travado_observacao}</div>
              ) : null}
              {os.data_previsao_entrega && (
                <div className="text-[11px] text-neutral-400">
                  Previsão {formatDateBR(os.data_previsao_entrega)}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
