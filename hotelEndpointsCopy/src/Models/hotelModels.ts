import mongoose, { Schema } from "mongoose";

const metapolicyStruct = new Schema({
    add_fee: [{
        currency: String, 
        fee_type: String, 
        price: Number, 
        price_unit: String 
    }],
    check_in_check_out: [{
        check_in_check_out_type: String,
        currency: String,
        inclusion: String,
        price: Number
    }],
    children: [{
        age_end: Number,
        age_start: Number,
        currency: String,
        extra_bed: String, 
        price: Number
    }],
    children_meal: [{
        age_end: Number,
        age_start: Number,
        currency: String,
        inclusion: String,
        meal_type: String,
        price: Number
    }],
    cot: [{
        amount: Number, 
        currency: String, 
        inclusion: String, 
        price: Number, 
        price_unit: String
    }],
    deposit: [{
        availability: String,
        currency: String,
        deposit_type: String,
        payment_type: String,
        price: Number,
        price_unit: String,
        pricing_method: String
    }],
    extra_bed: [{
        amount: Number, 
        currency: String, 
        inclusion: String, 
        price: Number, 
        price_unit: String
    }],
    internet: [{
        currency: String, 
        inclusion: String, 
        internet_type: String,
        price: Number, 
        price_unit: String
    }],
    meal: [{
        currency: String, 
        inclusion: String, 
        meal_type: String,
        price: Number 
    }],
    no_show: [{
        availability: String,
        day_period: String,
        time: { type: String, required: false }
    }],
    parking: [{
        currency: String, 
        inclusion: String, 
        price: Number, 
        price_unit: String,
        territory_type: String
    }],
    pets: [{
        currency: String, 
        inclusion: String, 
        pets_type: String,
        price: Number, 
        price_unit: String
    }],
    shuttle: [{
        currency: String, 
        destination_type: String,
        inclusion: String, 
        price: Number, 
        shuttle_type: String
    }],
    visa: { visa_support: String }
})

const individualRoom = new Schema({
    name: String, 
    name_struct: {
        bathroom: String,
        bedding_type: String, 
        main_name: String
    },
    images: [String],
    room_amenities: [String],
    rg_ext: {
        class: Number, 
        quality: Number, 
        sex: Number, 
        bathroom: Number, 
        bedding: Number, 
        family: Number, 
        capacity: Number, 
        club: Number, 
        bedrooms: Number, 
        balcony: Number,    
        view: Number, 
        floor: Number
    },
    room_group_id: { type: Number, required: false } 
})

const hotelInfo = new Schema({
    address: String,
    amenity_groups: { group_name: String, amenities: [String] },
    check_in_time: String,
    check_out_time: String, 
    description_struct: [{ paragraphs: [String], title: String }],
    email: String, 
    front_desk_time_end: String, 
    front_desk_time_start: String, 
    hotel_chain: String, 
    id: String, 
    images: [String],
    is_closed: Boolean,
    kind: String,
    latitude: Number, 
    longitude: Number, 
    name: String,
    metapolicy_struct: [metapolicyStruct],
    payment_methods: [String],
    phone: String, 
    postal_code: String,
    region: {
        country_code: String,
        iata: String,
        id: Number,
        name: String,
        type: String
    },
    room_groups: [{ type: individualRoom }],
    star_rating: Number
}, {
    collection: 'static-hotel-data'
});
const Hotel = mongoose.models.Hotel || mongoose.model('Hotel', hotelInfo)
export default Hotel;
