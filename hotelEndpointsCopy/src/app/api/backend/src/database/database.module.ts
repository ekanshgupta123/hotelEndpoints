import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HotelSchema } from 'src/schemas/hotel.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: 'MONGO_DB', schema: HotelSchema }])],
    exports: [MongooseModule]
})
export class DatabaseModule {}
