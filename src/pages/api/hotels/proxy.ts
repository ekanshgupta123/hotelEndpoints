import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { check_in, check_out, residency, language, guests, region_id, currency } = req.body;
    const keyId = '4852';  
    const apiKey = 'ef8353a6-e09e-4e2a-9204-681409880ebb';  
    console.log("Received check_in:", check_in);
    console.log("Received check_out:", check_out);


    const requestBody = JSON.stringify({
        check_in,
        check_out,
        residency,
        language,
        guests: guests.map((guest: { adults: any; children: any[]; }) => ({
            adults: guest.adults,  
            children: guest.children.map(child => parseInt(child, 10))  
        })),
        region_id,
        currency
    });

    console.log("Request Body:", requestBody);  // Debug: Log the request body

    const requestOptions = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${Buffer.from(`${keyId}:${apiKey}`).toString('base64')}`
        },
        body: requestBody
    };

    try {
        const response = await fetch("https://api.worldota.net/api/b2b/v3/search/serp/region/", requestOptions);
        const textResponse = await response.text();  // Get raw text response
        console.log("Raw Response:", textResponse);  // Debug: Log the raw response

        try {
            const jsonResponse = JSON.parse(textResponse);  // Try to parse JSON response
            res.status(200).json(jsonResponse);
        } catch (jsonParseError) {
            console.error("JSON Parse Error:", jsonParseError);  // Log JSON parse error
            res.status(500).json({ error: 'Failed to parse JSON response from external API' });
        }
    } catch (error) {
        console.error("Fetch Error:", error);  // Log fetch error
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
