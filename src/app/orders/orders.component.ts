import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, map } from 'rxjs';
import { Order } from '../models/orders';
import { RouterLink } from '@angular/router';
import { OrderProcessingService } from '../order-processing.service';
@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe, CurrencyPipe],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css',
  providers: [OrderProcessingService] 
  
})
export class OrdersComponent implements OnInit{
  loading = false;
  private orders: Order[] = [];
  filteredOrders$!: Observable<Order[]>;
  searchTerm: string = '';

  constructor(
    private http: HttpClient,
    private orderProcessing: OrderProcessingService
  ) {}

  async submitOrder(orderData: any): Promise<void> {
    try {
      const processedOrder = await this.orderProcessing.processOrder({
        customerName: orderData.customer.nombre,
        email: orderData.customer.email,
        products: orderData.products,
        total: 0, 
        orderCode: '', 
        timestamp: '' 
      });

      await this.http.post('/api/orders', processedOrder).toPromise();
     
    } catch (error) {
      
      console.error(error);
    }
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    this.loading = true;
    this.http.get<Order[]>('/api/orders').subscribe({
      next: (orders) => {
        this.orders = orders;
        this.filterOrders();
      },
      error: (error) => console.error('Error loading orders:', error),
      complete: () => this.loading = false
    });
  }

  filterOrders(): void {
    this.filteredOrders$ = new Observable(observer => {
      const filtered = this.orders.filter(order => 
        order.customerName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.email.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
      observer.next(filtered);
      observer.complete();
    });
  }
}
