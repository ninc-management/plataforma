import { Component, OnInit, Type, OnDestroy } from '@angular/core';
import { UserService } from '../../shared/services/user.service';
import { StatecityService } from '../../shared/services/statecity.service';
import * as user_validation from '../../shared/user-validation.json';
import { NbDialogService } from '@nebular/theme';
import { FileUploadDialogComponent } from '../../shared/components/file-upload/file-upload.component';
import { take } from 'rxjs/operators';

@Component({
  selector: 'ngx-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  currentUser: any = {};
  tmpUser;
  cities: string[] = [];
  states: string[] = [];
  validation = (user_validation as any).default;
  editing = false;

  constructor(
    private userService: UserService,
    private statecityService: StatecityService,
    private dialogService: NbDialogService
  ) {}

  ngOnInit(): void {
    this.states = this.statecityService.buildStateList();
    this.userService.currentUser$.pipe(take(2)).subscribe((user) => {
      this.currentUser = user;
      if (this.currentUser.state)
        this.cities = this.statecityService.buildCityList(
          this.currentUser.state
        );
    });
  }

  updateUser(): void {
    this.editing = false;
    this.userService.updateCurrentUser(this.currentUser);
  }

  enableEditing(): void {
    this.editing = true;
    this.tmpUser = Object.assign({}, this.currentUser);
  }

  revert(): void {
    this.editing = false;
    this.currentUser = Object.assign({}, this.tmpUser);
  }

  buildCityList(state: string): void {
    this.cities = this.statecityService.buildCityList(state);
  }

  uploadDialog(): void {
    this.dialogService
      .open(FileUploadDialogComponent, {
        context: {
          title: 'Envio de foto de perfil',
          allowedMimeType: ['image/png', 'image/jpg', 'image/jpeg'],
          maxFileSize: 2,
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
      })
      .onClose.pipe(take(1))
      .subscribe((urls) => {
        if (urls.length > 0) {
          this.currentUser.profilePicture = urls[0];
          this.userService.updateCurrentUser(this.currentUser);
        }
      });
  }
}
