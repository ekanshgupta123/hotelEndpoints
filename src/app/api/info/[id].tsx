import { NextApiRequest, NextApiResponse } from 'next';
import connection from '@/db/config';
import Hotel from '@/Models/hotelModels';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('Request received at API route');

    if (req.method !== 'GET') {
        console.log('Method not allowed');
        return res.status(405).json({ msg: "Method not allowed" });
    }

    const { id } = req.query;
    console.log('ID:', id);

    if (!id) {
        console.log('ID is required');
        return res.status(400).json({ msg: "ID is required" });
    }

    try {
        await connection();
        console.log('Connected to database');

        const hotel = await Hotel.findOne({ id });
        if (!hotel) {
            console.log('Hotel not found');
            return res.status(404).json({ msg: "Hotel not found" });
        }

        console.log('Hotel found:', hotel);
        return res.status(200).json(hotel);
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).json({ error: err.message });
    }
}