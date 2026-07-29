import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationSchedule } from './reservation-schedule';

describe('ReservationSchedule', () => {
  let component: ReservationSchedule;
  let fixture: ComponentFixture<ReservationSchedule>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationSchedule],
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationSchedule);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
