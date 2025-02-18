import mongoose from 'mongoose';

const { Schema } = mongoose;

// Crear esquema del usuario
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  myCitiesId: {
    type: [{ type: String, ref: 'City' }],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: false,
  }
});

// Crear modelo del usuario y exportarlo
export default mongoose.model('User', userSchema);
