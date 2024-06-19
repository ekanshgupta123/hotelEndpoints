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
    main_name: string;
    room_groups: RoomGroup[];
}

interface RoomGroup {
    name_struct: {
        main_name: string;
    };
    images: string[];
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
    images: string[];
}

const HotelPage = () => {
    console.log("I'm here in Hotel Page");
    const [hotelData, setHotelData] = useState<HotelDetails | null>(null);
    const [searchParams, setSearchParams] = useState<HotelSearchParams | null>(null);
    const [rooms, setRooms] = useState<HotelRoom[]>([]); 
    const router = useRouter();
   
    useEffect(() => {
        const fetchedHotelData = localStorage.getItem('currentHotelData');
        const fetchedSearchParams = localStorage.getItem('searchParams');
        if (fetchedHotelData) {
            setHotelData(JSON.parse(fetchedHotelData));
            console.log('Fetched hotelData:', JSON.parse(fetchedHotelData)); // Log the fetched hotel data
        }
        if (fetchedSearchParams) {
            setSearchParams(JSON.parse(fetchedSearchParams));
            console.log('Fetched searchParams:', JSON.parse(fetchedSearchParams)); // Log the fetched search params
        };
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

            console.log('Request body:', body);

            try {
                const response = await axios.post("http://localhost:5001/hotels/rooms", body);
                const hotelsData = response.data.data.hotels;
                if (hotelsData.length > 0) {
                    console.log('API response hotelsData:', hotelsData); // Log the response data

                    const updatedHotelData = { ...hotelData, room_groups: hotelsData[0].room_groups }; // Ensure room_groups are set
                    setHotelData(updatedHotelData);
                    console.log('Updated hotelData with room_groups:', updatedHotelData); // Log the updated hotel data

                    const roomDetails = hotelsData[0].rates.map((rate: { room_name: string; daily_prices: number[]; room_data_trans: { main_name: string }; }) => {
                        const rateMainName = rate.room_data_trans.main_name.trim();
                        console.log('rate.room_data_trans.main_name:', rateMainName); // Log main_name

                        const matchedHotelRoom = updatedHotelData.room_groups?.find((group: { name_struct: { main_name: string; }; }) => {
                            const groupMainName = group.name_struct.main_name.trim();
                            console.log('Comparing:', rateMainName, 'with:', groupMainName); // Log both values
                            return groupMainName === rateMainName;
                        });

                        console.log('matchedHotelRoom:', matchedHotelRoom); // Log matchedHotelRoom
                        return {
                            name: rate.room_name,
                            price: rate.daily_prices[0],
                            type: rateMainName,
                            images: matchedHotelRoom ? matchedHotelRoom.images.map((img: string) => img.replace('{size}', '240x240')) : []
                        };
                    });
                    setRooms(roomDetails);
                    console.log('Room details:', roomDetails); // Log the room details
                }
            } catch (error) {
                console.error('Error fetching room data:', error);
            }
        };

        getRooms();
    }, [hotelData, searchParams]);

    if (!hotelData) {
        return <p>Loading...</p>;
    };

    const handleReservation = (idx: number) => {
        localStorage.setItem('currentRoom', JSON.stringify(rooms[idx]));
        const { id } = router.query;
        router.push(`/review-booking?id=${id}`)
    };

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
                {rooms.map((room, index) => (
                    <div key={index} className="room-card">
                        <div className="room-content">
                            <h2 className="room-title">{room.name}</h2>
                            <div className="room-images">
                                {room.images.slice(0, 3).map((image, idx) => (
                                    <img key={idx} src={image} alt={`Room view ${room.name}`} />
                                ))}
                            </div>
                            <a href="#" className="details-link">More Details »</a>
                            <div className="price-info">
                                ${room.price} per Day / Room
                            </div>
                            <button className="reserve-button" onClick={() => handleReservation(index)}>Reserve</button>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );    
};

export default HotelPage;