import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { useOficina } from '../context/OficinaContext';
import { AcaoFooter, BarraFooter } from './AcaoFooter';
import { Campo, inputClass } from './Campo';

export const OficinaConfigView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { oficina, salvarOficina } = useOficina();
  const [nome, setNome] = useState(oficina?.nome || '');
  const [segmento, setSegmento] = useState(oficina?.segmento || '');
  const [whatsapp, setWhatsapp] = useState(oficina?.whatsapp || '');
  const [email, setEmail] = useState(oficina?.email || '');
  const [cnpj, setCnpj] = useState(oficina?.cnpj || '');
  const [endereco, setEndereco] = useState(oficina?.endereco || '');
  const [logoUrl, setLogoUrl] = useState(oficina?.logo_url || '');
  const [erro, setErro] = useState('');

  return (
    <form
      className="space-y-3 pb-20"
      onSubmit={async (e) => {
        e.preventDefault();
        setErro('');
        try {
          await salvarOficina({
            nome,
            segmento,
            whatsapp,
            email,
            cnpj,
            endereco,
            logo_url: logoUrl.trim() || null,
          });
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
      <Campo label="Segmento">
        <input
          className={inputClass}
          value={segmento}
          onChange={(e) => setSegmento(e.target.value)}
          placeholder="Estética automotiva"
        />
      </Campo>
      <Campo label="WhatsApp">
        <input className={inputClass} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
      </Campo>
      <Campo label="E-mail">
        <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
      </Campo>
      <Campo label="Logo (URL pública)">
        <input className={inputClass} value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
      </Campo>
      <Campo label="CNPJ">
        <input className={inputClass} value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
      </Campo>
      <Campo label="Endereço">
        <input className={inputClass} value={endereco} onChange={(e) => setEndereco(e.target.value)} />
      </Campo>
      {erro && <p className="text-sm text-red-700">{erro}</p>}
      <BarraFooter>
        <AcaoFooter type="submit" label="Salvar" icon={<Save className="w-5 h-5" />} tom="destaque" />
      </BarraFooter>
    </form>
  );
};
