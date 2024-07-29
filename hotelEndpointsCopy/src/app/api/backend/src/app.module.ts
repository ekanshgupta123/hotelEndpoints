import * as redisStore from 'cache-manager-redis-store';
import { CacheModule } from '@nestjs/cache-manager';
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
import { UtilService } from './util/util.service';
import { DatabaseModule } from './database/database.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    HttpModule,
    JwtModule.register({ secret: '1234' }),
    ConfigModule.forRoot({
      envFilePath:
        '/Users/ekanshgupta/testHotel/hotelEndpoints/src/app/api/backend/.env',
      isGlobal: true,
    }), 
    CacheModule.register({
      isGlobal: true, 
      store: redisStore,
      ttl: 30,
      host: 'localhost',
      port: 6379
    }), 
    DatabaseModule,
    MongooseModule.forRoot('mongodb://localhost:27017/next-auth')
  ],
  controllers: [ResController, BookController, HotelsController],
  providers: [ResService, BookService, HotelsService, UtilService],
})

export class AppModule {}
