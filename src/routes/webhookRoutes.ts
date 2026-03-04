import { Router } from 'express';
import { registerWebhook, unregisterWebhook, listWebhooks } from '../controllers/webhookController';

const router = Router();

router.post('/register', registerWebhook);
router.delete('/:id', unregisterWebhook);
router.get('/', listWebhooks);

export default router;
