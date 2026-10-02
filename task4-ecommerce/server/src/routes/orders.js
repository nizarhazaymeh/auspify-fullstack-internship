import { Router } from 'express';
import { checkout, listMyOrders, getOrder, cancelMyOrder } from '../controllers/orderController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateCheckout, validateId, validateOrderQuery } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

router.post('/', validateCheckout, checkout);
router.get('/', validateOrderQuery, listMyOrders);
router.get('/:id', validateId(), getOrder);
router.post('/:id/cancel', validateId(), cancelMyOrder);

export default router;
