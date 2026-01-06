import express from 'express';
import { translateText } from '../controllers/translateController';

const router = express.Router();

router.post('/translate', translateText);

export default router;