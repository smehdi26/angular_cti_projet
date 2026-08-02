import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8090/api/auth';

  // Reactive state manager for the active admin profile card [1.2.6]
  private currentUserSubject = new BehaviorSubject<any>(this.getCurrentUserFromStorage());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) { }

  private getCurrentUserFromStorage(): any {
    const userJson = localStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
  }

  register(req: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, req);
  }

  login(req: LoginRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, req).pipe(
      tap((res: any) => {
        localStorage.setItem('currentUser', JSON.stringify(res));
        this.updateCurrentUserInSidebar(); // Broadcast successful login
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('lastAcknowledgedDailySummary');
    this.currentUserSubject.next(null); // Clear active broadcast
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('currentUser') !== null;
  }

  // GET active profile details from Spring
  getProfile(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`, { params: { email } });
  }

  // PUT update profile details
  updateProfile(existingEmail: string, req: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, req, { params: { existingEmail } }).pipe(
      tap((res: any) => {
        localStorage.setItem('currentUser', JSON.stringify(res));
        this.updateCurrentUserInSidebar(); // Broadcast updated details instantly [1.2.6]
      })
    );
  }

  // Broadcasts the fresh session storage details globally [1.2.6]
  updateCurrentUserInSidebar(): void {
    this.currentUserSubject.next(this.getCurrentUserFromStorage());
  }
}