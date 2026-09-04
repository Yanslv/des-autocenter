import type { StatusOS } from '../types';

export interface PrazoOSInfo {
  dataIniciadoFormatada: string;
  dataInicioCompleta: string;
  prazoDias: number;
  dataPrometidaFormatada: string;
  diasRestantes: number;
  statusPrazo: 'atrasado' | 'vence_hoje' | 'no_prazo' | 'entregue_no_prazo' | 'entregue_com_atraso';
  textoPrazo: string;
  descricaoCurta: string;
}

/**
 * Converte string de data para objeto Date seguro
 */
export function parseDateSafe(dateInput: string | Date | undefined | null): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  const d = new Date(dateInput);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Formata data no padrão brasileiro DD/MM/AAAA
 */
export function formatDateBR(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '—';
  const d = parseDateSafe(dateInput);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formata data e hora no padrão brasileiro DD/MM/AAAA às HH:mm
 */
export function formatDateTimeBR(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '—';
  const d = parseDateSafe(dateInput);
  const dataStr = d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaStr = d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${dataStr} às ${horaStr}`;
}

export function formatarDataAbertura(dateInput: string | Date | undefined | null): string {
  return formatDateTimeBR(dateInput);
}

/**
 * Adiciona N dias corridos a uma data
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Calcula todas as informações de início, prazo acordado e situação (atraso vs dias restantes)
 */
export function calcularPrazoOS(os: {
  data_abertura: string;
  prazo_dias?: number | null;
  data_previsao_entrega?: string | null;
  data_entrega?: string | null;
  status: StatusOS;
}): PrazoOSInfo {
  const dataInicio = parseDateSafe(os.data_abertura);
  const prazoDias = os.prazo_dias != null ? os.prazo_dias : 2;

  // Se tem data_previsao_entrega explícita, usa ela; senão calcula data_abertura + prazoDias
  let dataPrometida: Date;
  if (os.data_previsao_entrega) {
    dataPrometida = parseDateSafe(os.data_previsao_entrega);
  } else {
    dataPrometida = addDays(dataInicio, prazoDias);
  }

  const dataIniciadoFormatada = formatDateBR(dataInicio);
  const dataInicioCompleta = formatDateTimeBR(dataInicio);
  const dataPrometidaFormatada = formatDateBR(dataPrometida);

  // Normaliza datas para início do dia civil para contagem precisa de dias
  const hoje = new Date();
  const hojeZero = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const prometidaZero = new Date(
    dataPrometida.getFullYear(),
    dataPrometida.getMonth(),
    dataPrometida.getDate()
  );

  const diffMs = prometidaZero.getTime() - hojeZero.getTime();
  const diasRestantes = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // Caso 1: Ordem já entregue ao cliente
  if (os.status === 'Entregue') {
    if (os.data_entrega) {
      const entrega = parseDateSafe(os.data_entrega);
      const entregaZero = new Date(entrega.getFullYear(), entrega.getMonth(), entrega.getDate());
      const diffEntrega = prometidaZero.getTime() - entregaZero.getTime();
      const diasAtrasoEntrega = Math.round((entregaZero.getTime() - prometidaZero.getTime()) / (1000 * 60 * 60 * 24));

      if (diasAtrasoEntrega > 0) {
        return {
          dataIniciadoFormatada,
          dataInicioCompleta,
          prazoDias,
          dataPrometidaFormatada,
          diasRestantes: -diasAtrasoEntrega,
          statusPrazo: 'entregue_com_atraso',
          textoPrazo: `Entregue com ${diasAtrasoEntrega}d de atraso`,
          descricaoCurta: `Entregue (+${diasAtrasoEntrega}d)`,
        };
      }
    }

    return {
      dataIniciadoFormatada,
      dataInicioCompleta,
      prazoDias,
      dataPrometidaFormatada,
      diasRestantes: 0,
      statusPrazo: 'entregue_no_prazo',
      textoPrazo: 'Entregue no prazo acordado',
      descricaoCurta: 'Entregue no prazo',
    };
  }

  // Caso 2: Em Atraso (prazo já expirou)
  if (diasRestantes < 0) {
    const diasAtraso = Math.abs(diasRestantes);
    const textoDias = diasAtraso === 1 ? '1 dia' : `${diasAtraso} dias`;
    return {
      dataIniciadoFormatada,
      dataInicioCompleta,
      prazoDias,
      dataPrometidaFormatada,
      diasRestantes,
      statusPrazo: 'atrasado',
      textoPrazo: `Atrasada há ${textoDias}`,
      descricaoCurta: `Atrasada (${textoDias})`,
    };
  }

  // Caso 3: Vence hoje (último dia)
  if (diasRestantes === 0) {
    return {
      dataIniciadoFormatada,
      dataInicioCompleta,
      prazoDias,
      dataPrometidaFormatada,
      diasRestantes: 0,
      statusPrazo: 'vence_hoje',
      textoPrazo: 'Vence hoje (Último dia)',
      descricaoCurta: 'Vence hoje',
    };
  }

  // Caso 4: No prazo (dias restantes)
  const textoFalta = diasRestantes === 1 ? 'Falta 1 dia' : `Faltam ${diasRestantes} dias`;
  return {
    dataIniciadoFormatada,
    dataInicioCompleta,
    prazoDias,
    dataPrometidaFormatada,
    diasRestantes,
    statusPrazo: 'no_prazo',
    textoPrazo: textoFalta,
    descricaoCurta: textoFalta,
  };
}
