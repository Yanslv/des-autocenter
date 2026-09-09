import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { OficinaProvider, useOficina } from './context/OficinaContext';
import { AppHeader } from './components/AppHeader';
import { LoginView } from './components/LoginView';
import { BottomNav, type Aba } from './components/BottomNav';
import { PainelView } from './components/PainelView';
import { ClientesView } from './components/ClientesView';
import { OrcamentoView } from './components/OrcamentoView';
import { OrcamentosListaView } from './components/OrcamentosListaView';
import { OSDetalheView } from './components/OSDetalheView';
import { VendaBalcaoView } from './components/VendaBalcaoView';
import { ProdutosView } from './components/ProdutosView';
import { OficinaConfigView } from './components/OficinaConfigView';
import { FinanceiroView } from './components/FinanceiroView';
import { useManterCampoVisivel } from './hooks/useManterCampoVisivel';

const PageShell: React.FC<{
  children: React.ReactNode;
  footer?: React.ReactNode;
  cartCount?: number;
  onCartClick?: () => void;
  onNovoOrcamento?: () => void;
  onConfig?: () => void;
  tecladoAberto?: boolean;
}> = ({ children, footer, cartCount, onCartClick, onNovoOrcamento, onConfig, tecladoAberto }) => (
  <div className={`min-h-dvh bg-[#F7F7F8] ${footer && !tecladoAberto ? 'pb-32' : ''}`}>
    <AppHeader cartCount={cartCount} onCartClick={onCartClick} onConfig={onConfig} />
    <div className="px-4 pt-4">
      <div className="max-w-lg mx-auto">{children}</div>
    </div>
    {onNovoOrcamento && !tecladoAberto ? (
      <button
        type="button"
        aria-label="Novo orçamento"
        onClick={onNovoOrcamento}
        className="fixed z-50 right-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] w-14 h-14 rounded-full bg-[#cd3f00] text-white shadow-lg flex items-center justify-center active:bg-[#a83300]"
      >
        <Plus className="w-7 h-7" strokeWidth={2.5} />
      </button>
    ) : null}
    {tecladoAberto ? null : footer}
  </div>
);

const Shell: React.FC = () => {
  const tecladoAberto = useManterCampoVisivel();
  const { session, perfil, carregando } = useOficina();
  const [aba, setAba] = useState<Aba>('painel');
  const [osId, setOsId] = useState<string | null>(null);
  const [orcamentoId, setOrcamentoId] = useState<string | null>(null);
  const [novoOrcamento, setNovoOrcamento] = useState(false);
  const [listaOrcamentos, setListaOrcamentos] = useState(false);
  const [config, setConfig] = useState(false);
  const [produtoFoco, setProdutoFoco] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [pedidoCarrinho, setPedidoCarrinho] = useState(0);

  if (carregando && !session) {
    return <div className="min-h-dvh flex items-center justify-center text-sm text-neutral-500">Carregando…</div>;
  }

  if (!session || !perfil) {
    return <LoginView />;
  }

  const openOS = (id: string) => {
    setOsId(id);
    setOrcamentoId(null);
    setNovoOrcamento(false);
    setListaOrcamentos(false);
    setConfig(false);
  };

  const openOrcamento = (id: string) => {
    setOrcamentoId(id);
    setNovoOrcamento(false);
    setOsId(null);
    setConfig(false);
  };

  const openConfig = () => {
    setConfig(true);
    setOsId(null);
    setOrcamentoId(null);
    setNovoOrcamento(false);
    setListaOrcamentos(false);
  };

  if (osId) {
    return (
      <PageShell tecladoAberto={tecladoAberto} onConfig={openConfig}>
        <OSDetalheView osId={osId} onBack={() => setOsId(null)} />
      </PageShell>
    );
  }

  if (config) {
    return (
      <PageShell tecladoAberto={tecladoAberto} onConfig={openConfig}>
        <OficinaConfigView onBack={() => setConfig(false)} />
      </PageShell>
    );
  }

  if (novoOrcamento || orcamentoId) {
    return (
      <PageShell tecladoAberto={tecladoAberto} onConfig={openConfig}>
        <OrcamentoView
          orcamentoId={orcamentoId || undefined}
          onBack={() => {
            setNovoOrcamento(false);
            setOrcamentoId(null);
          }}
          onSalvou={(id) => {
            setNovoOrcamento(false);
            setOrcamentoId(id);
          }}
          onAbriuOS={(id) => {
            setNovoOrcamento(false);
            setOrcamentoId(null);
            setListaOrcamentos(false);
            setOsId(id);
            setAba('painel');
          }}
        />
      </PageShell>
    );
  }

  if (listaOrcamentos) {
    return (
      <PageShell tecladoAberto={tecladoAberto} onConfig={openConfig}>
        <OrcamentosListaView
          onBack={() => setListaOrcamentos(false)}
          onOpenOrcamento={openOrcamento}
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      tecladoAberto={tecladoAberto}
      footer={<BottomNav aba={aba} onChange={setAba} />}
      cartCount={aba === 'venda' ? cartCount : undefined}
      onCartClick={aba === 'venda' ? () => setPedidoCarrinho((n) => n + 1) : undefined}
      onNovoOrcamento={() => {
        setOrcamentoId(null);
        setNovoOrcamento(true);
      }}
      onConfig={openConfig}
    >
      {aba === 'painel' && (
        <PainelView
          onOpenOS={openOS}
          onOpenOrcamento={openOrcamento}
          onVerTodosOrcamentos={() => setListaOrcamentos(true)}
          onEstoqueCritico={(id) => {
            setProdutoFoco(id);
            setAba('produtos');
          }}
        />
      )}
      {aba === 'produtos' && (
        <ProdutosView
          produtoFoco={produtoFoco}
          onFocoConsumido={() => setProdutoFoco(null)}
        />
      )}
      {aba === 'venda' && (
        <VendaBalcaoView pedidoAbrirCarrinho={pedidoCarrinho} onCartCount={setCartCount} />
      )}
      {aba === 'clientes' && <ClientesView />}
      {aba === 'financeiro' && <FinanceiroView onOpenOS={openOS} />}
    </PageShell>
  );
};

export default function App() {
  return (
    <OficinaProvider>
      <Shell />
    </OficinaProvider>
  );
}
