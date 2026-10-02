import { Router } from 'express';
import {
  listTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary,
  exportCsv,
} from '../controllers/transactionController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateCreateTx, validateId, validateListTx, validateRange, validateUpdateTx } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

router.get('/summary', validateRange, getSummary);
router.get('/export', validateListTx, exportCsv);
router.route('/').get(validateListTx, listTransactions).post(validateCreateTx, createTransaction);
router
  .route('/:id')
  .get(validateId, getTransaction)
  .put(validateId, validateUpdateTx, updateTransaction)
  .delete(validateId, deleteTransaction);

export default router;
