
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Order, OrderProduct } from './models/orders';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrderProcessingService {
  private readonly DISCOUNT_THRESHOLD = 1000;
  private readonly DISCOUNT_PERCENTAGE = 0.1;

  constructor(private http: HttpClient) {}

  calculateOrderTotal(products: OrderProduct[]): number {
    const subtotal = products.reduce((total, product) => {
      return total + (product.quantity * product.price);
    }, 0);

    return subtotal > this.DISCOUNT_THRESHOLD 
      ? subtotal * (1 - this.DISCOUNT_PERCENTAGE) 
      : subtotal;
  }

  validateStock(products: OrderProduct[]): boolean {
    return products.every(product => product.quantity <= product.stock);
  }

  generateOrderCode(customerName: string, email: string): string {
    const prefix = customerName.charAt(0).toUpperCase();
    const emailSuffix = email.slice(-4);
    const timestamp = Date.now();
    return `${prefix}${emailSuffix}${timestamp}`;
  }

  enrichProducts(products: OrderProduct[]): OrderProduct[] {
    const purchaseDate = new Date().toISOString();
    return products.map(product => ({
      ...product,
      purchaseDate
    }));
  }

  validateDuplicateProducts(products: OrderProduct[]): boolean {
    const productIds = products.map(p => p.productId);
    return new Set(productIds).size === productIds.length;
  }

  async validateOrderLimit(email: string): Promise<boolean> {
    try {
      const orders = await lastValueFrom(this.http.get<Order[]>(`/api/orders?email=${email}`));
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentOrders = orders.filter(order => 
        new Date(order.timestamp) > last24Hours
      );
      
      return recentOrders.length <= 3;
    } catch (error) {
      console.error('Error validating order limit:', error);
      throw new Error('Failed to validate order limit');
    }
  }

  async processOrder(order: Order): Promise<Order> {
    try {
      // Validate order
      if (!this.validateStock(order.products)) {
        throw new Error('Insufficient stock');
      }

      if (!this.validateDuplicateProducts(order.products)) {
        throw new Error('Duplicate products not allowed');
      }

      if (!await this.validateOrderLimit(order.email)) {
        throw new Error('Order limit exceeded');
      }

      // Process order
      order.products = this.enrichProducts(order.products);
      order.total = this.calculateOrderTotal(order.products);
      order.orderCode = this.generateOrderCode(order.customerName, order.email);
      order.timestamp = new Date().toISOString();

      // Save order to backend
      const savedOrder = await lastValueFrom(
        this.http.post<Order>('/api/orders', order)
      );

      return savedOrder;
    } catch (error) {
      console.error('Error processing order:', error);
      throw error;
    }
  }
}