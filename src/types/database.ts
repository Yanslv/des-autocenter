export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      clientes: {
        Row: {
          bairro: string | null;
          cep: string | null;
          cidade: string | null;
          complemento: string | null;
          cpf_cnpj: string | null;
          cpf_responsavel: string | null;
          created_at: string;
          eh_balcao: boolean;
          email: string | null;
          endereco: string | null;
          endereco_numero: string | null;
          id: string;
          nome: string;
          nome_fantasia: string | null;
          oficina_id: string;
          responsavel: string | null;
          telefone: string | null;
          tipo: string | null;
          uf: string | null;
        };
        Insert: {
          bairro?: string | null;
          cep?: string | null;
          cidade?: string | null;
          complemento?: string | null;
          cpf_cnpj?: string | null;
          cpf_responsavel?: string | null;
          eh_balcao?: boolean;
          email?: string | null;
          endereco?: string | null;
          endereco_numero?: string | null;
          id?: string;
          nome: string;
          nome_fantasia?: string | null;
          oficina_id: string;
          responsavel?: string | null;
          telefone?: string | null;
          tipo?: string | null;
          uf?: string | null;
        };
        Update: {
          bairro?: string | null;
          cep?: string | null;
          cidade?: string | null;
          complemento?: string | null;
          cpf_cnpj?: string | null;
          cpf_responsavel?: string | null;
          email?: string | null;
          endereco?: string | null;
          endereco_numero?: string | null;
          nome?: string;
          nome_fantasia?: string | null;
          responsavel?: string | null;
          telefone?: string | null;
          tipo?: string | null;
          uf?: string | null;
        };
        Relationships: [];
      };
      oficinas: {
        Row: {
          cnpj: string | null;
          created_at: string;
          email: string | null;
          endereco: string | null;
          id: string;
          logo_url: string | null;
          nome: string;
          segmento: string | null;
          whatsapp: string;
        };
        Insert: {
          cnpj?: string | null;
          email?: string | null;
          endereco?: string | null;
          id?: string;
          logo_url?: string | null;
          nome: string;
          segmento?: string | null;
          whatsapp?: string;
        };
        Update: {
          cnpj?: string | null;
          email?: string | null;
          endereco?: string | null;
          logo_url?: string | null;
          nome?: string;
          segmento?: string | null;
          whatsapp?: string;
        };
        Relationships: [];
      };
      orcamento_itens: {
        Row: {
          descricao: string;
          detalhe: string | null;
          id: string;
          oficina_id: string;
          orcamento_id: string;
          origem_peca: string | null;
          produto_id: string | null;
          quantidade: number;
          tipo: string;
          valor_total: number;
          valor_unitario: number;
        };
        Insert: {
          descricao: string;
          detalhe?: string | null;
          id?: string;
          oficina_id: string;
          orcamento_id: string;
          origem_peca?: string | null;
          produto_id?: string | null;
          quantidade?: number;
          tipo: string;
          valor_total?: number;
          valor_unitario?: number;
        };
        Update: {
          descricao?: string;
          detalhe?: string | null;
          quantidade?: number;
          valor_total?: number;
          valor_unitario?: number;
        };
        Relationships: [];
      };
      orcamentos: {
        Row: {
          aprovado_em: string | null;
          aprovado_nome: string | null;
          cliente_id: string | null;
          data_emissao: string;
          data_previsao_entrega: string | null;
          desconto: number;
          id: string;
          km: number | null;
          numero_orcamento: number;
          observacao: string | null;
          oficina_id: string;
          os_id: string | null;
          pdf_enviado_em: string | null;
          prazo_estimado_dias: number | null;
          status: string;
          total_pecas: number;
          total_servicos: number;
          total_terceiros: number;
          validade_dias: number;
          valor_total: number;
          veiculo_id: string | null;
        };
        Insert: {
          cliente_id?: string | null;
          data_previsao_entrega?: string | null;
          desconto?: number;
          id?: string;
          km?: number | null;
          oficina_id: string;
          observacao?: string | null;
          prazo_estimado_dias?: number | null;
          status?: string;
          validade_dias?: number;
          veiculo_id?: string | null;
        };
        Update: {
          aprovado_em?: string | null;
          aprovado_nome?: string | null;
          cliente_id?: string | null;
          data_previsao_entrega?: string | null;
          desconto?: number;
          km?: number | null;
          observacao?: string | null;
          os_id?: string | null;
          pdf_enviado_em?: string | null;
          prazo_estimado_dias?: number | null;
          status?: string;
          validade_dias?: number;
          veiculo_id?: string | null;
        };
        Relationships: [];
      };
      ordens_servico: {
        Row: {
          checklist_lataria: Json;
          cliente_id: string;
          data_abertura: string;
          data_conclusao: string | null;
          data_entrega: string | null;
          data_previsao_entrega: string | null;
          enviada_para_cotar_em: string | null;
          forma_pagamento: string | null;
          id: string;
          km_entrada: number | null;
          mecanico_id: string | null;
          numero_os: number;
          oficina_id: string;
          orcamento_id: string | null;
          pdf_enviado_em: string | null;
          pos_venda_ligado_em: string | null;
          prazo_dias: number;
          problema_relatado: string;
          status: string;
          valor_pago: number | null;
          valor_total: number;
          veiculo_id: string;
        };
        Insert: {
          checklist_lataria?: Json;
          cliente_id: string;
          data_previsao_entrega?: string | null;
          id?: string;
          km_entrada?: number | null;
          mecanico_id?: string | null;
          numero_os?: number;
          oficina_id: string;
          orcamento_id?: string | null;
          prazo_dias?: number;
          problema_relatado?: string;
          status?: string;
          veiculo_id: string;
        };
        Update: {
          checklist_lataria?: Json;
          data_conclusao?: string | null;
          data_previsao_entrega?: string | null;
          enviada_para_cotar_em?: string | null;
          km_entrada?: number | null;
          orcamento_id?: string | null;
          pdf_enviado_em?: string | null;
          pos_venda_ligado_em?: string | null;
          prazo_dias?: number;
          problema_relatado?: string;
          status?: string;
        };
        Relationships: [];
      };
      os_itens: {
        Row: {
          comprado: boolean;
          descricao: string;
          eh_caixa: boolean;
          id: string;
          oficina_id: string;
          origem_peca: string | null;
          os_id: string;
          produto_id: string | null;
          quantidade: number;
          tipo: string;
          valor_total: number;
          valor_unitario: number;
        };
        Insert: {
          comprado?: boolean;
          descricao: string;
          eh_caixa?: boolean;
          oficina_id: string;
          origem_peca?: string | null;
          os_id: string;
          produto_id?: string | null;
          quantidade?: number;
          tipo: string;
          valor_total?: number;
          valor_unitario?: number;
        };
        Update: {
          comprado?: boolean;
          descricao?: string;
          quantidade?: number;
          valor_total?: number;
          valor_unitario?: number;
        };
        Relationships: [];
      };
      perfis: {
        Row: {
          created_at: string;
          id: string;
          nome: string;
          oficina_id: string;
          papel: string;
        };
        Insert: {
          id: string;
          nome: string;
          oficina_id: string;
          papel: string;
        };
        Update: {
          nome?: string;
          papel?: string;
        };
        Relationships: [];
      };
      produto_movimentos: {
        Row: {
          created_at: string;
          custo: number;
          id: string;
          motivo: string | null;
          oficina_id: string;
          os_id: string | null;
          os_item_id: string | null;
          produto_id: string;
          quantidade: number;
          tipo: string;
          usuario_id: string | null;
          venda_id: string | null;
        };
        Insert: {
          custo?: number;
          motivo?: string | null;
          oficina_id: string;
          os_id?: string | null;
          os_item_id?: string | null;
          produto_id: string;
          quantidade: number;
          tipo: string;
          usuario_id?: string | null;
          venda_id?: string | null;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      produtos: {
        Row: {
          avisar_estoque_baixo: boolean;
          categoria: string;
          codigo: string | null;
          custo: number;
          eh_caixa: boolean;
          estoque_minimo: number;
          foto_url: string | null;
          garantia: string | null;
          id: string;
          nome: string;
          oficina_id: string;
          preco_venda: number;
          quantidade_estoque: number;
          quantidade_reservada: number;
          unidade: string;
          unidades_por_caixa: number;
        };
        Insert: {
          avisar_estoque_baixo?: boolean;
          categoria?: string;
          codigo?: string | null;
          custo?: number;
          eh_caixa?: boolean;
          estoque_minimo?: number;
          foto_url?: string | null;
          garantia?: string | null;
          nome: string;
          oficina_id: string;
          preco_venda?: number;
          quantidade_estoque?: number;
          quantidade_reservada?: number;
          unidade?: string;
          unidades_por_caixa?: number;
        };
        Update: {
          avisar_estoque_baixo?: boolean;
          categoria?: string;
          codigo?: string | null;
          custo?: number;
          eh_caixa?: boolean;
          estoque_minimo?: number;
          foto_url?: string | null;
          garantia?: string | null;
          nome?: string;
          preco_venda?: number;
          quantidade_estoque?: number;
          unidade?: string;
          unidades_por_caixa?: number;
        };
        Relationships: [];
      };
      veiculos: {
        Row: {
          ano: number | null;
          ano_modelo: number | null;
          cliente_id: string;
          cor: string | null;
          id: string;
          marca: string | null;
          modelo: string | null;
          oficina_id: string;
          placa: string | null;
          versao: string | null;
        };
        Insert: {
          ano?: number | null;
          ano_modelo?: number | null;
          cliente_id: string;
          cor?: string | null;
          marca?: string | null;
          modelo?: string | null;
          oficina_id: string;
          placa?: string | null;
          versao?: string | null;
        };
        Update: {
          ano?: number | null;
          ano_modelo?: number | null;
          cor?: string | null;
          marca?: string | null;
          modelo?: string | null;
          placa?: string | null;
          versao?: string | null;
        };
        Relationships: [];
      };
      venda_itens: {
        Row: {
          id: string;
          oficina_id: string;
          produto_id: string;
          quantidade: number;
          valor_total: number;
          valor_unitario: number;
          venda_id: string;
        };
        Insert: {
          oficina_id: string;
          produto_id: string;
          quantidade?: number;
          valor_total?: number;
          valor_unitario?: number;
          venda_id: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      vendas_avulsas: {
        Row: {
          atendente_id: string;
          cliente_id: string | null;
          data_venda: string;
          forma_pagamento: string;
          id: string;
          numero_venda: number;
          observacao: string | null;
          oficina_id: string;
          valor_total: number;
        };
        Insert: {
          atendente_id: string;
          cliente_id?: string | null;
          forma_pagamento: string;
          numero_venda?: number;
          observacao?: string | null;
          oficina_id: string;
          valor_total?: number;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      criar_venda_avulsa: {
        Args: { p_forma: string; p_itens: Json; p_observacao?: string };
        Returns: string;
      };
      entrada_produto: {
        Args: { p_custo: number; p_produto_id: string; p_quantidade: number };
        Returns: undefined;
      };
      entregar_os: {
        Args: { p_forma: string; p_os_id: string; p_valor_pago: number };
        Returns: undefined;
      };
      minha_oficina_id: { Args: Record<string, never>; Returns: string };
      recalcular_total_orcamento: { Args: { p_orcamento_id: string }; Returns: undefined };
      recalcular_total_os: { Args: { p_os_id: string }; Returns: undefined };
      remover_item_os: { Args: { p_item_id: string }; Returns: undefined };
      reservar_peca_os: {
        Args: {
          p_descricao: string;
          p_eh_caixa?: boolean;
          p_os_id: string;
          p_produto_id: string;
          p_quantidade: number;
          p_valor_unitario: number;
        };
        Returns: string;
      };
      saida_produto: {
        Args: { p_motivo: string; p_produto_id: string; p_quantidade: number };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
