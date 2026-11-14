// Carga de demonstração: 2 usuários com 3 meses de lançamentos (o mês atual e
// os 2 anteriores), cartões e compras parceladas. Usa os próprios models, então
// os dados passam pelas mesmas regras e transações da API.
// Uso: npm run db:seed (banco vazio) ou npm run db:reset (recria e popula).
import '../src/config/env.js';
import bcrypt from 'bcrypt';
import { pool } from '../src/config/db.js';
import * as Usuario from '../src/models/Usuario.js';
import * as Categoria from '../src/models/Categoria.js';
import * as FonteDestino from '../src/models/FonteDestino.js';
import * as Lancamento from '../src/models/Lancamento.js';
import { hojeISO, paraISO, ultimoDiaDoMes } from '../src/models/datas.js';

// Credenciais de teste, documentadas no README.
const USUARIOS = [
  {
    nome: 'Ana Souza',
    email: 'ana@exemplo.com',
    cpf: '52998224725',
    senha: 'Senha123',
    fontes: [
      { nome: 'Poupança', tipo: 'conta' },
      { nome: 'Freelas', tipo: 'renda' },
      { nome: 'Nubank', tipo: 'cartao_credito', diaFechamento: 3, diaVencimento: 10, limite: 8000 },
      { nome: 'Visa', tipo: 'cartao_credito', diaFechamento: 25, diaVencimento: 5, limite: 3000 },
    ],
    // [mês (0 = atual, -1 = anterior...), dia, tipo, descrição, valor, categoria, fonte, parcelas]
    lancamentos: [
      ...[-2, -1, 0].flatMap((m, i) => [
        [m, 5, 'entrada', 'Salário', 5000, 'Salário', 'Salário'],
        [m, 10, 'saida', 'Aluguel', 1500, 'Moradia', 'Conta corrente'],
        [m, 8, 'saida', 'Mercado', [612.4, 735.9, 688.15][i], 'Alimentação', 'Nubank'],
        [m, 22, 'saida', 'Mercado', [254.3, 198.75, 301.2][i], 'Alimentação', 'Nubank'],
        [m, 12, 'saida', 'Uber', [118.6, 142.3, 96.4][i], 'Mobilidade', 'Nubank'],
        [m, 15, 'saida', 'Farmácia', [82.5, 45.9, 130][i], 'Saúde', 'Conta corrente'],
        [m, 18, 'saida', 'Cinema', [64, 58, 72][i], 'Lazer', 'Visa'],
        [m, 20, 'saida', 'Guardar na poupança', 400, 'Outros', 'Conta corrente'],
        [m, 21, 'entrada', 'Depósito na poupança', 400, 'Outros', 'Poupança'],
      ]),
      [-1, 7, 'entrada', 'Site para cliente', 800, 'Outros', 'Freelas'],
      // Gasto fora do padrão no mês atual, para a página de saúde financeira apontar.
      [0, 2, 'saida', 'Jantar de aniversário', 280, 'Lazer', 'Conta corrente'],
      [-2, 28, 'saida', 'Celular', 1800, 'Mobilidade', 'Visa', 6],
      [-1, 15, 'saida', 'Notebook', 4000, 'Educação', 'Nubank', 10],
      // Feita no dia do fechamento do Nubank: entra na fatura do mês seguinte.
      [0, 3, 'saida', 'Curso de inglês', 1200, 'Educação', 'Nubank', 3],
    ],
  },
  {
    nome: 'Bruno Lima',
    email: 'bruno@exemplo.com',
    cpf: '11144477735',
    senha: 'Senha123',
    fontes: [
      { nome: 'Inter', tipo: 'cartao_credito', diaFechamento: 10, diaVencimento: 17, limite: 2000 },
    ],
    lancamentos: [
      ...[-2, -1, 0].flatMap((m, i) => [
        [m, 5, 'entrada', 'Salário', 3500, 'Salário', 'Salário'],
        [m, 6, 'saida', 'Aluguel', 1000, 'Moradia', 'Conta corrente'],
        [m, 9, 'saida', 'Mercado', [420.5, 389.9, 455][i], 'Alimentação', 'Inter'],
        [m, 14, 'saida', 'Academia', 99.9, 'Saúde', 'Inter'],
      ]),
      [-1, 20, 'saida', 'Fone de ouvido', 600, 'Lazer', 'Inter', 3],
    ],
  },
];

// Data do dia d no mês atual + deslocamento (ajusta dia 31 em meses curtos).
function dataDoMes(deslocamento, dia) {
  const hoje = new Date();
  const referencia = new Date(hoje.getFullYear(), hoje.getMonth() + deslocamento, 1);
  const ano = referencia.getFullYear();
  const mes = referencia.getMonth();
  return paraISO(ano, mes, Math.min(dia, ultimoDiaDoMes(ano, mes)));
}

async function popularUsuario({ nome, email, cpf, senha, fontes, lancamentos }) {
  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await Usuario.cadastrar({ nome, email, cpf, senhaHash });
  for (const fonte of fontes) {
    await FonteDestino.criar(usuario.id, {
      diaFechamento: null, diaVencimento: null, limite: null, ...fonte,
    });
  }

  const categorias = new Map(
    (await Categoria.listar(usuario.id)).map((c) => [`${c.tipo}:${c.nome}`, c.id]),
  );
  const fontesPorNome = new Map((await FonteDestino.listar(usuario.id)).map((f) => [f.nome, f.id]));

  const hoje = hojeISO();
  let criados = 0;
  for (const [mes, dia, tipo, descricao, valor, categoria, fonte, totalParcelas = 1] of lancamentos) {
    const data = dataDoMes(mes, dia);
    if (data > hoje) continue; // nada no futuro: o mês atual vai só até hoje
    await Lancamento.criar(usuario.id, {
      tipo,
      descricao,
      valor,
      data,
      categoriaId: categorias.get(`${tipo}:${categoria}`),
      fonteDestinoId: fontesPorNome.get(fonte),
      totalParcelas,
    });
    criados++;
  }
  console.log(`${nome} <${email}>: ${criados} lançamentos.`);
}

try {
  for (const usuario of USUARIOS) await popularUsuario(usuario);
  console.log('Seed concluído. Senha dos dois usuários: Senha123');
} catch (erro) {
  if (erro.code === '23505') {
    console.error('Os usuários do seed já existem. Rode npm run db:reset para recriar o banco do zero.');
  } else {
    console.error(`Falha no seed: ${erro.message}`);
  }
  process.exitCode = 1;
} finally {
  await pool.end();
}
