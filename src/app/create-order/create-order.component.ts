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

  constructor(
    private fb: FormBuilder, 
    private http: HttpClient,
    private router: Router 
  ) {
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

  private calculateTotal(products: any[]): number {
    return products.reduce((total, product) => {
      const precio = product.precio || 0;
      const cantidad = product.cantidad || 0;
      return total + (precio * cantidad);
    }, 0);
  }

  private getProductId(productName: string): string {
    let id = '';
    this.products$.subscribe(products => {
      const product = products.find(p => p.name === productName);
      if (product) {
        id = product.id;
      }
    }).unsubscribe();
    return id;
  }

  onSubmit(): void {
    if (this.orderForm.valid) {
      const formValue = this.orderForm.value;
      
      const orderData = {
        id: Date.now().toString(),
        customerName: formValue.customer.nombre,
        email: formValue.customer.email,
        products: formValue.products.map((p: any) => ({
          productId: this.getProductId(p.nombre),
          quantity: p.cantidad,
          price: p.precio,
          stock: p.stock
        })),
        total: this.calculateTotal(this.products.getRawValue()),
        orderCode: `ORD-${Date.now()}`,
        timestamp: new Date().toISOString()
      };
  
      this.http.post(`${this.apiUrl}/orders`, orderData).subscribe({
        next: () => {
          alert('Pedido creado exitosamente');
          this.router.navigate(['/orders'])
            .then(() => {
           
              window.location.reload();
            });
        },
        error: (error) => {
          console.error('Error al crear pedido:', error);
          alert('Error al crear el pedido');
        }
      });
    }
  }
}
