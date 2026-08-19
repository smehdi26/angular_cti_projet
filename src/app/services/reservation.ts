import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client } from './client';
import { User } from './auth'; // Import the unified User interface

export interface Reservation {
  id?: number;
  name: string; 
  client: any;
  priority: string; // Add this
  reservationTime: string; // ISO String (LocalDateTime)
  description?: string;
  status: 'UNTREATED' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  cancellationReason?: string;
  technician?: User; // Reference to unified User table
  technicianId?: number;
  statusUpdatedBy?: string; 

}

export interface TimeSlot {
  time: string;
  booked: boolean;
  clientName?: string;
  reservationId?: number;
  description?: string;
}

export interface BookingRequest {
  name: string; 
  clientId: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  description?: string;
  priority: string; // Add this
  technicianId: number; // Assigned user ID
}

@Injectable({
  providedIn: 'root'
})
export class ReservationService {

  private apiUrl = 'http://localhost:8090/api/reservations';

  constructor(private http: HttpClient) { }

  // Fetch all reservations with optional filtering
  getReservations(keyword?: string, statusFilter?: string, priorityFilter?: string): Observable<Reservation[]> {
  let params: any = {};
  if (keyword) params.keyword = keyword;
  if (statusFilter) params.statusFilter = statusFilter;
  if (priorityFilter) params.priorityFilter = priorityFilter; // NEW
  return this.http.get<Reservation[]>(this.apiUrl, { params });
}

  // Fetch 30-min intervals for a specific day
  getSlots(date: string): Observable<TimeSlot[]> {
    return this.http.get<TimeSlot[]>(`${this.apiUrl}/slots`, { params: { date } });
  }

  // Register a new booking
  bookSlot(req: BookingRequest): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.apiUrl}/book`, req);
  }

  // Mark a slot as cancelled
  cancelSlot(id: number, reason?: string): Observable<void> {
    let params: any = {};
    if (reason) params.reason = reason;
    return this.http.post<void>(`${this.apiUrl}/cancel/${id}`, null, { params });
  }

  // Update status (DONE, IN_PROGRESS, etc.)
  updateStatus(id: number, status: string, reason?: string): Observable<void> {
    let params: any = { status };
    if (reason) params.reason = reason;
    return this.http.post<void>(`${this.apiUrl}/status/${id}`, null, { params });
  }

  // Get total active reservation count for today
  getTodayCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/today-count`);
  }

  // Get alerts for reservations starting within 1 hour
  getUpcomingAlerts(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/upcoming-alerts`);
  }

  // Permanent deletion of a record
  deleteReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateReservation(id: number, req: any): Observable<Reservation> {
  return this.http.put<Reservation>(`${this.apiUrl}/${id}`, req, { withCredentials: true });
}
}