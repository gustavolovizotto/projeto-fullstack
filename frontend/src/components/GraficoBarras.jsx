import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { moeda, moedaCurta } from '../services/formatos.js'

// Barras horizontais de uma série só (o título do cartão diz o que é, então
// não precisa de legenda). itens: [{ nome, total }]
export default function GraficoBarras({ itens, nomeSerie, cor = '#2a78d6' }) {
  return (
    <ResponsiveContainer width="100%" height={30 + itens.length * 36}>
      <BarChart data={itens} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} stroke="#e7e9eb" />
        <XAxis type="number" tickFormatter={moedaCurta} tick={{ fill: '#5f6b70', fontSize: 12 }} />
        <YAxis type="category" dataKey="nome" width={120} tick={{ fill: '#1c2427', fontSize: 13 }} />
        <Tooltip formatter={(valor) => moeda(valor)} cursor={{ fill: 'rgb(0 0 0 / 0.04)' }} />
        <Bar dataKey="total" name={nomeSerie} fill={cor} barSize={16} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
