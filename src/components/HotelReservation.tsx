import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import axios, { AxiosResponse } from 'axios'
import Navbar from './Navbar'
import '../styles/App.css'

interface Guests {
    age: null,
      first_name: string,
      first_name_original: string,
      is_child: boolean,
      last_name: string,
      last_name_original: string
};

interface GuestData {
  adults_number: number,
  children_number: number,
  guests: Guests[]
};

interface RoomData {
    bedding_name: Array<string>,
    guest_data: GuestData,
    meal_name: string,
    room_idx: number,
    room_name: string
};

interface Policies {
    end_at: null,
    penalty: { amount: string, amount_info: null, currency_code: string },
    start_at: null
};

interface TaxAmount {
    amount_tax: { amount: string, currency_code: string }, 
    is_included: boolean, 
    name: string 
};

interface Components {
    agreement_number: string,
    amount_payable: { amount: string, currency_code: string },
    amount_payable_vat: { amount: string, currency_code: string },
    amount_payable_with_upsells: { amount: string, currency_code: string },
    amount_refunded: { amount: string, currency_code: string },
    amount_sell: { amount: string, currency_code: string },
    amount_sell_b2b2c: { amount: string, currency_code: string },
    api_auth_key_id: null,
    cancellation_info: { free_cancellation_before: null, policies: Policies[] },
    cancelled_at: null,
    checkin_at: string,
    checkout_at: string,
    contract_slug: string,
    created_at: string,
    has_tickets: boolean,
    hotel_data: { id: string, order_id: null },
    invoice_id: string,
    is_cancellable: boolean,
    is_checked: boolean,
    meta_data: { voucher_order_comment: null },
    modified_at: string,
    nights: number,
    order_id: number,
    order_type: string,
    partner_data: { order_comment: null, order_id: string },
    payment_data: {
      invoice_id: number,
      invoice_id_v2: string,
      paid_at: null,
      payment_by: null,
      payment_due: string,
      payment_pending: string,
      payment_type: string
    },
    roomnights: number,
    rooms_data: RoomData[],
    source: string,
    status: string,
    supplier_data: { confirmation_id: null, name: null, order_id: string },
    taxes: TaxAmount[],
    total_vat: { amount: string, currency_code: string, included: boolean },
    upsells: [],
    user_data: { arrival_datetime: null, email: string, user_comment: null }
  };

const Reservation: React.FC = () => {
    const router = useRouter();
    const { id } = router.query;
    const [rendered, setRendered] = useState<boolean>(false)
    const [hotel, setHotel] = useState<string | null>(null);
    const [user, setUser] = useState<string | null>(null)
    const [reservations, setReservations] = useState<Components[] | null>(null);
    const [details, setDetails] = useState<Components | null>(null);
    const [retrieving, setRetrieving] = useState<boolean>(false)
    const [scale, setScale] = useState<boolean>(false)

    useEffect(() => {
        const apiCall = async (): Promise<void> => {
            try {
                const request: AxiosResponse = await 
                axios.get('http://localhost:3002/reservation/list', {
                  headers: { 'Content-Type': 'application/json' },
                  withCredentials: true,
                });
                const { data } = request.data;
                const { list, user } = data;
                setReservations(list);
                setUser(user);
            } catch (e) {
                console.error(e)
            }
        }
        if (!rendered) {
            apiCall();
            setRendered(true);
        }
    }, [])

    useEffect(() => {
        const reservationLookup = async (): Promise<void> => {
            if (hotel) {
                try {
                    const request: AxiosResponse = await axios.get('http://localhost:3002/reservation/details', {
                        params: { hotel: hotel, name: user },
                        headers: { 'Content-Type': 'application/json' },
                        withCredentials: true
                    });
                    const { data } = request.data;
                    setDetails(data);
                    setRetrieving(false);
                } catch (e) {
                    console.error(e);
                }
            }
        }
        reservationLookup();
    }, [hotel])

    if (!reservations) {
        return <div>Loading...</div>;
    };

    const flushCache = async () => {
        await axios.delete('http://localhost:3002/reservation/clear', {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true
        });
        console.log('cleared');
    };

    const handleViewHotel = async () => {
        flushCache();
        const objectString = JSON.stringify(details)
        router.push(`/hotel/details/${id}?details=${encodeURIComponent(objectString)}`)
    };

    const sideItinerary = () => {  
        if (details && !retrieving) {
            return (
                <div>
                    <h3>Trip Details:</h3>
                    <div className='itin-items'>
                        <p>Hotel:</p>
                        <p>{details.hotel_data.id.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}</p>
                    </div>
                    <div className='itin-items'>
                        <p>Check In:</p>
                        <p>{details.checkin_at}</p>
                    </div>
                    <div className='itin-items'>
                        <p>Check Out:</p>
                        <p>{details.checkin_at}</p>
                    </div> 
                    <div className='itin-items'>
                        <p>Nights:</p>
                        <p>{details.nights}</p>
                    </div> 
                    <div className='itin-items'>
                        <p>Booked By:</p>
                        <p>{details.payment_data.payment_by || user}</p>
                    </div> 
                    <h3>Room Information</h3>
                    <div className='itin-items'>
                        <p>Order ID:</p>
                        <p>{details.order_id}</p>
                    </div> 
                    <div className='itin-items'>
                        <p>Room Type:</p>
                        <p>{details.rooms_data[0].bedding_name[0][0].toUpperCase() + details.rooms_data[0].bedding_name[0].substring(1)}</p>
                    </div> 
                    <div className='itin-items'>
                        <p>Room Name:</p>
                        <p>{details.rooms_data[0].room_name.split('(')[0].trim().split(/\s+/).slice(0, 4).join(' ')}</p>
                    </div> 
                    <div className='itin-items'>
                        <p>Email:</p>
                        <p>{details.user_data.email}</p>
                    </div> 
                    <div className='itin-items'>
                        <p>Price:</p>
                        <p>{`$${details.amount_payable.amount}`}</p>
                    </div> 
                </div>  
            )
        } else if (retrieving) {
            return <p>Loading...</p>
        }; 
    };

    return (
        <>
            <header><Navbar /></header>
            <div className={`reservation-container ${scale ? 'scale' : ''}`}>
                <div className='above-columns'>
                    <label className='item-label'>Guests</label>
                    <label className='item-label'>Day In</label>
                    <label className='item-label'>Day Out</label>
                    <label className='item-label'>Hotel</label>
                    <label className='item-label'>Nights</label>
                </div>
                {reservations.map(order => (
                    <div className='columns' onClick={() => {
                        setHotel(order.invoice_id);
                        setScale(true);
                        setRetrieving(true);
                    }}>
                        <label>{user}</label>
                        <label style={{ marginRight: '20px', width: '120px' }}>{new Date(order.checkin_at).toDateString()}</label>
                        <label style={{ marginRight: '10px', width: '120px' }}>{new Date(order.checkout_at).toDateString()}</label>
                        <label className='hotel-specific'>{order.hotel_data.id.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}</label>
                        <label style={{ maxWidth: '5px' }}>{order.nights}</label>
                    </div>
                ))}
            </div>
            {scale && 
            <div className='itin-tag'>
                <div style={{ marginTop: '30%' }}>{sideItinerary() || <p>No Hotel Selected</p>}</div>
                <button onClick={() => handleViewHotel()} style={{ marginTop: '5%' }}>View Full Itinerary</button>
                <button onClick={() => setScale(false)} style={{ marginTop: '5%' }}>Close Itinerary</button>
            </div>}
            <div>
                <div>
                    <button onClick={() => setScale(true)}>Toggle Side Itinerary</button>
                </div>
            </div>
        </>
    );
};

export default Reservation;
