import {
  Controller,
  Get,
  Delete,
  Query,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ResService } from './res.service';
import { JwtService } from '@nestjs/jwt';
import { Order, PageNum } from './orders.dto';
import { Request, Response } from 'express';

@Controller('reservation')
export class ResController {
  constructor(
    private readonly appService: ResService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('list')
  @HttpCode(200)
  async findAll(
    @Req() request: Request, @Query('pg') pgNum: number,
    @Res() response: Response): Promise<Response> {
    try {
      const jwtToken: string = request.cookies['token'];
      const { name } = this.jwtService.decode(jwtToken);
      const apiCall: PageNum | { list: [], new: boolean } = await this.appService.getInfo(name, pgNum);
      if (!apiCall) return response.status(HttpStatus.OK).json({ data: apiCall })
      return response.status(HttpStatus.OK).json({
        status: 'success',
        data: { list: apiCall.list, new: apiCall.new, user: name },
      });
    } catch (e) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e })
    };
  };

  @Get('details')
  @HttpCode(200)
  async information(@Query('hotel') info: string, 
  @Res() response: Response): Promise<Response> {
    try {
      const apiCall: Order | undefined = this.appService.see(info);
      return response.status(HttpStatus.OK).json({
        status: 'success',
          data: apiCall,
      });
    } catch (e) {
      console.error(e)
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e })
    };
  };

  @Delete('clear')
  @HttpCode(204)
  clearCache (): void {
    this.appService.flush();
  };

  @Get('info')
  @HttpCode(200)
  async additionalInfo (@Query() params: {id: string, language: string}, @Res() response: Response) {
    try {
      const result = await this.appService.hotelData(params);
      return response.status(HttpStatus.OK).json({
        status: 'success',
        data: result,
      });
    } catch (e) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e })
    };
  }

};
