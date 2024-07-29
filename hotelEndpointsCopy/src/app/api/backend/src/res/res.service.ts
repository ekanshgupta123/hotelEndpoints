// import { Injectable } from '@nestjs/common';
// import { firstValueFrom } from 'rxjs';
// import { HttpService } from '@nestjs/axios';
// import { Components, Details, Order, PageNum } from './orders.dto';
// import { ConfigService } from '@nestjs/config';
// import NodeCache from 'node-cache';

// @Injectable()
// export class ResService {
//   private credentials = `${this.configService.get<string>('KEY_ID')}:${this.configService.get<string>('API_KEY')}`;
//   private authHeader = 'Basic ' + Buffer.from(this.credentials).toString('base64');
//   private headers = {
//     'Content-Type': 'application/json', 
//     'Authorization': this.authHeader,
//   };
//   private cache: NodeCache;
//   private pathName: string = '/Users/ekanshgupta/testHotel/hotelEndpoints/src/app/api/backend/src/res/worker.ts';

//   constructor(private readonly httpService: HttpService,
//     private configService: ConfigService
//   ) {
//     this.cache = new NodeCache({ stdTTL: 300, checkperiod: 90 })
//   };

//   async getInfo(name: string, pg: number): Promise<PageNum | { list: [], new: boolean }> {
//     console.log(pg);
//     const bodyData = {
//       "ordering": {
//           "ordering_type": "desc",
//           "ordering_by": "created_at"
//       },
//       "pagination": {
//           "page_size": "50",
//           "page_number": `${pg}`
//       }, 
//       "search": {
//           "created_at": {
//             "from_date": "2024-03-31T00:00"
//           }
//       },
//       "language":"en"
//     };

//     const { data } = await firstValueFrom(
//       this.httpService.post<Components>("https://api.worldota.net/api/b2b/v3/hotel/order/info/", 
//       bodyData, 
//       { headers: this.headers })
//     );
//     const multiple: Array<Order> = data.data.orders.filter(order => {
//       const guestInfo = order.rooms_data[0].guest_data.guests[0];
//       return (
//         name.toLowerCase() ==
//         `${guestInfo.first_name} ${guestInfo.last_name}`.toLowerCase() && 
//         order.invoice_id != null
//       );
//     });

//     const prev: Array<Order> | undefined = pg == 1 && [] || this.cache.get<Array<Order>>('list');
//     if (prev) {
//       if (multiple.length == 0) {
//         return { list: [], new: data.data.found_pages > pg };
//       };
//       const cachedList = [...prev, ...multiple];
//       this.cache.set('list', cachedList, 0);
//     } 
//     return { list: multiple, new: data.data.found_pages > pg};
//   };

//   see (hotel: string): Order | undefined {
//     const resList: Array<Order> | undefined = this.cache.get<Array<Order>>('list')
//     const single: Order | undefined = resList?.filter((order) => {
//       return ( 
//         order.invoice_id == hotel
//       );
//     })[0];
//     return single
//   };

//   async hotelData (args: { id: string, language: string }) {
//     const { data } = await firstValueFrom(
//       this.httpService.post<{ data: {address: string, images: string[], star_rating: string, latitude: string, longitude: string} }>(
//         "https://api.worldota.net/api/b2b/v3/hotel/info/", 
//       args, 
//       { headers: this.headers })
//     );
//     const { address, images, star_rating, latitude, longitude } = data.data;
//     return { address: address, 
//       images: images, 
//       star_rating: star_rating, 
//       latitude: latitude,
//       longitude: longitude }
//   };

//   flush (): void {
//     this.cache.flushAll();
//   };

// };


import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Components, Details, Order, PageNum } from './orders.dto';
import { ConfigService } from '@nestjs/config';
// import NodeCache from 'node-cache';

@Injectable()
export class ResService {
  private credentials = `${this.configService.get<string>('KEY_ID')}:${this.configService.get<string>('API_KEY')}`;
  private authHeader = 'Basic ' + Buffer.from(this.credentials).toString('base64');
  private headers = {
    'Content-Type': 'application/json',
    'Authorization': this.authHeader,
  };
  // private cache: NodeCache;
  private pathName: string = '/Users/ekanshgupta/testHotel/hotelEndpoints/src/app/api/backend/src/res/worker.ts';

  constructor(private readonly httpService: HttpService,
    private configService: ConfigService
  ) {
    // this.cache = new NodeCache({ stdTTL: 300, checkperiod: 90 });
  };

  async getInfo(name: string, pg: number): Promise<PageNum | { list: [], new: boolean }> {
    console.log(pg);
    const bodyData = {
      "ordering": {
        "ordering_type": "desc",
        "ordering_by": "created_at"
      },
      "pagination": {
        "page_size": "50",
        "page_number": `${pg}`
      },
      "search": {
        "created_at": {
          "from_date": "2024-03-31T00:00"
        }
      },
      "language": "en"
    };

    const { data } = await firstValueFrom(
      this.httpService.post<Components>("https://api.worldota.net/api/b2b/v3/hotel/order/info/",
        bodyData,
        { headers: this.headers })
    );
    console.log("Data: ", data);
    const multiple: Array<Order> = data.data.orders.filter(order => {
      console.log("Order: " , order);
      const guestInfo = order.rooms_data[0].guest_data.guests[0];
      console.log("GuestInfo: ", guestInfo);
      return (
        name.toLowerCase() ==
        `${guestInfo.first_name} ${guestInfo.last_name}`.toLowerCase() &&
        order.invoice_id != null
      );
    });

    // Commented out NodeCache usage
    // const prev: Array<Order> | undefined = pg == 1 && [] || this.cache.get<Array<Order>>('list');
    // if (prev) {
    //   if (multiple.length == 0) {
    //     return { list: [], new: data.data.found_pages > pg };
    //   };
    //   const cachedList = [...prev, ...multiple];
    //   this.cache.set('list', cachedList, 0);
    // }
    return { list: multiple, new: data.data.found_pages > pg };
  };

  see(hotel: string): Order | undefined {
    // Commented out NodeCache usage
    // const resList: Array<Order> | undefined = this.cache.get<Array<Order>>('list')
    // const single: Order | undefined = resList?.filter((order) => {
    //   return (
    //     order.invoice_id == hotel
    //   );
    // })[0];
    // return single;
    return undefined; // Placeholder
  };

  async hotelData(args: { id: string, language: string }) {
    const { data } = await firstValueFrom(
      this.httpService.post<{ data: { address: string, images: string[], star_rating: string, latitude: string, longitude: string } }>(
        "https://api.worldota.net/api/b2b/v3/hotel/info/",
        args,
        { headers: this.headers })
    );
    const { address, images, star_rating, latitude, longitude } = data.data;
    return {
      address: address,
      images: images,
      star_rating: star_rating,
      latitude: latitude,
      longitude: longitude
    }
  };

  flush(): void {
    // Commented out NodeCache usage
    // this.cache.flushAll();
  };
};
