import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, map } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';

dotenv.config();

@Injectable()
export class HotelsService {
    constructor(
        private httpService: HttpService,
        private configService: ConfigService
      ) {}
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
    }

    async fetchDetailsForMultipleHotels(hotelIds: string[], language: string): Promise<any[]> {
    let results = [];
    for (const hotelId of hotelIds) {
        // Wait a bit before making each request
        await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1 second
        try {
            const result = await this.fetchHotelDetails(hotelId, language);
            results.push(result);
        } catch (error) {
            console.error(`Failed to fetch details for hotel ID ${hotelId}: ${error}`);
            results.push({ error: `Failed for ${hotelId}`, details: error });
        }
    }
    return results;
}


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

    async searchHotels(searchParams: any): Promise<any> {
        const keyId = this.configService.get<string>('KEY_ID');
        const apiKey = this.configService.get<string>('API_KEY');
        console.log("im here");
        const { residency, language, guests, region_id, currency } = searchParams;

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
            region_id,
            currency
        };

        console.log("Request Body:", JSON.stringify(requestBody, null, 2));  

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Basic ${Buffer.from(`${keyId}:${apiKey}`).toString('base64')}`
        };

        console.log("Request Headers:", JSON.stringify(headers, null, 2)); 

        return this.httpService.post('https://api.worldota.net/api/b2b/v3/search/serp/region/', requestBody, { headers })
            .pipe(
                map(response => response.data),
                catchError((error) => {
                    console.error('Error in searchHotels:', error.response?.data || error.message);
                    return throwError(new HttpException('Failed to fetch hotels', HttpStatus.INTERNAL_SERVER_ERROR));
                })
            )
            .toPromise();
    }

    // async fetchHotelDetails(hotelId: string, language: string): Promise<any> {
    //     console.log(`Fetching details for hotel ID: ${hotelId}, Language: ${language}`);

    //     const url = `https://api.worldota.net/api/b2b/v3/hotel/info/`;
    //     const keyId = this.configService.get<string>('KEY_ID');
    //     const apiKey = this.configService.get<string>('API_KEY');

    //     const headers = {
    //         "Content-Type": "application/json",
    //         "Authorization": `Basic ${Buffer.from(`${keyId}:${apiKey}`).toString('base64')}`
    //     };

    //     const body = {
    //         id: hotelId,
    //         language: language
    //     };

    //     return this.httpService.post(url, body, { headers })
    //         .pipe(
    //             map(response => response.data),
    //             catchError((error) => {
    //                 console.error(`Error fetching hotel details for ID ${hotelId}:`, error.response?.data || error.message);
    //                 return throwError(new HttpException('Failed to fetch hotel details', HttpStatus.INTERNAL_SERVER_ERROR));
    //             })
    //         )
    //         .toPromise();
    // }

    async fetchHotelRooms(searchParams: any): Promise<any> {
        const keyId = this.configService.get<string>('KEY_ID');
        const apiKey = this.configService.get<string>('API_KEY');
        console.log("im inside fetchHotelRooms");

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

        console.log("Request Body:", JSON.stringify(requestBody, null, 2));  

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Basic ${Buffer.from(`${keyId}:${apiKey}`).toString('base64')}`
        };

        console.log("Request Headers:", JSON.stringify(headers, null, 2)); 

        return this.httpService.post('https://api.worldota.net/api/b2b/v3/search/hp/', requestBody, { headers })
            .pipe(
                map(response => response.data),
                catchError((error) => {
                    console.error('Error in fetchHotelRooms:', error.response?.data || error.message);
                    return throwError(new HttpException('Failed to fetch hotel rooms', HttpStatus.INTERNAL_SERVER_ERROR));
                })
            )
            .toPromise();
    }
}
