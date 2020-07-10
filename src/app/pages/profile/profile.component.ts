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
  cities: string[] = [];
  states: string[] = [];
  validation = (user_validation as any).default;

  constructor(
    private userService: UserService,
    private statecityService: StatecityService,
    private dialogService: NbDialogService
  ) {}

  ngOnInit(): void {
    this.states = this.statecityService.buildStateList();
    this.userService.currentUser$.pipe(take(2)).subscribe((user) => {
      console.log(user);
      this.currentUser = user;
      if (this.currentUser.state)
        this.cities = this.statecityService.buildCityList(
          this.currentUser.state
        );
    });
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
        console.log(urls);
        if (urls.length > 0) {
          console.log(urls[0]);
          this.currentUser.profilePicture = urls[0];
          this.userService.updateCurrentUser(this.currentUser);
        }
      });
  }
}
