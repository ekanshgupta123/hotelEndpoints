import React, { useEffect, useState } from 'react';
import axios, { AxiosResponse } from 'axios';
import { useRouter } from 'next/router';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import '../styles/App.css';
import { Alert } from '@mui/material';

interface HotelSpecifics {
  id: string;
  name: string;
  address: string;
  star_rating: number;
  amenity_groups: { amenities: string[], group_name: string }[];
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
  checkin: string;
  checkout: string;
  guests: {
    adults: number;
    children: {
      age: number;
    }[];
  }[];
  language: string;
  currency: string;
}

interface HotelRoom {
  taxes: any[];
  key: string;
  name: string;
  price: number;
  type: string;
  cancellation: string;
}

const ReviewBooking: React.FC = () => {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();

  const [room, setRoom] = useState<HotelRoom>({
    taxes: [],
    key: '',
    name: "",
    price: 0,
    type: "",
    cancellation: ""
  });
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
    star_rating: 0,
    amenity_groups: [{ amenities: [""], group_name: "" }],
    price: 0,
    images: [""],
    description: "",
  });

  const [imgArray, setImgArray] = useState<string[]>(['']);
  const [imgMap, setImgMap] = useState<{ [key: number]: number }>({});
  const [booking, setBooking] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [user, setUser] = useState<string>("");
  const [pid, setPid] = useState<string>("");
  const [orderID, setOrderID] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const room = localStorage.getItem('currentRoom');
    const params = localStorage.getItem('searchParams');
    const specifics = localStorage.getItem('currentHotelData');
    const prices = localStorage.getItem('priceParams');
    const images = localStorage.getItem('images');

    if (room && params && specifics && prices) {
      setRoom(JSON.parse(room));
      setParameters(JSON.parse(params));
      setSpecifics(JSON.parse(specifics));
      if (images) {
        try {
          setImgArray(JSON.parse(images));
        } catch (e) {
          console.error('Error parsing images:', e);
        }
      }
    } else {
      console.warn('One or more items are missing from localStorage');
    }
  }, []);

  const calculateTotalAmount = () => {
    return (Number(room.price) + room.taxes.reduce((acc, curr) => acc + Number(curr.amount), 0)).toFixed(2);
  };

  const handleDots = (index, size) => {
    const dots = Array(size).fill('◦');
    dots[index] = '•';
    return (dots.map(dot => <label key={dot}>{dot}</label>));
  };

  const handleDecrease = (key, group) => {
    const value = imgMap[key];
    if (value || value == 0) {
      let result;
      value == 0
        ? (result = <label>{group[0]}</label>, setImgMap(prevMap => ({
          ...prevMap,
          [key]: group.length - 1
        })))
        : (result = <label>{group[value + 1]}</label>, setImgMap(prevMap => ({
          ...prevMap,
          [key]: value - 1
        })));
      return result;
    } else {
      setImgMap(prevMap => ({
        ...prevMap,
        [key]: group.length - 1
      }));
      return <label>{group[1]}</label>
    }
  };

  const handleIncrease = (key, group) => {
    const value = imgMap[key];
    if (value) {
      let result;
      value == group.length - 1
        ? (result = <label>{group[0]}</label>, setImgMap(prevMap => ({
          ...prevMap,
          [key]: 0
        })))
        : (result = <label>{group[value + 1]}</label>, setImgMap(prevMap => ({
          ...prevMap,
          [key]: value + 1
        })));
      return result;
    } else {
      setImgMap(prevMap => ({
        ...prevMap,
        [key]: 1
      }));
      return <label>{group[1]}</label>
    }
  };

  const handleBooking = async (): Promise<void> => {
    if (!stripe || !elements) {
      return;
    }
  
    try {
      setStatus('Please wait a moment.');
      setError(""); // Clear previous errors
  
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/confirmation`,
        },
      });
  
      if (error) {
        console.error("Stripe error:", error);
        if (error.decline_code === 'insufficient_funds') {
          setError("Insufficient funds.");
        } else if (error.code === 'expired_card') {
          setError("Expired card.");
        } else if (error.code === 'incorrect_number') {
          setError("Invalid card number.");
        } else {
          setError(error.message);
        }
      } else if (paymentIntent) {
        console.log("PaymentIntent:", paymentIntent); 
  
        if (paymentIntent.status === 'requires_capture') {
          console.log('Payment requires capture. Calling booking endpoint.');
          
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
          localStorage.setItem('currentRoom', JSON.stringify(room));
          localStorage.setItem('searchParams', JSON.stringify(parameters));
          localStorage.setItem('currentHotelData', JSON.stringify(specifics));
          
          const confirmationUrl = `/confirmation?payment_intent=${paymentIntent.id}&payment_intent_client_secret=${paymentIntent.client_secret}&redirect_status=succeeded`;
          console.log('Opening confirmation URL:', confirmationUrl);
  
          // Redirect after successful booking call
          const newTab = window.open('', '_blank');
          setTimeout(() => {
            if (!newTab) {
              window.location.href = confirmationUrl;
            }
          }, 3000); // delay for 3 seconds
        } else {
          setError("Payment was not successful. Status: " + paymentIntent.status);
        }
      } else {
        setError("Payment failed without a paymentIntent.");
      }
    } catch (e) {
      console.error("Exception:", e);
      setError("An unexpected error occurred.");
    }
  };

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

  return (
    <div>
      <div style={{ marginTop: '2%' }}>
        <label style={{ marginLeft: '10%' }}>{'< Review Your Booking'}</label>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          width: '51.5%',
          marginLeft: '10%',
          marginTop: '2%',
          borderStyle: 'solid',
          borderRadius: '8px',
          padding: '1%'
        }}>
          <div style={{ display: 'flex' }}>
            <div style={{ display: 'flex', marginRight: '2%', marginBottom: '1%' }}>
              {imgArray.map((_, index) => (
                index === 0 &&
                <div key={index} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex' }}>
                    <button onClick={() => handleDecrease(index, imgArray)}
                      disabled={imgArray.length === 1}
                      style={{ width: '14%', height: '14%', borderRadius: '20px', marginTop: '41%', marginRight: '2%', borderWidth: '1px', backgroundColor: 'transparent' }}>{'<'}</button>
                    <img src={imgArray[imgMap[index] || 0].replace('{size}', '120x120')} alt='Room Image' style={{ marginRight: '1%', marginTop: '10%' }} />
                    <button onClick={() => handleIncrease(index, imgArray)}
                      disabled={imgArray.length === 1}
                      style={{ width: '14%', height: '14%', borderRadius: '20px', marginTop: '40%', marginLeft: '1.5%', borderWidth: '1px', backgroundColor: 'transparent' }}>{'>'}</button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <p>{handleDots(imgMap[index] || 0, imgArray.length)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '1%' }}>
              <div className='review-hotel'>
                <label>{specifics.name}</label>
              </div>
              <div style={{ padding: '1%', marginBottom: '0.5%' }}>
                <label>{Array(specifics.star_rating).fill('⭐').join('')}</label>
              </div>
              <div className='arbitrary'>
                <label>{specifics.address}</label>
              </div>
              <div style={{ padding: '1%', marginBottom: '5%', marginTop: '10%', width: '140%' }}>
                <label style={{ fontWeight: '600' }}>{room.key}</label>
              </div>
            </div>
          </div>
          <div className='amenities'>
            {specifics.amenity_groups.slice(0, 8).map(group => (
              <div key={group.group_name}>
                <h4>{group.group_name}</h4>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {group.amenities.slice(0, 7).map((feat, idx) => (
                    <li key={idx}>{feat}</li>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          width: '51.5%',
          marginLeft: '10%',
          marginTop: '1%',
          borderStyle: 'solid',
          borderRadius: '8px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            padding: '1%',
            justifyContent: 'space-between'
          }}>
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
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontWeight: '600', marginBottom: '1%' }}>Refund: </label>
              {room.cancellation.includes('\n') && room.cancellation.split('\n').map((opt, index) => <p key={index} style={{ whiteSpace: 'pre-wrap' }}>{index === 1 ? ('↳' + opt) : opt}</p>) || room.cancellation}
            </div>
          </div>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          width: '55%',
          marginLeft: '10%',
          marginTop: '1%',
          marginBottom: '2%'
        }}>
        {error && (
            <Alert severity="error">
                Error: {error}
            </Alert>
        )}
          <PaymentElement />
          <button style={{
            width: '45.25%',
            marginTop: '3.5%',
            color: 'white',
            backgroundColor: 'red',
            padding: '1%',
            fontSize: '15px',
            borderColor: 'transparent',
            borderRadius: '8px'
          }} onClick={handleBooking}>Place Order</button>
        </div>
      </div>
      <div style={{
        top: '10.1%',
        left: '62.5%',
        display: 'flex',
        flexDirection: 'column',
        position: 'absolute',
        width: '25%',
        borderStyle: 'solid',
        padding: '1%',
        borderRadius: '8px'
      }}>
        <div className='review-hotel' style={{ marginBottom: '2%' }}>
          <label>Price Summary</label>
        </div>
        <div className='review-hotel' style={{ backgroundColor: 'navy', width: '100%', padding: '2%', color: 'white', marginBottom: '2%' }}>
          <label>Description</label>
        </div>
        <div style={{ padding: '1%', marginTop: '1%', display: 'flex', justifyContent: 'space-between', marginBottom: '2%' }}>
          <input placeholder='Optional: Guest Name' onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setUser(e.target.value);
          }} />
        </div>
        <div style={{ padding: '1%', marginTop: '1%', marginBottom: '2%' }}>
          <label>Room: {room.key}</label>
        </div>
        <hr />
        <div style={{ padding: '1%', marginTop: '1%', display: 'flex', justifyContent: 'space-between', marginBottom: '2%' }}>
          <label>Booking Cost:</label>
          <label>${room.price}</label>
        </div>
        {room.taxes.map(tax => (
          <div key={tax.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1%' }}>
            <label>+ {tax.name.replace('_', ' ')}</label>
            <label>${tax.amount}</label>
          </div>
        ))}
        <hr />
        <div style={{ padding: '1%', marginTop: '1%', display: 'flex', justifyContent: 'space-between', marginBottom: '2%' }}>
          <label>Subtotal:</label>
          <label>{`$${calculateTotalAmount()}`}</label>
        </div>
      </div>
    </div>
  );
};

export default ReviewBooking;