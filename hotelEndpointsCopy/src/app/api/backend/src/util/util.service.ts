import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class UtilService {
    private client: Redis;
    constructor() {
        this.client = new Redis({
            host: 'localhost',
            port: 6379
        });
    };
    async dataPipeline(key: string, data: any[], ttl: number) {
        console.log('reached here');
        const pipeline = this.client.pipeline();
        data.forEach(async (element, index) => {
            pipeline.zadd(key, index+1, JSON.stringify(element));
        });
        pipeline.expire(key, ttl);
        pipeline.exec();
        return 
    };

    async getPaginatedData (key: string, offset: number, limit: number) {
        return await this.client.zrange(key, offset, limit);
    };

    async keyExists(key: string) {
        return await this.client.exists(key) == 1;
    };

};
