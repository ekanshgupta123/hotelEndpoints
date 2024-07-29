import React from 'react';
import pic from './checkins.png';
import '../styles/HotelDisplay.css';

interface HotelDetails {
    id: string;
    price: number;
    name?: string;
    address?: string;
    star_rating?: number;
    images?: string[];
    amenity_groups: string[];
    description_struct: string[];
    room_groups: RoomGroup[];
    latitude: number;
    longitude: number;
};

interface RoomGroup {
    images: string[];
    name: string;
    name_struct: {
        bathroom: string | null;
        bedding_type: string | null;
        main_name: string;
    };
    rg_ext: {
        class: number;
        quality: number;
        sex: number;
        bathroom: number;
        bedding: number;
    };
    room_amenities: string[];
    room_group_id: number;
}

interface HotelDisplayProps {
    hotel: HotelDetails;
    searchParams: HotelSearchParams;
    statics: any;
    price: number
}

interface HotelSearchParams {
    checkin: string;
    checkout: string;
    residency: string;
    language: string;
    guests: {
        adults: number;
        children: {
            age: number;
        }[];
    }[];
    region_id: number | null;
    currency: string;
}

const HotelDisplay: React.FC<HotelDisplayProps> = ({ hotel, searchParams, statics, price }) => {
    const handleCardClick = (hotelId: string, hotelData: HotelDetails, searchParams: HotelSearchParams) => {
        localStorage.setItem('currentHotelData', JSON.stringify(hotelData));
        localStorage.setItem('searchParams', JSON.stringify(searchParams));
        localStorage.setItem('priceParams', JSON.stringify(price));
        window.open(`/hotel/${hotelId}`, '_blank');
    };
    console.log("Hotel: ", hotel)
    console.log("statics: " , statics);

    const image = statics?.images?.[0];
    let imageResult: string;

    if (typeof image === 'string') {
        imageResult = `${image.slice(0, 27)}240x240${image.slice(33)}`;
    } else {
        imageResult = pic as unknown as string;
    }

    let checkoutDate = new Date(searchParams.checkout);
    let checkinDate = new Date(searchParams.checkin);
  
    let dateDifferenceMilliSeconds = checkoutDate.getTime() - checkinDate.getTime();
    let dateDifferenceDays = Math.floor(dateDifferenceMilliSeconds / (1000 * 60 * 60 * 24));


    // console.log("Amenities: ", statics?.amenity_groups[0]?.amenity_groups[0] || 'No amenities');

    // return (
    //     <div className="hotel-item" onClick={() => handleCardClick(hotel.id, statics, searchParams)}>
    //         <h3>{statics?.name || 'Unknown Hotel'}</h3>
    //         <p>{statics?.address || 'No Address Available'}</p>
    //         <div className="rating">{statics?.star_rating ? Array(statics.star_rating).fill('⭐').join('') : 'No Rating'}</div>
    //         <p className="price"> ${price}</p>
    //         <div className="hotel-images">
    //             <img 
    //                 key={image}
    //                 src={imageResult} 
    //                 alt={`View of ${statics?.name || 'Unknown Hotel'}`} 
    //             />
    //         </div>
    //     </div>
    // );


        const meal = hotel.rates[0]?.meal === 'nomeal' ? 'No Meal' : hotel.rates[0]?.meal;
        const cancellation = hotel.rates[0]?.payment_options.payment_types[0].cancellation_penalties.free_cancellation_before == null ? 'No Free Cancellation' : 'Free Cancellation';

        return (
        <div className="hotel-card" onClick={() => handleCardClick(hotel.id, statics, searchParams)}>
            <img src={imageResult} alt={`View of ${hotel.name}`} className="hotel-image" />
            <div className="hotel-info">
            <div className="hotel-header">
                <h3 className="hotel-name">{statics?.name}</h3>
                <p className="hotel-address">{statics?.address || 'No Address Available'}</p>
                <div className="hotel-rating">{statics?.star_rating ? Array(statics.star_rating).fill('⭐').join('') : 'No Rating'}</div>
            </div>
            <div className="room-info">
                <p className="room-type">{hotel.rates[0]?.room_data_trans.main_name || 'No room groups available'}</p>
            </div>
            <div className="price-info">
                <p className="hotel-price">${Number(price) * dateDifferenceDays} for {dateDifferenceDays} night(s) and {searchParams?.guests?.length} guest(s)</p>
            </div>
            <div className="additional-info">
                <p>Meal: {meal}</p>
                <p>Cancellation: {cancellation}</p>
            </div>
            </div>
            <button className="show-all-rooms-button">Show all rooms</button>
        </div>
        );
};

export default HotelDisplay;
