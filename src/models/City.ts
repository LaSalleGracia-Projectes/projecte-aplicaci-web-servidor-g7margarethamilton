import mongoose from 'mongoose';

// Crear esquema de city
const citySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    lat: {
        type: String,
        required: true
    },
    lng: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    admin1: {
        type: String,
        required: true
    },
    admin2: {
        type: String,
        required: true
    }
});

// Crear modelo del usuario y exportarlo
export default mongoose.model('City', citySchema);
