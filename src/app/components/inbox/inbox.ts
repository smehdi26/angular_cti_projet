import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './inbox.html',
  styleUrls: ['./inbox.css']
})
export class InboxComponent implements OnInit {

  private apiUrl = 'http://localhost:8090/api/messages';
  
  messages: any[] = [];
  selectedMessage: any = null;
  loading: boolean = true;
  searchTerm: string = '';

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadInbox();
  }

  /**
   * TDD Requirement: Fetch current user's inbox
   */
  loadInbox(): void {
    this.loading = true;
    this.http.get<any[]>(`${this.apiUrl}/inbox`, { withCredentials: true }).subscribe({
      next: (data) => {
        // Sort by newest first
        this.messages = data.sort((a, b) => 
          new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
        );
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load inbox', err);
        this.loading = false;
      }
    });
  }

  /**
   * Master-Detail Logic: View message content and sync 'Read' state to DB
   */
  selectMessage(msg: any): void {
    this.selectedMessage = msg;

    // Only call backend if the message was unread
    if (!msg.isRead) {
      this.http.put(`${this.apiUrl}/${msg.id}/read`, {}, { withCredentials: true }).subscribe({
        next: () => {
          msg.isRead = true;
          // Optionally refresh sidebar notification count here if needed
        },
        error: (err) => console.error('Error marking as read', err)
      });
    }
  }

  /**
   * Filter messages based on search keyword
   */
  get filteredMessages() {
    if (!this.searchTerm.trim()) return this.messages;
    const term = this.searchTerm.toLowerCase();
    return this.messages.filter(m => 
      m.subject.toLowerCase().includes(term) || 
      m.senderEmail.toLowerCase().includes(term) ||
      m.content.toLowerCase().includes(term)
    );
  }

  /**
   * Delete a message from the list and database
   */
  deleteMessage(id: number, event: Event): void {
    event.stopPropagation(); // Prevent opening the message when clicking delete
    if (confirm('Supprimer ce message définitivement ?')) {
      this.http.delete(`${this.apiUrl}/${id}`, { withCredentials: true }).subscribe({
        next: () => {
          this.messages = this.messages.filter(m => m.id !== id);
          if (this.selectedMessage?.id === id) {
            this.selectedMessage = null;
          }
        }
      });
    }
  }

  // Placeholder for compose functionality
  openComposeModal() {
    alert("Fonctionnalité d'envoi en cours de développement.");
  }
}