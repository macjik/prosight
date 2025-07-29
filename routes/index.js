import express from 'express';
import locusRouter from './locus.js';
import loginRouter from './auth.js';

const router = express.Router();

router.use('/locus', locusRouter);
router.use('/login', loginRouter);

export default router;
