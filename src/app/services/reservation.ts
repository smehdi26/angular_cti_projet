import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client } from './client';

export interface Reservation {
  id?: number;
  name: string; // Added field
  client: Client;
  reservationTime: string;
  description?: string;
  status: string;
  cancellationReason?: string;
  technician?: any; // Added assigned technician [1.2.6]
  technicianId?: number;
}

export interface TimeSlot {
  time: string;
  booked: boolean;
  clientName?: string;
  reservationId?: number;
  description?: string;
}

export interface BookingRequest {
  name: string; // Added field
  clientId: number;
  date: string;
  time: string;
  description?: string;
  technicianId: number; // Added field
}

@Injectable({
  providedIn: 'root'
})
export class ReservationService {

  private apiUrl = 'http://localhost:8090/api/reservations';

  constructor(private http: HttpClient) { }

  getReservations(keyword?: string, statusFilter?: string): Observable<Reservation[]> {
    let params: any = {};
    if (keyword) params.keyword = keyword;
    if (statusFilter) params.statusFilter = statusFilter;
    return this.http.get<Reservation[]>(this.apiUrl, { params });
  }

  getSlots(date: string): Observable<TimeSlot[]> {
    return this.http.get<TimeSlot[]>(`${this.apiUrl}/slots`, { params: { date } });
  }

  bookSlot(req: BookingRequest): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.apiUrl}/book`, req);
  }

  cancelSlot(id: number, reason?: string): Observable<void> {
    let params: any = {};
    if (reason) params.reason = reason;
    return this.http.post<void>(`${this.apiUrl}/cancel/${id}`, null, { params });
  }

  updateStatus(id: number, status: string, reason?: string): Observable<void> {
    let params: any = { status };
    if (reason) params.reason = reason;
    return this.http.post<void>(`${this.apiUrl}/status/${id}`, null, { params });
  }

  // GET count of today's active reservations
  getTodayCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/today-count`);
  }

  // GET active bookings starting within 1 hour
  getUpcomingAlerts(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/upcoming-alerts`);
  }

  // Add inside the ReservationService class:
  deleteReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}