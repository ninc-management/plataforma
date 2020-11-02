import { Component, OnInit, Type, OnDestroy } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { take } from 'rxjs/operators';
import { FileUploadDialogComponent } from '../../shared/components/file-upload/file-upload.component';
import { DepartmentService } from '../../shared/services/department.service';
import { StatecityService } from '../../shared/services/statecity.service';
import { UserService } from '../../shared/services/user.service';
import * as user_validation from '../../shared/user-validation.json';

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
  isEditing = false;
  DEPARTMENTS: string[] = [];
  POSITIONS: string[] = [];

  constructor(
    private userService: UserService,
    private statecityService: StatecityService,
    private departmentService: DepartmentService,
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
    this.DEPARTMENTS = this.departmentService.buildDepartmentList();
    this.POSITIONS = this.buildPositionsList();
  }

  updateUser(): void {
    this.isEditing = false;
    this.userService.updateCurrentUser(this.currentUser);
  }

  enableEditing(): void {
    this.isEditing = true;
    this.tmpUser = Object.assign({}, this.currentUser);
  }

  revert(): void {
    this.isEditing = false;
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

  buildPositionsList(): string[] {
    let tmp = [];
    tmp.push('Diretor de operações');
    tmp.push('Co-Diretor de operações');
    tmp.push('Diretor Executivo');
    this.departmentService.buildDepartmentList().map((dp: string) => {
      tmp.push('Diretor' + dp.slice(15));
    });
    this.departmentService.buildAllCoordinationsList().map((cd: string) => {
      tmp.push('Coordenador' + cd.split('Coordenação')[1]);
    });
    return tmp;
  }
}
