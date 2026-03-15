import express from 'express'
import { protect, admin } from '../middleware/auth.js'
import {
  createCharge,
  getAllCharges,
  markChargePaid,
  deleteCharge,
  getMyCharges,
} from '../controllers/chargeController.js'

const router = express.Router()

// Alumno
router.get('/me',       protect,            getMyCharges)

// Admin
router.get('/',         protect, admin, getAllCharges)
router.post('/',        protect, admin, createCharge)
router.put('/:id/paid', protect, admin, markChargePaid)
router.delete('/:id',   protect, admin, deleteCharge)

export default router