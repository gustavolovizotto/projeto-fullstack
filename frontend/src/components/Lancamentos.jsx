import { useState } from 'react'
import { api } from '../services/api.js'
import { dataBR, mesAtual, moeda } from '../services/formatos.js'
import { useCarregar } from '../services/useCarregar.js'
import Campo from './Campo.jsx'
import Estado from './Estado.jsx'
import Totais from './Totais.jsx'

const POR_PAGINA = 15

export default function Lancamentos() {
  const [filtros, setFiltros] = useState(() => ({
    ...mesAtual(),
    tipo: '',
    categoriaId: '',
    fonteDestinoId: '',
  }))
  const [pagina, setPagina] = useState(1)

  const lista = useCarregar(
    () => api('/lancamentos', { params: { ...filtros, pagina, porPagina: POR_PAGINA } }),
    [filtros, pagina],
  )
  const categorias = useCarregar(() => api('/categorias'), [])
  const fontes = useCarregar(() => api('/fontes-destinos'), [])

  // Mudar qualquer filtro volta para a primeira página.
  function filtrar(campo, valor) {
    setFiltros((atual) => ({ ...atual, [campo]: valor }))
    setPagina(1)
  }

  // Erro de filtro (ex.: data final antes da inicial) vem do servidor em campos.
  const errosFiltro = lista.erro?.campos ?? {}
  const dados = lista.dados

  return (
    <section>
      <h1>Lançamentos</h1>

      <div className="cartao filtros">
        <Campo
          id="inicio"
          rotulo="De"
          type="date"
          value={filtros.inicio}
          onChange={(e) => filtrar('inicio', e.target.value)}
          erro={errosFiltro.inicio}
        />
        <Campo
          id="fim"
          rotulo="Até"
          type="date"
          value={filtros.fim}
          onChange={(e) => filtrar('fim', e.target.value)}
          erro={errosFiltro.fim}
        />
        <Campo id="tipo" rotulo="Tipo">
          <select id="tipo" value={filtros.tipo} onChange={(e) => filtrar('tipo', e.target.value)}>
            <option value="">Todos</option>
            <option value="entrada">Entradas</option>
            <option value="saida">Saídas</option>
          </select>
        </Campo>
        <Campo id="categoriaId" rotulo="Categoria">
          <select
            id="categoriaId"
            value={filtros.categoriaId}
            onChange={(e) => filtrar('categoriaId', e.target.value)}
          >
            <option value="">Todas</option>
            {categorias.dados?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} ({c.tipo === 'entrada' ? 'entrada' : 'saída'})
              </option>
            ))}
          </select>
        </Campo>
        <Campo id="fonteDestinoId" rotulo="Fonte/destino">
          <select
            id="fonteDestinoId"
            value={filtros.fonteDestinoId}
            onChange={(e) => filtrar('fonteDestinoId', e.target.value)}
          >
            <option value="">Todas</option>
            {fontes.dados?.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      {dados && <Totais totais={dados.totais} />}

      <Estado
        carregando={lista.carregando && !dados}
        erro={Object.keys(errosFiltro).length > 0 ? null : lista.erro}
        aoTentarDeNovo={lista.recarregar}
        vazio={dados?.itens.length === 0}
        textoVazio="Nenhum lançamento neste período."
      >
        {dados && (
          <div className="cartao">
            <div className="tabela-rolagem">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Fonte/destino</th>
                    <th className="numero">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.itens.map((l) => (
                    <tr key={l.id}>
                      <td>{dataBR(l.data)}</td>
                      <td>
                        {l.descricao}
                        {l.totalParcelas > 1 && (
                          <span className="etiqueta">
                            {l.parcelaAtual}/{l.totalParcelas}
                          </span>
                        )}
                      </td>
                      <td>{l.categoriaNome}</td>
                      <td>{l.fonteDestinoNome}</td>
                      <td className={`numero ${l.tipo === 'entrada' ? 'valor-entrada' : 'valor-saida'}`}>
                        {l.tipo === 'entrada' ? '+ ' : '− '}
                        {moeda(l.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="paginacao">
              <button
                className="botao-secundario"
                type="button"
                disabled={pagina <= 1}
                onClick={() => setPagina((p) => p - 1)}
              >
                Anterior
              </button>
              <span className="texto-suave">
                Página {dados.pagina} de {dados.totalPaginas} · {dados.totalItens} lançamentos
              </span>
              <button
                className="botao-secundario"
                type="button"
                disabled={pagina >= dados.totalPaginas}
                onClick={() => setPagina((p) => p + 1)}
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </Estado>
    </section>
  )
}
