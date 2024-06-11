import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { query } = req.body;
    const keyId = '4852';
    const apiKey = 'ef8353a6-e09e-4e2a-9204-681409880ebb';  

    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(`${keyId}:${apiKey}`).toString('base64')}`
    };

    const body = JSON.stringify({
        "query": query,
        "lang": "en"
    });

    try {
        const response = await fetch("https://api.worldota.net/api/b2b/v3/search/multicomplete/", {
            method: 'POST',
            headers: headers,
            body: body
        });
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
}
