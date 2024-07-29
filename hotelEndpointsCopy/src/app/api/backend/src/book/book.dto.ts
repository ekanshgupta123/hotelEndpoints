export class PageData {
  hotels: {
      id: string;
      rates: {
        book_hash: string;
      }[];
  }[];
};

export class Page {
    data: PageData;
  };

export class RatesData {
    item_id: string;
    order_id: string;
    partner_order_id: string;
    payment_types: {
      amount: string;
      currency_code: string;
      is_need_credit_card_data: boolean;
      is_need_cvc: boolean;
      recommended_price?: {
        amount: string;
        currency_code: string;
        show_amount: string;
        show_currency_code: string;
      };
      type: string;
    }[];
  };

export class Rates {
    data: RatesData;
    debug: null;
    error: null;
    status: string;
  };

export class Status {
    "data": null;
    "debug": null;
    "error": null;
    "status": string
  };

export class FinalSchema {
  creditNeeded: boolean;
  cvcNeeded: boolean;
  pID: string;
  confirmation: string;
};

class CoreData {
  "year": string; 
  "card_number": string;
  "card_holder": string; 
  "month": string
};

export class TokenFormat {
  "object_id": string;
  "pay_uuid": string;
  "init_uuid": string;
  "user_first_name": string;
  "user_last_name": string;
  "cvc"?: string;
  "credit_card_data_core": CoreData;
  "is_cvc_required": boolean;
};

