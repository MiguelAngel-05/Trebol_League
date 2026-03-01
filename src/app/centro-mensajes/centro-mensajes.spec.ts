import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CentroMensajes } from './centro-mensajes';

describe('CentroMensajes', () => {
  let component: CentroMensajes;
  let fixture: ComponentFixture<CentroMensajes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CentroMensajes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CentroMensajes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
