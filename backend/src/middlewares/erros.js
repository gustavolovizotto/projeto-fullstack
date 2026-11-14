// Erro com status HTTP conhecido. As rotas lançam e o tratarErros responde.
// campos: { nomeDoCampo: 'mensagem' }, para o front mostrar junto ao campo.
export class ErroHttp extends Error {
  constructor(status, erro, campos) {
    super(erro);
    this.status = status;
    this.campos = campos;
  }
}

// O banco recusou por causa de um UNIQUE (código 23505 do PostgreSQL)?
export function violouUnico(erro, constraint) {
  return erro.code === '23505' && erro.constraint === constraint;
}

export function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: 'Rota não encontrada.' });
}

// Middleware de erro centralizado. Todas as respostas de erro saem daqui no
// mesmo formato: { erro, campos? }. No Express 5, erro lançado dentro de rota
// async chega aqui sozinho, sem precisar de try/catch + next(erro).
// O Express só reconhece middleware de erro com 4 parâmetros: por isso o next.
export function tratarErros(erro, req, res, next) {
  if (erro instanceof ErroHttp) {
    const corpo = { erro: erro.message };
    if (erro.campos) corpo.campos = erro.campos;
    return res.status(erro.status).json(corpo);
  }

  // Corpo da requisição com JSON malformado (lançado pelo express.json()).
  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição.' });
  }

  console.error(erro);
  return res.status(500).json({ erro: 'Erro interno do servidor.' });
}
