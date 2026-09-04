import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { Database } from '../types/database';
import { useOficina } from '../context/OficinaContext';
import { FORMA_LABEL, type FormaPagamento } from '../types';
import { Campo, inputClass } from './Campo';
import { formatBRL, rotuloEstoque, saldoLivre, unidadesDoPedido } from '../utils/formatters';

type Produto = Database['public']['Tables']['produtos']['Row'];

type CartItem = {
  produto_id: string;
  quantidade: number;
  valor_unitario: number;
  eh_caixa: boolean;
};

export const VendaBalcaoView: React.FC<{
  pedidoAbrirCarrinho: number;
  onCartCount: (n: number) => void;
}> = ({ pedidoAbrirCarrinho, onCartCount }) => {
  const { produtos, criarVendaAvulsa } = useOficina();
  const [busca, setBusca] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [aberto, setAberto] = useState(false);
  const [forma, setForma] = useState<FormaPagamento>('PIX');
  const [recebido, setRecebido] = useState('');
  const [obs, setObs] = useState('');
  const [erro, setErro] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendente, setPendente] = useState<Produto | null>(null);

  const encontrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    const filtrados = t
      ? produtos.filter(
          (p) => p.nome.toLowerCase().includes(t) || (p.codigo || '').toLowerCase().includes(t)
        )
      : produtos;
    return [...filtrados].sort((a, b) => {
      const aOk = saldoLivre(a) > 0 ? 0 : 1;
      const bOk = saldoLivre(b) > 0 ? 0 : 1;
      return aOk - bOk;
    });
  }, [busca, produtos]);

  const total = cart.reduce((s, i) => s + i.quantidade * i.valor_unitario, 0);
  const recebidoN = Number(recebido.replace(',', '.')) || 0;
  const troco = forma === 'Dinheiro' ? recebidoN - total : 0;

  useEffect(() => {
    onCartCount(cart.length);
  }, [cart, onCartCount]);

  useEffect(() => {
    return () => onCartCount(0);
  }, [onCartCount]);

  useEffect(() => {
    if (pedidoAbrirCarrinho > 0) setAberto(true);
  }, [pedidoAbrirCarrinho]);

  const add = (p: Produto, ehCaixa: boolean) => {
    const unidades = unidadesDoPedido(p, ehCaixa, 1);
    if (saldoLivre(p) < unidades) {
      setErro('Estoque insuficiente');
      return;
    }
    setCart((prev) => {
      const i = prev.find((x) => x.produto_id === p.id && x.eh_caixa === ehCaixa);
      if (i) {
        const nextUn = i.quantidade + unidades;
        if (saldoLivre(p) < nextUn) return prev;
        return prev.map((x) =>
          x.produto_id === p.id && x.eh_caixa === ehCaixa ? { ...x, quantidade: nextUn } : x
        );
      }
      return [
        ...prev,
        { produto_id: p.id, quantidade: unidades, valor_unitario: Number(p.preco_venda), eh_caixa: ehCaixa },
      ];
    });
    setPendente(null);
    setErro('');
  };

  const onCard = (p: Produto) => {
    if (saldoLivre(p) <= 0) {
      setErro('Sem estoque. Dê entrada no produto antes de vender.');
      return;
    }
    if (p.eh_caixa && p.unidades_por_caixa > 1) {
      setPendente(p);
      return;
    }
    add(p, false);
  };

  const confirmar = async () => {
    setErro('');
    if (cart.length === 0) {
      setErro('Carrinho vazio');
      return;
    }
    if (forma === 'Dinheiro' && recebidoN < total) {
      setErro('Valor recebido menor que o total');
      return;
    }
    setBusy(true);
    try {
      await criarVendaAvulsa(
        forma,
        cart.map((i) => ({
          produto_id: i.produto_id,
          quantidade: i.quantidade,
          valor_unitario: i.valor_unitario,
        })),
        obs
      );
      setCart([]);
      setObs('');
      setRecebido('');
      setAberto(false);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha na venda');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      <h2 className="text-lg font-semibold">Venda de balcão</h2>
      <Campo label="Buscar produto">
        <input className={inputClass} value={busca} onChange={(e) => setBusca(e.target.value)} />
      </Campo>

      {pendente && (
        <div className="bg-white border border-[#cd3f00] rounded-2xl p-3 space-y-2">
          <p className="text-sm font-medium">Vender {pendente.nome} como</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="py-3 rounded-xl bg-[#cd3f00] text-white text-sm font-semibold"
              onClick={() => add(pendente, true)}
            >
              Caixa ({pendente.unidades_por_caixa} un)
            </button>
            <button
              type="button"
              className="py-3 rounded-xl border border-neutral-200 text-sm font-semibold"
              onClick={() => add(pendente, false)}
            >
              Unidade
            </button>
          </div>
          <button type="button" className="text-xs text-neutral-500" onClick={() => setPendente(null)}>
            Cancelar
          </button>
        </div>
      )}

      {erro && !aberto && <p className="text-sm text-red-700">{erro}</p>}

      <div className="grid grid-cols-2 gap-2">
        {encontrados.map((p) => {
          const semEstoque = saldoLivre(p) <= 0;
          return (
            <button
              key={p.id}
              type="button"
              className={`text-left bg-white border border-neutral-200 rounded-2xl overflow-hidden ${
                semEstoque ? 'opacity-55' : ''
              }`}
              onClick={() => onCard(p)}
            >
              {p.foto_url ? (
                <img src={p.foto_url} alt="" className="w-full h-24 object-cover bg-neutral-100" />
              ) : (
                <div className="w-full h-24 bg-neutral-100 flex items-center justify-center text-[11px] text-neutral-400">
                  Sem foto
                </div>
              )}
              <div className="p-2">
                <div className="text-xs font-medium line-clamp-2">{p.nome}</div>
                <div className="text-sm font-semibold mt-1">{formatBRL(Number(p.preco_venda))}</div>
                <div className={`text-[11px] ${semEstoque ? 'font-semibold text-red-700' : 'text-neutral-500'}`}>
                  {semEstoque ? 'Sem estoque' : rotuloEstoque(p)}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {aberto && (
        <CarrinhoSidebar
          produtos={produtos}
          cart={cart}
          total={total}
          forma={forma}
          recebido={recebido}
          troco={troco}
          obs={obs}
          erro={erro}
          busy={busy}
          onClose={() => setAberto(false)}
          onTirar={(item) =>
            setCart((prev) =>
              prev.filter((x) => !(x.produto_id === item.produto_id && x.eh_caixa === item.eh_caixa))
            )
          }
          onForma={setForma}
          onRecebido={setRecebido}
          onObs={setObs}
          onConfirmar={confirmar}
        />
      )}
    </div>
  );
};

const CarrinhoSidebar: React.FC<{
  produtos: Produto[];
  cart: CartItem[];
  total: number;
  forma: FormaPagamento;
  recebido: string;
  troco: number;
  obs: string;
  erro: string;
  busy: boolean;
  onClose: () => void;
  onTirar: (item: CartItem) => void;
  onForma: (f: FormaPagamento) => void;
  onRecebido: (v: string) => void;
  onObs: (v: string) => void;
  onConfirmar: () => void;
}> = ({
  produtos,
  cart,
  total,
  forma,
  recebido,
  troco,
  obs,
  erro,
  busy,
  onClose,
  onTirar,
  onForma,
  onRecebido,
  onObs,
  onConfirmar,
}) => (
  <div className="fixed inset-0 z-[70]">
    <button type="button" aria-label="Fechar carrinho" className="absolute inset-0 bg-black/40" onClick={onClose} />
    <aside className="absolute inset-y-0 right-0 flex w-[min(100%,22rem)] flex-col bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <h3 className="text-sm font-semibold">Carrinho</h3>
        <button type="button" aria-label="Fechar carrinho" onClick={onClose} className="p-2 -mr-1">
          <X className="h-6 w-6" />
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 pb-8">
        {cart.length === 0 && <p className="text-sm text-neutral-400">Toque num produto para adicionar.</p>}
        {cart.map((i) => {
          const p = produtos.find((x) => x.id === i.produto_id);
          const qtd = i.eh_caixa
            ? `${i.quantidade / (p?.unidades_por_caixa || 1)} cx`
            : `${i.quantidade} un`;
          return (
            <div key={`${i.produto_id}-${i.eh_caixa}`} className="flex items-center gap-3">
              {p?.foto_url ? (
                <img
                  src={p.foto_url}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-xl object-cover bg-neutral-100"
                />
              ) : (
                <div className="h-14 w-14 shrink-0 rounded-xl bg-neutral-100 flex items-center justify-center text-[10px] text-neutral-400">
                  Sem foto
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium line-clamp-2">{p?.nome}</p>
                <p className="text-xs text-neutral-500">
                  {qtd} · {formatBRL(i.quantidade * i.valor_unitario)}
                </p>
              </div>
              <button type="button" className="text-xs text-red-700 shrink-0" onClick={() => onTirar(i)}>
                Tirar
              </button>
            </div>
          );
        })}
        <div className="font-semibold text-right">Total {formatBRL(total)}</div>

        <div>
          <p className="text-xs font-medium text-neutral-600 mb-1">Pagamento</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(FORMA_LABEL) as FormaPagamento[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onForma(f)}
                className={`py-2 rounded-xl text-xs font-semibold border ${
                  forma === f ? 'bg-[#cd3f00] text-white border-[#cd3f00]' : 'bg-white border-neutral-200'
                }`}
              >
                {FORMA_LABEL[f]}
              </button>
            ))}
          </div>
        </div>

        {forma === 'Dinheiro' && (
          <>
            <Campo label="Valor recebido">
              <input
                className={inputClass}
                inputMode="decimal"
                value={recebido}
                onChange={(e) => onRecebido(e.target.value)}
              />
            </Campo>
            <p className={`text-sm font-semibold ${troco < 0 ? 'text-red-700' : 'text-emerald-800'}`}>
              Troco {formatBRL(Math.max(0, troco))}
            </p>
          </>
        )}

        <Campo label="Observação">
          <textarea className={`${inputClass} min-h-20`} value={obs} onChange={(e) => onObs(e.target.value)} />
        </Campo>
      </div>
      <div className="space-y-2 border-t border-neutral-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {erro && <p className="text-sm text-red-700">{erro}</p>}
        <button
          type="button"
          disabled={busy}
          className="w-full py-3 rounded-xl bg-[#cd3f00] text-white font-semibold disabled:opacity-60"
          onClick={onConfirmar}
        >
          {busy ? 'Confirmando…' : 'Confirmar venda'}
        </button>
      </div>
    </aside>
  </div>
);
