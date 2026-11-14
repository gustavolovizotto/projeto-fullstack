import { moeda } from '../services/formatos.js'

// Cartões de total de entradas, saídas e saldo de um período.
export default function Totais({ totais }) {
  const saldoNegativo = totais.saldo < 0
  return (
    <div className="totais">
      <div className="cartao total">
        <span className="texto-suave">Entradas</span>
        <strong className="valor-entrada">{moeda(totais.entradas)}</strong>
      </div>
      <div className="cartao total">
        <span className="texto-suave">Saídas</span>
        <strong className="valor-saida">{moeda(totais.saidas)}</strong>
      </div>
      <div className="cartao total">
        <span className="texto-suave">Saldo</span>
        <strong className={saldoNegativo ? 'valor-saida' : 'valor-entrada'}>{moeda(totais.saldo)}</strong>
      </div>
    </div>
  )
}
