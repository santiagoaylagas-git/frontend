import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-no-encontrada',
  imports: [RouterLink, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './no-encontrada.html',
  styleUrl: './no-encontrada.scss',
})
export class NoEncontrada {}
