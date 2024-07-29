import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, map } from 'rxjs/operators';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { throwError } from 'rxjs';
import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { UtilService } from 'src/util/util.service';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Hotel, individualRoom } from '../interfaces/hotel.interface';
import Bottleneck from 'bottleneck';

dotenv.config();

@Injectable()
export class HotelsService {
    private limiter: Bottleneck;

    constructor(
        private httpService: HttpService,
        private configService: ConfigService,
        private utilService: UtilService,
        @Inject(CACHE_MANAGER) private cacheService: Cache,
        @InjectModel('MONGO_DB') private hotelModel: Model<Hotel>
    ) {
        // Initialize Bottleneck with the desired rate limit
        this.limiter = new Bottleneck({
            maxConcurrent: 1, // Only one request at a time
            minTime: 2000 // Minimum time (ms) between requests (30 requests per minute)
        });
    };

    private convertToISO8601Format(dateString: string): string {
        if (dateString.includes('/')) {
            const [month, day, year] = dateString.split('/');
            const dateObject = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
            return dateObject.toISOString().split('T')[0];
        } else if (dateString.includes('-')) {
            return dateString;
        } else {
            const dateObject = new Date(dateString);
            return dateObject.toISOString().split('T')[0];
        }
    };

    async staticImages (ID: string, body: any) {
        const roomMatch = (obj1, obj2) => {
            const keys = Object.keys(obj2);
            for (let key of keys) {
                if (obj1[key] != obj2[key]) return false
            };
            return true;
        };
        const hotel = await this.hotelModel.find({ id: ID });
        return hotel[0].room_groups.filter(rate => roomMatch(rate.rg_ext, body) == true).length != 0 
        && hotel[0].room_groups.filter(rate => roomMatch(rate.rg_ext, body) == true)[0].images 
        || ['https://placehold.jp/{size}.png'];
    };

    async redisCache (keys: string[], page: number, flag: boolean, data?: any[]) {
        try {
            const end: number = 25*page-1;
            let resultArr: any[];
            if (flag) {
                resultArr = await Promise.all(keys.map(async (key) => {
                    return await this.utilService.getPaginatedData(key, end-24, end);
                }));
                return { data: resultArr, total: null };
            } else {
                resultArr = await Promise.all(keys.map(async (key, index) => {
                    const toPass = index == 1
                        ? await Promise.all(data.map(hotel => hotel.id).map(async (id) => {
                            const match = await this.hotelModel.find({ id: id });
                            return match[0];
                        }))
                        : data;
                    await this.utilService.dataPipeline(key, toPass, 120);
                    return await this.utilService.getPaginatedData(key, end-24, end);
                }));
            };
            return { data: resultArr, total: data.length };
        } catch (e) {
            console.error(e);
        };
    };

    async fetchHotelDetails(hotelId: string, language: string): Promise<any> {
        const url = `https://api.worldota.net/api/b2b/v3/hotel/info/`;
        const keyId = this.configService.get<string>('KEY_ID');
        const apiKey = this.configService.get<string>('API_KEY');

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Basic ${Buffer.from(`${keyId}:${apiKey}`).toString('base64')}`
        };

        const body = {
            id: hotelId,
            language: language
        };

        return this.httpService.post(url, body, { headers }).pipe(
            map(response => response.data),
            catchError((error) => {
                console.error(`Error fetching hotel details for ID ${hotelId}:`, error.response?.data || error.message);
                return throwError(new HttpException('Failed to fetch hotel details', HttpStatus.INTERNAL_SERVER_ERROR));
            })
        ).toPromise();
    }


    async fetchDetailsForMultipleHotels(params: { checkin: string; checkout: string; residency: string; language: string; guests: any[]; ids: string[]; currency: string }): Promise<any[]> {
        const keyId = this.configService.get<string>('KEY_ID');
        const apiKey = this.configService.get<string>('API_KEY');
                
        const { checkin, checkout, residency, language, guests, ids, currency } = params;

        const formattedCheckin = this.convertToISO8601Format(checkin);
        const formattedCheckout = this.convertToISO8601Format(checkout);

        guests.forEach((guest: any) => {
            const childrenAges = guest.children.map((child: { age: number }) => child.age);
        });

        const requestBody = {
            checkin: formattedCheckin,
            checkout: formattedCheckout,
            residency,
            language,
            guests: guests.map(guest => ({
                adults: guest.adults,
                children: guest.children.map((child: { age: number }) => child.age)
            })),
            ids,
            currency
        };

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Basic ${Buffer.from(`${keyId}:${apiKey}`).toString('base64')}`
        };

        return this.httpService.post('https://api.worldota.net/api/b2b/v3/search/serp/hotels/', requestBody, { headers })
            .pipe(
                map(response => response.data),
                catchError((error) => {
                    console.error('Error in fetchDetailsForMultipleHotels:', error.response?.data || error.message);
                    return throwError(new HttpException('Failed to fetch hotel details', HttpStatus.INTERNAL_SERVER_ERROR));
                })
            )
            .toPromise();
    };

    async searchHotels(searchParams: any): Promise<any> {
        const { residency, language, guests, region_id, currency, keys, pageNumber } = searchParams;
        const exists = await this.utilService.keyExists(keys[0]);
        if (exists) return await this.redisCache(keys, pageNumber, true);

        const keyId = this.configService.get<string>('KEY_ID');
        const apiKey = this.configService.get<string>('API_KEY');

        const checkin = this.convertToISO8601Format(searchParams.checkin);
        const checkout = this.convertToISO8601Format(searchParams.checkout);

        searchParams.guests.forEach((guest: any, index: number) => {
            const childrenAges = guest.children.map((child: { age: number }) => child.age);
        });

        const requestBody = {
            checkin,
            checkout,
            residency,
            language,
            guests: guests.map(guest => ({
                adults: guest.adults,
                children: guest.children.map((child: { age: number }) => child.age)
            })),
            region_id,
            currency
        };

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Basic ${Buffer.from(`${keyId}:${apiKey}`).toString('base64')}`
        };

        const responseArr = await this.httpService.post('https://api.worldota.net/api/b2b/v3/search/serp/region/', requestBody, { headers })
            .pipe(
                map(response => response.data),
                catchError((error) => {
                    console.error('Error in searchHotels:', error.response?.data || error.message);
                    return throwError(new HttpException('Failed to fetch hotels', HttpStatus.INTERNAL_SERVER_ERROR));
                })
            )
            .toPromise();
        return await this.redisCache(keys, pageNumber, false, responseArr.data.hotels);
    };

    async fetchHotelRooms(searchParams: any): Promise<any> {
        const keyId = this.configService.get<string>('KEY_ID');
        const apiKey = this.configService.get<string>('API_KEY');

        const { residency, language, guests, id, currency } = searchParams;

        const checkin = this.convertToISO8601Format(searchParams.checkin);
        const checkout = this.convertToISO8601Format(searchParams.checkout);

        searchParams.guests.forEach((guest: any, index: number) => {
            const childrenAges = guest.children.map((child: { age: number }) => child.age);
            console.log(childrenAges);
        });

        const requestBody = {
            checkin,
            checkout,
            residency,
            language,
            guests: guests.map(guest => ({
                adults: guest.adults,
                children: guest.children.map((child: { age: number }) => child.age)
            })),
            id,
            currency
        };

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Basic ${Buffer.from(`${keyId}:${apiKey}`).toString('base64')}`
        };

        return this.httpService.post('https://api.worldota.net/api/b2b/v3/search/hp/', requestBody, { headers })
            .pipe(
                map(response => response.data),
                catchError((error) => {
                    console.error('Error in fetchHotelRooms:', error.response?.data || error.message);
                    return throwError(new HttpException('Failed to fetch hotel rooms', HttpStatus.INTERNAL_SERVER_ERROR));
                })
            )
            .toPromise();
    };
};