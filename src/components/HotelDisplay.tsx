import React, { useEffect, useState } from 'react';
import axios, {AxiosResponse} from 'axios';
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
}

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
    const [hotelDetails, setHotelDetails] = useState<HotelDetails | null>(null);

    useEffect(() => {
        const fetchHotelDetails = async () => {
            try {
                const hotelId = hotel.id
                console.log("im here");
                const response: AxiosResponse = await axios.post(`/api/info/${hotel.id}`, {
                    hotelId : hotel.id
                });
                console.log("Hotel data:", response.data);
                setHotelDetails(response.data);
            } catch (error) {
                console.error('Error fetching hotel details:', error);
            }
        };

        fetchHotelDetails();
    }, [hotel.id]);

    const handleCardClick = (hotelId: string, hotelData: HotelDetails, searchParams: HotelSearchParams) => {
        console.log("Hotel Dataaa: ", hotelData);
        localStorage.setItem('currentHotelData', JSON.stringify(hotelData));
        localStorage.setItem('searchParams', JSON.stringify(searchParams));
        localStorage.setItem('priceParams', JSON.stringify(hotel.price));
        window.open(`/hotel/${hotelId}`, '_blank');
    };

    if (!hotelDetails) {
        return <div>Loading...</div>;
    }

    console.log("Price: : " ,hotel.price);
    const placeholderImage = 'URL_TO_PLACEHOLDER_IMAGE';

    const image = hotelDetails.images?.[0];
    const imageResult = image
        ? `${image.slice(0, 27)}240x240${image.slice(33)}`
        : placeholderImage;
    return (
        <div className="hotel-item" onClick={() => handleCardClick(hotel.id, hotelDetails, searchParams)}>
            <h3>{hotelDetails.name}</h3>
            <p>{hotelDetails.address}</p>
            <div className="rating">{Array(hotelDetails.star_rating).fill('⭐').join('')}</div>
            <p className="price"> ${hotel.price}</p>
            <div className="hotel-images">
                <img key={image} src={imageResult} alt={`View of ${hotel.name}`} />
            </div>
        </div>
    );
};

export default HotelDisplay;
