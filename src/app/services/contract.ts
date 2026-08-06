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
  monthsOfVisits?: string; // Calculated by backend dynamically [1.1.4]
  visitDate1?: string;
  visitDate2?: string;
  visitDate3?: string;
  visitDate4?: string;
  visitDate5?: string;
  visitDate6?: string;
  clientId: number;
  client?: Client;
  status: string; // ACTIVE, SUSPENDED
  history?: ContractHistory[]; // Dynamic yearly historical logs [1.2.6]
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
    if (activeFilter) params.activeFilter = activeFilter; // Added parameter mapping
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

  // 9. PUT: Update exact visit dates (N.D.V constraint-safe) [1.1.4, 1.2.1]
  updateContractScheduleDates(id: number, dates: string[]): Observable<Contract> {
    return this.http.put<Contract>(`${this.apiUrl}/${id}/schedule-dates`, dates);
  }

  // 10. GET: Fetch monthly scheduler list
  getMonthlySchedules(month: number, year: number): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.apiUrl}/monthly`, { params: { month, year } });
  }
}