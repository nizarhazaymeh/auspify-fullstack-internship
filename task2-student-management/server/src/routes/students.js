import { Router } from 'express';
import {
  listStudents,
  getStats,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
} from '../controllers/studentController.js';
import { validateId, validateCreate, validateUpdate, validateList } from '../middleware/validate.js';
import { COURSES, GENDERS } from '../models/Student.js';

const router = Router();

router.get('/meta', (req, res) => res.json({ courses: COURSES, genders: GENDERS }));
router.get('/stats', getStats);

router.route('/').get(validateList, listStudents).post(validateCreate, createStudent);

router
  .route('/:id')
  .get(validateId, getStudent)
  .put(validateId, validateUpdate, updateStudent)
  .delete(validateId, deleteStudent);

export default router;
