import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { HouseComponent } from './components/house/house.component';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';

import {
  MatCardModule,
  MatButtonModule,
  MatExpansionModule,
  MatIconModule,
  MatToolbarModule,
  MatFormFieldModule,
  MatInputModule,
  MatSnackBarModule,
  MatTableModule
} from '@angular/material';
import { Routes, RouterModule } from '@angular/router';
import { AccountService } from './services/account.service';
import { DutchComponent } from './dutch/dutch.component';
import { VickeryComponent } from './vickery/vickery.component';
import { DutchDetailComponent } from './dutch-detail/dutch-detail.component';
import { VickeryDetailComponent } from './vickery-detail/vickery-detail.component';

const routes: Routes = [
  {
    path: '',
    component: HouseComponent
  },
  {
    path: 'dutch',
    component: DutchComponent
  },
  {
    path: 'vickery',
    component: VickeryComponent
  },
  {
    path: 'dutch/:address',
    component: DutchDetailComponent
  },
  {
    path: 'vickery/:address',
    component: VickeryDetailComponent
  }
];

@NgModule({
  declarations: [
    AppComponent,
    HouseComponent,
    DutchComponent,
    VickeryComponent,
    DutchDetailComponent,
    VickeryDetailComponent
  ],
  imports: [
    RouterModule.forRoot(routes),
    BrowserModule,
    FormsModule,
    // material
    BrowserAnimationsModule,
    MatCardModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatExpansionModule,
    MatSnackBarModule,
    MatTableModule
  ],
  providers: [
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
