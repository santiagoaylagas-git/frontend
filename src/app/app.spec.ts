import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('se crea el componente raíz', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra el encabezado y el pie de página', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const plantilla = fixture.nativeElement as HTMLElement;

    expect(plantilla.querySelector('app-header')).toBeTruthy();
    expect(plantilla.querySelector('app-footer')).toBeTruthy();
  });

  it('sin sesión no muestra el menú lateral', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const plantilla = fixture.nativeElement as HTMLElement;

    expect(plantilla.querySelector('app-menu')).toBeNull();
  });
});
