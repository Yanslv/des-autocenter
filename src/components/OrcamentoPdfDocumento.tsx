import React from 'react';
import type { OrcamentoPdfModelo } from '../utils/orcamentoPdf';
import { OBSERVACAO_PADRAO, TEXTO_APROVACAO } from '../utils/orcamento';

export const orcamentoPdfCss = `
.orcamento-pdf { box-sizing: border-box; width: 794px; padding: 0 0 16px; font-family: system-ui, -apple-system, Helvetica, Arial, sans-serif; color: #1a1a1a; font-size: 11px; line-height: 1.4; background: #fff; }
.orcamento-pdf *, .orcamento-pdf *::before, .orcamento-pdf *::after { box-sizing: border-box; }
.orcamento-pdf .cabecalho { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 0 0 12px; margin-bottom: 14px; background: #fff; color: #1a1a1a; border-bottom: 1px solid #e8e8e8; }
.orcamento-pdf .empresa { display: flex; align-items: center; gap: 12px; }
.orcamento-pdf .logo { width: 72px; height: 72px; object-fit: contain; flex-shrink: 0; background: #fff; padding: 2px; }
.orcamento-pdf .empresa-info .nome { font-size: 15px; font-weight: 700; letter-spacing: 0.2px; color: #1a1a1a; }
.orcamento-pdf .empresa-info .segmento { font-size: 8.5px; color: #888; text-transform: uppercase; letter-spacing: 0.6px; margin: 2px 0 5px; font-weight: 600; }
.orcamento-pdf .empresa-info .contato { font-size: 9px; color: #777; }
.orcamento-pdf .doc-info { text-align: right; flex-shrink: 0; }
.orcamento-pdf .doc-info .titulo { font-size: 11.5px; font-weight: 700; color: #1a1a1a; letter-spacing: 1px; margin-bottom: 6px; text-transform: uppercase; }
.orcamento-pdf .doc-info .linha { font-size: 9px; color: #777; }
.orcamento-pdf .doc-info .linha strong { color: #1a1a1a; font-weight: 600; }
.orcamento-pdf .secao,
.orcamento-pdf .resumo-bloco,
.orcamento-pdf .bloco,
.orcamento-pdf tr,
.orcamento-pdf .tabela-total,
.orcamento-pdf .cabecalho { break-inside: avoid; page-break-inside: avoid; }
.orcamento-pdf .secao { margin-bottom: 18px; }
.orcamento-pdf .secao-titulo { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #888; margin-bottom: 6px; }
.orcamento-pdf .bloco { border: 1px solid #eee; padding: 9px 11px; }
.orcamento-pdf .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.orcamento-pdf .campo { display: flex; justify-content: space-between; gap: 10px; padding: 3px 0; border-bottom: 1px solid #f2f2f2; }
.orcamento-pdf .campo:last-child { border-bottom: none; }
.orcamento-pdf .campo .rotulo { font-size: 9px; color: #999; flex-shrink: 0; }
.orcamento-pdf .campo .valor { font-size: 10.5px; color: #1a1a1a; font-weight: 600; text-align: right; }
.orcamento-pdf .veiculo-titulo { font-size: 12.5px; font-weight: 700; margin-bottom: 8px; padding-bottom: 7px; border-bottom: 1px solid #f2f2f2; color: #1a1a1a; }
.orcamento-pdf table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
.orcamento-pdf thead th { text-align: left; color: #888; background: transparent; font-weight: 700; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.4px; padding: 0 9px 6px; border-bottom: 1px solid #e8e8e8; }
.orcamento-pdf tbody td { padding: 7px 9px; border-bottom: 1px solid #f2f2f2; vertical-align: top; }
.orcamento-pdf .col-qtd { text-align: center; width: 8%; }
.orcamento-pdf .col-valor { text-align: right; width: 16%; white-space: nowrap; font-weight: 600; }
.orcamento-pdf .col-item { width: 6%; color: #bbb; }
.orcamento-pdf .desc-secundaria { display: block; color: #999; font-size: 9px; margin-top: 1px; }
.orcamento-pdf .tabela-total { display: flex; justify-content: space-between; align-items: center; padding: 7px 9px; font-size: 10.5px; font-weight: 700; background: #fafafa; border-top: 1px solid #eee; }
.orcamento-pdf .tabela-total .rotulo-total { color: #888; font-weight: 600; text-transform: uppercase; font-size: 8.5px; letter-spacing: 0.4px; }
.orcamento-pdf .resumo-bloco { background: #fafafa; color: #1a1a1a; padding: 13px 16px; margin: 12px 0; }
.orcamento-pdf .resumo-linha { display: flex; justify-content: space-between; gap: 24px; font-size: 10px; padding: 2px 0; color: #777; }
.orcamento-pdf .resumo-linha span:last-child { font-size: 10.5px; color: #444; font-weight: 500; text-align: right; }
.orcamento-pdf .resumo-linha.subtotal { color: #1a1a1a; font-weight: 700; border-top: 1px solid #eee; padding-top: 6px; margin-top: 2px; }
.orcamento-pdf .resumo-linha.subtotal span { color: #1a1a1a; font-weight: 700; }
.orcamento-pdf .resumo-total { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e8e8e8; }
.orcamento-pdf .resumo-total .rotulo { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #1a1a1a; }
.orcamento-pdf .resumo-total .valor { font-size: 27px; font-weight: 800; color: #1a1a1a; letter-spacing: 0.2px; }
.orcamento-pdf .condicoes-grid { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid #eee; border-left: none; }
.orcamento-pdf .condicao-item { padding: 7px 11px; border-left: 1px solid #eee; }
.orcamento-pdf .condicao-item .rotulo { font-size: 8.5px; color: #999; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 2px; }
.orcamento-pdf .condicao-item .valor { font-size: 11px; font-weight: 700; color: #1a1a1a; }
.orcamento-pdf .observacoes { font-size: 9.5px; color: #777; padding: 8px 12px; background: #fafafa; }
.orcamento-pdf .aprovacao-bloco { border: 1px solid #eee; padding: 11px 14px; }
.orcamento-pdf .aprovacao-texto { font-size: 10px; color: #666; margin-bottom: 12px; }
.orcamento-pdf .assinatura-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 22px; margin-top: 22px; }
.orcamento-pdf .linha-assinatura { border-top: 1px solid #ddd; padding-top: 4px; font-size: 8.5px; color: #999; text-align: center; text-transform: uppercase; letter-spacing: 0.4px; }
.orcamento-pdf .campo-nome-cliente { font-size: 9.5px; color: #777; }
.orcamento-pdf .linha-preenchimento { display: inline-block; border-bottom: 1px solid #ddd; width: 65%; margin-left: 6px; color: #1a1a1a; font-weight: 600; }
.orcamento-pdf .rodape { margin-top: 12px; padding-top: 8px; border-top: 1px solid #f0f0f0; text-align: center; font-size: 8.5px; color: #bbb; }
`;

const Campo: React.FC<{ rotulo: string; valor?: string }> = ({ rotulo, valor }) => {
  if (!valor) return null;
  return (
    <div className="campo">
      <div className="rotulo">{rotulo}</div>
      <div className="valor">{valor}</div>
    </div>
  );
};

export const OrcamentoPdfDocumento: React.FC<{
  modelo: OrcamentoPdfModelo;
  logoSrc: string;
}> = ({ modelo, logoSrc }) => (
  <div className="orcamento-pdf">
    <style>{orcamentoPdfCss}</style>
    <div className="cabecalho">
      <div className="empresa">
        <img className="logo" src={logoSrc} alt="" />
        <div className="empresa-info">
          <div className="nome">{modelo.oficinaNome}</div>
          {modelo.oficinaSegmento ? <div className="segmento">{modelo.oficinaSegmento}</div> : null}
          <div className="contato">
            {[modelo.oficinaWhatsapp, modelo.oficinaEmail].filter(Boolean).join(' · ')}
            {modelo.oficinaEndereco || modelo.oficinaCnpj ? <br /> : null}
            {[modelo.oficinaEndereco, modelo.oficinaCnpj && `CNPJ ${modelo.oficinaCnpj}`].filter(Boolean).join(' · ')}
          </div>
        </div>
      </div>
      <div className="doc-info">
        <div className="titulo">Orçamento</div>
        <div className="linha">
          Nº <strong>{modelo.numero}</strong>
        </div>
        <div className="linha">
          Data: <strong>{modelo.data}</strong>
        </div>
        <div className="linha">
          Validade: <strong>{modelo.validadeTexto}</strong>
        </div>
      </div>
    </div>

    <div className="secao">
      <div className="grid-2">
        <div>
          <div className="secao-titulo">Cliente</div>
          <div className="bloco">
            {modelo.ehPj ? (
              <>
                <Campo rotulo="Razão social" valor={modelo.clienteNome} />
                <Campo rotulo="Nome fantasia" valor={modelo.clienteNomeFantasia} />
                <Campo rotulo="CNPJ" valor={modelo.clienteDocumento} />
                <Campo rotulo="Responsável" valor={modelo.clienteResponsavel} />
                <Campo rotulo="CPF do responsável" valor={modelo.clienteCpfResponsavel} />
              </>
            ) : (
              <>
                <Campo rotulo="Nome" valor={modelo.clienteNome} />
                <Campo rotulo="CPF" valor={modelo.clienteDocumento} />
              </>
            )}
            <Campo rotulo="Telefone" valor={modelo.clienteTelefone} />
            <Campo rotulo="E-mail" valor={modelo.clienteEmail} />
            <Campo rotulo="Endereço" valor={modelo.clienteEndereco} />
          </div>
        </div>
        <div>
          <div className="secao-titulo">Veículo</div>
          <div className="bloco">
            <div className="veiculo-titulo">{modelo.veiculoTitulo}</div>
            <Campo rotulo="Placa" valor={modelo.veiculoPlaca} />
            <Campo rotulo="KM" valor={modelo.veiculoKm} />
            <Campo rotulo="Cor" valor={modelo.veiculoCor} />
            <Campo rotulo="Ano" valor={modelo.veiculoAno} />
            <Campo rotulo="Ano/modelo" valor={modelo.veiculoAnoModelo} />
          </div>
        </div>
      </div>
    </div>

    {modelo.servicos.length > 0 ? (
      <div className="secao">
        <div className="secao-titulo">O que será feito no veículo</div>
        <table>
          <thead>
            <tr>
              <th>Serviço</th>
              <th className="col-qtd">Qtd</th>
              <th className="col-valor">Valor</th>
            </tr>
          </thead>
          <tbody>
            {modelo.servicos.map((s) => (
              <tr key={`${s.nome}-${s.valor}`}>
                <td>
                  <span>{s.nome}</span>
                  {s.descricao ? <span className="desc-secundaria">{s.descricao}</span> : null}
                </td>
                <td className="col-qtd">{s.qtd}</td>
                <td className="col-valor">{s.valor}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="tabela-total">
          <span className="rotulo-total">Total dos serviços</span>
          <span>{modelo.totalServicos}</span>
        </div>
      </div>
    ) : null}

    {modelo.pecas.length > 0 ? (
      <div className="secao">
        <div className="secao-titulo">Peças e materiais</div>
        <table>
          <thead>
            <tr>
              <th className="col-item">Item</th>
              <th>Descrição</th>
              <th className="col-qtd">Qtd</th>
              <th className="col-valor">Unitário</th>
              <th className="col-valor">Total</th>
            </tr>
          </thead>
          <tbody>
            {modelo.pecas.map((p) => (
              <tr key={p.item}>
                <td className="col-item">{p.item}</td>
                <td>{p.descricao}</td>
                <td className="col-qtd">{p.qtd}</td>
                <td className="col-valor">{p.unitario}</td>
                <td className="col-valor">{p.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="tabela-total">
          <span className="rotulo-total">Total de peças e materiais</span>
          <span>{modelo.totalPecas}</span>
        </div>
      </div>
    ) : null}

    <div className="resumo-bloco">
      <div className="resumo-linha">
        <span>Serviços</span>
        <span>{modelo.resumoServicos}</span>
      </div>
      <div className="resumo-linha">
        <span>Peças e materiais</span>
        <span>{modelo.resumoPecas}</span>
      </div>
      <div className="resumo-linha">
        <span>Serviços de terceiros</span>
        <span>{modelo.resumoTerceiros}</span>
      </div>
      <div className="resumo-linha subtotal">
        <span>Subtotal</span>
        <span>{modelo.resumoSubtotal}</span>
      </div>
      {modelo.temDesconto ? (
        <div className="resumo-linha">
          <span>Desconto</span>
          <span>{modelo.resumoDesconto}</span>
        </div>
      ) : null}
      <div className="resumo-total">
        <span className="rotulo">Total do orçamento</span>
        <span className="valor">{modelo.total}</span>
      </div>
    </div>

    <div className="secao">
      <div className="secao-titulo">Prazo e condições</div>
      <div className="condicoes-grid">
        <div className="condicao-item">
          <div className="rotulo">Prazo estimado</div>
          <div className="valor">{modelo.prazoEstimado || '—'}</div>
        </div>
        <div className="condicao-item">
          <div className="rotulo">Previsão de entrega</div>
          <div className="valor">{modelo.previsaoEntrega || '—'}</div>
        </div>
        <div className="condicao-item">
          <div className="rotulo">Validade do orçamento</div>
          <div className="valor">{modelo.validadeTexto}</div>
        </div>
      </div>
    </div>

    <div className="secao">
      <div className="secao-titulo">Observações</div>
      <div className="observacoes">{modelo.observacao || OBSERVACAO_PADRAO}</div>
    </div>

    <div className="secao">
      <div className="secao-titulo">Aprovação do orçamento</div>
      <div className="aprovacao-bloco">
        <div className="aprovacao-texto">{TEXTO_APROVACAO}</div>
        <div className="campo-nome-cliente">
          Nome do cliente:<span className="linha-preenchimento">{modelo.aprovacaoNome || '\u00a0'}</span>
        </div>
        <div className="assinatura-grid">
          <div className="linha-assinatura">Assinatura do cliente</div>
          <div className="linha-assinatura">Data: ____/____/________</div>
        </div>
      </div>
    </div>

    <div className="rodape">
      {[modelo.oficinaNome, modelo.oficinaWhatsapp, modelo.oficinaEmail].filter(Boolean).join(' · ')}
    </div>
  </div>
);
