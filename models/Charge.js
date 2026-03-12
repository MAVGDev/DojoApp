import mongoose from 'mongoose'

const chargeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  category: {
    type: String,
    enum: ['material', 'inscripcion', 'licencia', 'evento', 'otro'],
    required: true,
  },
  // Descripción libre del cargo: "Dobok talla M", "Inscripción torneo mayo", etc.
  description: {
    type: String,
    required: true,
    maxlength: 200,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  paid: {
    type: Boolean,
    default: false,
  },
  paymentDate: {
    type: Date,
    default: null,
  },
  paymentMethod: {
    type: String,
    enum: ['efectivo', 'tarjeta', 'transferencia', 'otro'],
    default: 'efectivo',
  },
  dueDate: {
    type: Date,
    default: null,
  },
  notes: {
    type: String,
    default: '',
    maxlength: 500,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true })

export default mongoose.model('Charge', chargeSchema)