import { Routes } from '@angular/router';
import { OrdersComponent } from './orders/orders.component';
import { CreateOrderComponent } from './create-order/create-order.component';

export const routes: Routes = [
  { path: '', redirectTo: '/create-order', pathMatch: 'full' },
  { path: 'create-order', component: CreateOrderComponent },
  { path: 'orders', component: OrdersComponent }
];