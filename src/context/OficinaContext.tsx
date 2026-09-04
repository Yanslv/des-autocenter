import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import type { FormaPagamento, MotivoSaida, OrigemPeca, StatusOS, UserRole } from '../types';
import { placaNormalizada, placaValida } from '../utils/formatters';

type Cliente = Database['public']['Tables']['clientes']['Row'];
type Veiculo = Database['public']['Tables']['veiculos']['Row'];
type Produto = Database['public']['Tables']['produtos']['Row'];
type OS = Database['public']['Tables']['ordens_servico']['Row'];
type OSItem = Database['public']['Tables']['os_itens']['Row'];
type Perfil = Database['public']['Tables']['perfis']['Row'];
type Oficina = Database['public']['Tables']['oficinas']['Row'];
type Venda = Database['public']['Tables']['vendas_avulsas']['Row'];
type VendaItem = Database['public']['Tables']['venda_itens']['Row'];

export type ProdutoInput = {
  id?: string;
  nome: string;
  codigo?: string;
  foto?: File | null;
  foto_url?: string | null;
  preco_venda: number;
  custo: number;
  garantia?: string;
  eh_caixa: boolean;
  unidades_por_caixa: number;
  estoque_minimo: number;
  avisar_estoque_baixo: boolean;
};

function fail(error: { message: string } | null, fallback: string): never {
  if (error) throw new Error(error.message);
  throw new Error(fallback);
}

function extensaoFoto(file: File): string {
  const doNome = (file.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (doNome === 'jpeg' || doNome === 'jpg' || doNome === 'png' || doNome === 'webp' || doNome === 'gif') {
    return doNome === 'jpeg' ? 'jpg' : doNome;
  }
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  if (file.type === 'image/gif') return 'gif';
  return 'jpg';
}

async function enviarFotoProduto(oficinaId: string, produtoId: string, file: File): Promise<string> {
  const ext = extensaoFoto(file);
  const path = `${oficinaId}/${produtoId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('produtos').upload(path, file, {
    upsert: false,
    contentType: file.type || 'image/jpeg',
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('produtos').getPublicUrl(path);
  return data.publicUrl;
}

export type BuscaHit = {
  cliente: Cliente;
  veiculos: Veiculo[];
};

export type ItemAbrirOS =
  | { tipo: 'servico'; descricao: string; quantidade: number; valor: number }
  | { tipo: 'comprar'; descricao: string; quantidade: number; valor: number }
  | { tipo: 'estoque'; produtoId: string; quantidadeUnidades: number; ehCaixa: boolean };

export type AbrirOSInput = {
  placa: string;
  clienteNome: string;
  clienteId?: string;
  veiculoId?: string;
  problema: string;
  prazoDias: number;
  km?: number | null;
  modelo?: string;
  cor?: string;
  telefone?: string;
  cpf?: string;
  endereco?: string;
  itens?: ItemAbrirOS[];
};

type OficinaContextType = {
  session: Session | null;
  perfil: Perfil | null;
  oficina: Oficina | null;
  carregando: boolean;
  clientes: Cliente[];
  veiculos: Veiculo[];
  produtos: Produto[];
  ordens: OS[];
  itens: OSItem[];
  vendas: Venda[];
  vendaItens: VendaItem[];
  isVendedor: boolean;
  recarregar: () => Promise<void>;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (input: { email: string; senha: string; nome: string; papel: UserRole }) => Promise<string | null>;
  sair: () => Promise<void>;
  buscarIdentidade: (termo: string) => BuscaHit[];
  abrirOS: (input: AbrirOSInput) => Promise<string>;
  atualizarStatus: (osId: string, status: StatusOS) => Promise<void>;
  mandarParaCotar: (osId: string) => Promise<void>;
  marcarPdfEnviado: (osId: string) => Promise<void>;
  adicionarServico: (osId: string, descricao: string, quantidade: number, valor: number) => Promise<void>;
  adicionarPecaComprar: (osId: string, descricao: string, quantidade: number, valor: number) => Promise<void>;
  adicionarPecaEstoque: (
    osId: string,
    produtoId: string,
    quantidadeUnidades: number,
    ehCaixa: boolean
  ) => Promise<void>;
  atualizarPrecoItem: (itemId: string, valorUnitario: number) => Promise<void>;
  marcarItemComprado: (itemId: string) => Promise<void>;
  removerItem: (itemId: string) => Promise<void>;
  salvarEntradaVeiculo: (input: {
    osId: string;
    veiculoId: string;
    km: number | null;
    modelo: string;
    cor: string;
  }) => Promise<void>;
  atualizarCliente: (
    clienteId: string,
    patch: { telefone?: string | null; cpf_cnpj?: string | null; endereco?: string | null }
  ) => Promise<void>;
  entregarOS: (osId: string, forma: FormaPagamento, valorPago: number) => Promise<void>;
  marcarPosVenda: (osId: string) => Promise<void>;
  salvarOficina: (patch: { nome?: string; whatsapp?: string; cnpj?: string; endereco?: string }) => Promise<void>;
  salvarProduto: (input: ProdutoInput) => Promise<void>;
  removerProduto: (produtoId: string) => Promise<void>;
  entradaProduto: (produtoId: string, quantidade: number, custo: number) => Promise<void>;
  saidaProduto: (produtoId: string, quantidade: number, motivo: MotivoSaida) => Promise<void>;
  criarVendaAvulsa: (
    forma: FormaPagamento,
    itens: Array<{ produto_id: string; quantidade: number; valor_unitario: number }>,
    observacao: string
  ) => Promise<void>;
};

const OficinaContext = createContext<OficinaContextType | undefined>(undefined);

export const OficinaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [oficina, setOficina] = useState<Oficina | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [ordens, setOrdens] = useState<OS[]>([]);
  const [itens, setItens] = useState<OSItem[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [vendaItens, setVendaItens] = useState<VendaItem[]>([]);

  const recarregar = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setPerfil(null);
      setOficina(null);
      setClientes([]);
      setVeiculos([]);
      setProdutos([]);
      setOrdens([]);
      setItens([]);
      setVendas([]);
      setVendaItens([]);
      return;
    }

    const { data: perfilData, error: perfilError } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', userData.user.id)
      .maybeSingle();
    if (perfilError) throw new Error(perfilError.message);
    if (!perfilData) {
      setPerfil(null);
      return;
    }
    setPerfil(perfilData);

    const [{ data: ofi }, { data: cli }, { data: vei }, { data: prod }, { data: os }, { data: osItens }, { data: ven }, { data: venItens }] =
      await Promise.all([
        supabase.from('oficinas').select('*').eq('id', perfilData.oficina_id).maybeSingle(),
        supabase.from('clientes').select('*').order('created_at', { ascending: false }),
        supabase.from('veiculos').select('*'),
        supabase.from('produtos').select('*').order('nome'),
        supabase.from('ordens_servico').select('*').order('data_abertura', { ascending: false }),
        supabase.from('os_itens').select('*'),
        supabase.from('vendas_avulsas').select('*').order('data_venda', { ascending: false }),
        supabase.from('venda_itens').select('*'),
      ]);

    setOficina(ofi ?? null);
    setClientes(cli ?? []);
    setVeiculos(vei ?? []);
    setProdutos(prod ?? []);
    setOrdens(os ?? []);
    setItens(osItens ?? []);
    setVendas(ven ?? []);
    setVendaItens(venItens ?? []);
  }, []);

  useEffect(() => {
    let ativo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      setSession(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setCarregando(true);
    recarregar()
      .catch(() => undefined)
      .finally(() => setCarregando(false));
  }, [session, recarregar]);

  const entrar = async (email: string, senha: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) throw new Error(error.message);
  };

  const cadastrar = async (input: { email: string; senha: string; nome: string; papel: UserRole }) => {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.senha,
      options: {
        data: { nome: input.nome, papel: input.papel },
      },
    });
    if (error) throw new Error(error.message);
    if (!data.session) {
      return 'Conta criada. Confirme o e-mail se o Supabase pedir, depois entre.';
    }
    return null;
  };

  const sair = async () => {
    await supabase.auth.signOut();
  };

  const buscarIdentidade = useCallback(
    (termo: string): BuscaHit[] => {
      const t = termo.trim().toLowerCase();
      if (t.length < 2) return [];
      const tPlaca = t.replace(/[^a-z0-9]/g, '');
      const map = new Map<string, BuscaHit>();

      clientes
        .filter((c) => !c.eh_balcao)
        .forEach((c) => {
          const nomeOk = c.nome.toLowerCase().includes(t);
          const foneOk = (c.telefone || '').replace(/\D/g, '').includes(t.replace(/\D/g, ''));
          if (nomeOk || (t.replace(/\D/g, '').length >= 4 && foneOk)) {
            map.set(c.id, { cliente: c, veiculos: veiculos.filter((v) => v.cliente_id === c.id) });
          }
        });

      veiculos.forEach((v) => {
        const placa = (v.placa || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const modelo = (v.modelo || '').toLowerCase();
        if ((tPlaca.length >= 3 && placa.includes(tPlaca)) || modelo.includes(t)) {
          const c = clientes.find((cli) => cli.id === v.cliente_id);
          if (!c || c.eh_balcao) return;
          const atual = map.get(c.id);
          if (atual) {
            if (!atual.veiculos.some((x) => x.id === v.id)) atual.veiculos.push(v);
          } else {
            map.set(c.id, { cliente: c, veiculos: [v] });
          }
        }
      });

      return Array.from(map.values());
    },
    [clientes, veiculos]
  );

  const abrirOS = async (input: AbrirOSInput) => {
    if (!perfil) throw new Error('Sem perfil');
    if (!placaValida(input.placa)) throw new Error('Informe uma placa válida');
    const nome = input.clienteNome.trim();
    if (!nome) throw new Error('Informe o nome do cliente');
    if (!Number.isFinite(input.prazoDias) || input.prazoDias < 0) {
      throw new Error('Informe o prazo em dias');
    }
    const oficinaId = perfil.oficina_id;
    const placa = placaNormalizada(input.placa);
    const telefone = input.telefone?.trim() || null;
    const cpf = input.cpf?.trim() || null;
    const endereco = input.endereco?.trim() || null;
    const modelo = input.modelo?.trim() || null;
    const cor = input.cor || null;

    let clienteId = input.clienteId;
    let veiculoId = input.veiculoId;

    const veiculoExistente = veiculos.find(
      (v) => placaNormalizada(v.placa || '') === placa
    );

    if (veiculoExistente) {
      veiculoId = veiculoExistente.id;
      clienteId = veiculoExistente.cliente_id;
    } else {
      if (!clienteId) {
        const mesmoNome = clientes.find(
          (c) => !c.eh_balcao && c.nome.trim().toLowerCase() === nome.toLowerCase()
        );
        if (mesmoNome) {
          clienteId = mesmoNome.id;
        } else {
          const { data, error } = await supabase
            .from('clientes')
            .insert({ oficina_id: oficinaId, nome, telefone, cpf_cnpj: cpf, endereco })
            .select('*')
            .single();
          if (error || !data) fail(error, 'Não foi possível criar o cliente');
          clienteId = data.id;
        }
      }
      const { data, error } = await supabase
        .from('veiculos')
        .insert({
          oficina_id: oficinaId,
          cliente_id: clienteId,
          placa,
          modelo,
          cor,
        })
        .select('*')
        .single();
      if (error || !data) fail(error, 'Não foi possível criar o veículo');
      veiculoId = data.id;
    }

    const { error: cliErr } = await supabase
      .from('clientes')
      .update({ telefone, cpf_cnpj: cpf, endereco })
      .eq('id', clienteId as string);
    if (cliErr) throw new Error(cliErr.message);

    const { error: veiErr } = await supabase
      .from('veiculos')
      .update({ modelo, cor })
      .eq('id', veiculoId as string);
    if (veiErr) throw new Error(veiErr.message);

    const previsao = new Date();
    previsao.setDate(previsao.getDate() + input.prazoDias);

    const { data: os, error: osError } = await supabase
      .from('ordens_servico')
      .insert({
        oficina_id: oficinaId,
        cliente_id: clienteId as string,
        veiculo_id: veiculoId as string,
        mecanico_id: perfil.papel === 'mecanico' ? perfil.id : null,
        problema_relatado: input.problema.trim(),
        prazo_dias: input.prazoDias,
        data_previsao_entrega: previsao.toISOString().slice(0, 10),
        km_entrada: input.km ?? null,
        status: 'Aberta',
      })
      .select('*')
      .single();
    if (osError || !os) fail(osError, 'Não foi possível abrir a OS');

    for (const item of input.itens ?? []) {
      if (item.tipo === 'estoque') {
        const prod = produtos.find((p) => p.id === item.produtoId);
        if (!prod) throw new Error('Produto não encontrado');
        const descricao = item.ehCaixa ? `${prod.nome} (caixa)` : prod.nome;
        const { error } = await supabase.rpc('reservar_peca_os', {
          p_os_id: os.id,
          p_produto_id: item.produtoId,
          p_quantidade: item.quantidadeUnidades,
          p_descricao: descricao,
          p_valor_unitario: prod.preco_venda,
          p_eh_caixa: item.ehCaixa,
        });
        if (error) throw new Error(error.message);
        continue;
      }
      const { error } = await supabase.from('os_itens').insert({
        oficina_id: oficinaId,
        os_id: os.id,
        tipo: item.tipo === 'servico' ? 'servico' : 'produto',
        descricao: item.descricao,
        quantidade: item.quantidade,
        valor_unitario: item.valor,
        valor_total: item.quantidade * item.valor,
        origem_peca: item.tipo === 'comprar' ? ('comprar' satisfies OrigemPeca) : null,
      });
      if (error) throw new Error(error.message);
    }

    if ((input.itens ?? []).length > 0) {
      await supabase.rpc('recalcular_total_os', { p_os_id: os.id });
    }

    await recarregar();
    return os.id;
  };

  const atualizarStatus = async (osId: string, status: StatusOS) => {
    const patch: Database['public']['Tables']['ordens_servico']['Update'] = { status };
    if (status === 'Pronto' || status === 'Entregue') {
      patch.data_conclusao = new Date().toISOString();
    }
    const { error } = await supabase.from('ordens_servico').update(patch).eq('id', osId);
    if (error) throw new Error(error.message);
    await recarregar();
  };

  const mandarParaCotar = async (osId: string) => {
    const { error } = await supabase
      .from('ordens_servico')
      .update({
        status: 'AguardandoCotar',
        enviada_para_cotar_em: new Date().toISOString(),
      })
      .eq('id', osId);
    if (error) throw new Error(error.message);
    await recarregar();
  };

  const marcarPdfEnviado = async (osId: string) => {
    const { error } = await supabase
      .from('ordens_servico')
      .update({
        status: 'AguardandoCliente',
        pdf_enviado_em: new Date().toISOString(),
      })
      .eq('id', osId);
    if (error) throw new Error(error.message);
    await recarregar();
  };

  const adicionarServico = async (osId: string, descricao: string, quantidade: number, valor: number) => {
    if (!perfil) throw new Error('Sem perfil');
    const { error } = await supabase.from('os_itens').insert({
      oficina_id: perfil.oficina_id,
      os_id: osId,
      tipo: 'servico',
      descricao,
      quantidade,
      valor_unitario: valor,
      valor_total: quantidade * valor,
      origem_peca: null,
    });
    if (error) throw new Error(error.message);
    await supabase.rpc('recalcular_total_os', { p_os_id: osId });
    await recarregar();
  };

  const adicionarPecaComprar = async (osId: string, descricao: string, quantidade: number, valor: number) => {
    if (!perfil) throw new Error('Sem perfil');
    const { error } = await supabase.from('os_itens').insert({
      oficina_id: perfil.oficina_id,
      os_id: osId,
      tipo: 'produto',
      descricao,
      quantidade,
      valor_unitario: valor,
      valor_total: quantidade * valor,
      origem_peca: 'comprar' satisfies OrigemPeca,
    });
    if (error) throw new Error(error.message);
    await supabase.rpc('recalcular_total_os', { p_os_id: osId });
    await recarregar();
  };

  const adicionarPecaEstoque = async (
    osId: string,
    produtoId: string,
    quantidadeUnidades: number,
    ehCaixa: boolean
  ) => {
    const prod = produtos.find((p) => p.id === produtoId);
    if (!prod) throw new Error('Produto não encontrado');
    const descricao = ehCaixa ? `${prod.nome} (caixa)` : prod.nome;
    const { error } = await supabase.rpc('reservar_peca_os', {
      p_os_id: osId,
      p_produto_id: produtoId,
      p_quantidade: quantidadeUnidades,
      p_descricao: descricao,
      p_valor_unitario: prod.preco_venda,
      p_eh_caixa: ehCaixa,
    });
    if (error) throw new Error(error.message);
    await recarregar();
  };

  const atualizarPrecoItem = async (itemId: string, valorUnitario: number) => {
    const item = itens.find((i) => i.id === itemId);
    if (!item) throw new Error('Item não encontrado');
    const { error } = await supabase
      .from('os_itens')
      .update({
        valor_unitario: valorUnitario,
        valor_total: item.quantidade * valorUnitario,
      })
      .eq('id', itemId);
    if (error) throw new Error(error.message);
    await supabase.rpc('recalcular_total_os', { p_os_id: item.os_id });
    await recarregar();
  };

  const marcarItemComprado = async (itemId: string) => {
    const { error } = await supabase.from('os_itens').update({ comprado: true }).eq('id', itemId);
    if (error) throw new Error(error.message);
    await recarregar();
  };

  const removerItem = async (itemId: string) => {
    const { error } = await supabase.rpc('remover_item_os', { p_item_id: itemId });
    if (error) throw new Error(error.message);
    await recarregar();
  };

  const salvarEntradaVeiculo = async (input: {
    osId: string;
    veiculoId: string;
    km: number | null;
    modelo: string;
    cor: string;
  }) => {
    const { error: osErr } = await supabase
      .from('ordens_servico')
      .update({ km_entrada: input.km })
      .eq('id', input.osId);
    if (osErr) throw new Error(osErr.message);
    const { error: vErr } = await supabase
      .from('veiculos')
      .update({
        modelo: input.modelo.trim() || null,
        cor: input.cor || null,
      })
      .eq('id', input.veiculoId);
    if (vErr) throw new Error(vErr.message);
    await recarregar();
  };

  const atualizarCliente = async (
    clienteId: string,
    patch: { telefone?: string | null; cpf_cnpj?: string | null; endereco?: string | null }
  ) => {
    const { error } = await supabase.from('clientes').update(patch).eq('id', clienteId);
    if (error) throw new Error(error.message);
    await recarregar();
  };

  const entregarOS = async (osId: string, forma: FormaPagamento, valorPago: number) => {
    const os = ordens.find((o) => o.id === osId);
    if (!os) throw new Error('OS não encontrada');
    const cliente = clientes.find((c) => c.id === os.cliente_id);
    if (!cliente?.telefone) throw new Error('Informe o telefone do cliente antes de entregar');
    const { error } = await supabase.rpc('entregar_os', {
      p_os_id: osId,
      p_forma: forma,
      p_valor_pago: valorPago,
    });
    if (error) throw new Error(error.message);
    await recarregar();
  };

  const marcarPosVenda = async (osId: string) => {
    const { error } = await supabase
      .from('ordens_servico')
      .update({ pos_venda_ligado_em: new Date().toISOString() })
      .eq('id', osId);
    if (error) throw new Error(error.message);
    await recarregar();
  };

  const salvarOficina = async (patch: { nome?: string; whatsapp?: string; cnpj?: string; endereco?: string }) => {
    if (!oficina) throw new Error('Sem oficina');
    const { error } = await supabase.from('oficinas').update(patch).eq('id', oficina.id);
    if (error) throw new Error(error.message);
    await recarregar();
  };

  const salvarProduto = async (input: ProdutoInput) => {
    if (!perfil) throw new Error('Sem perfil');
    const payload = {
      nome: input.nome.trim(),
      codigo: input.codigo?.trim() || null,
      categoria: 'Geral',
      preco_venda: input.preco_venda,
      custo: input.custo,
      garantia: input.garantia?.trim() || null,
      eh_caixa: input.eh_caixa,
      unidades_por_caixa: input.eh_caixa ? Math.max(1, input.unidades_por_caixa) : 1,
      estoque_minimo: input.estoque_minimo,
      avisar_estoque_baixo: input.avisar_estoque_baixo,
    };
    if (!payload.nome) throw new Error('Informe o nome do produto');

    let produtoId = input.id;
    if (produtoId) {
      const { error } = await supabase.from('produtos').update(payload).eq('id', produtoId);
      if (error) throw new Error(error.message);
    } else {
      const { data, error } = await supabase
        .from('produtos')
        .insert({
          ...payload,
          oficina_id: perfil.oficina_id,
          quantidade_estoque: 0,
        })
        .select('id')
        .single();
      if (error || !data) fail(error, 'Não foi possível cadastrar o produto');
      produtoId = data.id;
    }

    if (input.foto && produtoId) {
      const foto_url = await enviarFotoProduto(perfil.oficina_id, produtoId, input.foto);
      const { error } = await supabase.from('produtos').update({ foto_url }).eq('id', produtoId);
      if (error) throw new Error(error.message);
    }
    await recarregar();
  };

  const removerProduto = async (produtoId: string) => {
    const prod = produtos.find((p) => p.id === produtoId);
    if (!prod) throw new Error('Produto não encontrado');
    if (prod.quantidade_reservada > 0) {
      throw new Error('Não é possível remover: há unidades reservadas em OS.');
    }
    const { count, error: vendaErr } = await supabase
      .from('venda_itens')
      .select('id', { count: 'exact', head: true })
      .eq('produto_id', produtoId);
    if (vendaErr) throw new Error(vendaErr.message);
    if ((count ?? 0) > 0) {
      throw new Error('Não é possível remover: este produto já foi usado em vendas.');
    }
    const { error: movErr } = await supabase.from('produto_movimentos').delete().eq('produto_id', produtoId);
    if (movErr) throw new Error(movErr.message);
    const { error } = await supabase.from('produtos').delete().eq('id', produtoId);
    if (error) {
      if (error.code === '23503') {
        throw new Error('Não é possível remover: este produto já foi usado.');
      }
      throw new Error(error.message);
    }
    await recarregar();
  };

  const entradaProduto = async (produtoId: string, quantidade: number, custo: number) => {
    const { error } = await supabase.rpc('entrada_produto', {
      p_produto_id: produtoId,
      p_quantidade: quantidade,
      p_custo: custo,
    });
    if (error) throw new Error(error.message);
    await recarregar();
  };

  const saidaProduto = async (produtoId: string, quantidade: number, motivo: MotivoSaida) => {
    const { error } = await supabase.rpc('saida_produto', {
      p_produto_id: produtoId,
      p_quantidade: quantidade,
      p_motivo: motivo,
    });
    if (error) throw new Error(error.message);
    await recarregar();
  };

  const criarVendaAvulsa = async (
    forma: FormaPagamento,
    lista: Array<{ produto_id: string; quantidade: number; valor_unitario: number }>,
    observacao: string
  ) => {
    const { error } = await supabase.rpc('criar_venda_avulsa', {
      p_forma: forma,
      p_itens: lista,
      p_observacao: observacao,
    });
    if (error) throw new Error(error.message);
    await recarregar();
  };

  const value = useMemo<OficinaContextType>(
    () => ({
      session,
      perfil,
      oficina,
      carregando,
      clientes,
      veiculos,
      produtos,
      ordens,
      itens,
      vendas,
      vendaItens,
      isVendedor: perfil?.papel === 'vendedor',
      recarregar,
      entrar,
      cadastrar,
      sair,
      buscarIdentidade,
      abrirOS,
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
      marcarPosVenda,
      salvarOficina,
      salvarProduto,
      removerProduto,
      entradaProduto,
      saidaProduto,
      criarVendaAvulsa,
    }),
    [
      session,
      perfil,
      oficina,
      carregando,
      clientes,
      veiculos,
      produtos,
      ordens,
      itens,
      vendas,
      vendaItens,
      recarregar,
      buscarIdentidade,
    ]
  );

  return <OficinaContext.Provider value={value}>{children}</OficinaContext.Provider>;
};

export const useOficina = () => {
  const ctx = useContext(OficinaContext);
  if (!ctx) throw new Error('useOficina precisa do OficinaProvider');
  return ctx;
};
