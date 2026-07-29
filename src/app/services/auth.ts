import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface LoginRequest {
  username: string; // Spring Security expects the email bound to the 'username' parameter
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string; // Added field
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8090/api/auth';

  constructor(private http: HttpClient) { }

  register(req: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, req);
  }

  login(req: LoginRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, req).pipe(
      tap((res: any) => {
        // Save current user/session on success
        localStorage.setItem('currentUser', JSON.stringify(res));
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('lastAcknowledgedDailySummary');
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('currentUser') !== null;
  }
}