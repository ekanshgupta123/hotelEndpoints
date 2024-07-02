import { Schema, model, Document } from 'mongoose';

interface IHotel extends Document {
    id: string;
    name: string;
    address: string;
    starRating: number;
    price: number;
    images: string[];
}

const hotelSchema = new Schema<IHotel>({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    starRating: { type: Number, required: true },
    price: { type: Number, required: true },
    images: { type: [String], required: true },
}, {
    timestamps: true,
    collection: 'static-hotel-data'
});

const Hotel = model<IHotel>('Hotel', hotelSchema);

export default Hotel;