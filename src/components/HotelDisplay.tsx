import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import '../styles/HotelDisplay.css';
import axios from 'axios';

interface HotelDetails {
    id: string;
    name: string;
    address: string;
    starRating: number;
    amenities: string[];
    price: number;
    images: string[];
    description: string;
}

interface HotelDisplayProps {
    hotel: HotelDetails;
    searchParams: HotelSearchParams
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

const HotelDisplay: React.FC<HotelDisplayProps> = ({ hotel, searchParams }) => {
    const handleCardClick = (hotelId: string, hotelData: HotelDetails, searchParams: HotelSearchParams) => {
        localStorage.setItem('currentHotelData', JSON.stringify(hotelData));
        localStorage.setItem('searchParams', JSON.stringify(searchParams));
        window.open(`/hotel/${hotelId}`, '_blank');
    };

    // const getRooms = async () => {
    //     const body = {
    //         checkin: searchParams.checkin,
    //         checkout: searchParams.checkout,
    //         residency: "us",
    //         language: "en",
    //         guests: searchParams.guests,
    //         id: hotel.name,
    //         currency: "USD"
    //     }

    //     try {
    //         const response = await axios.post("http://localhost:3002/hotels/rooms", body)
    //         if (response.data && response.data.data && response.data.data.hotels) {
    //             console.log("Full response data:", response.data.data.hotels);
    //         }

    //     } catch (error) {
    //         if (axios.isAxiosError(error)) {
    //             console.error('Error fetching hotels:', error.response ? error.response.data : 'Unknown error');
    //             // setError(`Failed to fetch hotels: ${error.response ? error.response.data : 'Unknown error'}`);
    //         } else {
    //             console.error('Unexpected error:', error);
    //             // setError('An unexpected error occurred');
    //         }
    //     }
    // }

    // useEffect(() => {
    //     console.log("effect running");
    //     getRooms();
    // }, [searchParams, hotel]);
    
    
    let image = hotel.images[0];
    let imageResult = image.slice(0, 27) + "240x240" + image.slice(33);
    console.log(imageResult);
    return (
        <div className="hotel-item" onClick={() => handleCardClick(hotel.id, hotel, searchParams)}>
            <h3>{hotel.name}</h3>
            <p>{hotel.address}</p>
            <p>Rating: {hotel.starRating} stars</p>
            <p className="price"> ${hotel.price}</p>
            <div className="hotel-images">
                <img key={image} src={imageResult} alt={`View of ${hotel.name}`} />
            </div>
        </div>
    );
};

export default HotelDisplay;
