import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Phone {
  phoneNumber: string;
}

export interface Client {
  id?: number;
  name: string;
  email: string;
  description?: string;
  phones?: Phone[];
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {

  private apiUrl = 'http://localhost:8090/api/clients';

  constructor(private http: HttpClient) { }

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(this.apiUrl);
  }

  getClientByPhone(phone: string): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/${phone}`);
  }

  createClient(client: Client): Observable<Client> {
    return this.http.post<Client>(this.apiUrl, client);
  }

  deleteClient(phone: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${phone}`);
  }

  // Save modifications to Spring
  updateClient(phone: string, client: Client): Observable<Client> {
    return this.http.put<Client>(`${this.apiUrl}/${phone}`, client);
  }

  // Fetch client meeting history log from Spring
  getClientReservations(phone: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${phone}/reservations`);
  }
}