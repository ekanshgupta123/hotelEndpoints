import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { payment_intent_id } = req.query;

  if (!payment_intent_id) {
    return res.status(400).json({ error: 'Missing payment intent ID' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id as string);
    res.status(200).json(paymentIntent);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
