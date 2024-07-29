import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

require('dotenv').config({ path: "/Users/ekanshgupta/testHotel/hotelEndpoints/src/app/api/backend/.env" });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export async function POST(req: NextRequest) {
  const { payment_intent_id } = await req.json();

  try {
    const paymentIntent = await stripe.paymentIntents.capture(payment_intent_id);
    return NextResponse.json(paymentIntent);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}