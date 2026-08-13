import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReservationListComponent } from './reservation-list';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReservationService } from '../../services/reservation';
import { of } from 'rxjs';

describe('ReservationListComponent', () => {
  let component: ReservationListComponent;
  let fixture: ComponentFixture<ReservationListComponent>;
  let reservationService: ReservationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationListComponent, HttpClientTestingModule, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationListComponent);
    component = fixture.componentInstance;
    reservationService = TestBed.inject(ReservationService);
  });

  it('should calculate status counts and detect priority field on load', () => {
    const mockData: any[] = [
      { id: 1, name: 'R1', status: 'UNTREATED', priority: 'CRITICAL', reservationTime: '2026-08-13T10:00' },
      { id: 2, name: 'R2', status: 'DONE', priority: 'LOW', reservationTime: '2026-08-13T11:00' }
    ];
    
    spyOn(reservationService, 'getReservations').and.returnValue(of(mockData));
    
    component.loadReservations();

    expect(component.untreatedCount).toBe(1);
    expect(component.doneCount).toBe(1);
    expect(component.reservations[0].priority).toBe('CRITICAL');
  });

  it('should switch between list, board, and calendar views', () => {
    component.switchView('board');
    expect(component.currentView).toBe('board');
    component.switchView('calendar');
    expect(component.currentView).toBe('calendar');
  });
});