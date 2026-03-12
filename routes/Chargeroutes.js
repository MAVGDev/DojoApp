import Charge from '../models/Charge.js'
import Student from '../models/Student.js'

// ─── ADMIN: crear cargo ───────────────────────────────────────────────────────
export const createCharge = async (req, res) => {
  try {
    const { studentId, category, description, amount, dueDate, paymentMethod, notes } = req.body

    const student = await Student.findById(studentId)
    if (!student) return res.status(404).json({ message: 'Alumno no encontrado' })

    const charge = await Charge.create({
      student:       studentId,
      category,
      description,
      amount:        parseFloat(amount),
      dueDate:       dueDate ? new Date(dueDate) : null,
      paymentMethod: paymentMethod || 'efectivo',
      notes:         notes || '',
      createdBy:     req.user._id,
    })

    const populated = await Charge.findById(charge._id).populate('student', 'fullName')

    res.status(201).json({ message: 'Cargo creado correctamente', charge: populated })
  } catch (err) {
    console.error('Error creando cargo:', err)
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join(', ') })
    }
    res.status(500).json({ message: 'Error en el servidor' })
  }
}

// ─── ADMIN: obtener todos los cargos (con filtro por categoría) ───────────────
export const getAllCharges = async (req, res) => {
  try {
    const { category, studentId, paid } = req.query
    const filter = {}
    if (category)  filter.category = category
    if (studentId) filter.student  = studentId
    if (paid !== undefined) filter.paid = paid === 'true'

    const charges = await Charge.find(filter)
      .populate('student', 'fullName arteMarcial categoria')
      .sort({ createdAt: -1 })

    // Agrupar por categoría para las pestañas
    const grouped = {
      material:    [],
      inscripcion: [],
      licencia:    [],
      evento:      [],
      otro:        [],
    }
    charges.forEach(c => { grouped[c.category]?.push(c) })

    res.json({ charges, grouped })
  } catch (err) {
    console.error('Error obteniendo cargos:', err)
    res.status(500).json({ message: 'Error en el servidor' })
  }
}

// ─── ADMIN: marcar cargo como pagado ─────────────────────────────────────────
export const markChargePaid = async (req, res) => {
  try {
    const { id } = req.params
    const { paymentMethod } = req.body

    const charge = await Charge.findById(id).populate('student', 'fullName')
    if (!charge) return res.status(404).json({ message: 'Cargo no encontrado' })
    if (charge.paid) return res.status(400).json({ message: 'Este cargo ya estaba pagado' })

    charge.paid          = true
    charge.paymentDate   = new Date()
    charge.paymentMethod = paymentMethod || charge.paymentMethod
    await charge.save()

    res.json({ message: 'Cargo marcado como pagado', charge })
  } catch (err) {
    console.error('Error marcando cargo:', err)
    res.status(500).json({ message: 'Error en el servidor' })
  }
}

// ─── ADMIN: eliminar cargo ────────────────────────────────────────────────────
export const deleteCharge = async (req, res) => {
  try {
    const charge = await Charge.findByIdAndDelete(req.params.id)
    if (!charge) return res.status(404).json({ message: 'Cargo no encontrado' })
    res.json({ message: 'Cargo eliminado correctamente' })
  } catch (err) {
    res.status(500).json({ message: 'Error en el servidor' })
  }
}

// ─── STUDENT: ver mis cargos ──────────────────────────────────────────────────
export const getMyCharges = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id })
    if (!student) return res.status(404).json({ message: 'Alumno no encontrado' })

    const charges = await Charge.find({ student: student._id }).sort({ createdAt: -1 })

    const grouped = {
      material:    [],
      inscripcion: [],
      licencia:    [],
      evento:      [],
      otro:        [],
    }
    charges.forEach(c => { grouped[c.category]?.push(c) })

    res.json({ charges, grouped })
  } catch (err) {
    res.status(500).json({ message: 'Error en el servidor' })
  }
}