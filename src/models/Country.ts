import mongoose from 'mongoose';

// Crear esquema del country
const countrySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    code: {
        type: String,
        required: true
    }
});

// Crear modelo del usuario y exportarlo
export default mongoose.model('Country', countrySchema);