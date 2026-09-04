import React, { useState } from 'react';
import { CircleUser, LogOut, ShoppingCart } from 'lucide-react';
import logo from '../assets/d&s_logo.png';
import { useOficina } from '../context/OficinaContext';

export const AppHeader: React.FC<{
  cartCount?: number;
  onCartClick?: () => void;
  onConfig?: () => void;
}> = ({ cartCount, onCartClick, onConfig }) => {
  const { perfil, oficina, sair } = useOficina();
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <header className="bg-black relative z-[60]">
      <div className="max-w-lg mx-auto flex items-center justify-between gap-3 py-2 px-4">
        <img src={logo} alt="D&S Auto Center" className="h-12 w-auto shrink-0" />
        {perfil ? (
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative min-w-0">
              <button
                type="button"
                aria-label="Abrir perfil"
                aria-expanded={menuAberto}
                onClick={() => setMenuAberto((v) => !v)}
                className="flex items-center gap-3 min-w-0"
              >
                <span className="text-sm font-medium text-white truncate text-right">{perfil.nome}</span>
                <CircleUser className="w-8 h-8 text-white shrink-0" strokeWidth={1.5} />
              </button>
              {menuAberto ? (
                <>
                  <button
                    type="button"
                    aria-label="Fechar menu"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setMenuAberto(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl bg-white shadow-lg border border-neutral-200 overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-neutral-100 space-y-0.5">
                      <p className="text-[11px] uppercase tracking-wide text-neutral-400 font-semibold">Oficina</p>
                      <p className="text-sm font-semibold text-neutral-900 leading-tight">{oficina?.nome || '—'}</p>
                      {oficina?.whatsapp ? (
                        <p className="text-xs text-neutral-500">{oficina.whatsapp}</p>
                      ) : null}
                      {oficina?.cnpj ? <p className="text-xs text-neutral-500">{oficina.cnpj}</p> : null}
                      {oficina?.endereco ? (
                        <p className="text-xs text-neutral-500">{oficina.endereco}</p>
                      ) : null}
                    </div>
                    {onConfig ? (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuAberto(false);
                          onConfig();
                        }}
                        className="w-full text-left px-3 py-2.5 text-sm text-neutral-800 hover:bg-neutral-50"
                      >
                        Editar dados da oficina
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void sair()}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-700 hover:bg-red-50 border-t border-neutral-100"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                </>
              ) : null}
            </div>
            {onCartClick ? (
              <button
                type="button"
                aria-label="Abrir carrinho"
                onClick={onCartClick}
                className="relative shrink-0 p-1"
              >
                <ShoppingCart className="w-6 h-6 text-white" strokeWidth={1.75} />
                {(cartCount ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#cd3f00] text-[10px] leading-4 font-bold text-white text-center">
                    {cartCount}
                  </span>
                )}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
};
