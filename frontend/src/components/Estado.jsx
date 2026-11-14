// Mostra o estado de uma consulta à API: carregando, erro (com "tentar de
// novo") ou lista vazia. Se nada disso, mostra o conteúdo (children).
export default function Estado({ carregando, erro, vazio, textoVazio, aoTentarDeNovo, children }) {
  if (erro) {
    return (
      <div className="estado estado-erro" role="alert">
        <p>{erro.message}</p>
        {aoTentarDeNovo && (
          <button className="botao-secundario" type="button" onClick={aoTentarDeNovo}>
            Tentar de novo
          </button>
        )}
      </div>
    )
  }
  if (carregando) return <p className="estado texto-suave">Carregando…</p>
  if (vazio) return <p className="estado texto-suave">{textoVazio ?? 'Nada por aqui ainda.'}</p>
  return children
}
