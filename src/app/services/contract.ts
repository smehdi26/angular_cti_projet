import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client } from './client'; // Import the Client interface [1.2.1]

export interface Contract {
  id?: number;
  name: string;
  redevance: string; // ANNUELLE, SEMESTRIELLE, TRIMESTRIELLE
  dateSignature: string;
  numberOfVisits?: number;
  monthsOfVisits?: string;
  clientId: number;
  client?: Client; // ADDED: Declares the nested client object
  status: string; // Added field: ACTIVE, SUSPENDED
}

@Injectable({
  providedIn: 'root'
})
export class ContractService {

  private apiUrl = 'http://localhost:8090/api/contracts';

  constructor(private http: HttpClient) { }

  createContract(contract: Contract): Observable<Contract> {
    return this.http.post<Contract>(this.apiUrl, contract);
  }

  getContractsByClient(clientId: number): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.apiUrl}/client/${clientId}`);
  }

  deleteContract(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getContracts(keyword?: string, redevanceFilter?: string): Observable<Contract[]> {
    let params: any = {};
    if (keyword) params.keyword = keyword;
    if (redevanceFilter) params.redevanceFilter = redevanceFilter;
    return this.http.get<Contract[]>(this.apiUrl, { params });
  }

  // PUT update contract months of visits
  updateContractSchedule(id: number, months: string): Observable<Contract> {
    return this.http.put<Contract>(`${this.apiUrl}/${id}/schedule`, null, { params: { months } });
  }

  // Add these methods inside the ContractService class:
  getContractById(id: number): Observable<Contract> {
    return this.http.get<Contract>(`${this.apiUrl}/${id}`);
  }

  updateContract(id: number, contract: Contract): Observable<Contract> {
    return this.http.put<Contract>(`${this.apiUrl}/${id}`, contract);
  }

  toggleStatus(id: number, status: string): Observable<Contract> {
    return this.http.put<Contract>(`${this.apiUrl}/${id}/status`, null, { params: { status } });
  }

  renewContract(id: number): Observable<Contract> {
    return this.http.post<Contract>(`${this.apiUrl}/${id}/renew`, null);
  }
}