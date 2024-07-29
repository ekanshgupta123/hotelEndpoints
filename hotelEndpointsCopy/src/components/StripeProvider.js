import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_51MRmu5Lv44uqD0Xkf4p0eZUewscyL3FdPfbZKzxHxAC1Js99vTF7wb60pTUyCbnf8PsvqNbfyIROviRFnoJPEV5E00HXo96HRK');

const StripeProvider = ({ children }) => {
    return (
        <Elements stripe={stripePromise}>
            {children}
        </Elements>
    );
};

export default StripeProvider;