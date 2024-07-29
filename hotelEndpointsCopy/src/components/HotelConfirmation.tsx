import React, { useState, useEffect } from "react";
import axios, { AxiosResponse } from 'axios';
import Image from 'next/image';
import { useRouter } from "next/router";
import { Alert } from '@mui/material';

interface HotelSpecifics {
  id: string;
  name: string;
  address: string;
  starRating: number;
  amenities: string[];
  price: number;
  images: string[];
  description: string;
}

interface BookingResponse { 
    partnerID: string;
    objectID: string;
    pUUID: string;
    credit: boolean;
    userName: string[];
    confirmation: string;
}

interface HotelPage {
  checkin: string,
  checkout: string,
  guests: {
    adults: number;
    children: {
      age: number;
    }[];
  }[];
  language: string,
  currency: string,
}

interface HotelRoom {
    taxes: any[];
    key: string;
    name: string;
    price: number;
    type: string;
    cancellation: string;
  }
interface Additional {
  pID: string,
  userName: string,
  confirmNum: string
}

const Confirm = () => {
  const router = useRouter();
  const { payment_intent, payment_intent_client_secret, redirect_status } = router.query;
  const [cancelSelect, setCancelSelect] = useState<boolean>(true);
  const [cancel, setCancel] = useState<string>("");
  const [room, setRoom] = useState<HotelRoom>();
  const [parameters, setParameters] = useState<HotelPage>({
    checkin: "",
    checkout: "",
    guests: [{
      adults: 1,
      children: []
    }],
    language: "",
    currency: ""
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
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<string>("");

  const [booking, setBooking] = useState<string>("");
  const [user, setUser] = useState<string>("");
  const [pid, setPid] = useState<string>("");
  const [orderID, setOrderID] = useState<string>("");

  useEffect(() => {
    const windowParam = new URLSearchParams(window.location.search);
    const objectPassed = windowParam.get('details');
    if (objectPassed) {
      setAddData(JSON.parse(objectPassed));
    }
    const room = localStorage.getItem('currentRoom');
    const params = localStorage.getItem('searchParams');
    const specifics = localStorage.getItem('currentHotelData');
    if (room && params && specifics) {
      setRoom(JSON.parse(room));
      setParameters(JSON.parse(params));
      setSpecifics(JSON.parse(specifics));
    }
  }, []);

  const handleStatus = async (partner?: string): Promise<void> => {
    try {
      if (partner) {
        setPid(partner);
      }
      const statusCall: AxiosResponse<{ status: string, data: string }> = await axios.get('http://localhost:5001/booking/status', {
        params: { pID: partner },
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      });
      const { status, data } = statusCall.data;
      if (data === 'ok') {
        setStatus(status);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const confirmPayment = async () => {
      if (payment_intent && payment_intent_client_secret && redirect_status) {
        try {
            const bookCall: AxiosResponse<{ status: string, data: BookingResponse }> = await axios.post('http://localhost:5001/booking/create', {
                id: "test_hotel_do_not_book" || specifics.id,
                checkin: parameters.checkin,
                checkout: parameters.checkout,
                guests: [{
                  adults: parameters.guests[0].adults,
                  children: parameters.guests[0].children.length ? [parameters.guests[0].children.length] : []
                }],
                currency: parameters.currency,
                language: parameters.language
              }, {
                headers: { "Content-Type": "application/json" },
                withCredentials: true
              });
      
              console.log('Booking endpoint called successfully.');
              
              const { status, data } = bookCall.data;
              setBooking(status);
              setStatus('Finalizing...');
              console.log("Data: ", data);
              const { partnerID, objectID, pUUID, credit, userName, confirmation } = data;
              console.log("PartnerID: ", partnerID);
              console.log("Username: ", userName);
              console.log("Confirmation: ", confirmation);
              setUser(userName.join(' '));
              setOrderID(confirmation);
              await handleStatus(partnerID);

          const response = await axios.post('/api/capture-payment-intent', {
            payment_intent_id: payment_intent,
          });
          const paymentIntent = response.data;

          if (paymentIntent.status === 'succeeded' && redirect_status === 'succeeded') {
            setStatus('Payment succeeded!');
          } else {
            setStatus('Payment failed.');
          }
        } catch (error) {
          console.error(error);
          setStatus('Payment confirmation error.');
        } finally {
          setLoading(false);
        }
      } else {
        setStatus('Finalizing...');
        setLoading(false);
      }
    };

    confirmPayment();
  }, [payment_intent, payment_intent_client_secret, redirect_status]);

  const handleCancellation = async (): Promise<void | null> => {
    setCancel('Processing...');
    const cancelCall: AxiosResponse<{ status: string, data: string }> = await axios.delete('http://localhost:5001/booking/cancel', {
      headers: { 'Content-Type': 'application/json', 'pID': addData.pID },
      withCredentials: true
    });
    const result = cancelCall.data;
    if (result.data === 'ok') {
      setCancelSelect(false);
    }
    setCancel(result.status);
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  const calculateTotalAmount = () => {
    return (Number(room?.price) + room?.taxes.reduce((acc, curr) => acc + Number(curr.amount), 0)).toFixed(2);
  };

  return (
    <div style={{ transform: 'scale(0.85)', height: '30%', fontFamily: "gill sans" }}>
      <a style={{ marginLeft: '5%' }} onClick={() => {
        router.push(`/hotel/${specifics.id}`)
      }}> {'<'} Search {specifics.id.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())} hotels</a>
      <div style={{ marginLeft: '5%', marginTop: '4%' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          width: '90%',
          boxShadow: '0 0 7px rgba(0, 0, 0, 0.5)',
          marginTop: '-2%'
        }}>
        
        {status && (
            <div style={{ padding: '1%', marginTop: '2%', textAlign: 'center' }}>
              {status === 'Payment succeeded!' && (
                <Alert severity="success">
                  Status: {status}
                </Alert>
              )}
              {status === 'Payment failed.' && (
                <Alert severity="error">
                  Status: {status}
                </Alert>
              )}
              {status !== 'Payment succeeded!' && status !== 'Payment failed.' && (
                <Alert severity="info">
                  Status: {status}
                </Alert>
              )}
            </div>
          )}
          <div style={{ padding: '1%', marginTop: '1%', justifyContent: 'center', display: 'flex', fontSize: '30px', fontWeight: '600' }}>
            <label>Hotel Booking Confirmation</label>
          </div>
          <div style={{ padding: '0.5 %', justifyContent: 'center', display: 'flex', fontSize: '22px' }}>
            <label>Confirmation / Order Number: {addData.confirmNum}</label>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            padding: '0.5%',
            justifyContent: 'space-between',
            marginTop: '3%',
            marginLeft: '2%'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                {specifics.id.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
              </div>
              <div style={{ display: 'flex', padding: '1.5%' }}>
                <Image src={specifics.images[0].replace('{size}', '200x200')} width={360} height={360} alt="Thing" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ padding: '0.5%', display: 'flex', flexDirection: 'column', marginBottom: '40%' }}>
                  <label>{specifics.address}</label>
                </div>
              </div>
            </div>
            <div>
              <div style={{
                marginTop: '8%',
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
                  <label>Room 1 - {room?.name}</label>
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
                  <label>{`$${calculateTotalAmount()}`}</label>
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
  );
};

export default Confirm;