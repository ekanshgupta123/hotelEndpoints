// import { Schema, model, Document } from 'mongoose';

// interface IHotel extends Document {
//     id: string;
//     name: string;
//     address: string;
//     starRating: number;
//     price: number;
//     images: string[];
// }

// const hotelSchema = new Schema<IHotel>({
//     id: { type: String, required: true, unique: true },
//     name: { type: String, required: true },
//     address: { type: String, required: true },
//     starRating: { type: Number, required: true },
//     price: { type: Number, required: true },
//     images: { type: [String], required: true },
// }, {
//     timestamps: true,
//     collection: 'static-hotel-data'
// });

// const Hotel = model<IHotel>('Hotel', hotelSchema);

// export default Hotel;


import mongoose, { Schema, Document } from 'mongoose';

interface IHotel extends Document {
    id: string;
    name: string;
    address: string;
    starRating: number;
    amenities: string[];
    price: number;
    images: string[];
    description: string;
    main_name: string;
    room_images: string[];
}

const HotelSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    starRating: { type: Number, required: true },
    amenities: { type: [String], required: true },
    price: { type: Number, required: true },
    images: { type: [String], required: true },
    description: { type: String, required: true },
    main_name: { type: String, required: true },
    room_images: { type: [String], required: true }
}, {
    timestamps: true,
    collection: 'static-hotel-data'
});

const Hotel = mongoose.models.Hotel || mongoose.model<IHotel>('Hotel', HotelSchema);

export default Hotel;