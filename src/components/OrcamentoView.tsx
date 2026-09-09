import React, { useMemo, useState } from 'react';
import { Check, Download, FilePlus2, FolderOpen, RotateCcw, Save, Share, X } from 'lucide-react';
import { useOficina, type ItemSalvarOrcamento } from '../context/OficinaContext';
import {
  OBSERVACAO_PADRAO,
  STATUS_ORCAMENTO_COR,
  STATUS_ORCAMENTO_LABEL,
  TEXTO_APROVACAO,
  calcularTotaisOrcamento,
  formatarNumeroOrcamento,
  podeAprovarOrcamento,
  podeGerarOS,
  podeReabrirOrcamento,
  resumoVeiculoOrcamento,
  statusOrcamentoEfetivo,
  type StatusOrcamento,
  type TipoClienteOrcamento,
  type TipoDescontoOrcamento,
} from '../utils/orcamento';
import { gerarOrcamentoPdf } from '../utils/orcamentoPdfGerar';
import { baixarOsPdf, compartilharArquivo } from '../utils/osPdf';
import { formatBRL, maskKmInput, maskPlaca, parseKm, unidadesDoPedido } from '../utils/formatters';
import { formatDateBR } from '../utils/dateUtils';
import { novoId } from '../utils/id';
import { Campo, inputClass, inputCompactClass } from './Campo';
import { CorPicker } from './CorPicker';
import { OrcamentoItensForm, type ItemOrcamentoForm } from './OrcamentoItensForm';

export const OrcamentoView: React.FC<{
  orcamentoId?: string;
  onBack: () => void;
  onSalvou: (id: string) => void;
  onAbriuOS: (osId: string) => void;
}> = ({ orcamentoId, onBack, onSalvou, onAbriuOS }) => {
  const {
    oficina,
    clientes,
    veiculos,
    produtos,
    orcamentos,
    orcamentoItens,
    buscarIdentidade,
    salvarOrcamento,
    adicionarItemOrcamento,
    removerItemOrcamento,
    marcarOrcamentoEnviado,
    aprovarOrcamento,
    recusarOrcamento,
    reabrirOrcamento,
    gerarOsDoOrcamento,
  } = useOficina();

  const salvo = orcamentos.find((o) => o.id === orcamentoId);
  const clienteSalvo = clientes.find((c) => c.id === salvo?.cliente_id);
  const veiculoSalvo = veiculos.find((v) => v.id === salvo?.veiculo_id);
  const itensSalvos = orcamentoItens.filter((i) => i.orcamento_id === orcamentoId);

  const [tipo, setTipo] = useState<TipoClienteOrcamento>((clienteSalvo?.tipo as TipoClienteOrcamento) || 'pf');
  const [clienteNome, setClienteNome] = useState(clienteSalvo?.nome || '');
  const [clienteId, setClienteId] = useState(clienteSalvo?.id || '');
  const [nomeFantasia, setNomeFantasia] = useState(clienteSalvo?.nome_fantasia || '');
  const [cpfCnpj, setCpfCnpj] = useState(clienteSalvo?.cpf_cnpj || '');
  const [responsavel, setResponsavel] = useState(clienteSalvo?.responsavel || '');
  const [cpfResponsavel, setCpfResponsavel] = useState(clienteSalvo?.cpf_responsavel || '');
  const [telefone, setTelefone] = useState(clienteSalvo?.telefone || '');
  const [email, setEmail] = useState(clienteSalvo?.email || '');
  const [endereco, setEndereco] = useState(clienteSalvo?.endereco || '');
  const [enderecoNumero, setEnderecoNumero] = useState(clienteSalvo?.endereco_numero || '');
  const [complemento, setComplemento] = useState(clienteSalvo?.complemento || '');
  const [bairro, setBairro] = useState(clienteSalvo?.bairro || '');
  const [cidade, setCidade] = useState(clienteSalvo?.cidade || '');
  const [uf, setUf] = useState(clienteSalvo?.uf || '');
  const [cep, setCep] = useState(clienteSalvo?.cep || '');
  const [placa, setPlaca] = useState(veiculoSalvo?.placa ? maskPlaca(veiculoSalvo.placa) : '');
  const [veiculoId, setVeiculoId] = useState(veiculoSalvo?.id || '');
  const [marca, setMarca] = useState(veiculoSalvo?.marca || '');
  const [modelo, setModelo] = useState(veiculoSalvo?.modelo || '');
  const [versao, setVersao] = useState(veiculoSalvo?.versao || '');
  const [ano, setAno] = useState(veiculoSalvo?.ano ? String(veiculoSalvo.ano) : '');
  const [anoModelo, setAnoModelo] = useState(veiculoSalvo?.ano_modelo ? String(veiculoSalvo.ano_modelo) : '');
  const [cor, setCor] = useState(veiculoSalvo?.cor || '');
  const [km, setKm] = useState(salvo?.km != null ? maskKmInput(String(salvo.km)) : '');
  const [validade, setValidade] = useState(salvo?.validade_dias ?? 15);
  const [prazo, setPrazo] = useState(salvo?.prazo_estimado_dias ?? 5);
  const [previsao, setPrevisao] = useState(salvo?.data_previsao_entrega || '');
  const [observacao, setObservacao] = useState(salvo?.observacao || OBSERVACAO_PADRAO);
  const [desconto, setDesconto] = useState(Number(salvo?.desconto || 0));
  const [tipoDesconto, setTipoDesconto] = useState<TipoDescontoOrcamento>('valor');
  const [aprovador, setAprovador] = useState(salvo?.aprovado_nome || clienteSalvo?.nome || '');
  const [rascunhoItens, setRascunhoItens] = useState<ItemOrcamentoForm[]>([]);
  const [erro, setErro] = useState('');
  const [busy, setBusy] = useState(false);

  const hitsPlaca = useMemo(() => buscarIdentidade(placa), [placa, buscarIdentidade]);
  const hitsNome = useMemo(() => buscarIdentidade(clienteNome), [clienteNome, buscarIdentidade]);
  const veiculosDoCliente = useMemo(
    () => (clienteId ? veiculos.filter((v) => v.cliente_id === clienteId) : []),
    [clienteId, veiculos]
  );

  const itens: ItemOrcamentoForm[] = orcamentoId
    ? itensSalvos.map((i) => ({
        id: i.id,
        tipo: i.tipo,
        descricao: i.descricao,
        detalhe: i.detalhe,
        quantidade: i.quantidade,
        valor_unitario: Number(i.valor_unitario),
        valor_total: Number(i.valor_total),
        produto_id: i.produto_id,
        origem_peca: i.origem_peca,
      }))
    : rascunhoItens;

  const status = statusOrcamentoEfetivo(
    (salvo?.status as StatusOrcamento) || 'rascunho',
    validade,
    salvo?.data_emissao || new Date().toISOString()
  );
  const podeEditar = !salvo || status === 'rascunho' || status === 'enviado';
  const totais = calcularTotaisOrcamento(itens, desconto, tipoDesconto);
  const resumo = resumoVeiculoOrcamento({
    marca,
    modelo,
    versao,
    placa,
    cor,
    km: parseKm(km),
  });

  const trocarTipoDesconto = (novo: TipoDescontoOrcamento) => {
    if (novo === tipoDesconto) return;
    if (novo === 'percentual') {
      setDesconto(totais.subtotal > 0 ? Math.round((totais.desconto / totais.subtotal) * 10000) / 100 : 0);
    } else {
      setDesconto(totais.desconto);
    }
    setTipoDesconto(novo);
  };

  const preencherCliente = (id: string, nome: string) => {
    const c = clientes.find((x) => x.id === id);
    setClienteId(id);
    setClienteNome(nome);
    setTipo((c?.tipo as TipoClienteOrcamento) || (c?.cpf_cnpj && c.cpf_cnpj.replace(/\D/g, '').length > 11 ? 'pj' : 'pf'));
    setNomeFantasia(c?.nome_fantasia || '');
    setCpfCnpj(c?.cpf_cnpj || '');
    setResponsavel(c?.responsavel || '');
    setCpfResponsavel(c?.cpf_responsavel || '');
    setTelefone(c?.telefone || '');
    setEmail(c?.email || '');
    setEndereco(c?.endereco || '');
    setEnderecoNumero(c?.endereco_numero || '');
    setComplemento(c?.complemento || '');
    setBairro(c?.bairro || '');
    setCidade(c?.cidade || '');
    setUf(c?.uf || '');
    setCep(c?.cep || '');
    setAprovador((atual) => atual || nome);
  };

  const preencherVeiculo = (id: string, placaAtual: string) => {
    const v = veiculos.find((x) => x.id === id);
    setVeiculoId(id);
    setPlaca(maskPlaca(placaAtual));
    setMarca(v?.marca || '');
    setModelo(v?.modelo || '');
    setVersao(v?.versao || '');
    setAno(v?.ano ? String(v.ano) : '');
    setAnoModelo(v?.ano_modelo ? String(v.ano_modelo) : '');
    setCor(v?.cor || '');
  };

  const dadosSalvar = () => ({
    id: orcamentoId,
    clienteId: clienteId || undefined,
    veiculoId: veiculoId || undefined,
    cliente: {
      tipo,
      nome: clienteNome,
      nomeFantasia,
      cpfCnpj,
      responsavel,
      cpfResponsavel,
      telefone,
      email,
      endereco,
      enderecoNumero,
      complemento,
      bairro,
      cidade,
      uf,
      cep,
    },
    veiculo: {
      placa,
      marca,
      modelo,
      versao,
      ano: ano ? Number(ano) : null,
      anoModelo: anoModelo ? Number(anoModelo) : null,
      cor,
      km: parseKm(km),
    },
    validadeDias: validade,
    prazoEstimadoDias: prazo,
    dataPrevisaoEntrega: previsao || null,
    observacao,
    desconto: totais.desconto,
  });

  const run = async (fn: () => Promise<void>) => {
    setErro('');
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro');
    } finally {
      setBusy(false);
    }
  };

  const persistir = async () => {
    const salvoNovo = await salvarOrcamento({
      ...dadosSalvar(),
      itens: orcamentoId
        ? undefined
        : rascunhoItens.map((i) => ({
            tipo: i.tipo as ItemSalvarOrcamento['tipo'],
            descricao: i.descricao,
            detalhe: i.detalhe || '',
            quantidade: i.quantidade,
            valor: i.valor_unitario,
            produtoId: i.produto_id || undefined,
            origemPeca: (i.origem_peca as ItemSalvarOrcamento['origemPeca']) || null,
          })),
    });
    onSalvou(salvoNovo.id);
    return salvoNovo;
  };

  const addLocal = (item: ItemOrcamentoForm) => setRascunhoItens((prev) => [...prev, item]);

  const onAddServico = async (descricao: string, detalhe: string, quantidade: number, valor: number) => {
    if (orcamentoId) {
      await adicionarItemOrcamento(orcamentoId, { tipo: 'servico', descricao, detalhe, quantidade, valor });
      return;
    }
    addLocal({
      id: novoId(),
      tipo: 'servico',
      descricao,
      detalhe,
      quantidade,
      valor_unitario: valor,
      valor_total: quantidade * valor,
    });
  };

  const onAddPecaComprar = async (descricao: string, quantidade: number, valor: number) => {
    if (orcamentoId) {
      await adicionarItemOrcamento(orcamentoId, {
        tipo: 'produto',
        descricao,
        quantidade,
        valor,
        origemPeca: 'comprar',
      });
      return;
    }
    addLocal({
      id: novoId(),
      tipo: 'produto',
      descricao,
      quantidade,
      valor_unitario: valor,
      valor_total: quantidade * valor,
      origem_peca: 'comprar',
    });
  };

  const onAddPecaEstoque = async (
    produto: { id: string; nome: string; preco_venda: number; eh_caixa: boolean; unidades_por_caixa: number },
    ehCaixa: boolean,
    quantidadePedido: number
  ) => {
    const unidades = unidadesDoPedido(produto, ehCaixa, quantidadePedido);
    const descricao = ehCaixa ? `${produto.nome} (caixa)` : produto.nome;
    const valor = Number(produto.preco_venda);
    if (orcamentoId) {
      await adicionarItemOrcamento(orcamentoId, {
        tipo: 'produto',
        descricao,
        quantidade: unidades,
        valor,
        produtoId: produto.id,
        origemPeca: 'estoque',
      });
      return;
    }
    addLocal({
      id: novoId(),
      tipo: 'produto',
      descricao,
      quantidade: unidades,
      valor_unitario: valor,
      valor_total: unidades * valor,
      produto_id: produto.id,
      origem_peca: 'estoque',
    });
  };

  const onAddTerceiro = async (descricao: string, quantidade: number, valor: number) => {
    if (orcamentoId) {
      await adicionarItemOrcamento(orcamentoId, { tipo: 'terceiro', descricao, quantidade, valor });
      return;
    }
    addLocal({
      id: novoId(),
      tipo: 'terceiro',
      descricao,
      quantidade,
      valor_unitario: valor,
      valor_total: quantidade * valor,
    });
  };

  const onRemover = async (id: string) => {
    if (orcamentoId) {
      await removerItemOrcamento(id, orcamentoId);
      return;
    }
    setRascunhoItens((prev) => prev.filter((i) => i.id !== id));
  };

  const montarPdf = async () => {
    const salvoNovo = await persistir();
    const atual = orcamentos.find((o) => o.id === salvoNovo.id);
    const pdf = await gerarOrcamentoPdf({
      oficinaNome: oficina?.nome || 'Oficina',
      oficinaSegmento: oficina?.segmento,
      oficinaWhatsapp: oficina?.whatsapp || '',
      oficinaEmail: oficina?.email,
      oficinaEndereco: oficina?.endereco,
      oficinaCnpj: oficina?.cnpj,
      numero: atual?.numero_orcamento || salvoNovo.numero,
      dataEmissao: atual?.data_emissao || new Date().toISOString(),
      validadeDias: validade,
      clienteTipo: tipo,
      clienteNome,
      clienteNomeFantasia: nomeFantasia,
      clienteDocumento: cpfCnpj,
      clienteResponsavel: responsavel,
      clienteCpfResponsavel: cpfResponsavel,
      clienteTelefone: telefone,
      clienteEmail: email,
      clienteEndereco: endereco,
      clienteNumero: enderecoNumero,
      clienteComplemento: complemento,
      clienteBairro: bairro,
      clienteCidade: cidade,
      clienteUf: uf,
      clienteCep: cep,
      marca,
      modelo,
      versao,
      ano: ano ? Number(ano) : null,
      anoModelo: anoModelo ? Number(anoModelo) : null,
      placa,
      cor,
      km: parseKm(km),
      itens,
      desconto: totais.desconto,
      prazoEstimadoDias: prazo,
      previsao: previsao || null,
      observacao,
      aprovadoNome: atual?.aprovado_nome,
      aprovadoEm: atual?.aprovado_em,
    });
    return { id: salvoNovo.id, pdf };
  };

  const baixarPdf = async () => {
    const { pdf } = await montarPdf();
    baixarOsPdf(pdf);
  };

  const compartilharPdf = async () => {
    const { id, pdf } = await montarPdf();
    await compartilharArquivo(pdf);
    await marcarOrcamentoEnviado(id);
  };

  return (
    <form
      className="space-y-4 pb-20"
      onSubmit={(e) => {
        e.preventDefault();
        void run(async () => {
          await persistir();
        });
      }}
      onKeyDown={(e) => {
        if (e.key !== 'Enter') return;
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'BUTTON' || tag === 'TEXTAREA') return;
        e.preventDefault();
      }}
    >
      <div>
        <button type="button" onClick={onBack} className="text-sm text-[#cd3f00] font-medium">
          Voltar
        </button>
        <div className="flex items-start justify-between gap-2 mt-1">
          <div>
            <p className="text-[11px] font-mono text-neutral-500">
              {salvo ? `ORÇAMENTO Nº ${formatarNumeroOrcamento(salvo.numero_orcamento)}` : 'Novo orçamento'}
            </p>
            <h2 className="text-lg font-semibold leading-tight">Orçamento de serviço</h2>
            {salvo && <p className="text-xs text-neutral-500">Emitido em {formatDateBR(salvo.data_emissao)}</p>}
          </div>
          <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_ORCAMENTO_COR[status].badge}`}>
            {STATUS_ORCAMENTO_LABEL[status]}
          </span>
        </div>
      </div>

      <section className="bg-white border border-neutral-200 rounded-xl p-3 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Dados do cliente</h3>
        <p className="text-[11px] text-neutral-400">Opcional. Preencha se quiser identificar quem recebe o orçamento.</p>
        <div className="grid grid-cols-2 gap-1">
          {(['pf', 'pj'] as TipoClienteOrcamento[]).map((t) => (
            <button
              key={t}
              type="button"
              disabled={!podeEditar}
              onClick={() => setTipo(t)}
              className={`py-1.5 rounded-lg text-xs font-semibold border ${
                tipo === t ? 'bg-[#cd3f00] text-white border-[#cd3f00]' : 'bg-white border-neutral-200'
              }`}
            >
              {t === 'pf' ? 'Pessoa física' : 'Pessoa jurídica'}
            </button>
          ))}
        </div>
        <Campo label={tipo === 'pj' ? 'Razão social' : 'Nome completo'}>
          <input
            className={inputClass}
            value={clienteNome}
            disabled={!podeEditar}
            onChange={(e) => {
              setClienteNome(e.target.value);
              setClienteId('');
              setVeiculoId('');
            }}
          />
        </Campo>
        {hitsNome.length > 0 && !clienteId && clienteNome.length >= 2 && podeEditar && (
          <div className="space-y-2">
            {hitsNome.map((hit) => (
              <button
                key={hit.cliente.id}
                type="button"
                className="w-full text-left bg-neutral-50 border border-neutral-200 rounded-xl p-3"
                onClick={() => preencherCliente(hit.cliente.id, hit.cliente.nome)}
              >
                <div className="font-medium text-sm">{hit.cliente.nome}</div>
                <div className="text-xs text-neutral-500">{hit.cliente.telefone || 'sem telefone'}</div>
              </button>
            ))}
          </div>
        )}
        {tipo === 'pj' && (
          <Campo label="Nome fantasia">
            <input className={inputCompactClass} value={nomeFantasia} disabled={!podeEditar} onChange={(e) => setNomeFantasia(e.target.value)} />
          </Campo>
        )}
        <Campo label={tipo === 'pj' ? 'CNPJ' : 'CPF'}>
          <input className={inputCompactClass} value={cpfCnpj} disabled={!podeEditar} onChange={(e) => setCpfCnpj(e.target.value)} />
        </Campo>
        {tipo === 'pj' && (
          <>
            <Campo label="Responsável / contato">
              <input className={inputCompactClass} value={responsavel} disabled={!podeEditar} onChange={(e) => setResponsavel(e.target.value)} />
            </Campo>
            <Campo label="CPF do responsável">
              <input className={inputCompactClass} value={cpfResponsavel} disabled={!podeEditar} onChange={(e) => setCpfResponsavel(e.target.value)} />
            </Campo>
          </>
        )}
        <Campo label="Telefone / WhatsApp">
          <input className={inputCompactClass} value={telefone} disabled={!podeEditar} onChange={(e) => setTelefone(e.target.value)} />
        </Campo>
        <Campo label="E-mail">
          <input className={inputCompactClass} value={email} disabled={!podeEditar} onChange={(e) => setEmail(e.target.value)} />
        </Campo>
        <Campo label="Endereço">
          <input className={inputCompactClass} value={endereco} disabled={!podeEditar} onChange={(e) => setEndereco(e.target.value)} />
        </Campo>
        <div className="grid grid-cols-2 gap-2">
          <Campo label="Número">
            <input className={inputCompactClass} value={enderecoNumero} disabled={!podeEditar} onChange={(e) => setEnderecoNumero(e.target.value)} />
          </Campo>
          <Campo label="Complemento">
            <input className={inputCompactClass} value={complemento} disabled={!podeEditar} onChange={(e) => setComplemento(e.target.value)} />
          </Campo>
        </div>
        <Campo label="Bairro">
          <input className={inputCompactClass} value={bairro} disabled={!podeEditar} onChange={(e) => setBairro(e.target.value)} />
        </Campo>
        <div className="grid grid-cols-2 gap-2">
          <Campo label="Cidade">
            <input className={inputCompactClass} value={cidade} disabled={!podeEditar} onChange={(e) => setCidade(e.target.value)} />
          </Campo>
          <Campo label="UF">
            <input className={inputCompactClass} value={uf} disabled={!podeEditar} maxLength={2} onChange={(e) => setUf(e.target.value.toUpperCase())} />
          </Campo>
        </div>
        <Campo label="CEP">
          <input className={inputCompactClass} value={cep} disabled={!podeEditar} onChange={(e) => setCep(e.target.value)} />
        </Campo>
      </section>

      <section className="bg-white border border-neutral-200 rounded-xl p-3 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Dados do veículo</h3>
        <Campo label="Placa">
          <input
            className={inputClass}
            value={placa}
            disabled={!podeEditar}
            onChange={(e) => {
              setPlaca(maskPlaca(e.target.value));
              setVeiculoId('');
            }}
          />
        </Campo>
        {hitsPlaca.length > 0 && !veiculoId && placa.length >= 3 && podeEditar && (
          <div className="space-y-2">
            {hitsPlaca.map((hit) =>
              hit.veiculos
                .filter((v) =>
                  (v.placa || '')
                    .replace(/[^A-Za-z0-9]/g, '')
                    .toUpperCase()
                    .includes(placa.replace(/[^A-Za-z0-9]/g, ''))
                )
                .map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className="w-full text-left bg-neutral-50 border border-neutral-200 rounded-xl p-3"
                    onClick={() => {
                      const c = clientes.find((x) => x.id === v.cliente_id) || hit.cliente;
                      preencherCliente(c.id, c.nome);
                      preencherVeiculo(v.id, v.placa || '');
                    }}
                  >
                    <div className="font-medium text-sm">{v.placa}</div>
                    <div className="text-xs text-neutral-500">
                      {hit.cliente.nome}
                      {v.modelo ? ` • ${v.modelo}` : ''}
                    </div>
                  </button>
                ))
            )}
          </div>
        )}
        {clienteId && veiculosDoCliente.length > 0 && podeEditar && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-neutral-600">Veículos deste cliente</p>
            {veiculosDoCliente.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`w-full text-left rounded-xl p-3 border ${
                  v.id === veiculoId ? 'border-[#cd3f00] bg-orange-50' : 'bg-white border-neutral-200'
                }`}
                onClick={() => preencherVeiculo(v.id, v.placa || '')}
              >
                <div className="font-medium text-sm">{v.placa || 'sem placa'}</div>
                <div className="text-xs text-neutral-500">{[v.marca, v.modelo].filter(Boolean).join(' ') || 'sem modelo'}</div>
              </button>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Campo label="Marca">
            <input className={inputCompactClass} value={marca} disabled={!podeEditar} onChange={(e) => setMarca(e.target.value)} />
          </Campo>
          <Campo label="Modelo">
            <input className={inputCompactClass} value={modelo} disabled={!podeEditar} onChange={(e) => setModelo(e.target.value)} />
          </Campo>
        </div>
        <Campo label="Versão">
          <input className={inputCompactClass} value={versao} disabled={!podeEditar} onChange={(e) => setVersao(e.target.value)} />
        </Campo>
        <div className="grid grid-cols-2 gap-2">
          <Campo label="Ano">
            <input className={inputCompactClass} inputMode="numeric" value={ano} disabled={!podeEditar} onChange={(e) => setAno(e.target.value.replace(/\D/g, '').slice(0, 4))} />
          </Campo>
          <Campo label="Ano/modelo">
            <input className={inputCompactClass} inputMode="numeric" value={anoModelo} disabled={!podeEditar} onChange={(e) => setAnoModelo(e.target.value.replace(/\D/g, '').slice(0, 4))} />
          </Campo>
        </div>
        <Campo label="KM">
          <input className={inputCompactClass} inputMode="numeric" value={km} disabled={!podeEditar} onChange={(e) => setKm(maskKmInput(e.target.value))} />
        </Campo>
        <CorPicker value={cor} onChange={podeEditar ? setCor : () => undefined} />
        <div className="rounded-lg bg-neutral-100 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Veículo do orçamento</p>
          <p className="text-sm font-semibold text-neutral-900 leading-tight mt-0.5">{resumo.titulo}</p>
          {resumo.detalhe ? <p className="text-xs text-neutral-600">{resumo.detalhe}</p> : null}
        </div>
      </section>

      <OrcamentoItensForm
        itens={itens}
        produtos={produtos}
        podeEditar={podeEditar}
        onErro={setErro}
        onAddServico={onAddServico}
        onAddPecaComprar={onAddPecaComprar}
        onAddPecaEstoque={onAddPecaEstoque}
        onAddTerceiro={onAddTerceiro}
        onRemover={onRemover}
      />

      <section className="bg-white border border-neutral-200 rounded-xl p-3 space-y-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Valor do orçamento</h3>
        <LinhaValor rotulo="Serviços" valor={totais.totalServicos} />
        <LinhaValor rotulo="Peças e materiais" valor={totais.totalPecas} />
        <LinhaValor rotulo="Serviços de terceiros" valor={totais.totalTerceiros} />
        <div className="border-t border-neutral-200 pt-1.5">
          <LinhaValor rotulo="Subtotal" valor={totais.subtotal} />
        </div>
        {podeEditar ? (
          <div className="pt-1 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Desconto</span>
              <div className="flex rounded-md border border-neutral-200 overflow-hidden">
                {(['percentual', 'valor'] as TipoDescontoOrcamento[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => trocarTipoDesconto(t)}
                    className={`min-w-9 px-2.5 py-1 text-[11px] font-semibold ${
                      tipoDesconto === t ? 'bg-[#cd3f00] text-white' : 'bg-white text-neutral-600'
                    }`}
                  >
                    {t === 'percentual' ? '%' : 'R$'}
                  </button>
                ))}
              </div>
            </div>
            <input
              className={inputCompactClass}
              type="number"
              min={0}
              max={tipoDesconto === 'percentual' ? 100 : undefined}
              step="0.01"
              value={desconto}
              onChange={(e) => setDesconto(Number(e.target.value) || 0)}
            />
            {tipoDesconto === 'percentual' && totais.desconto > 0 ? (
              <p className="text-[11px] text-neutral-500 text-right tabular-nums">− {formatBRL(totais.desconto)}</p>
            ) : null}
          </div>
        ) : (
          <LinhaValor rotulo="Desconto" valor={-totais.desconto} />
        )}
        <div className="flex justify-between items-end pt-1">
          <span className="text-sm font-semibold text-neutral-900">Total do orçamento</span>
          <span className="text-xl font-bold tabular-nums text-neutral-900">{formatBRL(totais.total)}</span>
        </div>
      </section>

      <section className="bg-white border border-neutral-200 rounded-xl p-3 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Prazo e condições</h3>
        <div className="grid grid-cols-2 gap-2">
          <Campo label="Validade (dias)">
            <input
              className={inputCompactClass}
              type="number"
              min={1}
              value={validade}
              disabled={!podeEditar}
              onChange={(e) => setValidade(Math.max(1, Number(e.target.value) || 15))}
            />
          </Campo>
          <Campo label="Prazo estimado (dias)">
            <input
              className={inputCompactClass}
              type="number"
              min={0}
              value={prazo}
              disabled={!podeEditar}
              onChange={(e) => setPrazo(Math.max(0, Number(e.target.value) || 0))}
            />
          </Campo>
        </div>
        <Campo label="Previsão de entrega">
          <input className={inputCompactClass} type="date" value={previsao} disabled={!podeEditar} onChange={(e) => setPrevisao(e.target.value)} />
        </Campo>
      </section>

      <section className="bg-white border border-neutral-200 rounded-xl p-3 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Observações</h3>
        <textarea
          className={`${inputClass} min-h-24`}
          value={observacao}
          disabled={!podeEditar}
          onChange={(e) => setObservacao(e.target.value)}
        />
      </section>

      {salvo && (
        <section className="bg-white border border-neutral-200 rounded-xl p-3 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Aprovação do orçamento</h3>
          <p className="text-xs text-neutral-600 leading-snug">{TEXTO_APROVACAO}</p>
          <Campo label="Nome do cliente">
            <input className={inputCompactClass} value={aprovador} onChange={(e) => setAprovador(e.target.value)} />
          </Campo>
          {salvo.aprovado_em && (
            <p className="text-xs text-emerald-700">
              Aprovado por {salvo.aprovado_nome} em {formatDateBR(salvo.aprovado_em)}
            </p>
          )}
        </section>
      )}

      {erro && <p className="text-sm text-red-700">{erro}</p>}

      <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-neutral-200 px-1 pt-1 pb-[calc(env(safe-area-inset-bottom)+6px)]">
        <div className="flex items-stretch max-w-lg mx-auto">
          <AcaoFooter
            label="Baixar"
            icon={<Download className="w-5 h-5" />}
            disabled={busy}
            onClick={() => void run(baixarPdf)}
          />
          <AcaoFooter
            label="Compartilhar"
            icon={<Share className="w-5 h-5" />}
            disabled={busy}
            onClick={() => void run(compartilharPdf)}
          />
          {podeEditar ? (
            <AcaoFooter
              type="submit"
              label={busy ? 'Salvando' : 'Salvar'}
              icon={<Save className="w-5 h-5" />}
              disabled={busy}
            />
          ) : null}
          {salvo && podeAprovarOrcamento(status) ? (
            <>
              <AcaoFooter
                label="Recusar"
                icon={<X className="w-5 h-5" />}
                tom="perigo"
                disabled={busy}
                onClick={() => void run(() => recusarOrcamento(salvo.id))}
              />
              <AcaoFooter
                label="Aprovar"
                icon={<Check className="w-5 h-5" />}
                tom="destaque"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await persistir();
                    await aprovarOrcamento(salvo.id, aprovador || clienteNome);
                  })
                }
              />
            </>
          ) : null}
          {salvo && podeGerarOS(status, salvo.os_id) ? (
            <AcaoFooter
              label="Gerar OS"
              icon={<FilePlus2 className="w-5 h-5" />}
              tom="destaque"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const osId = await gerarOsDoOrcamento(salvo.id);
                  onAbriuOS(osId);
                })
              }
            />
          ) : null}
          {salvo && podeReabrirOrcamento(status) ? (
            <AcaoFooter
              label="Reabrir"
              icon={<RotateCcw className="w-5 h-5" />}
              tom="destaque"
              disabled={busy}
              onClick={() => void run(() => reabrirOrcamento(salvo.id))}
            />
          ) : null}
          {salvo?.os_id ? (
            <AcaoFooter
              label="Abrir OS"
              icon={<FolderOpen className="w-5 h-5" />}
              tom="destaque"
              onClick={() => onAbriuOS(salvo.os_id as string)}
            />
          ) : null}
        </div>
      </div>
    </form>
  );
};

const TOM_ACAO = {
  neutro: 'text-neutral-600',
  destaque: 'text-[#cd3f00]',
  perigo: 'text-red-600',
} as const;

const AcaoFooter: React.FC<{
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

const LinhaValor: React.FC<{ rotulo: string; valor: number }> = ({ rotulo, valor }) => (
  <div className="flex justify-between text-sm">
    <span className="text-neutral-600">{rotulo}</span>
    <span className="font-mono text-neutral-900">{formatBRL(valor)}</span>
  </div>
);
