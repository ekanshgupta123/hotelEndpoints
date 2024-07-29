import connection from "../../../db/config";
import Hotel from "../../../Models/hotelModels";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        await connection();
        const data = await req.json();
        const { hotelIDs, flag } = data;
        let result;
        if (Array.isArray(hotelIDs)) {
            result = await Hotel.find({ id: { $in: hotelIDs } });
            return NextResponse.json({ data: result });
        };
        if (flag) {
            result = await Hotel.findOne({ _id: hotelIDs });
        } else {
            result = await Hotel.findOne({ id: hotelIDs });
        };
        return NextResponse.json({ data: result });
    } catch (e) {
        console.error(e);
    };
};