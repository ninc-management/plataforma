import {
  ChangeDetectionStrategy,
  Component,
  DoCheck,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { NbDialogService, NbThemeService } from '@nebular/theme';
import { NbAccessChecker } from '@nebular/security';
import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs';
import { take, map, takeUntil, filter } from 'rxjs/operators';
import { cloneDeep, isEqual } from 'lodash';
import { FileUploadDialogComponent } from 'app/shared/components/file-upload/file-upload.component';
import { DepartmentService } from 'app/shared/services/department.service';
import { StatecityService } from 'app/shared/services/statecity.service';
import { TeamService } from 'app/shared/services/team.service';
import { UserService } from 'app/shared/services/user.service';
import { UtilsService, Permissions } from 'app/shared/services/utils.service';
import { User } from '@models/user';
import { Sector } from '@models/team';
import user_validation from 'app/shared/user-validation.json';

@Component({
  selector: 'ngx-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit, OnDestroy, DoCheck {
  @ViewChildren('expertise', { read: ElementRef })
  expertiseRefs!: QueryList<ElementRef>;
  @ViewChildren('shortExpertise', { read: ElementRef })
  shortExpertiseRefs!: QueryList<ElementRef>;
  @ViewChild('expertiseTabs', { read: ElementRef }) tabsRef!: ElementRef;
  @Input() iUser = new User();
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  private destroy$ = new Subject<void>();
  isCurrentUser = false;
  user = new User();
  cities: string[] = [];
  states: string[] = [];
  groupedSectors: Sector[][] = [];
  validation = user_validation as any;
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
  memberChanged$ = new BehaviorSubject<boolean>(true);
  userSearch = '';
  availableUsers: Observable<User[]> = of([]);

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
    public userService: UserService,
    public teamService: TeamService,
    public accessChecker: NbAccessChecker,
    public utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.teamService
      .getTeams()
      .pipe(
        filter((teams) => teams.length > 0),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.states = this.statecityService.buildStateList();
        this.DEPARTMENTS = this.departmentService.buildDepartmentList();
        this.COORDINATIONS = this.departmentService.buildAllCoordinationsList().map((cd: string) => {
          return cd.split(' ')[0];
        });
        if (this.iUser._id !== undefined) this.user = cloneDeep(this.iUser);
        else
          this.userService.currentUser$.pipe(take(2)).subscribe((user) => {
            this.iUser = user;
            this.user = cloneDeep(this.iUser);
            this.isCurrentUser = true;
          });
        if (this.user.state) this.cities = this.statecityService.buildCityList(this.user.state);
        if (this.user.expertise == undefined) this.user.expertise = [];
        if (this.user.theme == undefined) this.user.theme = 'default';
        this.buildGrupedSectors();
        this.buildPositionsList();
        this.buildLevelList();
        this.refreshExpertises();
        this.availableUsers = combineLatest([this.userService.getUsers(), this.memberChanged$]).pipe(
          map(([users, _]) => {
            return users.filter((user) => {
              return (
                !this.userService.isUserInTeam(user, this.user.AER) &&
                !this.userService.isEqual(user, this.user) &&
                user.active
              );
            });
          })
        );

        this.checkPrivileges();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngDoCheck(): void {
    this.fixTabText();
    this.fixTabActive();
  }

  fixTabText(): void {
    if (this.expertiseRefs != undefined && this.shortExpertiseRefs != undefined) {
      this.expertiseRefs.toArray().forEach((el: any) => {
        const idx = this.user.expertise.findIndex((ael) =>
          ael.sector ? ael.sector.abrev === el.nativeElement.placeholder.split(' ').slice(-1)[0] : false
        );
        if (idx != -1 && el.nativeElement.value != this.user.expertise[idx].text)
          el.nativeElement.value = this.user.expertise[idx].text;
      });
      this.shortExpertiseRefs.toArray().forEach((el: any) => {
        const idx = this.user.expertise.findIndex((ael) =>
          ael.sector ? ael.sector.abrev === el.nativeElement.placeholder.split(' ')[5].slice(0, -1) : false
        );
        if (idx != -1 && el.nativeElement.value != this.user.expertise[idx].shortExpertise)
          el.nativeElement.value = this.user.expertise[idx].shortExpertise;
      });
    }
  }

  fixTabActive(): void {
    if (this.tabsRef != undefined) {
      if ([...this.tabsRef.nativeElement.children[0].children].length > 0) {
        const children = [...this.tabsRef.nativeElement.children[0].children];
        if (children.map((el) => el.classList.contains('active')).every((v) => v === false)) children[0].click();
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
            'Diretor' + (this.user.article == 'a' ? 'a' : '') + ' Financeir' + (this.user.article == 'a' ? 'a' : 'o')
          );
        case (position.match(/Direto(r|ra) Administrativ[oa]/) || {}).input:
          return (
            'Diretor' +
            (this.user.article == 'a' ? 'a' : '') +
            ' Administrativ' +
            (this.user.article == 'a' ? 'a' : 'o')
          );
        case (position.match(/Assesso(r|ra) Executiv[oa] Remot[oa]/) || {}).input:
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

  updateSectors(sector: Sector): void {
    if (sector.isChecked) {
      this.user.sectors.push(sector);
    } else {
      this.user.sectors.splice(
        this.user.sectors.findIndex((iSector) => iSector._id === sector._id),
        1
      );
    }
  }

  refreshExpertises(): void {
    this.ACTIVE_EXPERTISE = [];
    //  A ordem das coordenações no active array precisa ser igual a ordem allCoords.
    this.user.sectors.map((sector: Sector) => {
      let idx = this.user.expertise.findIndex((el) => {
        if (el.sector) return el.sector._id === sector._id;
        return false;
      });
      if (idx != -1) {
        if (this.user.expertise[idx].shortExpertise == undefined) this.user.expertise[idx].shortExpertise = '';
        this.ACTIVE_EXPERTISE.push(idx);
      } else {
        idx = this.user.expertise.push({
          text: '',
          shortExpertise: '',
          sector: sector,
        });
        this.ACTIVE_EXPERTISE.push(idx - 1);
      }
    });
  }

  checkPrivileges(): void {
    this.accessChecker
      .isGranted('aer', 'aer')
      .pipe(take(1))
      .subscribe((isGranted) => {
        return (this.isAER = isGranted);
      });

    this.accessChecker
      .isGranted(Permissions.ELO_PRINCIPAL, 'edit-level-position')
      .pipe(take(1))
      .subscribe((isGranted) => (this.isEloPrincipal = isGranted));
  }

  updateUser(): void {
    this.isEditing = false;
    this.userService.updateUser(this.user, () => this.checkPrivileges(), this.isCurrentUser);
  }

  enableEditing(): void {
    this.isEditing = true;
  }

  revert(): void {
    this.isEditing = false;
    this.user = cloneDeep(this.iUser);
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

  buildGrupedSectors(): void {
    this.groupedSectors = this.utils.chunkify(
      this.teamService.sectorsListAll().map((sector) => {
        if (this.user.sectors.some((sectorUser) => sectorUser._id === sector._id)) sector.isChecked = true;
        return sector;
      }),
      3
    );
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
      'Diretor' + (this.user.article == 'a' ? 'a' : '') + ' Financeir' + (this.user.article == 'a' ? 'a' : 'o')
    );
    this.POSITIONS.push(
      'Diretor' + (this.user.article == 'a' ? 'a' : '') + ' Administrativ' + (this.user.article == 'a' ? 'a' : 'o')
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
    this.POSITIONS.push('Diretor' + (this.user.article == 'a' ? 'a' : '') + ' de T.I');
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
    if (this.isCurrentUser) this.themeService.changeTheme(this.user?.theme == undefined ? 'default' : this.user.theme);
  }

  addToAER(): void {
    if (this.user.AER) this.user.AER.push(cloneDeep(this.userAER));
    this.userAER = new User();
    this.userSearch = '';
    this.memberChanged$.next(true);
  }
}
