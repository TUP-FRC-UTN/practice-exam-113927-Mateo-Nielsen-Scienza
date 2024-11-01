import { Component, OnInit } from '@angular/core';
import { 
  FormBuilder, 
  FormGroup, 
  FormArray, 
  Validators, 
  AbstractControl, 
  ValidatorFn, 
  ValidationErrors, 
  ReactiveFormsModule,
  AsyncValidatorFn,
} from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Product } from '../models/products';
import { Order } from '../models/orders';
import { clienteValidaciones } from '../models/client';
import { CommonModule } from '@angular/common';
import { map, catchError } from 'rxjs';


interface OrderHistory {
  id: string;
  email: string;
  timestamp: string;
}

@Component({
  selector: 'app-create-order',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './create-order.component.html',
  styleUrl: './create-order.component.css'
})
export class CreateOrderComponent implements OnInit{

  orderForm!: FormGroup;
  products$: Observable<Product[]> = new Observable<Product[]>();
  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.initForm();
  }

  ngOnInit(): void {
    this.products$ = this.http.get<Product[]>('/api/products');
  }


  private initForm(): void {
    this.orderForm = this.fb.group({
      customer: this.fb.group({
        nombre: ['', [Validators.required, Validators.minLength(clienteValidaciones.nombre.minLength)]],
        email: ['', [Validators.required, Validators.email], [this.emailOrderLimitValidator()]]
      }),
      products: this.fb.array([], [
        Validators.required,
        this.minProductsValidator(),
        this.maxTotalQuantityValidator(),
        this.noDuplicateProductsValidator()
      ])
    });
  }

  emailOrderLimitValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const email = control.value;
      
      if (!email) {
        return of(null);
      }

      return this.http.get<OrderHistory[]>(`/orders?email=${email}`).pipe(
        map((orders: OrderHistory[]) => {
          const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const recentOrders = orders.filter((order: OrderHistory) => 
            new Date(order.timestamp) > last24Hours
          );

          return recentOrders.length > 3 ? { orderLimit: true } : null;
        }),
        catchError(() => of(null))
      );
    };
  }

  get products(): FormArray {
    return this.orderForm.get('products') as FormArray;
  }

  addProduct(): void {
    const productGroup = this.fb.group({
      nombre: ['', Validators.required],  
      cantidad: [1, [Validators.required, Validators.min(1), this.noExceedStockValidator()]],
      precio: [{ value: 0, disabled: true }],
      stock: [{ value: 0, disabled: true }]
    });
  
    this.products.push(productGroup);
  }
  private calculateTotal(products: any[]): number {
    return products.reduce((total, product) => {
      return total + (product.cantidad * product.precio);
    }, 0);
  }

  private generateOrderCode(email: string): string {
    const prefix = email.charAt(0).toUpperCase();
    const timestamp = Date.now();
    return `${prefix}.com${timestamp}`;
  }
 
  private mapFormToOrder(formValue: any): Order {
    return {
      customerName: formValue.customer.nombre,
      email: formValue.customer.email,
      products: formValue.products.map((p: any) => ({
        productId: p.nombre, 
        quantity: p.cantidad,
        price: p.precio,
        stock: p.stock
      })),
      total: this.calculateTotal(formValue.products),
      orderCode: this.generateOrderCode(formValue.customer.email),
      timestamp: new Date().toISOString()
    };
  }

  removeProduct(index: number): void {
    this.products.removeAt(index);
  }

  noExceedStockValidator() {
    return (control: AbstractControl) => {
      const stock = control.parent?.get('stock')?.value;
      if (control.value > stock) {
        return { noExceedStock: true };
      }
      return null;
    };
  }

  minProductsValidator() {
    return (control: AbstractControl) => {
      const products = control as FormArray;
      if (products.length < 1) {
        return { minProducts: true };
      }
      return null;
    };
  }

  

  maxTotalQuantityValidator() {
    return (control: AbstractControl) => {
      const products = control as FormArray;
      const totalQuantity = products.controls.reduce((sum, product) => sum + product.get('cantidad')?.value || 0, 0);
      if (totalQuantity > 10) {
        return { maxTotalQuantity: true };
      }
      return null;
    };
  }

  onSubmit(): void {
    if (this.orderForm.valid) {
      console.log(this.orderForm.value);
    }
  }

  noDuplicateProductsValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const products = control as FormArray;
      const productNames = products.controls.map(product => product.get('nombre')?.value);
      
      const hasDuplicates = productNames.some((name, index) => 
        productNames.indexOf(name) !== index && name !== ''
      );
      
      return hasDuplicates ? { duplicateProducts: true } : null;
    };
  }
}
