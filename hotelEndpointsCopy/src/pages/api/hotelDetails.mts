import type { NextApiRequest, NextApiResponse } from 'next';
import { Worker } from 'worker_threads';
import path from 'path';

interface HotelTask {
    hotelId: string;
    id: number;
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
    const worker = new Worker(path.resolve('src/components/hotelDetailsWorker.ts'));

    worker.on('message', (result) => {
        if (result.status === 'success') {
            res.status(200).json(result.data);
        } else if (result.status === 'error') {
            res.status(500).json({ error: result.error });
        }
        worker.terminate();
    });

    worker.on('error', err => {
        res.status(500).json({ error: 'Worker error: ' + err.message });
        worker.terminate();
    });

    worker.postMessage({
        hotelId: req.body.hotelId,
        attempt: 1,
        maxAttempts: 3
    });
};