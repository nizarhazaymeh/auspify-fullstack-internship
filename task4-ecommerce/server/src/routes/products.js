import { Router } from 'express';
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';
import { optionalAuth, requireAdmin, requireAuth } from '../middleware/auth.js';
import { validateCreateProduct, validateId, validateProductQuery, validateUpdateProduct } from '../middleware/validate.js';

const router = Router();

router.get('/', optionalAuth, validateProductQuery, listProducts);
router.get('/:idOrSlug', optionalAuth, getProduct);
router.post('/', requireAuth, requireAdmin, validateCreateProduct, createProduct);
router.put('/:id', requireAuth, requireAdmin, validateId(), validateUpdateProduct, updateProduct);
router.delete('/:id', requireAuth, requireAdmin, validateId(), deleteProduct);

export default router;
