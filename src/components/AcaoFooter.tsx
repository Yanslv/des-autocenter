import React from 'react';

const TOM_ACAO = {
  neutro: 'text-neutral-600',
  destaque: 'text-[#cd3f00]',
  perigo: 'text-red-600',
} as const;

export const BarraFooter: React.FC<{ children: React.ReactNode; fixo?: boolean }> = ({
  children,
  fixo = true,
}) => (
  <div
    className={
      fixo
        ? 'fixed bottom-0 inset-x-0 z-40 bg-white border-t border-neutral-200 px-1 pt-1 pb-[calc(env(safe-area-inset-bottom)+6px)]'
        : 'border-t border-neutral-200 px-1 pt-1 pb-[max(6px,env(safe-area-inset-bottom))]'
    }
  >
    <div className="flex items-stretch max-w-lg mx-auto">{children}</div>
  </div>
);

export const AcaoFooter: React.FC<{
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  tom?: keyof typeof TOM_ACAO;
}> = ({ label, icon, onClick, disabled, type = 'button', tom = 'neutro' }) => (
  <button
    type={type}
    disabled={disabled}
    onClick={onClick}
    className={`flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 py-1.5 disabled:opacity-40 ${TOM_ACAO[tom]}`}
  >
    {icon}
    <span className="text-[10px] font-medium leading-none truncate w-full text-center">{label}</span>
  </button>
);
