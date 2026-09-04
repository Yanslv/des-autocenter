import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Images, Pencil, Search, Trash2 } from 'lucide-react';
import type { Database } from '../types/database';
import type { MotivoSaida } from '../types';
import { useOficina, type ProdutoInput } from '../context/OficinaContext';
import { Campo, inputClass } from './Campo';
import {
  formatBRL,
  formatMoedaInput,
  maskInteiroInput,
  maskMoedaInput,
  parseInteiro,
  parseMoeda,
  percentualMargem,
  resumoEstoque,
  saldoLivre,
} from '../utils/formatters';

type Produto = Database['public']['Tables']['produtos']['Row'];
type TipoMovimento = 'entrada' | 'saida';

type FormProduto = Omit<ProdutoInput, 'preco_venda' | 'custo' | 'estoque_minimo'> & {
  preco_venda: string;
  custo: string;
  estoque_minimo: string;
};

const formVazio: FormProduto = {
  nome: '',
  codigo: '',
  foto: null,
  preco_venda: '',
  custo: '',
  garantia: '',
  eh_caixa: false,
  unidades_por_caixa: 1,
  estoque_minimo: '',
  avisar_estoque_baixo: true,
};

function pararFaixas(stream: MediaStream | null) {
  stream?.getTracks().forEach((faixa) => faixa.stop());
}

function mensagemErroCamera(err: unknown): string {
  const nome = err instanceof DOMException ? err.name : '';
  if (nome === 'NotAllowedError' || nome === 'PermissionDeniedError') {
    return 'Permissão da câmera negada. Ative o acesso nas configurações do aparelho.';
  }
  if (nome === 'NotFoundError' || nome === 'OverconstrainedError') {
    return 'Nenhuma câmera encontrada neste aparelho.';
  }
  return 'Não foi possível abrir a câmera.';
}

async function pedirStreamCamera(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' } },
    });
  } catch {
    return await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
  }
}

const CameraCaptura: React.FC<{
  stream: MediaStream;
  onFoto: (file: File) => void;
  onFechar: () => void;
}> = ({ stream, onFoto, onFechar }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    void video.play().catch(() => undefined);
    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  const capturar = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onFoto(new File([blob], `produto-${Date.now()}.jpg`, { type: 'image/jpeg' }));
        onFechar();
      },
      'image/jpeg',
      0.9
    );
  };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black">
      <video ref={videoRef} className="min-h-0 flex-1 object-cover" autoPlay playsInline muted />
      <div className="grid grid-cols-2 gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button type="button" className="rounded-xl bg-white py-3 text-sm" onClick={onFechar}>
          Cancelar
        </button>
        <button
          type="button"
          className="rounded-xl bg-[#cd3f00] py-3 text-sm font-semibold text-white"
          onClick={capturar}
        >
          Capturar
        </button>
      </div>
    </div>
  );
};

export const ProdutosView: React.FC<{
  produtoFoco?: string | null;
  onFocoConsumido?: () => void;
}> = ({ produtoFoco, onFocoConsumido }) => {
  const { produtos, salvarProduto, removerProduto, entradaProduto, saidaProduto } = useOficina();
  const [busca, setBusca] = useState('');
  const [formAberto, setFormAberto] = useState(false);
  const [form, setForm] = useState<FormProduto>(formVazio);
  const [preview, setPreview] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const [busy, setBusy] = useState(false);
  const [movimento, setMovimento] = useState<{ produto: Produto; tipo: TipoMovimento } | null>(null);
  const [qtdMov, setQtdMov] = useState('1');
  const [custoMov, setCustoMov] = useState('');
  const [motivoMov, setMotivoMov] = useState<MotivoSaida>('avaria');
  const [remover, setRemover] = useState<Produto | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const arquivoRef = useRef<HTMLInputElement>(null);
  const cameraAoVivo =
    window.isSecureContext && Boolean(navigator.mediaDevices?.getUserMedia);

  const lista = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return produtos;
    return produtos.filter(
      (p) => p.nome.toLowerCase().includes(t) || (p.codigo || '').toLowerCase().includes(t)
    );
  }, [busca, produtos]);

  const estoque = useMemo(() => resumoEstoque(produtos), [produtos]);

  useEffect(() => {
    if (!produtoFoco) return;
    const el = document.getElementById(`produto-${produtoFoco}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    onFocoConsumido?.();
  }, [produtoFoco, onFocoConsumido]);

  const abrirEdicao = (p: Produto) => {
    setForm({
      id: p.id,
      nome: p.nome,
      codigo: p.codigo || '',
      foto: null,
      foto_url: p.foto_url,
      preco_venda: formatMoedaInput(Number(p.preco_venda)),
      custo: formatMoedaInput(Number(p.custo)),
      garantia: p.garantia || '',
      eh_caixa: p.eh_caixa,
      unidades_por_caixa: p.unidades_por_caixa,
      estoque_minimo: p.estoque_minimo === 0 ? '' : String(p.estoque_minimo),
      avisar_estoque_baixo: p.avisar_estoque_baixo,
    });
    setPreview(p.foto_url);
    setFormAberto(true);
  };

  const usarFoto = (file: File) => {
    setErro('');
    setForm((f) => ({ ...f, foto: file }));
    setPreview((atual) => {
      if (atual?.startsWith('blob:')) URL.revokeObjectURL(atual);
      return URL.createObjectURL(file);
    });
  };

  const aplicarArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    e.target.value = '';
    if (!file) return;
    if (file.type && !file.type.startsWith('image/')) {
      setErro('Selecione uma imagem válida');
      return;
    }
    usarFoto(file);
  };

  const confirmarRemocao = async () => {
    if (!remover) return;
    setErro('');
    setBusy(true);
    try {
      await removerProduto(remover.id);
      setRemover(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao remover');
      setRemover(null);
    } finally {
      setBusy(false);
    }
  };

  const fecharCamera = () => {
    setCameraStream((atual) => {
      pararFaixas(atual);
      return null;
    });
  };

  const abrirCamera = () => {
    setErro('');
    void (async () => {
      try {
        const stream = await pedirStreamCamera();
        setCameraStream(stream);
      } catch (err) {
        setErro(mensagemErroCamera(err));
      }
    })();
  };

  const fecharForm = () => {
    fecharCamera();
    setFormAberto(false);
    setForm(formVazio);
    setPreview((atual) => {
      if (atual?.startsWith('blob:')) URL.revokeObjectURL(atual);
      return null;
    });
    setErro('');
  };

  const abrirMovimento = (produto: Produto, tipo: TipoMovimento) => {
    setErro('');
    setQtdMov('1');
    setCustoMov(formatMoedaInput(Number(produto.custo)));
    setMotivoMov('avaria');
    setMovimento({ produto, tipo });
  };

  const confirmarMovimento = async () => {
    if (!movimento) return;
    setErro('');
    try {
      if (movimento.tipo === 'entrada') {
        await entradaProduto(movimento.produto.id, Number(qtdMov), parseMoeda(custoMov));
      } else {
        await saidaProduto(movimento.produto.id, Number(qtdMov), motivoMov);
      }
      setMovimento(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : movimento.tipo === 'entrada' ? 'Falha na entrada' : 'Falha na saída');
    }
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Produtos</h2>
        <button
          type="button"
          className="text-sm font-semibold text-[#cd3f00]"
          onClick={() => {
            if (formAberto && !form.id) {
              fecharForm();
              return;
            }
            setForm(formVazio);
            setPreview(null);
            setErro('');
            setFormAberto(true);
          }}
        >
          {formAberto && !form.id ? 'Fechar' : '+ Novo produto'}
        </button>
      </div>

      <p className="text-sm text-neutral-600">
        Em estoque <span className="font-bold text-neutral-900">{formatBRL(estoque.valorCusto)}</span> de{' '}
        {estoque.quantidadeItens} itens
      </p>

      {formAberto && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-3 sm:items-center"
          onClick={() => {
            if (!busy) fecharForm();
          }}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="produto-form-titulo"
            className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
            onSubmit={async (e) => {
              e.preventDefault();
              setErro('');
              setBusy(true);
              try {
                await salvarProduto({
                  ...form,
                  preco_venda: parseMoeda(form.preco_venda),
                  custo: parseMoeda(form.custo),
                  estoque_minimo: parseInteiro(form.estoque_minimo),
                });
                fecharForm();
              } catch (err) {
                setErro(err instanceof Error ? err.message : 'Erro ao salvar');
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3">
              <h3 id="produto-form-titulo" className="text-sm font-semibold">
                {form.id ? 'Editar produto' : 'Novo produto'}
              </h3>
              <button type="button" className="text-sm text-neutral-500" onClick={fecharForm} disabled={busy}>
                Fechar
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              <div className="space-y-2">
                <span className="text-xs font-medium text-neutral-600">Foto</span>
                <input
                  ref={arquivoRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={aplicarArquivo}
                />
                <div className="grid grid-cols-2 gap-2">
                  {cameraAoVivo ? (
                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 py-3 text-sm font-medium"
                      onClick={abrirCamera}
                    >
                      <Camera className="h-4 w-4" />
                      Tirar foto
                    </button>
                  ) : (
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-neutral-200 py-3 text-sm font-medium">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="sr-only"
                        onChange={aplicarArquivo}
                      />
                      <Camera className="h-4 w-4" />
                      Tirar foto
                    </label>
                  )}
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 py-3 text-sm font-medium"
                    onClick={() => arquivoRef.current?.click()}
                  >
                    <Images className="h-4 w-4" />
                    Arquivos
                  </button>
                </div>
                {erro && <p className="text-sm text-red-700">{erro}</p>}
                {preview && (
                  <img src={preview} alt="" className="h-44 w-full rounded-xl bg-neutral-100 object-cover" />
                )}
              </div>
              <Campo label="Nome do produto">
                <input
                  className={inputClass}
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  required
                />
              </Campo>
              <Campo label="Código (opcional)">
                <input
                  className={inputClass}
                  value={form.codigo}
                  onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
                />
              </Campo>
              <div className="grid grid-cols-2 gap-2">
                <Campo label="Custo">
                  <input
                    className={inputClass}
                    type="text"
                    inputMode="numeric"
                    placeholder="0.00"
                    value={form.custo}
                    onChange={(e) => setForm((f) => ({ ...f, custo: maskMoedaInput(e.target.value) }))}
                  />
                </Campo>
                <Campo label="Preço de venda">
                  <input
                    className={inputClass}
                    type="text"
                    inputMode="numeric"
                    placeholder="0.00"
                    value={form.preco_venda}
                    onChange={(e) => setForm((f) => ({ ...f, preco_venda: maskMoedaInput(e.target.value) }))}
                  />
                </Campo>
              </div>
              <Campo label="Garantia">
                <input
                  className={inputClass}
                  value={form.garantia}
                  onChange={(e) => setForm((f) => ({ ...f, garantia: e.target.value }))}
                  placeholder="Ex.: 3 meses"
                />
              </Campo>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.eh_caixa}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      eh_caixa: e.target.checked,
                      unidades_por_caixa: e.target.checked ? Math.max(f.unidades_por_caixa, 1) : 1,
                    }))
                  }
                />
                É caixa
              </label>
              {form.eh_caixa && (
                <Campo label="Unidades por caixa">
                  <input
                    className={inputClass}
                    type="number"
                    min={1}
                    value={form.unidades_por_caixa}
                    onChange={(e) => setForm((f) => ({ ...f, unidades_por_caixa: Number(e.target.value) }))}
                  />
                </Campo>
              )}
              <Campo label="Estoque mínimo">
                <input
                  className={inputClass}
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={form.estoque_minimo}
                  onChange={(e) => setForm((f) => ({ ...f, estoque_minimo: maskInteiroInput(e.target.value) }))}
                />
              </Campo>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>Avisar se estiver acabando</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.avisar_estoque_baixo}
                  onClick={() => setForm((f) => ({ ...f, avisar_estoque_baixo: !f.avisar_estoque_baixo }))}
                  className={`w-11 h-6 rounded-full relative ${
                    form.avisar_estoque_baixo ? 'bg-[#cd3f00]' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      form.avisar_estoque_baixo ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
              </label>
              {erro && <p className="text-sm text-red-700">{erro}</p>}
            </div>
            <div className="border-t border-neutral-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-[#cd3f00] text-white font-semibold disabled:opacity-60"
              >
                {busy ? 'Salvando…' : form.id ? 'Salvar produto' : 'Cadastrar produto'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          className={`${inputClass} rounded-full pl-10`}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar produtos..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {lista.map((p) => (
          <ProdutoCard
            key={p.id}
            produto={p}
            onEditar={() => abrirEdicao(p)}
            onRemover={() => setRemover(p)}
            onEntrada={() => abrirMovimento(p, 'entrada')}
            onSaida={() => abrirMovimento(p, 'saida')}
          />
        ))}
      </div>
      {erro && !formAberto && !movimento && <p className="text-sm text-red-700">{erro}</p>}

      {movimento && (
        <MovimentoModal
          produto={movimento.produto}
          tipo={movimento.tipo}
          qtd={qtdMov}
          custo={custoMov}
          motivo={motivoMov}
          erro={erro}
          onQtd={setQtdMov}
          onCusto={setCustoMov}
          onMotivo={setMotivoMov}
          onCancelar={() => {
            setMovimento(null);
            setErro('');
          }}
          onConfirmar={confirmarMovimento}
        />
      )}

      {cameraStream && (
        <CameraCaptura stream={cameraStream} onFoto={usarFoto} onFechar={fecharCamera} />
      )}

      {remover && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="remover-produto-titulo"
            className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-4"
          >
            <p id="remover-produto-titulo" className="text-sm text-neutral-800">
              Tem certeza que deseja remover o produto {remover.nome}?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="rounded-xl border border-neutral-200 py-2.5 text-sm"
                onClick={() => setRemover(null)}
                disabled={busy}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-xl bg-red-700 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                onClick={confirmarRemocao}
                disabled={busy}
              >
                {busy ? 'Removendo…' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MovimentoModal: React.FC<{
  produto: Produto;
  tipo: TipoMovimento;
  qtd: string;
  custo: string;
  motivo: MotivoSaida;
  erro: string;
  onQtd: (v: string) => void;
  onCusto: (v: string) => void;
  onMotivo: (v: MotivoSaida) => void;
  onCancelar: () => void;
  onConfirmar: () => void;
}> = ({ produto, tipo, qtd, custo, motivo, erro, onQtd, onCusto, onMotivo, onCancelar, onConfirmar }) => {
  const ehEntrada = tipo === 'entrada';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancelar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="movimento-produto-nome"
        className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <p id="movimento-produto-nome" className="text-sm font-semibold text-neutral-900">
          {produto.nome}
        </p>
        <Campo label="Quantidade (unidades)">
          <input
            className={inputClass}
            type="number"
            min={1}
            value={qtd}
            onChange={(e) => onQtd(e.target.value)}
          />
        </Campo>
        {ehEntrada ? (
          <Campo label="Custo">
            <input
              className={inputClass}
              type="text"
              inputMode="numeric"
              placeholder="0.00"
              value={custo}
              onChange={(e) => onCusto(maskMoedaInput(e.target.value))}
            />
          </Campo>
        ) : (
          <Campo label="Motivo">
            <select
              className={inputClass}
              value={motivo}
              onChange={(e) => onMotivo(e.target.value as MotivoSaida)}
            >
              <option value="avaria">Avaria / quebra</option>
              <option value="extravio">Extravio</option>
            </select>
          </Campo>
        )}
        {erro && <p className="text-sm text-red-700">{erro}</p>}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="rounded-xl border border-neutral-200 py-2.5 text-sm"
            onClick={onCancelar}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={`rounded-xl py-2.5 text-sm font-semibold text-white ${
              ehEntrada ? 'bg-emerald-700' : 'bg-red-700'
            }`}
            onClick={onConfirmar}
          >
            {ehEntrada ? 'Entrada' : 'Saída'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProdutoCard: React.FC<{
  produto: Produto;
  onEditar: () => void;
  onRemover: () => void;
  onEntrada: () => void;
  onSaida: () => void;
}> = ({ produto, onEditar, onRemover, onEntrada, onSaida }) => {
  const margem = percentualMargem(Number(produto.preco_venda), Number(produto.custo));
  const critico = produto.avisar_estoque_baixo && saldoLivre(produto) <= produto.estoque_minimo;

  return (
    <div id={`produto-${produto.id}`} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <div className="relative">
        <button type="button" className="block w-full text-left" onClick={onEditar}>
          {produto.foto_url ? (
            <img src={produto.foto_url} alt="" className="aspect-square w-full bg-neutral-100 object-cover" />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center bg-neutral-100 text-xs text-neutral-400">
              Sem foto
            </div>
          )}
        </button>
        <div className="absolute top-2 right-2 flex flex-col gap-1.5">
          <button
            type="button"
            aria-label={`Remover ${produto.nome}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow"
            onClick={onRemover}
          >
            <Trash2 className="h-4 w-4 text-neutral-500" />
          </button>
          <button
            type="button"
            aria-label={`Editar ${produto.nome}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow"
            onClick={onEditar}
          >
            <Pencil className="h-4 w-4 text-neutral-500" />
          </button>
        </div>
      </div>
      <button type="button" className="w-full p-2.5 text-left" onClick={onEditar}>
        <p className="line-clamp-2 text-sm font-semibold leading-tight text-neutral-900">{produto.nome}</p>
        <p className="mt-0.5 text-xs text-neutral-400">{produto.categoria}</p>
        <p className="text-xs text-neutral-400">Estoque: {saldoLivre(produto)} un.</p>
        {critico && <p className="text-xs font-semibold text-amber-800">Acabando</p>}
        <p className="mt-1 text-base font-bold text-emerald-600">{formatBRL(Number(produto.preco_venda))}</p>
        <p className="text-[11px] text-neutral-400">custo {formatBRL(Number(produto.custo))}</p>
        {margem !== null && <p className="text-sm font-bold text-blue-600">{margem}% margem</p>}
      </button>
      <div className="grid grid-cols-2 border-t border-neutral-100">
        <button type="button" className="py-2 text-xs font-semibold text-emerald-800" onClick={onEntrada}>
          Entrada
        </button>
        <button
          type="button"
          className="border-l border-neutral-100 py-2 text-xs font-semibold text-red-800"
          onClick={onSaida}
        >
          Saída
        </button>
      </div>
    </div>
  );
};
