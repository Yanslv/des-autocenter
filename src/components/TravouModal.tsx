import React, { useState } from 'react';
import { MOTIVOS_TRAVOU } from '../types';
import { validarTravamento } from '../utils/os';
import { Campo, inputCompactClass } from './Campo';

type ItemTravou = {
  id: string;
  descricao: string;
  tipo: string;
  quantidade: number;
};

export const TravouModal: React.FC<{
  itens: ItemTravou[];
  onCancelar: () => void;
  onConfirmar: (itemId: string, observacao: string) => Promise<void>;
}> = ({ itens, onCancelar, onConfirmar }) => {
  const [itemId, setItemId] = useState<string | null>(itens.length === 1 ? itens[0].id : null);
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');
  const [busy, setBusy] = useState(false);

  const servicos = itens.filter((i) => i.tipo === 'servico');
  const pecas = itens.filter((i) => i.tipo !== 'servico');
  const podeConfirmar = !validarTravamento(itemId, observacao) && !busy;

  const confirmar = async () => {
    const msg = validarTravamento(itemId, observacao);
    if (msg || !itemId) {
      setErro(msg || 'Selecione a peça ou o serviço que travou');
      return;
    }
    setBusy(true);
    setErro('');
    try {
      await onConfirmar(itemId, observacao.trim());
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro');
      setBusy(false);
    }
  };

  const grupo = (titulo: string, lista: ItemTravou[]) =>
    lista.length === 0 ? null : (
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">{titulo}</p>
        {lista.map((it) => {
          const ativo = itemId === it.id;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => setItemId(it.id)}
              className={`w-full text-left rounded-lg border px-2.5 py-2 ${
                ativo ? 'border-[#cd3f00] bg-orange-50' : 'border-neutral-200 bg-white'
              }`}
            >
              <span className="text-xs font-medium leading-tight">{it.descricao}</span>
              <span className="block text-[10px] text-neutral-500">{it.quantidade}x</span>
            </button>
          );
        })}
      </div>
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"
      onClick={busy ? undefined : onCancelar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="travou-titulo"
        className="w-full max-w-sm max-h-[85dvh] overflow-y-auto space-y-3 rounded-2xl bg-white p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <p id="travou-titulo" className="text-sm font-semibold text-neutral-900">
          O que travou?
        </p>
        {itens.length === 0 ? (
          <p className="text-xs text-neutral-500">Inclua peça ou serviço na OS antes de travar.</p>
        ) : (
          <>
            {grupo('Serviços', servicos)}
            {grupo('Peças', pecas)}
          </>
        )}
        <div className="flex flex-wrap gap-1.5">
          {MOTIVOS_TRAVOU.map((motivo) => (
            <button
              key={motivo}
              type="button"
              onClick={() => setObservacao(motivo === 'Outro' ? '' : motivo)}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold border ${
                observacao === motivo
                  ? 'bg-[#cd3f00] text-white border-[#cd3f00]'
                  : 'bg-white border-neutral-200 text-neutral-700'
              }`}
            >
              {motivo}
            </button>
          ))}
        </div>
        <Campo label="Por que travou">
          <textarea
            className={`${inputCompactClass} min-h-[72px] resize-none`}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Peça errada, avaria..."
            required
          />
        </Campo>
        {erro ? <p className="text-sm text-red-700">{erro}</p> : null}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="rounded-xl border border-neutral-200 py-2.5 text-sm"
            onClick={onCancelar}
            disabled={busy}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-xl bg-red-700 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            onClick={() => void confirmar()}
            disabled={!podeConfirmar}
          >
            {busy ? 'Travando…' : 'Travar'}
          </button>
        </div>
      </div>
    </div>
  );
};
