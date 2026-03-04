import { Router } from 'express';
import { getConnectionStatus, getQRCode, logout } from '../controllers/connectionController';

const router = Router();

router.get('/status', getConnectionStatus);
router.get('/qr', getQRCode);
router.post('/logout', logout);

export default router;
