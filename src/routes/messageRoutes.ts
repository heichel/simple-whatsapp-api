import { Router } from 'express';
import { sendMessage, getMessageStatus } from '../controllers/messageController';

const router = Router();

router.post('/send', sendMessage);
router.get('/status/:messageId', getMessageStatus);

export default router;
