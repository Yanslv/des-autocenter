import React, { useMemo, useState } from 'react';
import { Banknote, Check, Download, MessageCircle, Pause, Play, RotateCcw, Send, Share, Undo2 } from 'lucide-react';
import { useOficina } from '../context/OficinaContext';
import { FORMA_LABEL, STATUS_COR, STATUS_LABEL, type FormaPagamento, type StatusOS } from '../types';
import {
  abrirWhatsApp,
  baixarOsPdf,
  compartilharArquivo,
  mensagemWhatsAppOs,
} from '../utils/osPdf';
import { gerarOsClientePdf } from '../utils/orcamentoPdfGerar';
import { Campo, inputCompactClass } from './Campo';
import { CorPicker } from './CorPicker';
import { AcaoFooter, BarraFooter } from './AcaoFooter';
import { FotoProduto, PecasServicosForm } from './PecasServicosForm';
import { OficinaChecklist } from './OficinaChecklist';
import { TravouModal } from './TravouModal';
import { formatBRL, maskKmInput, parseKm, unidadesDoPedido } from '../utils/formatters';
import { osPodeEditarItens, osPodeSeguirCotar, osTemPecaParaCotar, resumoChecklist } from '../utils/os';

export const OSDetalheView: React.FC<{ osId: string; onBack: () => void }> = ({ osId, onBack }) => {
  const {
    oficina,
    isVendedor,
    ordens,
    itens,
    clientes,
    veiculos,
    produtos,
    atualizarStatus,
    travarOS,
    mandarParaCotar,
    marcarPdfEnviado,
    adicionarServico,
    adicionarPecaComprar,
    adicionarPecaEstoque,
    atualizarPrecoItem,
    marcarItemComprado,
    marcarItemExecutado,
    removerItem,
    salvarEntradaVeiculo,
    atualizarCliente,
    entregarOS,
  } = useOficina();

  const os = ordens.find((o) => o.id === osId);
  const cliente = clientes.find((c) => c.id === os?.cliente_id);
  const veiculo = veiculos.find((v) => v.id === os?.veiculo_id);
  const osItens = itens.filter((i) => i.os_id === osId);

  const [erro, setErro] = useState('');
  const [travouAberto, setTravouAberto] = useState(false);
  const [km, setKm] = useState(os?.km_entrada != null ? maskKmInput(String(os.km_entrada)) : '');
  const [modelo, setModelo] = useState(veiculo?.modelo || '');
  const [cor, setCor] = useState(veiculo?.cor || '');
  const [telefone, setTelefone] = useState(cliente?.telefone || '');
  const [cpf, setCpf] = useState(cliente?.cpf_cnpj || '');
  const [endereco, setEndereco] = useState(cliente?.endereco || '');
  const [forma, setForma] = useState<FormaPagamento>('PIX');

  const total = osItens.reduce((s, i) => s + Number(i.valor_total), 0);
  const pecasComprar = osItens.filter((i) => i.tipo === 'produto' && i.origem_peca === 'comprar');
  const modoCotar = os?.status === 'AguardandoCotar';
  const osAberta = os?.status === 'Aberta';
  const naOficina = os?.status === 'Fazendo' || os?.status === 'TravadoPeca';
  const temPreco = osItens.some((i) => Number(i.valor_unitario) > 0);
  const podeGerarPdf =
    isVendedor &&
    (modoCotar
      ? osItens.length > 0 && osPodeSeguirCotar(osItens) && temPreco
      : temPreco && os?.status === 'AguardandoCliente');

  const persistirEntrada = (kmMasked: string, modeloAtual: string, corAtual: string) => {
    if (!os || !veiculo) return Promise.resolve();
    const kmNum = parseKm(kmMasked);
    const modeloTrim = modeloAtual.trim();
    if (
      kmNum === (os.km_entrada ?? null) &&
      modeloTrim === (veiculo.modelo || '') &&
      (corAtual || '') === (veiculo.cor || '')
    ) {
      return Promise.resolve();
    }
    return salvarEntradaVeiculo({
      osId: os.id,
      veiculoId: veiculo.id,
      km: kmNum,
      modelo: modeloTrim,
      cor: corAtual,
    });
  };

  const run = async (fn: () => Promise<void>) => {
    setErro('');
    try {
      await fn();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro');
    }
  };

  const proximo = useMemo(() => {
    if (!os || !cliente || !veiculo) return null;
    const st = os.status as StatusOS;
    if (st === 'Aberta') {
      if (osTemPecaParaCotar(osItens)) {
        return {
          label: 'Cotar',
          icon: <Send className="w-5 h-5" />,
          action: () => mandarParaCotar(os.id),
        };
      }
      return {
        label: 'Enviar',
        icon: <Send className="w-5 h-5" />,
        action: async () => {
          if (osItens.length === 0) throw new Error('Liste serviço ou peça antes de enviar');
          await atualizarStatus(os.id, 'AguardandoCliente');
        },
      };
    }
    if (st === 'AguardandoCotar' && osPodeSeguirCotar(osItens)) {
      return {
        label: 'Seguir',
        icon: <Send className="w-5 h-5" />,
        action: () => atualizarStatus(os.id, 'AguardandoCliente'),
      };
    }
    if (st === 'AguardandoCliente') {
      return {
        label: 'Começar',
        icon: <Play className="w-5 h-5" />,
        action: () => atualizarStatus(os.id, 'Fazendo'),
      };
    }
    if (st === 'Fazendo') {
      return {
        label: 'Pronto',
        icon: <Check className="w-5 h-5" />,
        action: () => atualizarStatus(os.id, 'Pronto'),
      };
    }
    if (st === 'TravadoPeca') {
      return {
        label: 'Retomar',
        icon: <RotateCcw className="w-5 h-5" />,
        action: () => atualizarStatus(os.id, 'Fazendo'),
      };
    }
    if (st === 'Pronto' && isVendedor) {
      return {
        label: 'Entregar',
        icon: <Banknote className="w-5 h-5" />,
        action: () => entregarOS(os.id, forma, total || Number(os.valor_total)),
      };
    }
    return null;
  }, [
    os,
    cliente,
    veiculo,
    osItens,
    isVendedor,
    forma,
    total,
    mandarParaCotar,
    atualizarStatus,
    entregarOS,
  ]);

  if (!os || !cliente || !veiculo) {
    return (
      <div className="p-4">
        <button type="button" onClick={onBack} className="text-sm text-[#cd3f00]">
          Voltar
        </button>
        <p className="mt-4 text-sm">OS não encontrada.</p>
      </div>
    );
  }

  const montarPdf = () =>
    gerarOsClientePdf({
      oficinaNome: oficina?.nome || 'Oficina',
      oficinaSegmento: oficina?.segmento,
      oficinaWhatsapp: oficina?.whatsapp || '',
      oficinaEmail: oficina?.email,
      oficinaCnpj: oficina?.cnpj,
      oficinaEndereco: oficina?.endereco,
      numeroOs: os.numero_os,
      status: os.status as StatusOS,
      dataAbertura: os.data_abertura,
      previsao: os.data_previsao_entrega,
      clienteTipo: cliente.tipo,
      clienteNome: cliente.nome,
      clienteNomeFantasia: cliente.nome_fantasia,
      clienteDocumento: cpf || cliente.cpf_cnpj,
      clienteResponsavel: cliente.responsavel,
      clienteCpfResponsavel: cliente.cpf_responsavel,
      clienteTelefone: telefone || cliente.telefone,
      clienteEmail: cliente.email,
      clienteEndereco: endereco || cliente.endereco,
      clienteNumero: cliente.endereco_numero,
      clienteComplemento: cliente.complemento,
      clienteBairro: cliente.bairro,
      clienteCidade: cliente.cidade,
      clienteUf: cliente.uf,
      clienteCep: cliente.cep,
      placa: veiculo.placa,
      modelo: veiculo.modelo,
      marca: veiculo.marca,
      versao: veiculo.versao,
      ano: veiculo.ano,
      anoModelo: veiculo.ano_modelo,
      cor: cor || veiculo.cor,
      km: parseKm(km) ?? os.km_entrada,
      problema: os.problema_relatado,
      itens: osItens,
    });

  const baixarPdf = async () => {
    baixarOsPdf(await montarPdf());
    await marcarPdfEnviado(os.id);
  };

  const compartilharPdf = async () => {
    await compartilharArquivo(await montarPdf());
    await marcarPdfEnviado(os.id);
  };

  const resumoEntrada = [veiculo.placa || 'sem placa', modelo || veiculo.modelo, cor || veiculo.cor]
    .filter(Boolean)
    .join(' • ');
  const podeEditarItens = osPodeEditarItens(os.status as StatusOS);
  const pecasServicosForm = (
    <PecasServicosForm
      itens={osItens}
      produtos={produtos}
      podeEditar={podeEditarItens}
      podeEditarPreco={podeEditarItens}
      onErro={setErro}
      onAddServico={(descricao, quantidade, valor) => adicionarServico(os.id, descricao, quantidade, valor)}
      onAddPecaComprar={(descricao, quantidade, valor) => adicionarPecaComprar(os.id, descricao, quantidade, valor)}
      onAddPecaEstoque={(produto, ehCaixa, quantidadePedido) =>
        adicionarPecaEstoque(os.id, produto.id, unidadesDoPedido(produto, ehCaixa, quantidadePedido), ehCaixa)
      }
      onRemover={removerItem}
      onAtualizarPreco={atualizarPrecoItem}
    />
  );

  return (
    <div className="space-y-3 pb-20">
      <button type="button" onClick={onBack} className="text-xs text-[#cd3f00] font-medium">
        Voltar
      </button>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] font-mono text-neutral-500">OS-{os.numero_os}</div>
          <h2 className="text-base font-semibold leading-tight">{cliente.nome}</h2>
          <p className="text-xs text-neutral-500">
            {veiculo.placa || 'sem placa'} {veiculo.modelo ? `• ${veiculo.modelo}` : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COR[os.status as StatusOS].badge}`}>
            {STATUS_LABEL[os.status as StatusOS]}
          </span>
          {naOficina && osItens.length > 0 ? (
            <span className="text-[10px] font-semibold tabular-nums text-neutral-500">{resumoChecklist(osItens).pct}%</span>
          ) : null}
        </div>
      </div>

      <div className="bg-neutral-200/70 rounded-xl px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Observação</p>
        <p className="text-xs text-neutral-800 leading-snug mt-0.5">{os.problema_relatado}</p>
      </div>

      {modoCotar ? (
        <>
          <div className="bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-700 space-y-0.5">
            <p>{resumoEntrada}</p>
            {km && <p>KM {km}</p>}
            {telefone && <p>{telefone}</p>}
            {cpf && <p>{cpf}</p>}
            {endereco && <p>{endereco}</p>}
          </div>

          {pecasComprar.length > 0 ? (
            <div className="bg-white border border-neutral-200 rounded-xl p-3 space-y-2">
              <div>
                <h3 className="text-xs font-semibold">Comprar</h3>
                <p className="text-[10px] text-neutral-500">Confira a lista, marque o que comprou e depois informe o preço.</p>
              </div>
              {pecasComprar.map((it) => (
                <div key={it.id} className="flex items-center gap-2 py-1 border-b border-neutral-100 last:border-0">
                  {it.produto_id ? (
                    <FotoProduto url={produtos.find((p) => p.id === it.produto_id)?.foto_url} />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium leading-tight truncate">{it.descricao}</div>
                    <div className="text-[10px] text-neutral-500">{it.quantidade}x</div>
                  </div>
                  {it.comprado ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-semibold text-emerald-700">Comprado</span>
                      <input
                        className="w-20 rounded-md border border-neutral-200 bg-white px-1.5 py-1 text-[11px] font-mono text-right"
                        type="number"
                        step="0.01"
                        aria-label={`Preço de ${it.descricao}`}
                        defaultValue={Number(it.valor_unitario) || ''}
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (!Number.isNaN(v) && v !== Number(it.valor_unitario)) {
                            void run(() => atualizarPrecoItem(it.id, v));
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="shrink-0 px-2.5 py-1 rounded-md bg-[#cd3f00] text-white text-[11px] font-semibold"
                      onClick={() => void run(() => marcarItemComprado(it.id))}
                    >
                      Comprado
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-neutral-500">Nenhuma peça para comprar. Inclua peça e mão de obra ou siga em frente.</p>
          )}

          {pecasServicosForm}
        </>
      ) : osAberta ? (
        <>
          <div className="bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-700 space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Entrada do carro</p>
            <p>{resumoEntrada}</p>
            {km && <p>KM {km}</p>}
          </div>
          <div className="bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-700 space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Cliente (nota / Zap)</p>
            <p>{telefone || 'sem telefone'}</p>
            {cpf && <p>{cpf}</p>}
            {endereco && <p>{endereco}</p>}
          </div>
          {pecasServicosForm}
        </>
      ) : naOficina ? (
        <>
          <div className="bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-700 space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Carro</p>
            <p>{resumoEntrada}</p>
            {km ? <p>KM {km}</p> : null}
          </div>
          {os.status === 'TravadoPeca' && os.travado_observacao ? (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-red-700">Travou</p>
              <p className="text-xs font-medium text-red-900">
                {osItens.find((i) => i.id === os.travado_item_id)?.descricao || 'Item da OS'}
              </p>
              <p className="text-xs text-red-800">{os.travado_observacao}</p>
            </div>
          ) : null}
          <OficinaChecklist
            itens={osItens}
            podeMarcar
            onToggle={(id, executado) => void run(() => marcarItemExecutado(id, executado))}
          />
          {pecasServicosForm}
        </>
      ) : (
        <>
      <div className="bg-white border border-neutral-200 rounded-xl p-3 space-y-2">
        <h3 className="text-xs font-semibold">Entrada do carro</h3>
        <div className="grid grid-cols-2 gap-2">
          <Campo label="KM">
            <input
              className={inputCompactClass}
              inputMode="numeric"
              value={km}
              onChange={(e) => setKm(maskKmInput(e.target.value))}
              onBlur={() => void run(() => persistirEntrada(km, modelo, cor))}
            />
          </Campo>
          <Campo label="Modelo">
            <input
              className={inputCompactClass}
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              onBlur={() => void run(() => persistirEntrada(km, modelo, cor))}
              placeholder="Onix, Civic, Gol..."
            />
          </Campo>
        </div>
        <CorPicker
          value={cor}
          onChange={(nome) => {
            setCor(nome);
            void run(() => persistirEntrada(km, modelo, nome));
          }}
        />
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-3 space-y-2">
        <h3 className="text-xs font-semibold">Cliente (nota / Zap)</h3>
        <Campo label="Telefone">
          <input className={inputCompactClass} value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        </Campo>
        <Campo label="CPF/CNPJ">
          <input className={inputCompactClass} value={cpf} onChange={(e) => setCpf(e.target.value)} />
        </Campo>
        <Campo label="Endereço">
          <input className={inputCompactClass} value={endereco} onChange={(e) => setEndereco(e.target.value)} />
        </Campo>
        <button
          type="button"
          className="w-full py-2 rounded-lg border border-neutral-200 text-xs font-semibold"
          onClick={() =>
            void run(() =>
              atualizarCliente(cliente.id, {
                telefone: telefone || null,
                cpf_cnpj: cpf || null,
                endereco: endereco || null,
              })
            )
          }
        >
          Salvar dados do cliente
        </button>
      </div>

      {pecasServicosForm}
        </>
      )}

      {os.status === 'Pronto' && isVendedor && (
        <div className="grid grid-cols-3 gap-1.5">
          {(Object.keys(FORMA_LABEL) as FormaPagamento[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setForma(f)}
              className={`py-1.5 rounded-lg text-[11px] font-semibold border ${
                forma === f ? 'bg-[#cd3f00] text-white border-[#cd3f00]' : 'bg-white border-neutral-200'
              }`}
            >
              {FORMA_LABEL[f]}
            </button>
          ))}
        </div>
      )}

      {isVendedor && os.status === 'AguardandoCotar' && pecasComprar.length > 0 && !podeGerarPdf && (
        <p className="text-center text-[11px] text-neutral-500">
          {pecasComprar.some((i) => !i.comprado)
            ? 'Marque as peças compradas para informar o preço'
            : 'Informe o preço de cada peça comprada para gerar a OS'}
        </p>
      )}
      {erro && <p className="text-sm text-red-700">{erro}</p>}

      <BarraFooter>
          {(telefone || cliente.telefone) && (
            <AcaoFooter
              label="WhatsApp"
              icon={<MessageCircle className="w-5 h-5" />}
              onClick={() =>
                abrirWhatsApp(
                  telefone || cliente.telefone || '',
                  mensagemWhatsAppOs({
                    clienteNome: cliente.nome,
                    numeroOs: os.numero_os,
                    status: os.status as StatusOS,
                    total,
                    placa: veiculo.placa,
                  })
                )
              }
            />
          )}
          <AcaoFooter
            label="Baixar"
            icon={<Download className="w-5 h-5" />}
            disabled={!podeGerarPdf}
            onClick={() => void run(baixarPdf)}
          />
          <AcaoFooter
            label="Compartilhar"
            icon={<Share className="w-5 h-5" />}
            disabled={!podeGerarPdf}
            onClick={() => void run(compartilharPdf)}
          />
          {os.status === 'Fazendo' ? (
            <AcaoFooter
              label="Travou"
              icon={<Pause className="w-5 h-5" />}
              tom="perigo"
              onClick={() => setTravouAberto(true)}
            />
          ) : null}
          {modoCotar ? (
            <AcaoFooter
              label="Voltar"
              icon={<Undo2 className="w-5 h-5" />}
              onClick={() => void run(() => atualizarStatus(os.id, 'Aberta'))}
            />
          ) : null}
          {proximo ? (
            <AcaoFooter
              label={proximo.label}
              icon={proximo.icon}
              tom="destaque"
              onClick={() => void run(proximo.action)}
            />
          ) : null}
      </BarraFooter>

      {travouAberto ? (
        <TravouModal
          itens={osItens}
          onCancelar={() => setTravouAberto(false)}
          onConfirmar={async (itemId, observacao) => {
            await travarOS(os.id, itemId, observacao);
            setTravouAberto(false);
          }}
        />
      ) : null}
    </div>
  );
};
