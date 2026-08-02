import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ClientAddComponent } from './components/client-add/client-add';
import { ClientEditComponent } from './components/client-edit/client-edit';
import { ClientViewComponent } from './components/client-view/client-view';
import { ReservationListComponent } from './components/reservation-list/reservation-list';
import { ReservationScheduleComponent } from './components/reservation-schedule/reservation-schedule';
import { NotificationListComponent } from './components/notification-list/notification-list';
import { ContractAddComponent } from './components/contract-add/contract-add';
import { ContractListComponent } from './components/contract-list/contract-list';
import { ClientListComponent } from './components/client-list/client-list'; // Import this [1.2.1]

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // Workspace directories [1.2.1]
  { path: 'dashboard', component: DashboardComponent },
  { path: 'clients', component: ClientListComponent }, // Register clients directory path
  
  // Client CRUD [1.2.1]
  { path: 'clients/add', component: ClientAddComponent },
  { path: 'clients/:phone', component: ClientViewComponent },
  { path: 'clients/:phone/edit', component: ClientEditComponent },

  // Reservation pathways [1.2.1]
  { path: 'reservations', component: ReservationListComponent },
  { path: 'reservations/schedule', component: ReservationScheduleComponent },

  // Notification pathways [1.2.1]
  { path: 'notifications', component: NotificationListComponent },

  // Contract pathways [1.2.1]
  { path: 'contracts', component: ContractListComponent },
  { path: 'contracts/add', component: ContractAddComponent }
];