// Rótulo + controle + mensagem de erro do campo (vinda do cliente ou do servidor).
// Sem children, renderiza um <input> com as props recebidas. Com children
// (ex.: um <select>), renderiza o controle passado, que deve usar o mesmo id.
export default function Campo({ id, rotulo, erro, children, ...props }) {
  const idErro = erro ? `${id}-erro` : undefined
  return (
    <div className="campo">
      <label htmlFor={id}>{rotulo}</label>
      {children ?? (
        <input id={id} aria-invalid={erro ? true : undefined} aria-describedby={idErro} {...props} />
      )}
      {erro && (
        <span id={idErro} className="erro-campo">
          {erro}
        </span>
      )}
    </div>
  )
}
