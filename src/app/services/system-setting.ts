import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SystemSetting {
  id?: number;
  key: string;
  value: string;
}

@Injectable({
  providedIn: 'root'
})
export class SystemSettingService {
  private apiUrl = 'http://localhost:8090/api/settings';

  constructor(private http: HttpClient) { }

  getAllSettings(): Observable<SystemSetting[]> {
    return this.http.get<SystemSetting[]>(this.apiUrl);
  }

  updateSettings(settings: { [key: string]: string }): Observable<void> {
    return this.http.put<void>(this.apiUrl, settings);
  }
}