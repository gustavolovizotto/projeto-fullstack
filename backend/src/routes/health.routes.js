import { Router } from 'express';

const router = Router();

// Usada pelo front para conferir se a API está no ar e se o CORS está liberado.
router.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

export default router;
