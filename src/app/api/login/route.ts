import Hotel from "@/Models/hotelModels";
import connection from "@/db/config";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const body = await req.json();
    const { hotelId } = body;

    if (!hotelId) {
        return NextResponse.json({ msg: "Hotel ID is required" }, { status: 400 });
    }

    try {
        await connection();
        console.log('Connected to database');

        const hotel = await Hotel.findOne({ id: hotelId });
        if (!hotel) {
            return NextResponse.json({ msg: "Hotel not found" }, { status: 404 });
        }

        console.log('Hotel found:', hotel);
        return NextResponse.json(hotel, { status: 200 });
    } catch (err) {
        console.error('Error:', err);
        return NextResponse.json({ error: err.message, success: false }, { status: 500 });
    }
}