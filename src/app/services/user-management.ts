import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SystemUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private apiUrl = 'http://localhost:8090/api/users';

  constructor(private http: HttpClient) { }

  getAllUsers(): Observable<SystemUser[]> {
    return this.http.get<SystemUser[]>(this.apiUrl);
  }

  updateRole(id: number, role: string): Observable<SystemUser> {
    return this.http.put<SystemUser>(`${this.apiUrl}/${id}/role`, null, { params: { role } });
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getTechnicians(): Observable<SystemUser[]> {
    return this.http.get<SystemUser[]>(`${this.apiUrl}/technicians`);
  }
}