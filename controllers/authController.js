import User from '../models/User.js';
import Student from '../models/Student.js'; 
import generateToken from '../Utils/generateToken.js';
import bcrypt from 'bcryptjs';

const registerUser = async (req, res) => {
  let user = null;
  try {
    const { 
      email, password, fullName, telefono,
      fechaNacimiento, arteMarcial, direccion, contactoEmergencia
    } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await User.create({
      email,
      password: hashedPassword,
      role: 'student'
    });

    const student = await Student.create({
      user: user._id,
      fullName:           fullName           || 'Nombre por completar',
      telefono:           telefono           || 'Sin teléfono',
      fechaNacimiento:    fechaNacimiento ? new Date(fechaNacimiento) : new Date('2000-01-01'),
      direccion:          direccion          || 'Dirección por completar',
      contactoEmergencia: contactoEmergencia || 'Contacto por completar',
      arteMarcial:        arteMarcial        || 'taekwondo',
      categoria:          'adulto',
      cinturonActual:     'blanco',
      fechaProximoExamen: null,
      historialCinturones: [],
      informacionFederacion: {
        nombreFederacion:          '',
        numeroLicencia:            null,
        fechaVencimientoLicencia:  null,
        tipoLicencia:              'competencia',
        federadoActual:            false,
        fechaFederacion:           null,
        historialFederaciones:     []
      },
      logros:        [],
      foto:          '',
      fechaRegistro: new Date(),
      activo:        true
    });

    user.studentProfile = student._id;
    await user.save();

    const userWithStudent = await User.findById(user._id)
      .populate('studentProfile', 'fullName cinturonActual arteMarcial');

    res.status(201).json({
      message: '✅ Registro exitoso',
      user: {
        _id:   userWithStudent._id,
        email: userWithStudent.email,
        role:  userWithStudent.role,
        token: generateToken(userWithStudent._id)
      },
      studentProfile: {
        _id:          student._id,
        fullName:     student.fullName,
        arteMarcial:  student.arteMarcial,
        cinturonActual: student.cinturonActual,
        federado:     student.informacionFederacion.federadoActual
      }
    });
    
  } catch (error) {
    console.error('❌ Error en registro:', error);

    // Si el User se creó pero el Student falló, borrar el User huérfano
    if (user?._id) {
      await User.findByIdAndDelete(user._id).catch(() => {})
    }

    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'El email o número de licencia ya está en uso' 
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Error de validación',
        errors: messages 
      });
    }
    
    res.status(500).json({ 
      message: 'Error en el servidor al procesar el registro',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    res.json({
      _id:   user._id,
      email: user.email,
      role:  user.role,
      token: generateToken(user._id)
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export { registerUser, loginUser };