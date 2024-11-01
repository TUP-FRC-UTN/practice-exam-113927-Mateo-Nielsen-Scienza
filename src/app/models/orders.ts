export interface OrderProduct {
    productId: string;
    quantity: number;
    price: number;
    stock: number;
  }
  
  export interface Order {
    id?: string;
    customerName: string;
    email: string;
    products: OrderProduct[];
    total: number;
    orderCode: string;
    timestamp: string;
  }