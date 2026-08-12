import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

// Unified User Interface
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ROLE_ADMIN' | 'ROLE_HR' | 'ROLE_TECHNICIAN';
}

export interface LoginRequest {
  username: string; // backend maps email to username
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string; 
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8090/api/auth';

  // Reactive state manager for the active profile card in the sidebar
  private currentUserSubject = new BehaviorSubject<User | null>(this.getCurrentUserFromStorage());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) { }

  private getCurrentUserFromStorage(): User | null {
    const userJson = localStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
  }

  register(req: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, req);
  }

  login(req: LoginRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/login`, req).pipe(
      tap((user: User) => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.updateCurrentUserInSidebar(); // Refresh global UI
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('lastAcknowledgedDailySummary');
    this.currentUserSubject.next(null); // Clear broadcast
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('currentUser') !== null;
  }

  // GET active user details from Spring
  getProfile(email: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`, { params: { email } });
  }

  // PUT update profile details
  updateProfile(existingEmail: string, req: any): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, req, { params: { existingEmail } }).pipe(
      tap((updatedUser: User) => {
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        this.updateCurrentUserInSidebar(); // Refresh UI instantly
      })
    );
  }

  // Broadcasts the fresh storage details globally
  updateCurrentUserInSidebar(): void {
    this.currentUserSubject.next(this.getCurrentUserFromStorage());
  }
}