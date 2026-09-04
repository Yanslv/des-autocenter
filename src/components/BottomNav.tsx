import React from 'react';
import { LayoutDashboard, Package, Users, Wallet, ShoppingCart } from 'lucide-react';

export type Aba = 'painel' | 'produtos' | 'venda' | 'clientes' | 'financeiro';

export const BottomNav: React.FC<{
  aba: Aba;
  onChange: (aba: Aba) => void;
}> = ({ aba, onChange }) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-neutral-200 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-end justify-between max-w-lg mx-auto px-1">
        <NavItem
          ativo={aba === 'painel'}
          label="Painel"
          onClick={() => onChange('painel')}
          icon={<LayoutDashboard className="w-5 h-5" />}
        />
        <NavItem
          ativo={aba === 'produtos'}
          label="Produtos"
          onClick={() => onChange('produtos')}
          icon={<Package className="w-5 h-5" />}
        />
        <button
          type="button"
          onClick={() => onChange('venda')}
          className="relative -mt-5 flex flex-col items-center w-16"
        >
          <span
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
              aba === 'venda' ? 'bg-[#a83300]' : 'bg-[#cd3f00]'
            } text-white`}
          >
            <ShoppingCart className="w-6 h-6" />
          </span>
          <span className={`mt-1 text-[11px] font-semibold ${aba === 'venda' ? 'text-[#cd3f00]' : 'text-neutral-500'}`}>
            Venda
          </span>
        </button>
        <NavItem
          ativo={aba === 'clientes'}
          label="Clientes"
          onClick={() => onChange('clientes')}
          icon={<Users className="w-5 h-5" />}
        />
        <NavItem
          ativo={aba === 'financeiro'}
          label="Financeiro"
          onClick={() => onChange('financeiro')}
          icon={<Wallet className="w-5 h-5" />}
        />
      </div>
    </nav>
  );
};

const NavItem: React.FC<{
  ativo: boolean;
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}> = ({ ativo, label, onClick, icon }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-col items-center py-2.5 flex-1 min-w-0 text-[11px] font-medium ${
      ativo ? 'text-[#cd3f00]' : 'text-neutral-500'
    }`}
  >
    <span className="mb-0.5">{icon}</span>
    <span className="leading-tight text-center px-0.5">{label}</span>
  </button>
);
