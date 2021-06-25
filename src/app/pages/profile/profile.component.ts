import {
  Component,
  OnInit,
  DoCheck,
  ViewChildren,
  ElementRef,
  ViewChild,
  Input,
  QueryList,
} from '@angular/core';
import { NbDialogService, NbThemeService } from '@nebular/theme';
import { NbAccessChecker } from '@nebular/security';
import { CompleterData, CompleterService } from 'ng2-completer';
import { BehaviorSubject, Observable } from 'rxjs';
import { take, map } from 'rxjs/operators';
import { cloneDeep } from 'lodash';
import { FileUploadDialogComponent } from 'app/shared/components/file-upload/file-upload.component';
import { DepartmentService } from 'app/shared/services/department.service';
import { StatecityService } from 'app/shared/services/statecity.service';
import { UserService } from 'app/shared/services/user.service';
import { UtilsService, Permissions } from 'app/shared/services/utils.service';
import { User } from '../../../../backend/src/models/user';
import * as user_validation from 'app/shared/user-validation.json';

@Component({
  selector: 'ngx-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit, DoCheck {
  @ViewChildren('expertise', { read: ElementRef })
  expertiseRefs!: QueryList<ElementRef>;
  @ViewChildren('shortExpertise', { read: ElementRef })
  shortExpertiseRefs!: QueryList<ElementRef>;
  @ViewChild('expertiseTabs', { read: ElementRef }) tabsRef!: ElementRef;
  @Input() inputUser = new User();
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  isCurrentUser = false;
  user = new User();
  cities: string[] = [];
  states: string[] = [];
  validation = (user_validation as any).default;
  isEditing = false;
  isAER = false;
  isEloPrincipal = false;
  COORDINATIONS: string[] = [];
  ACTIVE_EXPERTISE: number[] = [];
  DEPARTMENTS: string[] = [];
  POSITIONS: string[] = [];
  LEVELS: string[] = [];
  permissions = Permissions;
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

  userAER = new User();
  userSearch = '';
  userData: CompleterData = this.completerService.local([]);

  get positionMessage(): string {
    let response = '';
    this.accessChecker
      .isGranted(Permissions.ELO_PRINCIPAL, 'edit-level')
      .pipe(take(1))
      .subscribe(
        (result: boolean) =>
          (response = result
            ? 'Quando não exibir os papeis selecionados é necessário apertar no botão de limpar'
            : 'Somente o elo principal pode alterar os papeis dos associados.')
      );
    return response;
  }

  constructor(
    private statecityService: StatecityService,
    private departmentService: DepartmentService,
    private themeService: NbThemeService,
    private dialogService: NbDialogService,
    private completerService: CompleterService,
    public userService: UserService,
    public accessChecker: NbAccessChecker,
    public utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.states = this.statecityService.buildStateList();
    this.DEPARTMENTS = this.departmentService.buildDepartmentList();
    this.COORDINATIONS = this.departmentService
      .buildAllCoordinationsList()
      .map((cd: string) => {
        return cd.split(' ')[0];
      });
    if (this.inputUser._id !== undefined) this.user = cloneDeep(this.inputUser);
    else
      this.userService.currentUser$.pipe(take(2)).subscribe((user) => {
        this.inputUser = user;
        this.user = cloneDeep(this.inputUser);
        this.isCurrentUser = true;
      });
    if (this.user.state)
      this.cities = this.statecityService.buildCityList(this.user.state);
    if (this.user.expertise == undefined) this.user.expertise = [];
    if (this.user.theme == undefined) this.user.theme = 'default';
    this.buildPositionsList();
    this.buildLevelList();
    this.refreshExpertises();
    this.userData = this.completerService
      .local(
        this.userService.getUsersList().filter((user) => {
          if (user._id != this.user._id) return true;
          return false;
        }),
        'fullName',
        'fullName'
      )
      .imageField('profilePicture');

    this.checkPrivileges();
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
      this.expertiseRefs.toArray().forEach((el: any) => {
        const idx = this.user.expertise.findIndex(
          (ael) =>
            ael.coordination ===
            el.nativeElement.placeholder.split(' ').slice(-1)[0]
        );
        if (el.nativeElement.value != this.user.expertise[idx].text)
          el.nativeElement.value = this.user.expertise[idx].text;
      });
      this.shortExpertiseRefs.toArray().forEach((el: any) => {
        const idx = this.user.expertise.findIndex(
          (ael) =>
            ael.coordination ===
            el.nativeElement.placeholder.split(' ')[5].slice(0, -1)
        );
        if (el.nativeElement.value != this.user.expertise[idx].shortExpertise)
          el.nativeElement.value = this.user.expertise[idx].shortExpertise;
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

  fixPositionAndLevel(): void {
    this.user.position = this.user.position.map((position) => {
      switch (position) {
        case (position.match(/Parceir[o,a]/) || {}).input:
          return 'Parceir' + (this.user.article == 'a' ? 'a' : 'o');
        case (position.match(/Associad[o,a]/) || {}).input:
          return 'Associad' + (this.user.article == 'a' ? 'a' : 'o');
        case (position.match(/Direto(r|ra) Financeir[oa]/) || {}).input:
          return (
            'Diretor' +
            (this.user.article == 'a' ? 'a' : '') +
            ' Financeir' +
            (this.user.article == 'a' ? 'a' : 'o')
          );
        case (position.match(/Direto(r|ra) Administrativ[oa]/) || {}).input:
          return (
            'Diretor' +
            (this.user.article == 'a' ? 'a' : '') +
            ' Administrativ' +
            (this.user.article == 'a' ? 'a' : 'o')
          );
        case (position.match(/Assesso(r|ra) Executiv[oa] Remot[oa]/) || {})
          .input:
          return 'Associad' + (this.user.article == 'a' ? 'a' : 'o');
        case (position.match(/Direto(r|ra) de T.I/) || {}).input:
          return 'Diretor' + (this.user.article == 'a' ? 'a' : '') + ' de T.I';
        default:
          return position;
      }
    });

    switch (this.user.level) {
      case (this.user.level.match(/Associad[oa] Trainee/) || {}).input:
        this.user.level = 'Associad' + this.user.article + ' Trainee';
        break;
      case (this.user.level.match(/Associad[oa] Equipe/) || {}).input:
        this.user.level = 'Associad' + this.user.article + ' Equipe';
        break;
      case (this.user.level.match(/Associad[oa] Líder/) || {}).input:
        this.user.level = 'Associad' + this.user.article + ' Líder';
        break;
      case (this.user.level.match(/Associad[oa] Gestor/) || {}).input:
        this.user.level = 'Associad' + this.user.article + ' Gestor';
        break;
      default:
        break;
    }
  }

  refreshExpertises(): void {
    const active: boolean[] = [
      this.user.adm ? this.user.adm : false,
      this.user.design ? this.user.design : false,
      this.user.obras ? this.user.obras : false,
      this.user.impermeabilizacao ? this.user.impermeabilizacao : false,
      this.user.instalacoes ? this.user.instalacoes : false,
      this.user.ambiental ? this.user.ambiental : false,
      this.user.arquitetura ? this.user.arquitetura : false,
      this.user.hidrico ? this.user.hidrico : false,
      this.user.eletrica ? this.user.eletrica : false,
      this.user.civil ? this.user.civil : false,
      this.user.sanitaria ? this.user.sanitaria : false,
    ];
    this.ACTIVE_EXPERTISE = [];
    this.COORDINATIONS.filter((cd: string, idx: number) => {
      return active[idx];
    }).map((cd: string) => {
      let idx = this.user.expertise.findIndex((el) => el.coordination === cd);
      if (idx != -1) {
        if (this.user.expertise[idx].shortExpertise == undefined)
          this.user.expertise[idx].shortExpertise = '';
        this.ACTIVE_EXPERTISE.push(idx);
      } else {
        idx = this.user.expertise.push({
          coordination: cd,
          text: '',
          shortExpertise: '',
        });
        this.ACTIVE_EXPERTISE.push(idx - 1);
      }
    });
  }

  checkPrivileges(): void {
    this.accessChecker
      .isGranted('aer', 'aer')
      .pipe(take(1))
      .subscribe((isGranted) => (this.isAER = isGranted));

    this.accessChecker
      .isGranted(Permissions.ELO_PRINCIPAL, 'edit-level-position')
      .pipe(take(1))
      .subscribe((isGranted) => (this.isEloPrincipal = isGranted));
  }

  updateUser(): void {
    this.isEditing = false;
    this.userService.updateUser(
      this.user,
      () => this.checkPrivileges(),
      this.isCurrentUser
    );
  }

  enableEditing(): void {
    this.isEditing = true;
  }

  revert(): void {
    this.isEditing = false;
    this.user = cloneDeep(this.inputUser);
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
          name: {
            fn: (name: string) => {
              return this.user._id;
            },
          },
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
      })
      .onClose.pipe(take(1))
      .subscribe((urls) => {
        this.isDialogBlocked.next(false);
        if (urls.length > 0) {
          this.user.profilePicture = urls[0].url;
          this.userService.updateUser(this.user, undefined, this.isCurrentUser);
        }
      });
  }

  buildPositionsList(): void {
    this.POSITIONS = [];
    this.POSITIONS.push('Parceir' + (this.user.article == 'a' ? 'a' : 'o'));
    this.POSITIONS.push('Cliente');
    this.POSITIONS.push('Associad' + (this.user.article == 'a' ? 'a' : 'o'));
    this.departmentService
      .buildDepartmentList()
      .map((dp: string) => this.POSITIONS.push('Elo Principal' + dp.slice(15)));
    this.POSITIONS.push(
      'Diretor' +
        (this.user.article == 'a' ? 'a' : '') +
        ' Financeir' +
        (this.user.article == 'a' ? 'a' : 'o')
    );
    this.POSITIONS.push(
      'Diretor' +
        (this.user.article == 'a' ? 'a' : '') +
        ' Administrativ' +
        (this.user.article == 'a' ? 'a' : 'o')
    );
    this.POSITIONS.push(
      'Assessor' +
        (this.user.article == 'a' ? 'a' : '') +
        ' Executiv' +
        (this.user.article == 'a' ? 'a' : 'o') +
        ' Remot' +
        (this.user.article == 'a' ? 'a' : 'o')
    );
    this.POSITIONS.push('Elo Principal Nortan');
    this.POSITIONS.push(
      'Diretor' + (this.user.article == 'a' ? 'a' : '') + ' de T.I'
    );
  }

  buildLevelList(): void {
    this.LEVELS = [];
    this.LEVELS.push('Freelancer');
    this.LEVELS.push('Associad' + this.user.article + ' Trainee');
    this.LEVELS.push('Associad' + this.user.article + ' Equipe');
    this.LEVELS.push('Associad' + this.user.article + ' Líder');
    this.LEVELS.push('Associad' + this.user.article + ' Gestor');
  }

  changeTheme(): void {
    if (this.isCurrentUser)
      this.themeService.changeTheme(
        this.user?.theme == undefined ? 'default' : this.user.theme
      );
  }

  addToAER(): void {
    if (this.user.AER) this.user.AER.push(cloneDeep(this.userAER));
    this.userAER = new User();
    this.userSearch = '';
  }

  NOT(o$: Observable<boolean>): Observable<boolean> {
    return o$.pipe(map((result: boolean) => !result));
  }
}
