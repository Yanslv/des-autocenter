import React, { useState } from 'react';
import { useOficina } from '../context/OficinaContext';
import { Campo, inputClass } from './Campo';

export const OficinaConfigView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { oficina, salvarOficina } = useOficina();
  const [nome, setNome] = useState(oficina?.nome || '');
  const [whatsapp, setWhatsapp] = useState(oficina?.whatsapp || '');
  const [cnpj, setCnpj] = useState(oficina?.cnpj || '');
  const [endereco, setEndereco] = useState(oficina?.endereco || '');
  const [erro, setErro] = useState('');

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setErro('');
        try {
          await salvarOficina({ nome, whatsapp, cnpj, endereco });
          onBack();
        } catch (err) {
          setErro(err instanceof Error ? err.message : 'Erro');
        }
      }}
    >
      <button type="button" onClick={onBack} className="text-sm text-[#cd3f00] font-medium">
        Voltar
      </button>
      <h2 className="text-lg font-semibold">Oficina</h2>
      <Campo label="Nome">
        <input className={inputClass} value={nome} onChange={(e) => setNome(e.target.value)} />
      </Campo>
      <Campo label="WhatsApp">
        <input className={inputClass} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
      </Campo>
      <Campo label="CNPJ">
        <input className={inputClass} value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
      </Campo>
      <Campo label="Endereço">
        <input className={inputClass} value={endereco} onChange={(e) => setEndereco(e.target.value)} />
      </Campo>
      {erro && <p className="text-sm text-red-700">{erro}</p>}
      <button type="submit" className="w-full py-3 rounded-xl bg-[#cd3f00] text-white font-semibold">
        Salvar
      </button>
    </form>
  );
};
