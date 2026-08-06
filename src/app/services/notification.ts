import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface NotificationLog {
  id?: number;
  title?: string; // Added field
  message: string;
  createdAt: string;
  readStatus: boolean;
  type: string; // INFO, SUCCESS, DANGER, WARNING
  category: string; // Added: CLIENT, CONTRACT, RESERVATION
  statusLevel?: string; // Added: SAFE, REMINDER, URGENT, OVERDUE
  color?: string;       // Added: GREEN, YELLOW, RED
  priority?: string;    // Added: LOW, MEDIUM, HIGH, CRITICAL
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private apiUrl = 'http://localhost:8090/api/notifications';

  // Reactive state manager for the unread counter badge [1.2.6]
  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) { }

  getNotifications(): Observable<NotificationLog[]> {
    return this.http.get<NotificationLog[]>(this.apiUrl);
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/unread-count`);
  }

  markAllAsRead(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/read-all`, null).pipe(
      tap(() => this.updateUnreadCount()) // Refresh badge state instantly
    );
  }

  // Queries the backend and broadcasts the new unread count to all observers [1.2.6]
  updateUnreadCount(): void {
    this.getUnreadCount().subscribe({
      next: (count: number) => {
        this.unreadCountSubject.next(count);
      },
      error: (err: any) => console.error('Failed to update unread count', err)
    });
  }

  // DELETE a single notification from history
  deleteNotification(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.updateUnreadCount()) // Sync global sidebar badge [1.2.6]
    );
  }
}