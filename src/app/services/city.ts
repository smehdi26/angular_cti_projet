import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface City {
  id?: number;
  name: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CityService {
  private apiUrl = 'http://localhost:8090/api/cities';

  constructor(private http: HttpClient) { }

  getAllCities(): Observable<City[]> {
    return this.http.get<City[]>(this.apiUrl);
  }

  getActiveCities(): Observable<City[]> {
    return this.http.get<City[]>(`${this.apiUrl}/active`);
  }

  createCity(city: City): Observable<City> {
    return this.http.post<City>(this.apiUrl, city);
  }

  toggleStatus(id: number, active: boolean): Observable<City> {
    return this.http.put<City>(`${this.apiUrl}/${id}/status`, null, { params: { active } });
  }
}