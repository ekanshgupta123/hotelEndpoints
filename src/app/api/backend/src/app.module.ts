import { Module } from '@nestjs/common';
import { ResController } from './res/res.controller';
import { ResService } from './res/res.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { BookController } from './book/book.controller';
import { BookService } from './book/Book.service';
import { HotelsController } from './hotels/hotels.controller';
import { HotelsService } from './hotels/hotels.service';

@Module({
  imports: [
    HttpModule,
    JwtModule.register({ secret: '1234' }),
    ConfigModule.forRoot({
      envFilePath:
        '/Users/ekanshgupta/hotelEndpoints/src/app/api/backend/src/.env',
      isGlobal: true,
    })
  ],
  controllers: [ResController, BookController, HotelsController],
  providers: [ResService, BookService, HotelsService],
})
export class AppModule {}
