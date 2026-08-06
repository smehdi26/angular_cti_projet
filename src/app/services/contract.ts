import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client } from './client'; // Import the Client interface [1.2.1]

export interface ContractHistory {
  id?: number;
  year: number;
  redevance: string;
  visitDates: string;
}

export interface Contract {
  id?: number;
  name: string;
  redevance: string; // ANNUELLE, SEMESTRIELLE, TRIMESTRIELLE
  dateSignature: string;
  numberOfVisits?: number;
  monthsOfVisits?: string; // Automatically calculated in-memory [1.1.4]
  status: string; // ACTIVE, SUSPENDED
  clientId: number;
  client?: Client;
  history?: ContractHistory[]; // Dynamic historical logs [1.2.6]

  // Visit exact date properties [1.1.4, 1.2.6]
  visitDate1?: string;
  visitFile1?: string;
  visitFileName1?: string;
  visitFile1Raw?: string; // Stores unique raw filename reference

  visitDate2?: string;
  visitFile2?: string;
  visitFileName2?: string;
  visitFile2Raw?: string;

  visitDate3?: string;
  visitFile3?: string;
  visitFileName3?: string;
  visitFile3Raw?: string;

  visitDate4?: string;
  visitFile4?: string;
  visitFileName4?: string;
  visitFile4Raw?: string;

  visitDate5?: string;
  visitFile5?: string;
  visitFileName5?: string;
  visitFile5Raw?: string;

  visitDate6?: string;
  visitFile6?: string;
  visitFileName6?: string;
  visitFile6Raw?: string;
}

export interface VisitSchedule {
  date: string;
  filePath?: string;
  fileName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContractService {

  private apiUrl = 'http://localhost:8090/api/contracts';

  constructor(private http: HttpClient) { }

  // 1. POST: Register new contract
  createContract(contract: Contract): Observable<Contract> {
    return this.http.post<Contract>(this.apiUrl, contract);
  }

  // 2. GET: List contracts by Client ID
  getContractsByClient(clientId: number): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.apiUrl}/client/${clientId}`);
  }

  // 3. DELETE: Terminate contract
  deleteContract(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // 4. GET: Fetch all contracts with optional search, term, and status filters [1.2.6]
  getContracts(keyword?: string, redevanceFilter?: string, activeFilter?: string): Observable<Contract[]> {
    let params: any = {};
    if (keyword) params.keyword = keyword;
    if (redevanceFilter) params.redevanceFilter = redevanceFilter;
    if (activeFilter) params.activeFilter = activeFilter;
    return this.http.get<Contract[]>(this.apiUrl, { params });
  }

  // 5. GET: Fetch contract by ID (Details Workspace)
  getContractById(id: number): Observable<Contract> {
    return this.http.get<Contract>(`${this.apiUrl}/${id}`);
  }

  // 6. PUT: Update contract details
  updateContract(id: number, contract: Contract): Observable<Contract> {
    return this.http.put<Contract>(`${this.apiUrl}/${id}`, contract);
  }

  // 7. PUT: Toggle contract active/suspended status
  toggleStatus(id: number, status: string): Observable<Contract> {
    return this.http.put<Contract>(`${this.apiUrl}/${id}/status`, null, { params: { status } });
  }

  // 8. POST: Renew contract (Adds exactly 1 year and resets schedule) [1.1.4]
  renewContract(id: number): Observable<Contract> {
    return this.http.post<Contract>(`${this.apiUrl}/${id}/renew`, null);
  }

  // 9. PUT: Update exact visit dates (N.D.V constraint-safe) [1.1.4, 1.2.1, 1.2.6]
  updateContractScheduleDates(id: number, visits: VisitSchedule[]): Observable<Contract> {
    return this.http.put<Contract>(`${this.apiUrl}/${id}/schedule-dates`, visits);
  }

  // 10. GET: Fetch monthly scheduler list
  getMonthlySchedules(month: number, year: number): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.apiUrl}/monthly`, { params: { month, year } });
  }

  // 11. POST: AJAX File Uploader [1.2.6]
  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/upload`, formData);
  }
}