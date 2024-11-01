import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ValidatorFn, ValidationErrors, ReactiveFormsModule,AsyncValidatorFn,} from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Product } from '../models/products';
import { Order } from '../models/orders';
import { clienteValidaciones } from '../models/client';
import { CommonModule } from '@angular/common';
import { map, catchError } from 'rxjs';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';


interface OrderHistory {
  id: string;
  email: string;
  timestamp: string;
}

@Component({
  selector: 'app-create-order',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule],
  templateUrl: './create-order.component.html',
  styleUrl: './create-order.component.css'
})
export class CreateOrderComponent implements OnInit{
  orderForm!: FormGroup;
  products$: Observable<Product[]>;
  private apiUrl = 'http://localhost:3000';

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.initForm();
    this.products$ = this.http.get<Product[]>(`${this.apiUrl}/products`).pipe(
      catchError(() => of([
        { id: "1", name: "Laptop Gaming Pro", price: 999.99, stock: 50 },
        { id: "2", name: "Smartphone X12", price: 699.99, stock: 100 },
        { id: "3", name: "Tablet Air", price: 449.99, stock: 75 },
        { id: "4", name: "Smart Watch V4", price: 199.99, stock: 120 }
      ]))
    );
  }

  ngOnInit(): void {}

  private initForm(): void {
    this.orderForm = this.fb.group({
      customer: this.fb.group({
        nombre: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email], [this.emailOrderLimitValidator()]]
      }),
      products: this.fb.array([])
    });
  }

  get products(): FormArray {
    return this.orderForm.get('products') as FormArray;
  }

  addProduct(): void {
    const productGroup = this.fb.group({
      nombre: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precio: [{ value: 0, disabled: true }],
      stock: [{ value: 0, disabled: true }]
    });

    productGroup.get('nombre')?.valueChanges.subscribe(selectedProduct => {
      this.products$.subscribe(products => {
        const product = products.find(p => p.name === selectedProduct);
        if (product) {
          productGroup.patchValue({
            precio: product.price,
            stock: product.stock
          }, { emitEvent: false });

          const cantidadControl = productGroup.get('cantidad');
          cantidadControl?.setValidators([
            Validators.required,
            Validators.min(1),
            Validators.max(product.stock)
          ]);
          cantidadControl?.updateValueAndValidity();
        }
      });
    });

    this.products.push(productGroup);
  }

  removeProduct(index: number): void {
    this.products.removeAt(index);
  }

  emailOrderLimitValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const email = control.value;
      if (!email) {
        return of(null);
      }
      return this.http.get<OrderHistory[]>(`${this.apiUrl}/orders?email=${email}`).pipe(
        map(orders => {
          const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const recentOrders = orders.filter(order => 
            new Date(order.timestamp) > last24Hours
          );
          return recentOrders.length >= 3 ? { orderLimit: true } : null;
        }),
        catchError(() => of(null))
      );
    };
  }

  onSubmit(): void {
    if (this.orderForm.valid) {
      console.log(this.orderForm.value);
      
    }
  }
}
