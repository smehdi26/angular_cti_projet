import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClientService, Client } from '../../services/client';

@Component({
  selector: 'app-client-view',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './client-view.html',
  styleUrls: ['./client-view.css']
})
export class ClientViewComponent implements OnInit {

  client!: Client;
  reservations: any[] = [];
  phone: string = '';

  constructor(
    private clientService: ClientService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.phone = this.route.snapshot.params['phone'];
    this.loadProfile();
  }

  loadProfile(): void {
    this.clientService.getClientByPhone(this.phone).subscribe({
      next: (data) => {
        this.client = data;
        this.loadReservations();
      },
      error: (err: any) => {
        console.error('Failed to load client details', err);
      }
    });
  }

  loadReservations(): void {
    this.clientService.getClientReservations(this.phone).subscribe({
      next: (data) => {
        this.reservations = data;
      },
      error: (err: any) => {
        console.error('Failed to load reservation log', err);
      }
    });
  }
}