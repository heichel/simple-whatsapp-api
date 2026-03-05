import { Router } from 'express';
import { sendMessage, getMessageStatus } from '../controllers/messageController.js';
import { validateSendMessage } from '../middleware/validation.js';

const router = Router();

router.post('/send', validateSendMessage, sendMessage);
router.get('/status/:messageId', getMessageStatus);

export default router;
