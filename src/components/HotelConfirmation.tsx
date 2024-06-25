import React, {useState, useEffect } from "react"
import axios, { AxiosResponse } from 'axios';
import Image from 'next/image';

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

interface Additional {
    pID: string, 
    userName: string,
    confirmNum: string
}


const Confirm = () => {
    const [cancelSelect, setCancelSelect] = useState<boolean>(true);
    const [cancel, setCancel] = useState<string>("");
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
    const [addData, setAddData] = useState<Additional>({
        pID: "",
        userName: "",
        confirmNum: ""
    })

    useEffect(() => {
        const windowParam = new URLSearchParams(window.location.search);
        const objectPassed = windowParam.get('details');
        if (objectPassed) {
            setAddData(JSON.parse(objectPassed));
        };
        console.log(objectPassed)
        const room = localStorage.getItem('currentRoom');
        const params = localStorage.getItem('searchParams');
        const specifics = localStorage.getItem('currentHotelData');
        if (room && params && specifics) {
            setRoom(JSON.parse(room));
            setParameters(JSON.parse(params));
            setSpecifics(JSON.parse(specifics));
        };
    }, []);

    const handleCancellation = async (): Promise<void | null> => {
        setCancel('Processing...');
        const cancelCall: AxiosResponse<{ status: string, data: string }> = await axios.delete('http://localhost:3002/booking/cancel', {
            headers: { 'Content-Type': 'application/json' ,'pID': addData.pID },
            withCredentials: true
        });
        const result = cancelCall.data;
        if (result.data == 'ok') {
            setCancelSelect(false);
        };
        setCancel(result.status);
    };

    return (
        <div style={{ transform: 'scale(0.85)', height: '30%', fontFamily: "gill sans" }}>
            <label style={{ marginLeft: '5%' }}>{'< Booking Details'}</label>
            <div style={{ marginLeft: '5%', marginTop: '4%' }}>
                <div style={{ display: 'flex', 
                flexDirection: 'column', 
                width: '90%',
                boxShadow: '0 0 7px rgba(0, 0, 0, 0.5)',
                marginTop: '-2%'
                }}>
                    <div style={{ padding: '1%', marginTop: '1%', justifyContent: 'center', display: 'flex', fontSize: '30px', fontWeight: '600' }}>
                        <label>Hotel Booking Confirmation</label>
                    </div>
                    <div style={{ padding: '0.5 %', justifyContent: 'center', display: 'flex', fontSize: '22px' }}>
                        <label>Confirmation / Order Number: {addData.confirmNum}</label>
                    </div>
                    <div style={{ display: 'flex', 
                    flexDirection: 'row',
                    padding: '0.5%', 
                    justifyContent: 'space-between',
                    marginTop: '3%', 
                    marginLeft: '2%' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'center'}}>
                               {specifics.id.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                            </div>
                            <div style={{ display: 'flex', padding: '1.5%' }}>
                                <Image src={specifics.images[0].replace('{size}', '200x200')} width={360} height={360} alt="Thing" /> 
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                                <div style={{ padding: '0.5%', display: 'flex', flexDirection: 'column', marginBottom: '40%' }}>
                                    <label>{specifics.address}</label>
                                </div>
                            </div>
                        </div>
                        <div> 
                            <div style={{ marginTop: '8%',
                                marginLeft: '-130%', 
                                display: 'flex',
                                flexDirection: 'column',
                                transform: 'scale(2.5)',
                                transformOrigin: 'top right',
                                width: '200%',
                                fontSize: '8px',
                                boxShadow: '0 1px 1px rgba(0, 0, 0, 0.5)',
                                padding: '1%'
                                }}>
                                <div className='review-hotel' style={{ marginBottom: '3%' }}>
                                    <label>Room & Guests</label>
                                </div>
                                <div className='review-hotel' style={{ width: '97%', padding: '2%', marginBottom: '3%', display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
                                    <label>Room 1 - {room.type}</label>
                                    <label>{addData.userName}</label>
                                </div>
                                <div style={{ padding: '1%', marginTop: '1%', marginBottom: '3%', display: 'flex', justifyContent: 'space-between' }}>
                                    <label>Checkin Date:</label>
                                    <label>{parameters.checkin}</label>
                                </div>
                                <div style={{ padding: '1%', marginTop: '1%', display: 'flex', justifyContent: 'space-between', marginBottom: '3%' }}>
                                    <label>Checkout Date:</label>
                                    <label>{parameters.checkout}</label>
                                </div>
                                <div style={{ padding: '1%', marginTop: '1%', display: 'flex', justifyContent: 'space-between', marginBottom: '3%' }}>
                                    <label>Nights:</label>
                                    <label> </label>
                                </div>
                                <div style={{ padding: '1%', marginTop: '1%', display: 'flex', justifyContent: 'space-between', marginBottom: '3%' }}>
                                    <label>Booking ID:</label>
                                    <label> </label>
                                </div>
                                <div style={{ padding: '1%', marginTop: '1%', display: 'flex', justifyContent: 'space-between', marginBottom: '3%' }}>
                                    <label>Amount paid:</label>
                                    <label>{`$${Number(room.price)}`}</label>
                                </div>
                                <div style={{ padding: '1%', marginTop: '1%', display: 'flex', justifyContent: 'center', marginBottom: '3%' }}>
                                    <label> </label>
                                </div>
                                {cancelSelect && (
                                    <button style={{ transform: 'scale(0.55)' }} onClick={handleCancellation}>
                                    Cancel Booking
                                    </button>
                                )}
                                <label>{cancel}</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default Confirm