import React, { useEffect, useState } from 'react';
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

interface HotelRoom {
    name: string;
    price: number;
    type: string;
}


const HotelPage = () => {
    console.log("Im here in Hotel Page");
    const [hotelData, setHotelData] = useState<HotelDetails | null>(null);
    const [searchParams, setSearchParams] = useState<HotelSearchParams | null>(null);
    const [rooms, setRooms] = useState<HotelRoom[]>([]); 
    const router = useRouter();
   
    useEffect(() => {
        const fetchedHotelData = localStorage.getItem('currentHotelData');
        const fetchedSearchParams = localStorage.getItem('searchParams');
        if (fetchedHotelData) {
            setHotelData(JSON.parse(fetchedHotelData));
        }
        if (fetchedSearchParams) {
            setSearchParams(JSON.parse(fetchedSearchParams));
        }
    }, []);

    useEffect(() => {
        const getRooms = async () => {
            if (!hotelData || !searchParams) return;
            console.log("Fetching rooms with updated state");
            
            const body = {
                checkin: searchParams.checkin,
                checkout: searchParams.checkout,
                residency: "us",
                language: "en",
                guests: searchParams.guests,
                id: hotelData.id,  
                currency: "USD"
            };

            console.log(body);

            try {
                const response = await axios.post("http://localhost:3002/hotels/rooms", body);
                const hotelsData = response.data.data.hotels;
                if (hotelsData.length > 0) {
                    const roomDetails = hotelsData[0].rates.map((rate: { room_name: any; daily_prices: any[]; room_data_trans: { main_name: any; }; }) => ({
                        name: rate.room_name,
                        price: rate.daily_prices[0],
                        type: rate.room_data_trans?.main_name // Using optional chaining in case room_data_trans is undefined
                    }));
                    setRooms(roomDetails);
                }
            } catch (error) {
                console.error('Error fetching room data:', error);
            }
        };

        getRooms();
    }, [hotelData, searchParams]);

    if (!hotelData) {
        return <p>Loading...</p>;
    }

    const handleReservation = (idx: number) => {
        const bookingObj: { room: HotelRoom, params: HotelSearchParams } = {room: ...rooms[idx], params: ...searchParams, specifics: ...hotelData};
        const passedObj = JSON.stringify(bookingObj);
        router.push(`/review-booking?details=${encodeURIComponent(passedObj)}`)
    }

    return (
        <>
            <div className="hotel-container">
                <div className="hotel-header">
                    <h1>{hotelData.name}</h1>
                    <p className="subtitle">{hotelData.address}</p>
                    <div className="rating">{hotelData.starRating} Stars</div>
                </div>
                <div className="hotel-images">
                    {hotelData.images.slice(0, 5).map((image, index) => (
                        <img key={index} src={image.slice(0, 27) + "240x240" + image.slice(33)} alt={`View of ${hotelData.name}`} />
                    ))}
                </div>
                <div className="hotel-details">
                    <div className="hotel-info">
                        <h2>About</h2>
                        <p>{hotelData.description}</p>
                        <h2>Price: ${hotelData.price}</h2>
                    </div>
                    <div className="hotel-amenities">
                        <h2>Popular Amenities</h2>
                        <ul className="amenities">
                            {hotelData.amenities.slice(0, 9).map((amenity, index) => (
                                <li key={index}>{amenity}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
            <div className="room-container">
                {rooms.slice(0,3).map((room, index) => (
                    <div key={index} className="room-card">
                        <div className="room-content">
                            <h2 className="room-title">{room.type}</h2>
                            <a href="#" className="details-link">More Details »</a>
                            <div className="price-info">
                                ${room.price} per Day / Room
                            </div>
                            <button className="reserve-button" onClick={handleReservation(index)}>Reserve</button>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );    
};

export default HotelPage;
