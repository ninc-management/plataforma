import { Component, OnInit } from '@angular/core';
import { UserService } from '../../shared/services/user.service';
import { StatecityService } from '../../shared/services/statecity.service';
import * as user_validation from '../../shared/user-validation.json';

@Component({
  selector: 'ngx-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  currentUser: any = {};
  cities: string[] = [];
  states: string[] = [];
  validation = (user_validation as any).default;

  constructor(
    private userService: UserService,
    private statecityService: StatecityService
  ) {}

  ngOnInit(): void {
    this.states = this.statecityService.buildStateList();
    this.userService.currentUser.subscribe((user) => {
      this.currentUser = user;
      this.cities = this.statecityService.buildCityList(this.currentUser.state);
    });
  }

  buildCityList(state: string): void {
    this.cities = this.statecityService.buildCityList(state);
  }
}
