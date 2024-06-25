import { Body, Controller, Post, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { Observable } from 'rxjs';

@Controller('hotels')
export class HotelsController {
    constructor(private hotelsService: HotelsService) {}

    @Post('search')
    async searchHotels(@Body() searchParams: any): Promise<any> {
        console.log('Incoming search params:', searchParams);
        try {
            const result = await this.hotelsService.searchHotels(searchParams);
            console.log('Search result:', result);
            return result;
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('details')
    async fetchDetailsForMultipleHotels(@Body() body: { hotelIds: string[], language: string }): Promise<any[]> {
        console.log("Incoming hotel IDs: ", body.hotelIds);
        return await this.hotelsService.fetchDetailsForMultipleHotels(body.hotelIds, body.language);
    }
        
    @Post('rooms') 
    async getRooms(@Body() searchParams: any): Promise<any> {
        console.log('Incoming search params:', searchParams);
        try {
            const result = await this.hotelsService.fetchHotelRooms(searchParams);
            console.log('Rooms fetched:', result);
            return result;
        } catch (e) {
            throw new HttpException('Failed to fetch hotel rooms', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
