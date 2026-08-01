import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sector } from './client';

@Injectable({
  providedIn: 'root'
})
export class SectorService {

  private apiUrl = 'http://localhost:8090/api/sectors';

  constructor(private http: HttpClient) { }

  getAllSectors(): Observable<Sector[]> {
    return this.http.get<Sector[]>(this.apiUrl);
  }

  getActiveSectors(): Observable<Sector[]> {
    return this.http.get<Sector[]>(`${this.apiUrl}/active`);
  }

  createSector(sector: Sector): Observable<Sector> {
    return this.http.post<Sector>(this.apiUrl, sector);
  }

  toggleStatus(id: number, active: boolean): Observable<Sector> {
    return this.http.put<Sector>(`${this.apiUrl}/${id}/status`, null, { params: { active } });
  }
}