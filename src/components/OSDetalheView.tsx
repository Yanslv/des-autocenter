import React, { useMemo, useState } from 'react';
import { useOficina } from '../context/OficinaContext';
import { FORMA_LABEL, STATUS_COR, STATUS_LABEL, type FormaPagamento, type StatusOS } from '../types';
import { abrirWhatsApp, baixarOsPdf, gerarOsClientePdf, mensagemWhatsAppOs } from '../utils/osPdf';
import { Campo, inputCompactClass } from './Campo';
import { CorPicker } from './CorPicker';
import { FotoProduto, PecasServicosForm } from './PecasServicosForm';
import { formatBRL, maskKmInput, parseKm, unidadesDoPedido } from '../utils/formatters';

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
    mandarParaCotar,
    marcarPdfEnviado,
    adicionarServico,
    adicionarPecaComprar,
    adicionarPecaEstoque,
    atualizarPrecoItem,
    marcarItemComprado,
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
  const [km, setKm] = useState(os?.km_entrada != null ? maskKmInput(String(os.km_entrada)) : '');
  const [modelo, setModelo] = useState(veiculo?.modelo || '');
  const [cor, setCor] = useState(veiculo?.cor || '');
  const [telefone, setTelefone] = useState(cliente?.telefone || '');
  const [cpf, setCpf] = useState(cliente?.cpf_cnpj || '');
  const [endereco, setEndereco] = useState(cliente?.endereco || '');
  const [forma, setForma] = useState<FormaPagamento>('PIX');

  const total = osItens.reduce((s, i) => s + Number(i.valor_total), 0);
  const pecasComprar = osItens.filter((i) => i.tipo === 'produto' && i.origem_peca === 'comprar');
  const pecasEstoque = osItens.filter((i) => i.tipo === 'produto' && i.origem_peca === 'estoque');
  const servicos = osItens.filter((i) => i.tipo === 'servico');
  const modoCotar = os?.status === 'AguardandoCotar';
  const osAberta = os?.status === 'Aberta';
  const cotarListaPronta = pecasComprar.every((i) => i.comprado && Number(i.valor_unitario) > 0);
  const temPreco = osItens.some((i) => Number(i.valor_unitario) > 0);
  const podeGerarPdf =
    isVendedor &&
    (modoCotar
      ? osItens.length > 0 && cotarListaPronta && temPreco
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
      return {
        label: 'Mandar pra cotar',
        action: async () => {
          if (osItens.length === 0) throw new Error('Liste serviço ou peça antes de mandar pra cotar');
          await mandarParaCotar(os.id);
        },
      };
    }
    if (st === 'AguardandoCliente') {
      return { label: 'Cliente aprovou • Começar', action: () => atualizarStatus(os.id, 'Fazendo') };
    }
    if (st === 'Fazendo') {
      return { label: 'Serviço pronto', action: () => atualizarStatus(os.id, 'Pronto') };
    }
    if (st === 'TravadoPeca') {
      return { label: 'Peça chegou • Retomar', action: () => atualizarStatus(os.id, 'Fazendo') };
    }
    if (st === 'Pronto' && isVendedor) {
      return {
        label: 'Receber e entregar',
        action: () => entregarOS(os.id, forma, total || Number(os.valor_total)),
      };
    }
    return null;
  }, [
    os,
    cliente,
    veiculo,
    osItens.length,
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

  const enviarCliente = async () => {
    const pdf = gerarOsClientePdf({
      oficinaNome: oficina?.nome || 'Oficina',
      oficinaWhatsapp: oficina?.whatsapp || '',
      oficinaCnpj: oficina?.cnpj,
      oficinaEndereco: oficina?.endereco,
      numeroOs: os.numero_os,
      status: os.status as StatusOS,
      dataAbertura: os.data_abertura,
      previsao: os.data_previsao_entrega,
      clienteNome: cliente.nome,
      clienteTelefone: telefone || cliente.telefone,
      placa: veiculo.placa,
      modelo: veiculo.modelo,
      marca: veiculo.marca,
      cor: cor || veiculo.cor,
      km: parseKm(km) ?? os.km_entrada,
      problema: os.problema_relatado,
      itens: osItens,
    });
    baixarOsPdf(pdf);
    await marcarPdfEnviado(os.id);
  };

  const resumoEntrada = [veiculo.placa || 'sem placa', modelo || veiculo.modelo, cor || veiculo.cor]
    .filter(Boolean)
    .join(' • ');

  return (
    <div className="space-y-3 pb-28">
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
        <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COR[os.status as StatusOS].badge}`}>
          {STATUS_LABEL[os.status as StatusOS]}
        </span>
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

          <div className="bg-white border border-neutral-200 rounded-xl p-3 space-y-2">
            <div>
              <h3 className="text-xs font-semibold">Comprar</h3>
              <p className="text-[10px] text-neutral-500">Confira a lista, marque o que comprou e depois informe o preço.</p>
            </div>
            {pecasComprar.length === 0 && (
              <p className="text-[11px] text-neutral-500">Nenhuma peça para comprar.</p>
            )}
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

          {pecasEstoque.length > 0 && (
          <div className="bg-white border border-neutral-200 rounded-xl p-3 space-y-2">
            <h3 className="text-xs font-semibold">Já no estoque</h3>
            {pecasEstoque.map((it) => (
              <div key={it.id} className="flex items-center gap-2 py-1 border-b border-neutral-100 last:border-0">
                {it.produto_id ? (
                  <FotoProduto url={produtos.find((p) => p.id === it.produto_id)?.foto_url} />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium leading-tight truncate">{it.descricao}</div>
                  <div className="text-[10px] text-neutral-500">{it.quantidade}x</div>
                </div>
                <div className="text-[11px] font-mono shrink-0">{formatBRL(Number(it.valor_total))}</div>
              </div>
            ))}
          </div>
          )}

          {servicos.length > 0 && (
            <div className="bg-white border border-neutral-200 rounded-xl p-3 space-y-2">
              <h3 className="text-xs font-semibold">Mão de obra</h3>
              {servicos.map((it) => (
                <div key={it.id} className="flex items-center gap-2 py-1 border-b border-neutral-100 last:border-0">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium leading-tight truncate">{it.descricao}</div>
                    <div className="text-[10px] text-neutral-500">{it.quantidade}x</div>
                  </div>
                  <input
                    className="w-20 shrink-0 rounded-md border border-neutral-200 bg-white px-1.5 py-1 text-[11px] font-mono text-right"
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
              ))}
            </div>
          )}

          <div className="text-right text-sm font-semibold">Total {formatBRL(total)}</div>
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
          <PecasServicosForm
            itens={osItens}
            produtos={produtos}
            podeEditar={false}
            podeEditarPreco={false}
            onErro={setErro}
          />
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

      <PecasServicosForm
        itens={osItens}
        produtos={produtos}
        podeEditar={os.status !== 'Entregue'}
        podeEditarPreco={os.status !== 'Entregue'}
        onErro={setErro}
        onAddServico={(descricao, quantidade, valor) => adicionarServico(os.id, descricao, quantidade, valor)}
        onAddPecaComprar={(descricao, quantidade, valor) => adicionarPecaComprar(os.id, descricao, quantidade, valor)}
        onAddPecaEstoque={(produto, ehCaixa, quantidadePedido) =>
          adicionarPecaEstoque(os.id, produto.id, unidadesDoPedido(produto, ehCaixa, quantidadePedido), ehCaixa)
        }
        onRemover={removerItem}
        onAtualizarPreco={atualizarPrecoItem}
      />
        </>
      )}

      {os.status === 'Fazendo' && (
        <button
          type="button"
          className="w-full py-2 rounded-lg border border-neutral-200 text-sm font-semibold"
          onClick={() => void run(() => atualizarStatus(os.id, 'TravadoPeca'))}
        >
          Travou peça
        </button>
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

      {erro && <p className="text-sm text-red-700">{erro}</p>}

      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 p-2.5 pb-[calc(env(safe-area-inset-bottom)+10px)] space-y-1.5">
        {(telefone || cliente.telefone) && (
          <button
            type="button"
            className="w-full py-2 rounded-lg border border-emerald-200 text-emerald-800 text-sm font-semibold"
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
          >
            WhatsApp
          </button>
        )}
        {isVendedor && os.status === 'AguardandoCotar' && !podeGerarPdf && (
          <p className="text-center text-[11px] text-neutral-500">
            {pecasComprar.some((i) => !i.comprado)
              ? 'Marque as peças compradas para informar o preço'
              : pecasComprar.some((i) => Number(i.valor_unitario) <= 0)
                ? 'Informe o preço de cada peça comprada para gerar a OS'
                : 'Preencha os valores para gerar a OS'}
          </p>
        )}
        {podeGerarPdf && (
          <button
            type="button"
            className={`w-full py-2 rounded-lg text-sm font-semibold ${
              proximo ? 'border border-neutral-200 text-neutral-800' : 'bg-[#cd3f00] text-white'
            }`}
            onClick={() => void run(enviarCliente)}
          >
            Baixar OS
          </button>
        )}
        {proximo && (
          <button
            type="button"
            className="w-full py-2 rounded-lg bg-[#cd3f00] text-white text-sm font-semibold"
            onClick={() => void run(proximo.action)}
          >
            {proximo.label}
          </button>
        )}
      </div>
    </div>
  );
};
