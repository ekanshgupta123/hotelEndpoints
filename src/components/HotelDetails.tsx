// import React, { useEffect, useState } from 'react';
// import { useRouter } from 'next/router';
// import '../styles/HotelDisplay.css';
// import axios from 'axios';

// interface HotelDetails {
//     id: string;
//     name: string;
//     address: string;
//     starRating: number;
//     amenities: string[];
//     price: number;
//     images: string[];
//     description: string;
//     main_name: string[];
//     room_images: string[][];
//     room_groups: RoomGroup[];
// }

// interface RoomGroup {
//     name_struct: {
//         main_name: string;
//     };
//     images: string[];
// }

// interface HotelSearchParams {
//     checkin: string;
//     checkout: string;
//     residency: string;
//     language: string;
//     guests: {
//         adults: number;
//         children: {
//             age: number;
//         }[];
//     }[];
//     region_id: number | null;
//     currency: string;
// }

// interface RoomPrice {
//     price: number;
//     amenities: string[];
//     miscRoom: string; // Ensure miscRoom is part of RoomPrice
//     meal: string;
//     cancellation: string;
//     refundable: boolean;
// }

// interface HotelRoom {
//     name: string;
//     priceWithoutMealNoRefund: RoomPrice;
//     priceWithMealNoRefund?: RoomPrice;
//     priceWithoutMealPartialRefund?: RoomPrice;
//     priceWithMealPartialRefund?: RoomPrice;
//     type: string;
//     images: string[];
//     room_data_trans: {
//         main_room_type: string;
//         main_name: string;
//         bathroom: string;
//         bedding_type: string;
//         misc_room_type: string;
//     };
// }

// const HotelPage = () => {
//     console.log("I'm here in Hotel Page");
//     const [hotelData, setHotelData] = useState<HotelDetails | null>(null);
//     const [searchParams, setSearchParams] = useState<HotelSearchParams | null>(null);
//     const [hoveredPriceIndex, setHoveredPriceIndex] = useState<{ roomIndex: number | null, priceIndex: number | null }>({ roomIndex: null, priceIndex: null });
//     const [rooms, setRooms] = useState<HotelRoom[]>([]);
//     const [dataFetched, setDataFetched] = useState(false);
//     const [selectedMeal, setSelectedMeal] = useState<{ [key: number]: boolean }>({});
//     const [selectedRefund, setSelectedRefund] = useState<{ [key: number]: boolean }>({});
//     const router = useRouter();

//     useEffect(() => {
//         const fetchedHotelData = localStorage.getItem('currentHotelData');
//         const fetchedSearchParams = localStorage.getItem('searchParams');
//         if (fetchedHotelData) {
//             setHotelData(JSON.parse(fetchedHotelData));
//             console.log('Fetched hotelData:', JSON.parse(fetchedHotelData)); // Log the fetched hotel data
//         }
//         if (fetchedSearchParams) {
//             setSearchParams(JSON.parse(fetchedSearchParams));
//             console.log('Fetched searchParams:', JSON.parse(fetchedSearchParams)); // Log the fetched search params
//         }
//     }, []);

//     useEffect(() => {
//         const getRooms = async () => {
//             if (!hotelData || !searchParams || dataFetched) return;
//             console.log("Fetching rooms with updated state");

//             const body = {
//                 checkin: searchParams.checkin,
//                 checkout: searchParams.checkout,
//                 residency: "us",
//                 language: "en",
//                 guests: searchParams.guests,
//                 id: hotelData.id,
//                 currency: "USD"
//             };

//             console.log('Request body:', body);
//             const hashmap: { [key: string]: string[] } = {};

//             try {
//                 const response = await axios.post("http://localhost:3002/hotels/rooms", body);
//                 const hotelsData = response.data.data.hotels;
//                 if (hotelsData.length > 0) {
//                     console.log('API response hotelsData:', hotelsData); // Log the response data

//                     const updatedHotelData = { ...hotelData, room_groups: hotelsData[0].room_groups }; // Ensure room_groups are set
//                     setHotelData(updatedHotelData);
//                     setDataFetched(true); 
//                     console.log('Updated hotelData with main_name:', updatedHotelData.main_name);
//                     console.log('Updated hotelData with room_images:', updatedHotelData.room_images);
//                     updatedHotelData.main_name.forEach((name, index) => {
//                         hashmap[name] = updatedHotelData.room_images[index];
//                     });
//                     console.log('Created hashmap:', hashmap);

//                     const roomGroups: { [key: string]: HotelRoom } = {};
//                     hotelsData[0].rates.forEach(rate => {
//                         console.log("Room json: ", rate);
//                         const rateMainName = rate.room_data_trans.main_name.trim();
//                         const roomImage = hashmap[rateMainName];

//                         let refundable = false;
//                         if (
//                             rate.payment_options &&
//                             rate.payment_options.payment_types &&
//                             rate.payment_options.payment_types[0] &&
//                             rate.payment_options.payment_types[0].cancellation_penalties &&
//                             rate.payment_options.payment_types[0].cancellation_penalties.policies &&
//                             rate.payment_options.payment_types[0].cancellation_penalties.policies[0]
//                         ) {
//                             const policy = rate.payment_options.payment_types[0].cancellation_penalties.policies[0];
//                             refundable = policy.amount_charge !== rate.daily_prices[0];
//                         }

//                         const roomPrice = {
//                             price: parseFloat(rate.daily_prices[0]),
//                             amenities: rate.amenities_data || [],
//                             miscRoom: rate.room_data_trans.misc_room_type,
//                             meal: rate.meal,
//                             cancellation: refundable ? "Partial Refund" : "No Refund",
//                             refundable: refundable
//                         };

//                         const sortedMiscRoomType = rate.room_data_trans.misc_room_type
//                         ? rate.room_data_trans.misc_room_type.split(', ').sort().join(', ')
//                         : '';

//                         const roomKey = `${rate.room_data_trans.main_room_type}-${rate.room_data_trans.main_name}-${rate.room_data_trans.bathroom}-${rate.room_data_trans.bedding_type}-${sortedMiscRoomType}`;
//                         console.log("RoomKey: " , roomKey);

//                         if (!roomGroups[roomKey]) {
//                             roomGroups[roomKey] = {
//                                 name: rate.room_name,
//                                 priceWithoutMealNoRefund: roomPrice,
//                                 type: rateMainName,
//                                 images: [roomImage],
//                                 room_data_trans: rate.room_data_trans
//                             };
//                         } else {
//                             if (rate.meal === 'breakfast' && !refundable) {
//                                 roomGroups[roomKey].priceWithMealNoRefund = roomPrice;
//                             } else if (rate.meal !== 'breakfast' && refundable) {
//                                 roomGroups[roomKey].priceWithoutMealPartialRefund = roomPrice;
//                             } else if (rate.meal === 'breakfast' && refundable) {
//                                 roomGroups[roomKey].priceWithMealPartialRefund = roomPrice;
//                             } else {
//                                 roomGroups[roomKey].priceWithoutMealNoRefund = roomPrice;
//                             }
//                             roomGroups[roomKey].images.push(roomImage);
//                         }
//                     });

//                     console.log(roomGroups);

//                     const groupedRooms = Object.values(roomGroups);
//                     setRooms(groupedRooms);
//                     console.log('Grouped room details:', groupedRooms);
//                     setDataFetched(true);
//                 }
//             } catch (error) {
//                 console.error('Error fetching room data:', error);
//             }
//         };

//         getRooms();
//     }, [hotelData, searchParams, dataFetched]);

//     if (!hotelData) {
//         return <p>Loading...</p>;
//     }

//     const handleReservation = (roomIndex: number) => {
//         const includeMeal = selectedMeal[roomIndex];
//         const includeRefund = selectedRefund[roomIndex];
//         let roomToReserve = rooms[roomIndex].priceWithoutMealNoRefund;

//         if (includeMeal && includeRefund) {
//             roomToReserve = rooms[roomIndex].priceWithMealPartialRefund || roomToReserve;
//         } else if (includeMeal && !includeRefund) {
//             roomToReserve = rooms[roomIndex].priceWithMealNoRefund || roomToReserve;
//         } else if (!includeMeal && includeRefund) {
//             roomToReserve = rooms[roomIndex].priceWithoutMealPartialRefund || roomToReserve;
//         }

//         localStorage.setItem('currentRoom', JSON.stringify(roomToReserve));
//         const { id } = router.query;
//         router.push(`/review-booking?id=${id}`);
//     };

//     const handleMealSelection = (roomIndex: number, includeMeal: boolean) => {
//         setSelectedMeal(prevState => ({
//             ...prevState,
//             [roomIndex]: includeMeal
//         }));
//     };

//     const handleRefundSelection = (roomIndex: number, includeRefund: boolean) => {
//         setSelectedRefund(prevState => ({
//             ...prevState,
//             [roomIndex]: includeRefund
//         }));
//     };

//     return (
//         <>
//             <div className="hotel-container">
//                 <div className="hotel-header">
//                     <h1>{hotelData.name}</h1>
//                     <p className="subtitle">{hotelData.address}</p>
//                     <div className="rating">{Array(hotelData.starRating).fill('⭐').join('')}</div>
//                 </div>
//                 <div className="hotel-images">
//                     {hotelData.images.slice(0, 5).map((image, index) => (
//                         <img key={index} src={image.slice(0, 27) + "240x240" + image.slice(33)} alt={`View of ${hotelData.name}`} />
//                     ))}
//                 </div>
//                 <div className="hotel-details">
//                     <div className="hotel-info">
//                         <h2>About</h2>
//                         <p>{hotelData.description}</p>
//                         <h2>Price: ${hotelData.price}</h2>
//                     </div>
//                     <div className="hotel-amenities">
//                         <h2>Popular Amenities</h2>
//                         <ul className="amenities">
//                             {hotelData.amenities.slice(0, 9).map((amenity, index) => (
//                                 <li key={index}>{amenity}</li>
//                             ))}
//                         </ul>
//                     </div>
//                 </div>
//             </div>
//             <div className="room-container">
//                 {rooms.map((room, roomIndex) => (
//                     <div key={roomIndex} className="room-card">
//                         <div className="room-content">
//                             <h2 className="room-title">{room.name}</h2>
//                             <div className="room-images">
//                                 {room.images.length > 0 && (
//                                     <img src={room.images[0]} alt={`Room view ${room.type}`} />
//                                 )}
//                             </div>
//                             <div className="price-info">
//                                 <p>Base Price: ${room.priceWithoutMealNoRefund.price}</p>
//                                 <div className="extras">
//                                     <label>
//                                         <input
//                                             type="radio"
//                                             name={`meal-${roomIndex}`}
//                                             checked={selectedMeal[roomIndex] === false}
//                                             onChange={() => handleMealSelection(roomIndex, false)}
//                                         />
//                                         No Meal + $0
//                                     </label>
//                                     {room.priceWithMealNoRefund && (
//                                         <label>
//                                             <input
//                                                 type="radio"
//                                                 name={`meal-${roomIndex}`}
//                                                 checked={selectedMeal[roomIndex] === true}
//                                                 onChange={() => handleMealSelection(roomIndex, true)}
//                                             />
//                                             Meal + ${room.priceWithMealNoRefund.price - room.priceWithoutMealNoRefund.price}
//                                         </label>
//                                     )}
//                                 </div>
//                                 <div className="extras">
//                                     <label>
//                                         <input
//                                             type="radio"
//                                             name={`refund-${roomIndex}`}
//                                             checked={selectedRefund[roomIndex] === false}
//                                             onChange={() => handleRefundSelection(roomIndex, false)}
//                                         />
//                                         No Refund
//                                     </label>
//                                     {room.priceWithoutMealPartialRefund && (
//                                         <label>
//                                             <input
//                                                 type="radio"
//                                                 name={`refund-${roomIndex}`}
//                                                 checked={selectedRefund[roomIndex] === true}
//                                                 onChange={() => handleRefundSelection(roomIndex, true)}
//                                             />
//                                             Partial Refund
//                                         </label>
//                                     )}
//                                 </div>
//                                 <p>
//                                     Total Price: $
//                                     {selectedMeal[roomIndex] && selectedRefund[roomIndex]
//                                         ? room.priceWithMealPartialRefund?.price
//                                         : selectedMeal[roomIndex]
//                                         ? room.priceWithMealNoRefund?.price
//                                         : selectedRefund[roomIndex]
//                                         ? room.priceWithoutMealPartialRefund?.price
//                                         : room.priceWithoutMealNoRefund.price}
//                                 </p>
//                             </div>
//                             <button
//                                 className="reserve-button"
//                                 onClick={() => handleReservation(roomIndex)}
//                             >
//                                 Reserve
//                             </button>
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         </>
//     );
// };

// export default HotelPage;

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
    main_name: string[];
    room_images: string[][];
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

interface RoomPrice {
    price: number;
    amenities: string[];
    miscRoom: string;
    meal: string;
    cancellation: string;
    refundable: boolean;
}

interface HotelRoom {
    name: string;
    priceWithoutMealNoRefund: RoomPrice;
    priceWithMealNoRefund?: RoomPrice;
    priceWithoutMealPartialRefund?: RoomPrice;
    priceWithMealPartialRefund?: RoomPrice;
    type: string;
    room_data_trans: {
        main_room_type: string;
        main_name: string;
        bathroom: string;
        bedding_type: string;
        misc_room_type: string;
    };
}

const HotelPage = () => {
    console.log("I'm here in Hotel Page");
    const [hotelData, setHotelData] = useState<HotelDetails | null>(null);
    const [searchParams, setSearchParams] = useState<HotelSearchParams | null>(null);
    const [hoveredPriceIndex, setHoveredPriceIndex] = useState<{ roomIndex: number | null, priceIndex: number | null }>({ roomIndex: null, priceIndex: null });
    const [rooms, setRooms] = useState<HotelRoom[]>([]);
    const [dataFetched, setDataFetched] = useState(false);
    const [selectedMeal, setSelectedMeal] = useState<{ [key: number]: boolean }>({});
    const [selectedRefund, setSelectedRefund] = useState<{ [key: number]: boolean }>({});
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
        }
    }, []);

    useEffect(() => {
        const getRooms = async () => {
            if (!hotelData || !searchParams || dataFetched) return;
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
            const hashmap: { [key: string]: string[] } = {};

            try {
                const response = await axios.post("http://localhost:3002/hotels/rooms", body);
                const hotelsData = response.data.data.hotels;
                if (hotelsData.length > 0) {
                    console.log('API response hotelsData:', hotelsData); // Log the response data

                    const updatedHotelData = { ...hotelData, room_groups: hotelsData[0].room_groups }; // Ensure room_groups are set
                    setHotelData(updatedHotelData);
                    setDataFetched(true); 
                    console.log('Updated hotelData with main_name:', updatedHotelData.main_name);
                    console.log('Updated hotelData with room_images:', updatedHotelData.room_images);

                    const roomGroups: { [key: string]: HotelRoom } = {};
                    hotelsData[0].rates.forEach(rate => {
                        console.log("Room json: ", rate);
                        const rateMainName = rate.room_data_trans.main_name.trim();

                        let refundable = false;
                        if (
                            rate.payment_options &&
                            rate.payment_options.payment_types &&
                            rate.payment_options.payment_types[0] &&
                            rate.payment_options.payment_types[0].cancellation_penalties &&
                            rate.payment_options.payment_types[0].cancellation_penalties.policies &&
                            rate.payment_options.payment_types[0].cancellation_penalties.policies[0]
                        ) {
                            const policy = rate.payment_options.payment_types[0].cancellation_penalties.policies[0];
                            refundable = policy.amount_charge !== rate.daily_prices[0];
                        }

                        const roomPrice = {
                            price: parseFloat(rate.daily_prices[0]),
                            amenities: rate.amenities_data || [],
                            miscRoom: rate.room_data_trans.misc_room_type,
                            meal: rate.meal,
                            cancellation: refundable ? "Partial Refund" : "No Refund",
                            refundable: refundable
                        };

                        const sortedMiscRoomType = rate.room_data_trans.misc_room_type
                            ? rate.room_data_trans.misc_room_type.split(', ').sort().join(', ')
                            : '';

                        const roomKey = `${rate.room_data_trans.main_room_type}-${rate.room_data_trans.main_name}-${rate.room_data_trans.bathroom}-${rate.room_data_trans.bedding_type}-${sortedMiscRoomType}`;
                        console.log("RoomKey: ", roomKey);

                        if (!roomGroups[roomKey]) {
                            roomGroups[roomKey] = {
                                name: rate.room_name,
                                priceWithoutMealNoRefund: roomPrice,
                                type: rateMainName,
                                room_data_trans: rate.room_data_trans
                            };
                        } else {
                            if (rate.meal === 'breakfast' && !refundable) {
                                roomGroups[roomKey].priceWithMealNoRefund = roomPrice;
                            } else if (rate.meal !== 'breakfast' && refundable) {
                                roomGroups[roomKey].priceWithoutMealPartialRefund = roomPrice;
                            } else if (rate.meal === 'breakfast' && refundable) {
                                roomGroups[roomKey].priceWithMealPartialRefund = roomPrice;
                            } else {
                                roomGroups[roomKey].priceWithoutMealNoRefund = roomPrice;
                            }
                        }
                    });

                    console.log(roomGroups);

                    const groupedRooms = Object.values(roomGroups);
                    setRooms(groupedRooms);
                    console.log('Grouped room details:', groupedRooms);
                    setDataFetched(true);
                }
            } catch (error) {
                console.error('Error fetching room data:', error);
            }
        };

        getRooms();
    }, [hotelData, searchParams, dataFetched]);

    if (!hotelData) {
        return <p>Loading...</p>;
    }

    const handleReservation = (roomIndex: number) => {
        const includeMeal = selectedMeal[roomIndex];
        const includeRefund = selectedRefund[roomIndex];
        let roomToReserve = rooms[roomIndex].priceWithoutMealNoRefund;

        if (includeMeal && includeRefund) {
            roomToReserve = rooms[roomIndex].priceWithMealPartialRefund || roomToReserve;
        } else if (includeMeal && !includeRefund) {
            roomToReserve = rooms[roomIndex].priceWithMealNoRefund || roomToReserve;
        } else if (!includeMeal && includeRefund) {
            roomToReserve = rooms[roomIndex].priceWithoutMealPartialRefund || roomToReserve;
        }

        localStorage.setItem('currentRoom', JSON.stringify(roomToReserve));
        const { id } = router.query;
        router.push(`/review-booking?id=${id}`);
    };

    const handleMealSelection = (roomIndex: number, includeMeal: boolean) => {
        setSelectedMeal(prevState => ({
            ...prevState,
            [roomIndex]: includeMeal
        }));

        if (includeMeal && !rooms[roomIndex].priceWithMealPartialRefund) {
            setSelectedRefund(prevState => ({
                ...prevState,
                [roomIndex]: false
            }));
        } else if (!includeMeal && !rooms[roomIndex].priceWithoutMealPartialRefund) {
            setSelectedRefund(prevState => ({
                ...prevState,
                [roomIndex]: false
            }));
        }
    };

    const handleRefundSelection = (roomIndex: number, includeRefund: boolean) => {
        setSelectedRefund(prevState => ({
            ...prevState,
            [roomIndex]: includeRefund
        }));

        if (includeRefund && !rooms[roomIndex].priceWithMealPartialRefund) {
            setSelectedMeal(prevState => ({
                ...prevState,
                [roomIndex]: false
            }));
        } else if (!includeRefund && !rooms[roomIndex].priceWithMealNoRefund) {
            setSelectedMeal(prevState => ({
                ...prevState,
                [roomIndex]: false
            }));
        }
    };

    return (
        <>
            <div className="hotel-container">
                <div className="hotel-header">
                    <h1>{hotelData.name}</h1>
                    <p className="subtitle">{hotelData.address}</p>
                    <div className="rating">{Array(hotelData.starRating).fill('⭐').join('')}</div>
                </div>
                <div className="hotel-details">
                    <div className="hotel-info">
                        <h2>About</h2>
                        <p>{hotelData.description}</p>
                        <h2>Price: ${hotelData.price}</h2>
                    </div>
                    <div className="hotel-amenities">
                        <h2>Popular Amenities</h2>
                    </div>
                </div>
            </div>
            <div className="room-container">
                {rooms.map((room, roomIndex) => (
                    <div key={roomIndex} className="room-card">
                        <div className="room-content">
                            <h2 className="room-title">{room.name}</h2>
                            <div className="price-info">
                                <p>Base Price: ${room.priceWithoutMealNoRefund.price}</p>
                                <div className="extras">
                                    <label>
                                        <input
                                            type="radio"
                                            name={`meal-${roomIndex}`}
                                            checked={selectedMeal[roomIndex] === false}
                                            onChange={() => handleMealSelection(roomIndex, false)}
                                        />
                                        No Meal + $0
                                    </label>
                                    {room.priceWithMealNoRefund && (
                                        <label>
                                            <input
                                                type="radio"
                                                name={`meal-${roomIndex}`}
                                                checked={selectedMeal[roomIndex] === true}
                                                onChange={() => handleMealSelection(roomIndex, true)}
                                            />
                                            Meal + ${room.priceWithMealNoRefund.price - room.priceWithoutMealNoRefund.price}
                                        </label>
                                    )}
                                </div>
                                <div className="extras">
                                    <label>
                                        <input
                                            type="radio"
                                            name={`refund-${roomIndex}`}
                                            checked={selectedRefund[roomIndex] === false}
                                            onChange={() => handleRefundSelection(roomIndex, false)}
                                        />
                                        No Refund
                                    </label>
                                    {room.priceWithoutMealPartialRefund && (
                                        <label>
                                            <input
                                                type="radio"
                                                name={`refund-${roomIndex}`}
                                                checked={selectedRefund[roomIndex] === true}
                                                onChange={() => handleRefundSelection(roomIndex, true)}
                                            />
                                            Partial Refund
                                        </label>
                                    )}
                                </div>
                                <p>
                                    Total Price: $
                                    {selectedMeal[roomIndex] && selectedRefund[roomIndex]
                                        ? room.priceWithMealPartialRefund?.price
                                        : selectedMeal[roomIndex]
                                        ? room.priceWithMealNoRefund?.price
                                        : selectedRefund[roomIndex]
                                        ? room.priceWithoutMealPartialRefund?.price
                                        : room.priceWithoutMealNoRefund.price}
                                </p>
                            </div>
                            <button
                                className="reserve-button"
                                onClick={() => handleReservation(roomIndex)}
                            >
                                Reserve
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default HotelPage;
