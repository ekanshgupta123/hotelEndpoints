import { NextApiRequest, NextApiResponse } from 'next';
import connection from '@/db/config';
import Hotel from '@/Models/hotelModels';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { hotelId } = body;
        console.log('Request received at API route with hotelId:', hotelId);

        await connection();
        console.log('Connected to database');

        const hotel = await Hotel.findOne({ id: hotelId });
        // console.log('After hotel findOne query:', hotel);

        if (!hotel) {
            console.log('Hotel not found');
            return NextResponse.json({ msg: "Hotel not found" }, { status: 404 });
        }

        // console.log('Hotel found:', hotel);
        return NextResponse.json(hotel, { status: 200 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ msg: "Internal Server Error" }, { status: 500 });
    }
}