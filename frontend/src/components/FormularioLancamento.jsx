import { useState } from 'react'
import { api } from '../services/api.js'
import { hojeISO, lerMoeda, mascaraMoeda, moeda, moedaParaCampo } from '../services/formatos.js'
import Campo from './Campo.jsx'

// escopo:
// - 'novo': cria (pode parcelar, se for saída no cartão);
// - 'simples': edita um lançamento sem parcelas;
// - 'so-esta': edita uma parcela só (data, cartão e tipo travados);
// - 'todas': edita todas as parcelas (o valor é o total da compra).
export default function FormularioLancamento({ lancamento, escopo, categorias, fontes, aoSalvar, aoCancelar }) {
  const [form, setForm] = useState(() =>
    lancamento
      ? {
          tipo: lancamento.tipo,
          descricao: lancamento.descricao,
          valor: moedaParaCampo(escopo === 'todas' ? lancamento.grupo.valorTotal : lancamento.valor),
          data: lancamento.data,
          categoriaId: String(lancamento.categoriaId),
          fonteDestinoId: String(lancamento.fonteDestinoId),
          totalParcelas: String(lancamento.totalParcelas),
        }
      : { tipo: 'saida', descricao: '', valor: '', data: hojeISO(), categoriaId: '', fonteDestinoId: '', totalParcelas: '1' },
  )
  const [erros, setErros] = useState({})
  const [mensagem, setMensagem] = useState('')
  const [salvando, setSalvando] = useState(false)

  const travado = escopo === 'so-esta' // data, cartão e tipo de uma parcela só
  const fonte = fontes.find((f) => String(f.id) === form.fonteDestinoId)
  const podeParcelar = escopo === 'novo' && form.tipo === 'saida' && fonte?.tipo === 'cartao_credito'
  const parcelas = podeParcelar ? Number(form.totalParcelas) : 1
  const valorTotal = escopo === 'todas' || (escopo === 'novo' && parcelas > 1)

  function alterar(campo, valor) {
    setForm((atual) => {
      const novo = { ...atual, [campo]: valor }
      // Trocou o tipo: a categoria escolhida pode não servir mais.
      if (campo === 'tipo') novo.categoriaId = ''
      return novo
    })
    setErros((atual) => ({ ...atual, [campo]: undefined }))
  }

  function validar() {
    const novosErros = {}
    const valor = lerMoeda(form.valor)
    if (!form.descricao.trim()) novosErros.descricao = 'Informe a descrição.'
    if (!(valor > 0)) novosErros.valor = 'Informe o valor.'
    if (!form.data) novosErros.data = 'Informe a data.'
    if (!form.categoriaId) novosErros.categoriaId = 'Escolha a categoria.'
    if (!form.fonteDestinoId) novosErros.fonteDestinoId = 'Escolha a fonte/destino.'
    if (podeParcelar && !(Number.isInteger(parcelas) && parcelas >= 1 && parcelas <= 48)) {
      novosErros.totalParcelas = 'De 1 a 48 parcelas.'
    }
    return novosErros
  }

  async function salvar(evento) {
    evento.preventDefault()
    const novosErros = validar()
    setErros(novosErros)
    setMensagem('')
    if (Object.keys(novosErros).length > 0) return

    const corpo = {
      tipo: form.tipo,
      descricao: form.descricao.trim(),
      valor: lerMoeda(form.valor),
      data: form.data,
      categoriaId: Number(form.categoriaId),
      fonteDestinoId: Number(form.fonteDestinoId),
      totalParcelas: parcelas,
    }

    setSalvando(true)
    try {
      if (escopo === 'novo') {
        await api('/lancamentos', { metodo: 'POST', corpo })
      } else {
        await api(`/lancamentos/${lancamento.id}`, {
          metodo: 'PUT',
          corpo,
          params: escopo === 'todas' ? { todasParcelas: true } : undefined,
        })
      }
      aoSalvar()
    } catch (falha) {
      setErros(falha.campos)
      setMensagem(falha.message)
      setSalvando(false)
    }
  }

  const categoriasDoTipo = categorias.filter((c) => c.tipo === form.tipo)
  // Editando todas as parcelas, a compra só pode ir para outro cartão.
  const fontesPermitidas = escopo === 'todas' ? fontes.filter((f) => f.tipo === 'cartao_credito') : fontes

  return (
    <form className="formulario" onSubmit={salvar} noValidate>
      {escopo === 'so-esta' && (
        <p className="alerta alerta-info">
          Editando só a parcela {lancamento.parcelaAtual}/{lancamento.totalParcelas}. Para mudar data, cartão
          ou tipo, edite todas as parcelas.
        </p>
      )}
      {escopo === 'todas' && (
        <p className="alerta alerta-info">
          Editando as {lancamento.totalParcelas} parcelas. O valor é o total da compra e será dividido entre
          elas.
        </p>
      )}
      {mensagem && (
        <p className="alerta" role="alert">
          {mensagem}
        </p>
      )}

      <div className="grade-campos">
        <Campo id="form-tipo" rotulo="Tipo" erro={erros.tipo}>
          <select
            id="form-tipo"
            value={form.tipo}
            disabled={travado || escopo === 'todas'}
            onChange={(e) => alterar('tipo', e.target.value)}
          >
            <option value="saida">Saída</option>
            <option value="entrada">Entrada</option>
          </select>
        </Campo>
        <Campo
          id="form-data"
          rotulo={Number(form.totalParcelas) > 1 || podeParcelar ? 'Data da compra' : 'Data'}
          type="date"
          value={form.data}
          disabled={travado}
          onChange={(e) => alterar('data', e.target.value)}
          erro={erros.data}
        />
      </div>

      <Campo
        id="form-descricao"
        rotulo="Descrição"
        maxLength={120}
        value={form.descricao}
        onChange={(e) => alterar('descricao', e.target.value)}
        erro={erros.descricao}
      />

      <div className="grade-campos">
        <Campo id="form-categoria" rotulo="Categoria" erro={erros.categoriaId}>
          <select
            id="form-categoria"
            value={form.categoriaId}
            aria-invalid={erros.categoriaId ? true : undefined}
            onChange={(e) => alterar('categoriaId', e.target.value)}
          >
            <option value="">Selecione</option>
            {categoriasDoTipo.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo id="form-fonte" rotulo={form.tipo === 'entrada' ? 'Fonte' : 'Destino'} erro={erros.fonteDestinoId}>
          <select
            id="form-fonte"
            value={form.fonteDestinoId}
            disabled={travado}
            aria-invalid={erros.fonteDestinoId ? true : undefined}
            onChange={(e) => alterar('fonteDestinoId', e.target.value)}
          >
            <option value="">Selecione</option>
            {fontesPermitidas.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <div className="grade-campos">
        <Campo
          id="form-valor"
          rotulo={valorTotal ? 'Valor total da compra (R$)' : 'Valor (R$)'}
          inputMode="numeric"
          placeholder="0,00"
          value={form.valor}
          onChange={(e) => alterar('valor', mascaraMoeda(e.target.value))}
          erro={erros.valor}
        />
        {podeParcelar && (
          <Campo
            id="form-parcelas"
            rotulo="Parcelas"
            type="number"
            min="1"
            max="48"
            value={form.totalParcelas}
            onChange={(e) => alterar('totalParcelas', e.target.value)}
            erro={erros.totalParcelas}
          />
        )}
      </div>
      {podeParcelar && parcelas > 1 && lerMoeda(form.valor) > 0 && (
        <p className="texto-suave">
          {parcelas}× de aproximadamente {moeda(lerMoeda(form.valor) / parcelas)}
        </p>
      )}

      <div className="acoes">
        <button className="botao" type="submit" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
        <button className="botao-secundario" type="button" onClick={aoCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
