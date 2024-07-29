import {
  Controller,
  Get,
  Post,
  Delete,
  Req,
  Query,
  Body,
  Headers,
  Res,
  Ip, 
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BookService } from './Book.service';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { TokenFormat } from './book.dto';

@Controller('booking')
export class BookController {
  constructor(
    private readonly bookService: BookService,
    private readonly jwtService: JwtService
  ) {}

  @Get('status')
  @HttpCode(200)
  async checkStatus (@Query('pID') partnerID: string, @Res() response: Response): Promise<Response> {
    try {
      if (!partnerID) {
        return response.status(HttpStatus.BAD_REQUEST)
      };
      const apiCall: string = await this.bookService.bookingStatus(partnerID);
      return response.status(HttpStatus.OK).json({
          status: 'Awaiting confirmation...',
          data: apiCall
        });
    } catch (e) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e })
    };
  };

  @Post('create')
  @HttpCode(201)
  async createBooking(
    @Req() request: Request,
    @Ip() remoteAddress: string, 
    @Res() response: Response): Promise<Response> {
    try {
      const { id, checkin, checkout, guests } = request.body;
      if (!id || !checkin || !checkout || !guests) {
        return response.status(HttpStatus.BAD_REQUEST)
      };
      const jwtToken: string = request.cookies['token'];
      const { name, email } = this.jwtService.decode(jwtToken);
      const [first, last] = name.split(" ");
      const hashAvailable = await this.bookService.getInfo(request.body);
      const formBooking = await this.bookService.bookingForm(hashAvailable, remoteAddress);
      const { ratesList, payUUID } = formBooking;
      const apiCall = await this.bookService.bookingFinish(
        ratesList, 
        first, 
        last, 
        email
      ); 

      // console.log("APICALL: ", apiCall.confirmation);
      // console.log("APICALL: ", apiCall.creditNeeded);
      // console.log("APICALL: ", apiCall.pID);
      return response.status(HttpStatus.OK).json({
        status: 'Order has been placed.',
        data: { partnerID: apiCall.pID, 
          objectID: ratesList.item_id, 
          pUUID: payUUID,
          credit: apiCall.creditNeeded,
          userName: [first, last],
          confirmation: apiCall.confirmation }
      });
    } catch (e) {
      console.error(e);
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e })
    };
  };

  @Post('credit')
  @HttpCode(201)
  async creditTokenization (@Body() params: TokenFormat, @Res() response: Response): Promise<Response> {
    try {
      const apiCall = await this.bookService.creditProcessing(params);
      return response.status(HttpStatus.OK).json({ 
        status: 'Payment processed. Booking is finished.', 
        data: apiCall 
      });
    } catch (e) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e })
    };
  };

  @Delete('cancel')
  @HttpCode(204)
  async cancelOrder (@Headers('pID') partnerID: string, @Res() response: Response): Promise<Response> {
    try {
      if (!partnerID) {
        return response.status(HttpStatus.BAD_REQUEST)
      };
      const apiCall: string = await this.bookService.cancelBooking(partnerID);
      return response.status(HttpStatus.OK).json({
          status: 'Booking has been canceled.',
          data: apiCall 
        });
    } catch (e) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e })
    };
  };
};