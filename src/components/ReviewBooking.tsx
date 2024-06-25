import { useRouter } from 'next/router';
import axios, { AxiosResponse } from 'axios';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { v4 as uuid } from 'uuid';
import '../styles/App.css';

interface HotelSpecifics {
    "id": string;
    "name": string;
    "address": string;
    "starRating": number;
    "amenities": string[];
    "price": number;
    "images": string[];
    "description": string;
}

interface HotelPage {
    "checkin": string, 
    "checkout": string, 
    "guests": {
        adults: number;
        children: {
            age: number;
        }[];
    }[];
    "language": string,
    "currency": string,
}

interface HotelRoom {
    "name": string;
    "price": number;
    "type": string;
}

interface BookingResponse { 
    "partnerID": string, 
    "objectID": string, 
    "pUUID": string,
    "credit": boolean,
    "userName": string[],
    "confirmation": string
};

interface CoreData {
    "year": string, 
    "card_number": string,
    "card_holder": string, 
    "month": string
};

interface TokenFormat {
    "object_id": string,
    "pay_uuid": string,
    "init_uuid": string,
    "user_first_name": string,
    "user_last_name": string,
    "cvc"?: string,
    "credit_card_data_core": CoreData,
    "is_cvc_required": boolean,
};

const dummyHotelSelected: HotelPage = {
    "checkin": "2024-06-19",
    "checkout": "2024-06-21",
    "guests": [
        {
            "adults": 1,
            "children": []
        }
    ],
    "language": "en", 
    "currency": "USD"
  };

const dummyProps = {
    reviews: 60,
    taxes: '$232',
    refund: 'Non-Refundable',
    cancellation: '...'
};

const ReviewBooking: React.FC = () => {
    const router = useRouter();
    const [hotel, setHotel] = useState<HotelPage>(dummyHotelSelected);
    const [booking, setBooking] = useState<string>("");
    const [status, setStatus] = useState<string>("");
    const [user, setUser] = useState<string>("");
    const [room, setRoom] = useState<HotelRoom>({
        name: "",
        price: 0,
        type: ""
    });
    const [parameters, setParameters] = useState<HotelPage>({
        "checkin": "", 
        "checkout": "", 
        "guests": [{
            "adults": 1,
            "children": [] 
        }],
        "language": "",
        "currency": ""
    });
    const [specifics, setSpecifics] = useState<HotelSpecifics>({
        id: "",
        name: "",
        address: "",
        starRating: 0,
        amenities: [""],
        price: 0,
        images: [""],
        description: "",
    });
    const [pid, setPid] = useState<string>("");
    const [orderID, setOrderID] = useState<string>("");
    const [dataCore, setDataCore] = useState<CoreData>({
        "year": "", // || "18"
        "card_number": "", // || "4111111111111111"
        "card_holder": "", // || "TEST"
        "month": "" // || "05"
    });
    const [cvcNum, setCvcNum] = useState<string>("");
    useEffect(() => {
        const room = localStorage.getItem('currentRoom');
        const params = localStorage.getItem('searchParams');
        const specifics = localStorage.getItem('currentHotelData');
        if (room && params && specifics) {
            setRoom(JSON.parse(room));
            setParameters(JSON.parse(params));
            setSpecifics(JSON.parse(specifics));
        };
        setBooking("");
        setStatus("");
    }, []);

    const handleBooking = async (): Promise<void> => {
        try {
            setStatus('Please wait a moment.');
            const bookCall: AxiosResponse<{ status: string, data: BookingResponse }> = await axios.post('http://localhost:3002/booking/create', {
                id: "test_hotel_do_not_book" || specifics.id,
                checkin: parameters.checkin,
                checkout: parameters.checkout,
                guests: [
                    {
                        "adults": parameters.guests[0].adults,
                        "children": parameters.guests[0].children.length && [parameters.guests[0].children.length] || [] 
                    }
                ],
                currency: parameters.currency,
                language: parameters.language
                }, 
                { headers: {"Content-Type" : "application/json"},
                withCredentials: true }
            );
            const { status, data } = bookCall.data;
            setBooking(status);
            setStatus('Finalizing...');
            const { partnerID, objectID, pUUID, credit, userName, confirmation } = data;
            setUser(userName.join(' '));
            setOrderID(confirmation);
            await handleStatus(partnerID);
            if (credit) { 
                await creditTokenization(objectID, pUUID, credit, userName)
            };
            seeConfirm(partnerID, userName.join(' '), confirmation);
        } catch (e) {
            console.error(e);
        };
    };

    const handleStatus = async (partner?: string): Promise<void> => {
        try {
            if (partner) {
                setPid(partner);
            };
            const statusCall: AxiosResponse<{ status: string, data: string }> = await axios.get('http://localhost:3002/booking/status', {
                params: { pID: partner },  
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true
            });
            const { status, data } = statusCall.data;
            if (data =='ok') {
                setStatus(status);
            };
        } catch (e) {
            console.error(e);
        };
    };
    
    const handleCoreChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        event.preventDefault();
        const { name, value } = event.target;
        setDataCore(prevParams => ({
            ...prevParams,
            [name]: value
        }));
    };

    const creditTokenization = async (itemID: string, payUID: string, code: boolean, name: string[]) => {
        const initUUID: string = uuid();
        const body: TokenFormat = {
            "object_id": itemID,
            "pay_uuid": payUID,
            "init_uuid": initUUID,
            "user_first_name": name[0],
            "user_last_name": name[1],
            "cvc": cvcNum,
            "is_cvc_required": code,
            "credit_card_data_core": dataCore
        };
        const creditCall: AxiosResponse<{ status: string, data: string }> = await axios.post('http://localhost:3002/booking/credit', 
            body, 
            { headers: { 'Content-Type': 'application/json' }, 
            withCredentials: true
        });
        const { status, data } = creditCall.data;
        if (data == 'ok') {
            setStatus(status);
            seeConfirm(pid, user, orderID);
        };
    };

    const seeConfirm = (partner?: string, name?: string, confirm?: string): void => {
        const sendObj = { pID: pid || partner, userName: name, confirmNum: confirm };
        const objectString = JSON.stringify(sendObj);
        router.push(`/confirmation/?details=${encodeURIComponent(objectString)}`)
    };

    //getInitialProps()

    return (
        <div>
            <div style={{ marginTop: '2%' }}>
                <label style={{ marginLeft: '10%'}}>{'< Review Your Booking'}</label>
                <div style={{ display: 'flex', 
                flexDirection: 'column', 
                width: '51.5%',
                marginLeft: '10%',
                marginTop: '2%',
                borderStyle: 'solid'
                }}>
                    <div style={{ display: 'flex'}}>
                        <div style={{ padding: '1%'}}>
                            <Image src={specifics.images[0].replace('{size}', '200x200')} alt='hotel image' width={200} height={200} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div className='review-hotel'>
                                <label>{specifics.id.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}</label>
                            </div>
                            <div style={{ padding: '1%', marginBottom: '0.5%' }}>
                                <label>{Array(specifics.starRating).fill('⭐').join('')}</label>
                                <label> | {dummyProps.reviews} reviews</label>
                            </div>
                            <div className='arbitrary'>
                                <label>{specifics.address}</label>
                            </div>
                            <div style={{ padding: '1%', marginBottom: '5%', marginLeft: '41%', marginTop: '10%', width: '140%' }}>
                                <label>{room.type}</label>
                            </div>
                        </div>
                    </div>
                    <div className='amenities'>
                        {specifics.amenities.slice(0, 20).map(feat => (
                            <label>{feat}</label>
                        ))}
                    </div>
                </div>
                <div style={{ display: 'flex', 
                flexDirection: 'column', 
                width: '51.5%',
                marginLeft: '10%',
                marginTop: '1%',
                borderStyle: 'solid'
                }}>
                    <div style={{ display: 'flex', 
                    flexDirection: 'row',
                    padding: '1%', 
                    justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ marginBottom: '8%' }}>
                                Checkin:
                            </div>
                            <div style={{ color: 'navy', fontWeight: '600' }}>
                                {parameters.checkin}
                            </div>
                        </div>
                        <div>
                            <div style={{ marginBottom: '8%' }}>
                                Checkout:
                            </div>
                            <div style={{ color: 'navy', fontWeight: '600' }}>
                                {parameters.checkout}
                            </div>
                        </div>
                        <div>
                            <div style={{ marginBottom: '8%' }}>
                                Booking For:
                            </div>
                            <div style={{ color: 'navy', fontWeight: '600' }}>
                                {parameters.guests[0].adults} Adults, {parameters.guests[0].children.length} Children
                            </div>
                        </div>
                    </div>
                    <div style={{ padding: '1%', marginTop: '1%' }}>
                        <label>Room Only, {dummyProps.refund}</label>
                    </div>
                    <div style={{ padding: '1%', marginTop: '1%' }}>
                        <label>View Booking and Cancellation Policy</label>
                    </div>
                </div>
                <div style={{ display: 'flex', 
                flexDirection: 'column', 
                width: '55%',
                marginLeft: '10%',
                marginTop: '1%'
                }}>
                    <div style={{ display: 'flex', 
                    flexDirection: 'row',
                    justifyContent: 'start', 
                    marginBottom: '6%' }}>
                        <div style={{ marginRight: '30%'}}>
                            <input 
                            type='text' 
                            placeholder='Card Holder' 
                            name='card_holder' 
                            onChange={handleCoreChange}
                            style={{ width: '250%', height: '250%' }} />
                        </div>
                        <div>
                            <input 
                            type='text'
                            placeholder='Expiration Month (MM)' 
                            name='month'
                            onChange={handleCoreChange}
                            style={{ width: '125%', height: '250%' }} />
                        </div>
                        <div>
                            <input type='text' 
                            placeholder='Expiration Year (YY)' 
                            name='year'
                            onChange={handleCoreChange} 
                            style={{ marginLeft: '25%', width: '125%', height: '250%' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', 
                    flexDirection: 'row',
                    justifyContent: 'start', 
                    marginBottom: '6%' }}>
                        <div style={{ marginRight: '25.55%'}}>
                            <input 
                            type='text'
                            placeholder='Card Number (1234 1234 1234 1234)'
                            name={"card_number"} 
                            value={dataCore.card_number} 
                            onChange={handleCoreChange}
                            style={{ width: '250%', height: '250%' }} />
                        </div>
                        <div>
                            <input type='text' 
                            placeholder='CVC' 
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                event.preventDefault();
                                setCvcNum(event.target.value); 
                            }} 
                            style={{ marginLeft: '25%', width: '125%', height: '250%' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', 
                    flexDirection: 'row',
                    justifyContent: 'start', 
                    marginBottom: '3%' }}>
                        <div style={{ marginRight: '30%'}}>
                            <select style={{ width: '350%', height: '250%' }}>
                                <option>United States</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <input placeholder='ZIP' style={{ marginLeft: '29%', width: '250%', height: '250%' }} />
                        </div>
                    </div>
                    <button style={{ width: '93.5%', marginTop: '3.5%'}} onClick={() => handleBooking()}>Book Now</button>
                    <label>{booking}</label>
                    <label>{status}</label>
                </div>
            </div>
            <div style={{ top: '10.1%', 
            left: '62.5%', 
            display: 'flex',
            flexDirection: 'column',
            position: 'absolute',
            width: '25%',
            borderStyle: 'solid',
            padding: '1%',
            zIndex: '9999'
            }}>
                <div className='review-hotel' style={{ marginBottom: '2%' }}>
                    <label>Price Summary</label>
                </div>
                <div className='review-hotel' style={{ backgroundColor: 'navy', width: '100%', padding: '2%', color: 'white', marginBottom: '2%' }}>
                    <label>Description</label>
                </div>
                <div style={{ padding: '1%', marginTop: '1%', marginBottom: '2%' }}>
                    <label>Room: {room.type}</label>
                </div>
                <div style={{ padding: '1%', marginTop: '1%', display: 'flex', justifyContent: 'space-between', marginBottom: '2%' }}>
                    <label>Retail Price:</label>
                    <label>{room.price}</label>
                </div>
                <hr />
                <div style={{ padding: '1%', marginTop: '1%', display: 'flex', justifyContent: 'space-between', marginBottom: '2%' }}>
                    <label>Booking Cost:</label>
                    <label>${specifics.price}</label>
                </div>
                <div style={{ padding: '1%', marginTop: '1%', display: 'flex', justifyContent: 'space-between', marginBottom: '2%' }}>
                    <label>Taxes and Fees:</label>
                    <label>{dummyProps.taxes}</label>
                </div>
                <hr />
                <div style={{ padding: '1%', marginTop: '1%', display: 'flex', justifyContent: 'space-between', marginBottom: '2%' }}>
                    <label>To Pay:</label>
                    <label>{`$${Number(room.price) + Number(dummyProps.taxes.slice(1))}`}</label>
                </div>
                <div style={{ padding: '1%', marginTop: '1%', display: 'flex', justifyContent: 'space-between', marginBottom: '2%' }}>
                    <input placeholder='Guest Name' onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setUser(e.target.value)
                    }}/>
                </div>
            </div>
        </div>
    )
};

export default ReviewBooking;