const { parentPort, workerData } = require('worker_threads');
const axios = require('axios');
const { AxiosResponse } = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const getResponse = () => {
    const apiCall = async () => {
        workerData.pagination.page_number = `${Number(workerData.pagination.page_number)+1}`;
        const credentials = `${process.env.KEY_ID}:${process.env.API_KEY}`;
        const authHeader = 'Basic ' + Buffer.from(credentials).toString('base64');
        const headers = {
            'Content-Type': 'application/json', 
            'Authorization': authHeader,
        };
        const result = await axios.post(
            "https://api.worldota.net/api/b2b/v3/hotel/order/info/", 
            workerData, 
            { headers: headers })
        
        const { data } = result.data;
        return { list: [], new: data.found_pages > Number(workerData.pagination.page_number) }
    };
    (async () => {
        const result = await apiCall();
        parentPort.postMessage(result);
    })();
};

getResponse();