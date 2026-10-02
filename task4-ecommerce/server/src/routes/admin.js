import { Router } from 'express';
import { listAllOrders, updateOrderStatus, getStats } from '../controllers/orderController.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { validateId, validateOrderQuery, validateStatus } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/stats', getStats);
router.get('/orders', validateOrderQuery, listAllOrders);
router.patch('/orders/:id/status', validateId(), validateStatus, updateOrderStatus);

export default router;
