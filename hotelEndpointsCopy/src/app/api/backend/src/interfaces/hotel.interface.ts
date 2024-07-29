import { Document } from "mongoose"

interface metapolicyStruct{
    add_fee: {
        currency: string, 
        fee_type: string, 
        price: number, 
        price_unit: string 
    }[],
    check_in_check_out: {
        check_in_check_out_type: string,
        currency: string,
        inclusion: string,
        price: number
    }[],
    children: {
        age_end: number,
        age_start: number,
        currency: string,
        extra_bed: string, 
        price: number
    }[],
    children_meal: {
        age_end: number,
        age_start: number,
        currency: string,
        inclusion: string,
        meal_type: string,
        price: number
    }[],
    cot: {
        amount: number, 
        currency: string, 
        inclusion: string, 
        price: number, 
        price_unit: string
    }[],
    deposit: {
        availability: string,
        currency: string,
        deposit_type: string,
        payment_type: string,
        price: number,
        price_unit: string,
        pricing_method: string
    }[],
    extra_bed: {
        amount: number, 
        currency: string, 
        inclusion: string, 
        price: number, 
        price_unit: string
    }[],
    internet: {
        currency: string, 
        inclusion: string, 
        internet_type: string,
        price: number, 
        price_unit: string
    }[],
    meal: {
        currency: string, 
        inclusion: string, 
        meal_type: string,
        price: number 
    }[],
    no_show: {
        availability: string,
        day_period: string,
        time?: string
    }[],
    parking: {
        currency: string, 
        inclusion: string, 
        price: number, 
        price_unit: string,
        territory_type: string
    }[],
    pets: {
        currency: string, 
        inclusion: string, 
        pets_type: string,
        price: number, 
        price_unit: string
    }[],
    shuttle: {
        currency: string, 
        destination_type: string,
        inclusion: string, 
        price: number, 
        shuttle_type: string
    }[],
    visa: { visa_support: string }
};

export interface individualRoom {
    name: string, 
    name_struct: {
        bathroom: string,
        bedding_type: string, 
        main_name: string
    },
    images: string[],
    room_amenities: string[],
    rg_ext: {
        class: number, 
        quality: number, 
        sex: number, 
        bathroom: number, 
        bedding: number, 
        family: number, 
        capacity: number, 
        club: number, 
        bedrooms: number, 
        balcony: number,    
        view: number, 
        floor: number
    },
    room_group_id?: number
};

export interface Hotel extends Document {
    readonly address: string,
    readonly amenity_groups: { group_name: string, amenities: string[] },
    readonly check_in_time: string,
    readonly check_out_time: string, 
    readonly description_struct: [{ paragraphs: string[], title: string }],
    readonly email: string, 
    readonly front_desk_time_end: string, 
    readonly front_desk_time_start: string, 
    readonly hotel_chain: string, 
    readonly id: string, 
    readonly images: string[],
    readonly is_closed: boolean,
    readonly kind: string,
    readonly latitude: number, 
    readonly longitude: number, 
    readonly name: string,
    readonly metapolicy_struct: metapolicyStruct[],
    readonly payment_methods: string[],
    readonly phone: string, 
    readonly postal_code: string,
    readonly region: {
        country_code: string,
        iata: string,
        id: number,
        name: string,
        type: string
    },
    readonly room_groups: individualRoom[],
    readonly star_rating: number
};