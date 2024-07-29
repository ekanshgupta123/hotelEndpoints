import React, { useEffect, useState } from 'react';
import axios, { AxiosResponse } from 'axios';
import { useRouter } from 'next/router';
import '../styles/HotelDisplay.css';

interface HotelDetails {
    id: string;
    price: number;
    name?: string;
    address?: string;
    star_rating?: number;
    images?: string[];
    amenity_groups: AmenityGroup[];
    description_struct: DescriptionStruct[];
    room_groups: RoomGroup[];
}

interface AmenityGroup {
    group_name: string;
    amenities: string[];
}

interface DescriptionStruct {
    title: string;
    paragraphs: string[];
}

interface RoomGroup {
    room_group_id: number;
    images: string[];
    name: string;
    room_amenities: string[];
    rg_ext: {
        class: number;
        quality: number;
        sex: number;
        bathroom: number;
        bedding: number;
    };
    name_struct: {
        main_name: string;
        bathroom: string | null;
        bedding_type: string | null;
    };
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
    key: string;
    name: string;
    price: number;
    amenities: string[];
    miscRoom: string | null;
    meal: string;
    cancellation_type: string;
    cancellation: string;
    refundable: boolean;
    taxes: any;
}

interface HotelRoom {
    name?: string;
    priceWithoutMealNoRefund: RoomPrice;
    priceWithMealNoRefund?: RoomPrice;
    priceWithoutMealPartialRefund?: RoomPrice;
    priceWithMealPartialRefund?: RoomPrice;
    priceWithoutMealFullRefund?: RoomPrice;
    priceWithMealFullRefund?: RoomPrice;
    hotel: string;
    options: RoomPrice[];
    type: string;
    room_data_trans?: {
        main_room_type: string;
        main_name: string;
        bathroom: string;
        bedding_type: string;
        misc_room_type: string;
    };
    meal?: string;
}

const HotelPage = () => {
    console.log("I'm here in Hotel Page");
    const [hotelData, setHotelData] = useState<HotelDetails | null>(null);
    const [searchParams, setSearchParams] = useState<HotelSearchParams | null>(null);
    const [dataFetched, setDataFetched] = useState(false);
    const [stuff, setStuff] = useState<{ [key: string]: HotelRoom }>({});
    const [hotelPrice, setHotelPrice] = useState(0);
    const [toggleStates, setToggleStates] = useState<boolean[]>([]);
    const [groups, setGroups] = useState<string[][]>([['']]);
    const [imgMap, setImgMap] = useState<{ [key: string]: number }>({});
    const router = useRouter();

    useEffect(() => {
        const fetchedHotelData = localStorage.getItem('currentHotelData');
        const fetchedSearchParams = localStorage.getItem('searchParams');
        const fetchedPriceParams = localStorage.getItem('priceParams');
        if (fetchedHotelData) {
            const parsedHotelData = JSON.parse(fetchedHotelData);
            console.log('Fetched hotelData:', parsedHotelData);
            setHotelData(parsedHotelData);
        }
        if (fetchedSearchParams) {
            const parsedSearchParams = JSON.parse(fetchedSearchParams);
            console.log('Fetched searchParams:', parsedSearchParams);
            setSearchParams(parsedSearchParams);
        }
        if (fetchedPriceParams) {
            const parsedPriceParams = JSON.parse(fetchedPriceParams);
            console.log('Fetched priceParams: ', parsedPriceParams);
            setHotelPrice(parsedPriceParams);
        }
    }, []);

    const rateLookup = async (id, rate) => {
        const match: AxiosResponse = await axios.post("http://localhost:5001/hotels/rate", { id: id, room: rate });
        const lookup: string[] = await match.data;
        return lookup;
    };

    useEffect(() => {
        const getRooms = async () => {
            if (!hotelData || !searchParams || dataFetched) return;

            const body = {
                checkin: searchParams.checkin,
                checkout: searchParams.checkout,
                residency: "us",
                language: "en",
                guests: searchParams.guests,
                id: hotelData.id,
                currency: "USD"
            };

            try {
                const response = await axios.post("http://localhost:5001/hotels/rooms", body);
                const hotelsData = response.data.data.hotels;
                if (hotelsData.length > 0) {
                    const updatedHotelData = { ...hotelData, room_groups: hotelsData[0].room_groups };
                    setHotelData(updatedHotelData);
                    setDataFetched(true);

                    // const images = await Promise.all(hotelsData[0].rates.map(async (rate) => {
                    //     return await rateLookup(hotelData.id, rate.rg_ext);
                    // }));

                    // setGroups(images);

                    // const input = hotelsData[0].rates.map(rate => rate.room_name);
                    // const chatModel: AxiosResponse = await axios.post('http://localhost:3000/api/chat', input);
                    // const groupings = chatModel.data.answer.groups;
                    // console.log(groupings);
                    // setGroups(groupings);

                    const roomGroups: { [key: string]: HotelRoom } = {};
                    hotelsData[0].rates.forEach((rate: any, index) => {
                        const options = {
                            year: 'numeric' as 'numeric',
                            month: 'long' as 'long',
                            day: 'numeric' as 'numeric',
                            hour: 'numeric' as 'numeric',
                            minute: 'numeric' as 'numeric',
                            second: 'numeric' as 'numeric',
                            hour12: true
                        };

                        let refundable: boolean = false;
                        let extent: string = '';
                        let refundPolicy: string = '';
                        if (
                            rate.payment_options &&
                            rate.payment_options.payment_types &&
                            rate.payment_options.payment_types[0] &&
                            rate.payment_options.payment_types[0].cancellation_penalties &&
                            rate.payment_options.payment_types[0].cancellation_penalties.policies
                        ) {
                            const policy = rate.payment_options.payment_types[0].cancellation_penalties.policies;
                            policy.length > 2
                                ? (extent = 'Full Refund', refundable = true, refundPolicy = `Full Refund of $${Number(rate.daily_prices[0])} until ${new Date(policy[0].end_at).toLocaleDateString('en-US', options)}.\n Partial Refund of $${Number(rate.daily_prices[0]) - Number(policy[1].amount_charge)} starting ${new Date(policy[1].start_at).toLocaleDateString('en-US', options)}\n     until ${new Date(policy[1].end_at).toLocaleDateString('en-US', options)}.`)
                                : (policy.length > 1
                                    ? (policy[0].amount_charge == '0.00'
                                        ? (extent = 'Full Refund', refundable = true, refundPolicy = `Full Refund of $${Number(rate.daily_prices[0]) - Number(policy[0].amount_charge)} until ${new Date(policy[0].end_at).toLocaleDateString('en-US', options)}.`)
                                        : (extent = 'Partial Refund', refundable = true, refundPolicy = `Partial Refund of $${Number(rate.daily_prices[0]) - Number(policy[0].amount_charge)} until ${new Date(policy[0].end_at).toLocaleDateString('en-US', options)}.`))
                                    : (extent = 'No Refund', refundable = false, refundPolicy = 'Non-refundable.'));
                        };

                        const roomKey = `${rate.room_data_trans.main_room_type}${rate.room_data_trans.bedding_type != null && ` - ${rate.room_data_trans.bedding_type}` || ''}`;

                        const roomPrice = {
                            key: roomKey,
                            name: rate.room_name,
                            price: parseFloat(rate.daily_prices[0]),
                            amenities: [...rate.amenities_data, ...rate.serp_filters] || [],
                            miscRoom: rate.room_data_trans.misc_room_type || null,
                            meal: rate.meal,
                            cancellation_type: extent,
                            cancellation: refundPolicy,
                            refundable: refundable,
                            taxes: rate.payment_options.payment_types[0].tax_data.taxes,
                        };

                        !roomGroups[roomKey]
                            ? roomGroups[roomKey] = {
                                type: rate.room_data_trans.main_name,
                                hotel: hotelData.id,
                                priceWithoutMealNoRefund: roomPrice,
                                options: [roomPrice]
                            }
                            : roomGroups[roomKey].options.push(roomPrice);
                    });

                    setStuff(roomGroups);
                    setDataFetched(true);
                }
            } catch (error) {
                console.error('Error fetching room data:', error);
            };
        };
        getRooms();
    }, [hotelData, searchParams, dataFetched]);

    if (!hotelData) {
        return <p>Loading...</p>;
    };

    const combineParagraphs = (descriptionStruct: DescriptionStruct[]): string => {
        return descriptionStruct.map(desc => desc.paragraphs.join(' ')).join(' ');
    };

    const handleToggle = (index) => {
        setToggleStates((prevStates) => {
            const newStates = [...prevStates];
            newStates[index] = !newStates[index];
            return newStates;
        });
    };

    const handleDots = (index, size) => {
        if (!size) return null;
        const dots = Array(size).fill('◦');
        dots[index] = '•';
        return (dots.map((dot, idx) => <label key={idx}>{dot}</label>));
    };

    const handleDecrease = (key, group) => {
        if (!group || group.length === 0) return null;
        const value = imgMap[key];
        if (value || value === 0) {
            let result;
            value === 0
                ? (result = <label key={key}>{group[0]}</label>, setImgMap(prevMap => ({
                    ...prevMap,
                    [key]: group.length - 1
                })))
                : (result = <label key={key}>{group[value + 1]}</label>, setImgMap(prevMap => ({
                    ...prevMap,
                    [key]: value - 1
                })));
            return result;
        } else {
            setImgMap(prevMap => ({
                ...prevMap,
                [key]: group.length - 1
            }));
            return <label key={key}>{group[1]}</label>
        };
    };

    const handleIncrease = (key, group) => {
        if (!group || group.length === 0) return null;
        const value = imgMap[key];
        if (value) {
            let result;
            value === group.length - 1
                ? (result = <label key={key}>{group[0]}</label>, setImgMap(prevMap => ({
                    ...prevMap,
                    [key]: 0
                })))
                : (result = <label key={key}>{group[value + 1]}</label>, setImgMap(prevMap => ({
                    ...prevMap,
                    [key]: value + 1
                })));
            return result;
        } else {
            setImgMap(prevMap => ({
                ...prevMap,
                [key]: 1
            }));
            return <label key={key}>{group[1]}</label>
        };
    };

    const handleReservation = (roomToReserve: RoomPrice, images: string[]) => {
        console.log("Room to reserve: ", roomToReserve);
        localStorage.setItem('currentRoom', JSON.stringify(roomToReserve));
        localStorage.setItem('images', JSON.stringify(images));
        const { id } = router.query;
        router.push(`/review-booking?id=${id}`);
    };

    return (
        <>
            <div className="hotel-container">
                <div className="hotel-header">
                    <h1>{hotelData.name}</h1>
                    <p className="subtitle">{hotelData.address}</p>
                    <div className="rating">{Array(hotelData.star_rating).fill('⭐').join('')}</div>
                </div>
                <div className="hotel-images">
                    {hotelData.images?.slice(0, 5).map((image, index) => (
                        <img key={index} src={image.slice(0, 27) + "240x240" + image.slice(33)} alt={`View of ${hotelData.name}`} />
                    ))}
                </div>
                <div className="hotel-details">
                    <div className="hotel-info">
                        <h2>About</h2>
                        <p>{combineParagraphs(hotelData.description_struct)}</p>
                        <h2>Price: ${hotelPrice}</h2>
                    </div>
                    <div className="hotel-amenities">
                        <h2>Popular Amenities</h2>
                        {hotelData.amenity_groups[0].amenities.slice(0, 9).map((amenity, index) => (
                            <li key={index}>{amenity}</li>
                        ))}
                    </div>
                </div>
            </div>
            <div style={{ fontFamily: 'Roboto, sans-serif' }}>
                {Object.entries(stuff).map(([key, value], index) => (
                    <div key={index} style={{ borderRadius: '8px', padding: '1%', marginBottom: '2%', boxShadow: '2px 2px 6px #888888' }}>
                        <div onClick={() => handleToggle(index)} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '22px' }}>
                            <label>{key}</label>
                            <label>{!toggleStates[index] ? '▿' : '▴'}</label>
                        </div>
                        {toggleStates[index] &&
                            <div>
                                <div style={{ display: 'flex', backgroundColor: 'red', marginTop: '1%', color: 'white', padding: '0.5%' }}>
                                    <p style={{ width: '13.25%' }}>Images</p>
                                    <p style={{ width: '19%' }}>Features</p>
                                    <p style={{ width: '4.65%' }}>Meal</p>
                                    <p style={{ width: '9.60%' }}>Refund</p>
                                    <p style={{ width: '43%' }}>Refund Policy</p>
                                    <p>Pricing</p>
                                </div>
                                {value.options.map((option, idx) => (
                                    <div key={idx}>
                                        <div style={{ display: 'flex', border: '1px solid black', padding: '0.5%', marginBottom: '10px', marginTop: '1%' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '1.5%' }}>
                                                <div style={{ display: 'flex' }}>
                                                    <button onClick={() => handleDecrease(`${index}-${idx}`, groups[index])}
                                                        disabled={!groups[index] || groups[index].length === 1}
                                                        style={{ width: '14%', height: '14%', borderRadius: '20px', marginTop: '41%', marginRight: '2%', borderWidth: '1px', backgroundColor: 'transparent' }}>{'<'}</button>
                                                    <img src={groups[index]?.[imgMap[`${index}-${idx}`] || 0]?.replace('{size}', '120x120')} alt='Room Image' style={{ marginRight: '1%', marginTop: '10%' }} />
                                                    <button onClick={() => handleIncrease(`${index}-${idx}`, groups[index])}
                                                        disabled={!groups[index] || groups[index].length === 1}
                                                        style={{ width: '14%', height: '14%', borderRadius: '20px', marginTop: '40%', marginLeft: '1.5%', borderWidth: '1px', backgroundColor: 'transparent' }}>{'>'}</button>
                                                </div>
                                                <p>{handleDots(imgMap[`${index}-${idx}`] || 0, groups[index]?.length || 0)}</p>
                                            </div>
                                            <div style={{ width: '20%', display: 'flex', flexDirection: 'column' }}>
                                                {option.miscRoom && option.miscRoom.split(', ').sort().map((qual, index) => {
                                                    const quality = qual[0] !== '+' ? (qual[0].toUpperCase() + qual.slice(1,)) : (qual[2].toUpperCase() + qual.slice(3,));
                                                    return <p key={index}> + {quality}</p>
                                                })}
                                                <div style={{ border: '1px solid black', width: '90%', marginTop: '6%', padding: '1%' }}>
                                                    <label>Room amenities: </label>
                                                    {option.amenities.map((amenity, index) => <label key={index}>{index !== option.amenities.length - 1 ? amenity.replace('_', ' ') + ',' : amenity.replace('_', ' ')} </label>)}
                                                </div>
                                            </div>
                                            {option.meal === 'breakfast' ? (<p style={{ width: '5%' }}>✓</p>) : (<p style={{ width: '5%' }}>-</p>)}
                                            {option.refundable === true ? (<p style={{ width: '10%' }}>✓</p>) : (<p style={{ width: '10%' }}>-</p>)}
                                            <div style={{ width: '45%' }}>
                                                {option.cancellation.includes('\n') ? option.cancellation.split('\n').map((opt, index) => <p key={index} style={{ whiteSpace: 'pre-wrap' }}>{index === 1 ? ('↳' + opt) : opt}</p>)
                                                    : (<p>{option.cancellation}</p>)}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <p style={{ width: '10%' }}>${option.price}</p>
                                                {option.taxes.map((tax, index) => <label key={index} style={{ fontSize: '12px', width: '85%' }}>+ ${tax.amount} as {tax.name.replace('_', ' ')}</label>)}
                                                <button style={{ marginTop: '10%', width: '85%' }} onClick={() => handleReservation(option, groups[index])}>Reserve Room</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>}
                    </div>
                ))}
            </div>
        </>
    );
};

export default HotelPage;
