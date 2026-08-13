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

  // 1. Initialize the Subject. The 'getCurrentUserFromStorage' method handles the safety checks.
  private currentUserSubject = new BehaviorSubject<User | null>(this.getCurrentUserFromStorage());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) { }

  /**
   * BULLETPROOF STORAGE READER
   * Prevents the app from crashing if 'undefined' or 'null' strings are stored.
   */
  private getCurrentUserFromStorage(): User | null {
    const userJson = localStorage.getItem('currentUser');

    // Check for null, or the literal strings "undefined"/"null" that cause JSON.parse to crash
    if (!userJson || userJson === 'undefined' || userJson === 'null') {
      return null;
    }

    try {
      return JSON.parse(userJson);
    } catch (e) {
      console.error("Malformed JSON in storage, clearing...", e);
      localStorage.removeItem('currentUser');
      return null;
    }
  }

  register(req: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, req);
  }

  /**
   * LOGIN
   * Refactored to handle the direct User object returned by your Spring Boot Controller.
   * We use 'withCredentials: true' to ensure the session cookie is saved.
   */
  login(req: LoginRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/login`, req, { withCredentials: true }).pipe(
      tap((user: User) => {
        if (user && user.email) {
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
        }
      })
    );
  }

  /**
   * GET ME (Session Restoration)
   * This is vital for Google Auth. After redirect, Angular calls this to see if the session is alive.
   */
  getMe(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`, { withCredentials: true }).pipe(
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('lastAcknowledgedDailySummary');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return this.getCurrentUserFromStorage() !== null;
  }

  getProfile(email: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`, { params: { email } });
  }

  updateProfile(existingEmail: string, req: any): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, req, { params: { existingEmail } }).pipe(
      tap((updatedUser: User) => {
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        this.currentUserSubject.next(updatedUser);
      })
    );
  }

  /**
   * Manual trigger to refresh sidebar state if needed
   */
  updateCurrentUserInSidebar(): void {
    this.currentUserSubject.next(this.getCurrentUserFromStorage());
  }
}