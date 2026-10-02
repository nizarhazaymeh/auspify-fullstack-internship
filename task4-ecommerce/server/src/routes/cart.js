import { Router } from 'express';
import { getCart, addItem, setItemQty, removeItem, clearCart, mergeCart } from '../controllers/cartController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateAddToCart, validateId, validateMergeCart, validateSetQty } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

router.get('/', getCart);
router.delete('/', clearCart);
router.post('/items', validateAddToCart, addItem);
router.post('/merge', validateMergeCart, mergeCart);
router.put('/items/:productId', validateSetQty, setItemQty);
router.delete('/items/:productId', validateId('productId'), removeItem);

export default router;
