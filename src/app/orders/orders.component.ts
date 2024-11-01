import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { Observable, catchError, of } from 'rxjs';
import { Order } from '../models/orders';
import { RouterLink } from '@angular/router';
import { OrderProcessingService } from '../order-processing.service';
import { OrderProduct } from '../models/orders';
import { Product } from '../models/products';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, DatePipe, CurrencyPipe, HttpClientModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css',
  providers: [OrderProcessingService] 
  
})
export class OrdersComponent implements OnInit{
  loading = false;
  private orders: Order[] = [];
  filteredOrders$!: Observable<Order[]>;
  searchTerm: string = '';
  private apiUrl = 'http://localhost:3000';
  products$: Observable<Product[]>;

  constructor(
    private http: HttpClient,
    private orderProcessing: OrderProcessingService
  ) {
    this.products$ = this.http.get<Product[]>(`${this.apiUrl}/products`).pipe(
      catchError(() => of([
        { id: "1", name: "Laptop Gaming Pro", price: 999.99, stock: 50 },
        { id: "2", name: "Smartphone X12", price: 699.99, stock: 100 },
        { id: "3", name: "Tablet Air", price: 449.99, stock: 75 },
        { id: "4", name: "Smart Watch V4", price: 199.99, stock: 120 }
      ]))
    );
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    this.loading = true;
    this.http.get<Order[]>(`${this.apiUrl}/orders`).pipe(
      catchError(error => {
        console.error('Error loading orders:', error);
        return of([]);
      })
    ).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.filterOrders();
      },
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



