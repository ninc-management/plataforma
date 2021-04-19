import {
  Component,
  OnInit,
  DoCheck,
  ViewChildren,
  ElementRef,
  ViewChild,
  Input,
} from '@angular/core';
import { NbDialogService, NbThemeService } from '@nebular/theme';
import { NbAccessChecker } from '@nebular/security';
import { BehaviorSubject, Observable } from 'rxjs';
import { take, map } from 'rxjs/operators';
import { FileUploadDialogComponent } from '../../shared/components/file-upload/file-upload.component';
import { DepartmentService } from '../../shared/services/department.service';
import { StatecityService } from '../../shared/services/statecity.service';
import { UserService } from '../../shared/services/user.service';
import * as user_validation from '../../shared/user-validation.json';
import * as _ from 'lodash';

@Component({
  selector: 'ngx-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit, DoCheck {
  @ViewChildren('expertise', { read: ElementRef }) expertiseRefs;
  @ViewChildren('shortExpertise', { read: ElementRef }) shortExpertiseRefs;
  @ViewChild('expertiseTabs', { read: ElementRef }) tabsRef;
  @Input() user;
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  currentUser: any = {};
  tmpUser;
  cities: string[] = [];
  states: string[] = [];
  validation = (user_validation as any).default;
  isEditing = false;
  COORDINATIONS: string[] = [];
  ACTIVE_EXPERTISE: number[] = [];
  DEPARTMENTS: string[] = [];
  POSITIONS: string[] = [];
  LEVELS: string[] = [];
  THEMES = [
    {
      value: 'default',
      name: 'Claro',
    },
    {
      value: 'dark',
      name: 'Escuro',
    },
    {
      value: 'cosmic',
      name: 'Cosmico',
    },
    {
      value: 'corporate',
      name: 'Empresarial',
    },
  ];

  constructor(
    private userService: UserService,
    private statecityService: StatecityService,
    private departmentService: DepartmentService,
    private themeService: NbThemeService,
    private dialogService: NbDialogService,
    public accessChecker: NbAccessChecker
  ) {}

  ngOnInit(): void {
    this.states = this.statecityService.buildStateList();
    this.DEPARTMENTS = this.departmentService.buildDepartmentList();
    this.COORDINATIONS = this.departmentService
      .buildAllCoordinationsList()
      .map((cd: string) => {
        return cd.split(' ')[0];
      });
    if (this.user !== undefined) this.currentUser = this.user;
    else
      this.userService.currentUser$
        .pipe(take(2))
        .subscribe((user) => (this.currentUser = user));
    if (this.currentUser.state)
      this.cities = this.statecityService.buildCityList(this.currentUser.state);
    if (this.currentUser.expertise == undefined)
      this.currentUser.expertise = [];
    if (this.currentUser.theme == undefined) this.currentUser.theme = 'default';
    this.buildPositionsList();
    this.buildLevelList();
    this.refreshExpertises();
  }

  ngDoCheck(): void {
    this.fixTabText();
    this.fixTabActive();
  }

  fixTabText(): void {
    if (
      this.expertiseRefs != undefined &&
      this.shortExpertiseRefs != undefined
    ) {
      this.expertiseRefs.toArray().forEach((el) => {
        const idx = this.currentUser.expertise.findIndex(
          (ael) =>
            ael.coordination ===
            el.nativeElement.placeholder.split(' ').slice(-1)[0]
        );
        if (el.nativeElement.value != this.currentUser.expertise[idx].text)
          el.nativeElement.value = this.currentUser.expertise[idx].text;
      });
      this.shortExpertiseRefs.toArray().forEach((el) => {
        const idx = this.currentUser.expertise.findIndex(
          (ael) =>
            ael.coordination ===
            el.nativeElement.placeholder.split(' ')[5].slice(0, -1)
        );
        if (
          el.nativeElement.value !=
          this.currentUser.expertise[idx].shortExpertise
        )
          el.nativeElement.value = this.currentUser.expertise[
            idx
          ].shortExpertise;
      });
    }
  }

  fixTabActive(): void {
    if (this.tabsRef != undefined) {
      if ([...this.tabsRef.nativeElement.children[0].children].length > 0) {
        const children = [...this.tabsRef.nativeElement.children[0].children];
        if (
          children
            .map((el) => el.classList.contains('active'))
            .every((v) => v === false)
        )
          children[0].click();
      }
    }
  }

  refreshExpertises(): void {
    const active: boolean[] = [
      this.currentUser.adm,
      this.currentUser.design,
      this.currentUser.obras,
      this.currentUser.impermeabilizacao,
      this.currentUser.instalacoes,
      this.currentUser.ambiental,
      this.currentUser.arquitetura,
      this.currentUser.hidrico,
      this.currentUser.eletrica,
      this.currentUser.civil,
      this.currentUser.sanitaria,
    ];
    this.ACTIVE_EXPERTISE = [];
    this.COORDINATIONS.filter((cd: string, idx: number) => {
      return active[idx];
    }).map((cd: string) => {
      let idx = this.currentUser.expertise.findIndex(
        (el) => el.coordination === cd
      );
      if (idx != -1) {
        if (this.currentUser.expertise[idx].shortExpertise == undefined)
          this.currentUser.expertise[idx].shortExpertise = '';
        this.ACTIVE_EXPERTISE.push(idx);
      } else {
        idx = this.currentUser.expertise.push({
          coordination: cd,
          text: '',
          shortExpertise: '',
        });
        this.ACTIVE_EXPERTISE.push(idx - 1);
      }
    });
  }

  updateUser(): void {
    this.isEditing = false;
    this.userService.updateCurrentUser(this.currentUser);
  }

  enableEditing(): void {
    this.isEditing = true;
    this.tmpUser = _.cloneDeep(this.currentUser);
  }

  revert(): void {
    this.isEditing = false;
    this.currentUser = _.cloneDeep(this.tmpUser);
    this.refreshExpertises();
    this.changeTheme();
  }

  buildCityList(state: string): void {
    this.cities = this.statecityService.buildCityList(state);
  }

  uploadDialog(): void {
    this.isDialogBlocked.next(true);
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
        this.isDialogBlocked.next(false);
        if (urls.length > 0) {
          this.currentUser.profilePicture = urls[0].url;
          this.userService.updateCurrentUser(this.currentUser);
        }
      });
  }

  buildPositionsList(): void {
    this.POSITIONS = [];
    this.POSITIONS.push(
      'Diretor' + (this.currentUser.article == 'a' ? 'a' : '') + ' de operações'
    );
    this.POSITIONS.push(
      'Co-Diretor' +
        (this.currentUser.article == 'a' ? 'a' : '') +
        ' de operações'
    );
    this.POSITIONS.push(
      'Diretor' + (this.currentUser.article == 'a' ? 'a' : '') + ' Executivo'
    );
    this.departmentService.buildDepartmentList().map((dp: string) => {
      this.POSITIONS.push(
        'Diretor' + (this.currentUser.article == 'a' ? 'a' : '') + dp.slice(15)
      );
    });
    this.departmentService.buildAllCoordinationsList().map((cd: string) => {
      this.POSITIONS.push(
        'Coordenador' +
          (this.currentUser.article == 'a' ? 'a' : '') +
          cd.split('Coordenação')[1]
      );
    });
  }

  buildLevelList(): void {
    this.LEVELS = [];
    this.LEVELS.push('Freelancer');
    this.LEVELS.push('Associad' + this.currentUser.article + ' Júnior');
    this.LEVELS.push('Associad' + this.currentUser.article);
    this.LEVELS.push('Associad' + this.currentUser.article + ' Líder');
  }

  changeTheme(): void {
    if (this.user === undefined)
      this.themeService.changeTheme(
        this.currentUser?.theme == undefined
          ? 'default'
          : this.currentUser.theme
      );
  }

  NOT(o$: Observable<boolean>): Observable<boolean> {
    return o$.pipe(map((result: boolean) => !result));
  }
}
