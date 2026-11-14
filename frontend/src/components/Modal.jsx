import { useEffect } from 'react'

// Janela sobre a tela. Fecha com Esc ou clicando fora dela.
export default function Modal({ titulo, aoFechar, children }) {
  useEffect(() => {
    const aoTeclar = (evento) => evento.key === 'Escape' && aoFechar()
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aoFechar])

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <div className="cartao modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
        <h2 id="modal-titulo">{titulo}</h2>
        {children}
      </div>
    </div>
  )
}
