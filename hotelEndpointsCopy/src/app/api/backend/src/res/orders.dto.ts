export class Guests {
    age: null;
    first_name: string;
    first_name_original: string;
    is_child: boolean;
    last_name: string;
    last_name_original: string;
  }
  
class RoomData {
    bedding_name: Array<string>;
    guest_data: {
        adults_number: number,
        children_number: number,
        guests: Guests[]
    };
    meal_name: string;
    room_idx: number;
    room_name: string;
}

class Policies {
    end_at: null;
    penalty: { amount: string, amount_info: null, currency_code: string };
    start_at: null;
}

class TaxAmount {
    amount_tax: { amount: string, currency_code: string }; 
    is_included: boolean;
    name: string;
}
  
export class Order {
    agreement_number: string;
    amount_payable: { amount: string, currency_code: string };
    amount_payable_vat: { amount: string, currency_code: string };
    amount_payable_with_upsells: { amount: string, currency_code: string };
    amount_refunded: { amount: string, currency_code: string };
    amount_sell: { amount: string, currency_code: string };
    amount_sell_b2b2c: { amount: string, currency_code: string };
    api_auth_key_id: null;
    cancellation_info: { free_cancellation_before: null, policies: Array<Policies> };
    cancelled_at: null;
    checkin_at: string;
    checkout_at: string;
    contract_slug: string;
    created_at: string;
    has_tickets: boolean;
    hotel_data: { id: string, order_id: null };
    invoice_id: string;
    is_cancellable: boolean;
    is_checked: boolean;
    meta_data: { voucher_order_comment: null };
    modified_at: string;
    nights: number;
    order_id: number;
    order_type: string;
    partner_data: { order_comment: null, order_id: string };
    payment_data: {
        invoice_id: number,
        invoice_id_v2: string,
        paid_at: null,
        payment_by: null,
        payment_due: string,
        payment_pending: string,
        payment_type: string
    };
    roomnights: number;
    rooms_data: Array<RoomData>;
    source: string;
    status: string;
    supplier_data: { confirmation_id: null, name: null, order_id: string };
    taxes: Array<TaxAmount>;
    total_vat: { amount: string, currency_code: string, included: boolean };
    upsells: [];
    user_data: { arrival_datetime: null, email: string, user_comment: null };
}


export class Components {
    data: { orders: Array<Order>, found_pages: number }
  }

export class Details { 
    hotel?: string;
    preArgs?: Array<Order>
  };

export class PageNum {
    list: Array<Order>;
    new: boolean;
    pages?: number
}