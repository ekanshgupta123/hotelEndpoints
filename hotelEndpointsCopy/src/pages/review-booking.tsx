import React, { useEffect, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import ReviewBooking from '../components/ReviewBooking';
import axios from 'axios';

const stripePromise = loadStripe("pk_test_51MRmu5Lv44uqD0Xkf4p0eZUewscyL3FdPfbZKzxHxAC1Js99vTF7wb60pTUyCbnf8PsvqNbfyIROviRFnoJPEV5E00HXo96HRK");

const BookingReview: React.FC = () => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  useEffect(() => {
    const fetchTotalAmount = () => {
      const room = JSON.parse(localStorage.getItem('currentRoom') || '{}');
      const totalAmount = Number(room.price) + room.taxes.reduce((acc, curr) => acc + Number(curr.amount), 0);
      console.log(totalAmount.toFixed(2));
      setTotalAmount(totalAmount);
    };

    const fetchClientSecret = async () => {
      try {
        const response = await axios.post('/api/create-payment-intent', {
          amount: totalAmount.toFixed(2),
          currency: 'usd',
        });
        setClientSecret(response.data.clientSecret);
      } catch (error) {
        console.error('Error fetching client secret:', error);
      }
    };

    fetchTotalAmount();
    fetchClientSecret();
  }, [totalAmount]);

  if (!clientSecret) {
    return <div>Loading...</div>;
  }

  const options = {
    clientSecret,
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <ReviewBooking />
    </Elements>
  );
};

export default BookingReview;
