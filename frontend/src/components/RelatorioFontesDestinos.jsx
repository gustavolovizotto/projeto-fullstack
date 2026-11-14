import { api } from '../services/api.js'
import { moeda } from '../services/formatos.js'
import { useCarregar } from '../services/useCarregar.js'
import Estado from './Estado.jsx'
import GraficoBarras from './GraficoBarras.jsx'

function TabelaTotais({ itens, rotulo, total }) {
  return (
    <div className="tabela-rolagem">
      <table className="tabela">
        <thead>
          <tr>
            <th>{rotulo}</th>
            <th className="numero">Total</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item) => (
            <tr key={item.id}>
              <td>{item.nome}</td>
              <td className="numero">{moeda(item.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th>Total</th>
            <th className="numero">{moeda(total)}</th>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export default function RelatorioFontesDestinos({ periodo, aoErroPeriodo }) {
  const { dados, carregando, erro, recarregar } = useCarregar(
    () =>
      api('/relatorios/fontes-destinos', { params: periodo }).catch((falha) => {
        aoErroPeriodo?.(falha.campos)
        throw falha
      }),
    [periodo.inicio, periodo.fim],
  )
  const erroGeral = Object.keys(erro?.campos ?? {}).length > 0 ? null : erro

  return (
    <Estado carregando={carregando && !dados} erro={erroGeral} aoTentarDeNovo={recarregar}>
      {dados && (
        <>
          <div className="grade-2">
            <div className="cartao">
              <h2>Entradas por fonte</h2>
              {dados.fontes.length === 0 ? (
                <p className="texto-suave">Nenhuma entrada neste período.</p>
              ) : (
                <>
                  <GraficoBarras itens={dados.fontes} nomeSerie="Entradas" />
                  <TabelaTotais itens={dados.fontes} rotulo="Fonte" total={dados.totalEntradas} />
                </>
              )}
            </div>
            <div className="cartao">
              <h2>Saídas por destino</h2>
              {dados.destinos.length === 0 ? (
                <p className="texto-suave">Nenhuma saída neste período.</p>
              ) : (
                <>
                  <GraficoBarras itens={dados.destinos} nomeSerie="Saídas" />
                  <TabelaTotais itens={dados.destinos} rotulo="Destino" total={dados.totalSaidas} />
                </>
              )}
            </div>
          </div>

          <div className="cartao">
            <h2>Saldo das contas no período</h2>
            {dados.contas.length === 0 ? (
              <p className="texto-suave">Nenhuma conta cadastrada.</p>
            ) : (
              <div className="tabela-rolagem">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th>Conta</th>
                      <th className="numero">Entradas</th>
                      <th className="numero">Saídas</th>
                      <th className="numero">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.contas.map((conta) => (
                      <tr key={conta.id}>
                        <td>{conta.nome}</td>
                        <td className="numero">{moeda(conta.entradas)}</td>
                        <td className="numero">{moeda(conta.saidas)}</td>
                        <td className={`numero ${conta.saldo < 0 ? 'valor-saida' : ''}`}>{moeda(conta.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </Estado>
  )
}
