import { parentPort } from 'worker_threads';
import axios from 'axios';

interface Task {
    hotelId: string;
    id: number; 
}

parentPort?.on('message', async (task: Task) => {
    try {
        const response = await axios.post('http://localhost:3002/hotels/details', {
            id: task.hotelId,
            language: "en"
        });
        parentPort?.postMessage({ status: 'success', data: response.data, taskId: task.id });
    } catch (error) {
        parentPort?.postMessage({ status: 'error', error: error.message, taskId: task.id });
    }
});