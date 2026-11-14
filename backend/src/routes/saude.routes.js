import { Router } from 'express';
import * as Relatorio from '../models/Relatorio.js';
import * as FonteDestino from '../models/FonteDestino.js';
import * as Lancamento from '../models/Lancamento.js';
import { hojeISO, somarMeses } from '../models/datas.js';
import { montarFaturas } from '../models/fatura.js';
import { analisar } from '../models/saudeFinanceira.js';

// Montado em /api/saude-financeira, depois do middleware autenticar.
const router = Router();

const AVISO =
  'As informações desta página são educativas e não constituem recomendação financeira profissional.';

router.get('/', async (req, res) => {
  const hoje = hojeISO();
  const mesAtual = hoje.slice(0, 7);
  // Do 1º dia de 3 meses atrás até hoje: cobre a janela das médias e a
  // média dos 3 meses anteriores usada na "categoria fora da curva".
  const inicio = `${somarMeses(mesAtual, -3)}-01`;

  const [totaisPorMes, gastosPorCategoria, cartoesCadastrados] = await Promise.all([
    Relatorio.totaisPorMes(req.usuarioId, inicio, hoje),
    Relatorio.saidasPorCategoriaEMes(req.usuarioId, inicio, hoje),
    FonteDestino.listar(req.usuarioId, 'cartao_credito'),
  ]);

  // 48 meses à frente: o máximo de parcelas, para enxergar até a última.
  const cartoes = [];
  for (const cartao of cartoesCadastrados) {
    const parcelas = await Lancamento.listarSaidasDoCartao(cartao.id, req.usuarioId);
    cartoes.push(montarFaturas(cartao, parcelas, hoje, 48));
  }

  res.json({ aviso: AVISO, hoje, ...analisar({ mesAtual, totaisPorMes, gastosPorCategoria, cartoes }) });
});

export default router;
