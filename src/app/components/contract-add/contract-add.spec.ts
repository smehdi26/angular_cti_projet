import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractAdd } from './contract-add';

describe('ContractAdd', () => {
  let component: ContractAdd;
  let fixture: ComponentFixture<ContractAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractAdd],
    }).compileComponents();

    fixture = TestBed.createComponent(ContractAdd);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
