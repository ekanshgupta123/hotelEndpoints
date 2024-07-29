import { NextResponse, NextRequest } from "next/server";
import Stripe from "stripe";

require('dotenv').config({ path: "/Users/ekanshgupta/testHotel/hotelEndpoints/src/app/api/backend/.env" });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export async function POST(req: NextRequest) {
  const { amount, currency } = await req.json();
  try {
    const formattedAmount = Math.round(Number(amount) * 100);
    console.log("Amount being charged: " , formattedAmount);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: formattedAmount, 
      capture_method: 'manual',
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
