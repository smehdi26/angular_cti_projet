import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientView } from './client-view';

describe('ClientView', () => {
  let component: ClientView;
  let fixture: ComponentFixture<ClientView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientView],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
