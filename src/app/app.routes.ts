import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ClientAddComponent } from './components/client-add/client-add';
import { ClientEditComponent } from './components/client-edit/client-edit';
import { ClientViewComponent } from './components/client-view/client-view';
import { ReservationListComponent } from './components/reservation-list/reservation-list';
import { ReservationScheduleComponent } from './components/reservation-schedule/reservation-schedule';
import { NotificationListComponent } from './components/notification-list/notification-list'; // Import this

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  
  // Client pathways
  { path: 'clients/add', component: ClientAddComponent },
  { path: 'clients/:phone', component: ClientViewComponent },
  { path: 'clients/:phone/edit', component: ClientEditComponent },

  // Reservation pathways
  { path: 'reservations', component: ReservationListComponent },
  { path: 'reservations/schedule', component: ReservationScheduleComponent },

  // Notification pathways
  { path: 'notifications', component: NotificationListComponent } // Register this route
];