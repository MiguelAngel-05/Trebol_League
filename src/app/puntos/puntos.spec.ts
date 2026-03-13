import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Puntos } from './puntos';

describe('Puntos', () => {
  let component: Puntos;
  let fixture: ComponentFixture<Puntos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Puntos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Puntos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
