import { Router } from 'express';
import { registerWebhook, unregisterWebhook, listWebhooks } from '../controllers/webhookController.js';
import { validateWebhookRegistration } from '../middleware/validation.js';

const router = Router();

router.post('/register', validateWebhookRegistration, registerWebhook);
router.delete('/:id', unregisterWebhook);
router.get('/', listWebhooks);

export default router;
