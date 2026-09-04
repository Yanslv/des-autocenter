import assert from 'node:assert/strict';
import {
  agruparLancamentosPorDia,
  custoMateriais,
  deslocarMes,
  detalharLancamentos,
  dreDoCaixa,
  horaDoLancamento,
  lancamentosDoPeriodo,
  nomeDiaSemana,
  rotuloDiaGrupo,
  somarCaixa,
  somarPorForma,
  variacaoPct,
} from './financeiro';

const predMes = (iso: string) => iso.slice(0, 7) === '2026-09';

const ordens = [
  {
    id: 'os1',
    status: 'Entregue',
    data_entrega: '2026-09-02T10:00:00Z',
    valor_pago: 400,
    valor_total: 450,
    numero_os: 12,
    cliente_id: 'c1',
    forma_pagamento: 'PIX',
  },
  {
    id: 'os2',
    status: 'Fazendo',
    data_entrega: null,
    valor_pago: null,
    valor_total: 900,
    numero_os: 13,
    cliente_id: 'c2',
    forma_pagamento: null,
  },
];

const vendas = [
  {
    id: 'v1',
    data_venda: '2026-09-03T12:00:00Z',
    valor_total: 80,
    numero_venda: 7,
    cliente_id: null,
    forma_pagamento: 'Dinheiro',
  },
  {
    id: 'v2',
    data_venda: '2026-08-20T12:00:00Z',
    valor_total: 50,
    numero_venda: 6,
    cliente_id: null,
    forma_pagamento: 'PIX',
  },
];

const caixa = somarCaixa(vendas, ordens, predMes);
assert.equal(caixa.total, 480);
assert.equal(caixa.qtd, 2);
assert.equal(caixa.totalOs, 400);
assert.equal(caixa.totalBalcao, 80);
assert.deepEqual(caixa.osIds, ['os1']);
assert.deepEqual(caixa.vendaIds, ['v1']);

const materiais = custoMateriais(
  caixa.osIds,
  caixa.vendaIds,
  [{ os_id: 'os1', tipo: 'produto', produto_id: 'p1', quantidade: 2 }],
  [{ venda_id: 'v1', produto_id: 'p2', quantidade: 1 }],
  [
    { id: 'p1', custo: 50 },
    { id: 'p2', custo: 20 },
  ]
);
assert.equal(materiais, 120);

const dre = dreDoCaixa(caixa.total, materiais);
assert.equal(dre.lucroBruto, 360);
assert.equal(dre.margem, 75);

assert.equal(deslocarMes('2026-09', -1), '2026-08');
assert.equal(deslocarMes('2026-01', -1), '2025-12');
assert.equal(variacaoPct(480, 400), 20);
assert.equal(variacaoPct(100, 0), null);

const lancamentos = lancamentosDoPeriodo(vendas, ordens, predMes);
assert.equal(lancamentos.length, 2);
assert.equal(lancamentos[0].tipo, 'balcao');
assert.deepEqual(somarPorForma(lancamentos), [
  { forma: 'PIX', valor: 400 },
  { forma: 'Dinheiro', valor: 80 },
]);

assert.equal(nomeDiaSemana('2026-09-06'), 'domingo');
assert.equal(nomeDiaSemana('2026-09-07'), 'segunda');
assert.equal(nomeDiaSemana('2026-09-01'), 'terça');
assert.equal(nomeDiaSemana('2026-09-02'), 'quarta');
assert.equal(nomeDiaSemana('2026-09-03'), 'quinta');
assert.equal(nomeDiaSemana('2026-09-04'), 'sexta');
assert.equal(nomeDiaSemana('2026-09-05'), 'sábado');
assert.equal(rotuloDiaGrupo('2026-09-07'), 'Seg 07/09');
assert.equal(horaDoLancamento('2026-09-04T20:16:00Z'), '17:16');

const vendasMesmoDia = [
  ...vendas,
  {
    id: 'v3',
    data_venda: '2026-09-03T15:00:00Z',
    valor_total: 20,
    numero_venda: 8,
    cliente_id: null,
    forma_pagamento: 'PIX',
  },
];
const grupos = agruparLancamentosPorDia(lancamentosDoPeriodo(vendasMesmoDia, ordens, predMes));
assert.equal(grupos.length, 2);
assert.equal(grupos[0].dia, '2026-09-03');
assert.equal(grupos[0].rotulo, 'Qui 03/09');
assert.equal(grupos[0].total, 100);
assert.equal(grupos[0].qtd, 2);
assert.equal(grupos[0].ticket, 50);
assert.equal(grupos[0].itens.length, 2);
assert.equal(grupos[1].dia, '2026-09-02');
assert.equal(grupos[1].rotulo, 'Qua 02/09');
assert.equal(grupos[1].total, 400);
assert.equal(grupos[1].itens.length, 1);

const noiteSp = agruparLancamentosPorDia(
  lancamentosDoPeriodo(
    [
      {
        id: 'v4',
        data_venda: '2026-09-05T02:30:00Z',
        valor_total: 10,
        numero_venda: 9,
        cliente_id: null,
        forma_pagamento: 'PIX',
      },
    ],
    [],
    () => true
  )
);
assert.equal(noiteSp[0].dia, '2026-09-04');
assert.equal(horaDoLancamento('2026-09-05T02:30:00Z'), '23:30');

const detalhados = detalharLancamentos(
  lancamentosDoPeriodo(vendas, ordens, predMes),
  [
    {
      os_id: 'os1',
      descricao: 'Troca de óleo',
      quantidade: 1,
      valor_unitario: 400,
      valor_total: 400,
    },
  ],
  [
    {
      venda_id: 'v1',
      produto_id: 'p2',
      quantidade: 2,
      valor_unitario: 40,
      valor_total: 80,
    },
  ],
  [{ id: 'p2', nome: 'Filtro de ar' }]
);
const balcao = detalhados.find((l) => l.tipo === 'balcao');
assert.ok(balcao);
assert.deepEqual(balcao.linhas, [
  { descricao: 'Filtro de ar', quantidade: 2, valorUnitario: 40, valorTotal: 80 },
]);
const os = detalhados.find((l) => l.tipo === 'os');
assert.ok(os);
assert.deepEqual(os.linhas, [
  { descricao: 'Troca de óleo', quantidade: 1, valorUnitario: 400, valorTotal: 400 },
]);
assert.equal(os.desconto, 50);

console.log('financeiro.test.ts ok');
