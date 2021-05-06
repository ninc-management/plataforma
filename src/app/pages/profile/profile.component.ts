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
import { CompleterData, CompleterService } from 'ng2-completer';
import { BehaviorSubject, Observable } from 'rxjs';
import { take, map } from 'rxjs/operators';
import { FileUploadDialogComponent } from '../../shared/components/file-upload/file-upload.component';
import { DepartmentService } from '../../shared/services/department.service';
import { StatecityService } from '../../shared/services/statecity.service';
import { UserService } from '../../shared/services/user.service';
import { UtilsService } from '../../shared/services/utils.service';
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
  isCurrentUser = false;
  currentUser: any = {};
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

  userAER: any = undefined;
  userSearch: string;
  userData: CompleterData;

  constructor(
    private userService: UserService,
    private statecityService: StatecityService,
    private departmentService: DepartmentService,
    private themeService: NbThemeService,
    private dialogService: NbDialogService,
    private completerService: CompleterService,
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
    if (this.user !== undefined) this.currentUser = _.cloneDeep(this.user);
    else
      this.userService.currentUser$.pipe(take(2)).subscribe((user) => {
        this.user = user;
        this.currentUser = _.cloneDeep(this.user);
        this.isCurrentUser = true;
        if (this.currentUser.AER.length > 0)
          this.currentUser.AER = this.currentUser.AER.map((user) =>
            this.userService.idToUser(user)
          );
      });
    if (this.currentUser.state)
      this.cities = this.statecityService.buildCityList(this.currentUser.state);
    if (this.currentUser.expertise == undefined)
      this.currentUser.expertise = [];
    if (this.currentUser.theme == undefined) this.currentUser.theme = 'default';
    this.buildPositionsList();
    this.buildLevelList();
    this.refreshExpertises();
    this.userData = this.completerService
      .local(
        this.userService.getUsersList().filter((user) => {
          if (user._id != this.currentUser._id) return true;
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

  fixPositionAndLevel(): void {
    this.currentUser.position = this.currentUser.position.map((position) => {
      switch (position) {
        case (position.match(/Parceir[o,a]/) || {}).input:
          return 'Parceir' + (this.currentUser.article == 'a' ? 'a' : 'o');
        case (position.match(/Associad[o,a]/) || {}).input:
          return 'Associad' + (this.currentUser.article == 'a' ? 'a' : 'o');
        case (position.match(/Direto(r|ra) Financeir[oa]/) || {}).input:
          return (
            'Diretor' +
            (this.currentUser.article == 'a' ? 'a' : '') +
            ' Financeir' +
            (this.currentUser.article == 'a' ? 'a' : 'o')
          );
        case (position.match(/Direto(r|ra) Administrativ[oa]/) || {}).input:
          return (
            'Diretor' +
            (this.currentUser.article == 'a' ? 'a' : '') +
            ' Administrativ' +
            (this.currentUser.article == 'a' ? 'a' : 'o')
          );
        case (position.match(/Assesso(r|ra) Executiv[oa] Remot[oa]/) || {})
          .input:
          return 'Associad' + (this.currentUser.article == 'a' ? 'a' : 'o');
        case (position.match(/Direto(r|ra) de T.I/) || {}).input:
          return (
            'Diretor' + (this.currentUser.article == 'a' ? 'a' : '') + ' de T.I'
          );
        default:
          return position;
      }
    });

    switch (this.currentUser.level) {
      case (this.currentUser.level.match(/Associad[oa] Trainee/) || {}).input:
        this.currentUser.level =
          'Associad' + this.currentUser.article + ' Trainee';
        break;
      case (this.currentUser.level.match(/Associad[oa] Equipe/) || {}).input:
        this.currentUser.level =
          'Associad' + this.currentUser.article + ' Equipe';
        break;
      case (this.currentUser.level.match(/Associad[oa] Líder/) || {}).input:
        this.currentUser.level =
          'Associad' + this.currentUser.article + ' Líder';
        break;
      case (this.currentUser.level.match(/Associad[oa] Gestor/) || {}).input:
        this.currentUser.level =
          'Associad' + this.currentUser.article + ' Gestor';
        break;
      default:
        break;
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

  checkPrivileges(): void {
    this.accessChecker
      .isGranted('aer', 'aer')
      .pipe(take(1))
      .subscribe((isGranted) => (this.isAER = isGranted));

    this.accessChecker
      .isGranted('elo-principal', 'edit-level-position')
      .pipe(take(1))
      .subscribe((isGranted) => (this.isEloPrincipal = isGranted));
  }

  updateUser(): void {
    this.isEditing = false;
    this.user = _.cloneDeep(this.currentUser);
    this.userService.updateCurrentUser(this.currentUser, () =>
      this.checkPrivileges()
    );
  }

  enableEditing(): void {
    this.isEditing = true;
  }

  revert(): void {
    this.isEditing = false;
    this.currentUser = _.cloneDeep(this.user);
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
      'Parceir' + (this.currentUser.article == 'a' ? 'a' : 'o')
    );
    this.POSITIONS.push('Cliente');
    this.POSITIONS.push(
      'Associad' + (this.currentUser.article == 'a' ? 'a' : 'o')
    );
    this.departmentService
      .buildDepartmentList()
      .map((dp: string) => this.POSITIONS.push('Elo Principal' + dp.slice(15)));
    this.POSITIONS.push(
      'Diretor' +
        (this.currentUser.article == 'a' ? 'a' : '') +
        ' Financeir' +
        (this.currentUser.article == 'a' ? 'a' : 'o')
    );
    this.POSITIONS.push(
      'Diretor' +
        (this.currentUser.article == 'a' ? 'a' : '') +
        ' Administrativ' +
        (this.currentUser.article == 'a' ? 'a' : 'o')
    );
    this.POSITIONS.push(
      'Assessor' +
        (this.currentUser.article == 'a' ? 'a' : '') +
        ' Executiv' +
        (this.currentUser.article == 'a' ? 'a' : 'o') +
        ' Remot' +
        (this.currentUser.article == 'a' ? 'a' : 'o')
    );
    this.POSITIONS.push('Elo Principal Nortan');
    this.POSITIONS.push(
      'Diretor' + (this.currentUser.article == 'a' ? 'a' : '') + ' de T.I'
    );
  }

  buildLevelList(): void {
    this.LEVELS = [];
    this.LEVELS.push('Freelancer');
    this.LEVELS.push('Associad' + this.currentUser.article + ' Trainee');
    this.LEVELS.push('Associad' + this.currentUser.article + ' Equipe');
    this.LEVELS.push('Associad' + this.currentUser.article + ' Líder');
    this.LEVELS.push('Associad' + this.currentUser.article + ' Gestor');
  }

  changeTheme(): void {
    if (this.isCurrentUser)
      this.themeService.changeTheme(
        this.currentUser?.theme == undefined
          ? 'default'
          : this.currentUser.theme
      );
  }

  addToAER(): void {
    this.currentUser.AER.push(_.cloneDeep(this.userAER));
    this.userAER = undefined;
    this.userSearch = undefined;
  }

  NOT(o$: Observable<boolean>): Observable<boolean> {
    return o$.pipe(map((result: boolean) => !result));
  }

  positionMessage(o$: Observable<boolean>): Observable<string> {
    return o$.pipe(
      map((result: boolean) =>
        result
          ? 'Quando não exibir os papeis selecionados é necessário apertar no botão de limpar'
          : 'Somente o elo principal pode alterar os papeis dos associados.'
      )
    );
  }
}
