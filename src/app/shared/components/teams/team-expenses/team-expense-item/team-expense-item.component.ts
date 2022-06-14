import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { cloneDeep, isEqual } from 'lodash';
import { skip, skipWhile, take, takeUntil } from 'rxjs/operators';
import { BaseExpenseComponent } from 'app/shared/components/base-expense/base-expense.component';
import { OneDriveService } from 'app/shared/services/onedrive.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { NORTAN, UserService } from 'app/shared/services/user.service';
import { UploadedFile } from 'app/@theme/components/file-uploader/file-uploader.service';
import { TeamService } from 'app/shared/services/team.service';
import { User } from '@models/user';
import expense_validation from 'app/shared/expense-validation.json';
import { NgForm } from '@angular/forms';
import { of } from 'rxjs/internal/observable/of';
import { Team, TeamExpense } from '@models/team';
import { ConfigService } from 'app/shared/services/config.service';
import { formatDate, compareFiles } from 'app/shared/utils';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'ngx-team-expense-item',
  templateUrl: './team-expense-item.component.html',
  styleUrls: ['./team-expense-item.component.scss'],
})
export class TeamExpenseItemComponent extends BaseExpenseComponent implements OnInit {
  @ViewChild('form', { static: true })
  formRef!: NgForm;
  @ViewChild('form') ngForm = {} as NgForm;
  @Input() iTeam: Team = new Team();
  @Input() expenseIdx?: number;
  @Input() isFormDirty = new BehaviorSubject<boolean>(false);
  validation = expense_validation as any;
  types: string[] = [];
  subTypes: string[] = [];

  options = {
    lastValue: '0',
    lastTeam: [],
  };
  splitSelectedMember = new User();

  expense: TeamExpense = new TeamExpense();

  initialFiles: UploadedFile[] = [];
  registered: boolean = false;
  folderPath: string = '';

  formatDate = formatDate;

  constructor(
    protected stringUtil: StringUtilService,
    protected onedrive: OneDriveService,
    public configService: ConfigService,
    public teamService: TeamService,
    public userService: UserService
  ) {
    super(stringUtil, onedrive, userService);
    this.expense.code = '#0';
  }

  ngOnInit(): void {
    super.ngOnInit();

    this.registered = false;
    const tmp = cloneDeep(this.userService.getUsers().value.filter((user) => user.active));
    this.userData = of(cloneDeep(tmp));
    this.configService
      .getConfig()
      .pipe(
        skipWhile((config) => config.length == 0),
        takeUntil(this.destroy$)
      )
      .subscribe((config) => {
        this.types = config[0].expenseTypes.map((eType) => eType.name);
      });
    tmp.unshift(NORTAN);
    this.sourceData = of(tmp);
    if (this.expenseIdx != undefined) {
      this.expense = cloneDeep(this.iTeam.expenses[this.expenseIdx]);
      if (this.expense.author) this.expense.author = this.userService.idToUser(this.expense.author);
      if (this.expense.source) this.expense.source = this.userService.idToUser(this.expense.source);
      this.uploadedFiles = cloneDeep(this.expense.uploadedFiles) as UploadedFile[];
      this.handleTypeChange();
      this.initialFiles = cloneDeep(this.uploadedFiles) as UploadedFile[];
    } else {
      this.expense.code = '#' + this.iTeam.expenses.length.toString();
      this.userService.currentUser$.pipe(take(1)).subscribe((author) => {
        this.expense.author = author;
      });
      this.updatePaidDate();
    }

    this.userSearch = this.expense.author ? this.userService.idToUser(this.expense.author)?.fullName : '';
    this.sourceSearch = this.expense.source ? this.userService.idToUser(this.expense.source)?.fullName : '';

    this.formRef.control.statusChanges.pipe(skip(1), takeUntil(this.destroy$)).subscribe((status) => {
      if (status === 'VALID' && this.expense.nf === true)
        setTimeout(() => {
          this.updateUploaderOptions();
        }, 5);
    });
  }

  ngAfterViewInit() {
    this.ngForm.statusChanges?.subscribe(() => {
      if (this.ngForm.dirty) this.isFormDirty.next(true);
    });
  }

  ngOnDestroy(): void {
    if (!this.registered && !isEqual(this.initialFiles, this.uploadedFiles)) {
      this.deleteFiles();
    }
    super.ngOnDestroy();
  }

  registerExpense(): void {
    let creatingExpense = false;
    this.registered = true;
    this.expense.uploadedFiles = cloneDeep(this.uploadedFiles);
    if (this.expenseIdx !== undefined) {
      this.expense.lastUpdate = new Date();
      this.iTeam.expenses[this.expenseIdx] = cloneDeep(this.expense);
    } else {
      creatingExpense = true;
      this.iTeam.expenses.push(cloneDeep(this.expense));
    }
    this.teamService.editTeam(cloneDeep(this.iTeam), creatingExpense);
    this.isFormDirty.next(false);
    this.submit.emit();
  }

  addAndClean(): void {
    this.registered = true;
    this.expense.uploadedFiles = cloneDeep(this.uploadedFiles);
    this.iTeam.expenses.push(cloneDeep(this.expense));
    this.teamService.editTeam(cloneDeep(this.iTeam));
    this.sourceSearch = '';
    this.expense.source = '';
    this.expense.description = '';
    this.expense.value = '';
    this.uploadedFiles = [];
    this.expense.created = this.today;
    this.expense.lastUpdate = this.today;
    this.expense.paid = true;
    this.ngForm.form.markAsPristine();
    this.isFormDirty.next(false);
  }

  updateUploaderOptions(): void {
    const mediaFolderPath = 'SFC/Comprovantes/';
    const fn = (name: string) => {
      const type = this.expense.type;
      const date = formatDate(new Date(), '-');
      const extension = name.match('[.].+');
      if (this.configService.expenseSubTypes(this.expense.type).length > 0) {
        const subType = this.expense.subType;
        return 'Comprovante-' + type + '-' + subType + '-' + date + extension;
      }
      return 'Comprovante-' + type + '-' + date + extension;
    };
    this.folderPath = mediaFolderPath;
    super.updateUploaderOptions(mediaFolderPath, fn);
  }

  handleTypeChange(): void {
    this.subTypes = this.configService.expenseSubTypes(this.expense.type);
    if (this.subTypes.length == 0) this.expense.subType = '';
  }

  updatePaidDate(): void {
    if (!this.expense.paid) this.expense.paidDate = undefined;
    else this.expense.paidDate = new Date();
  }

  deleteFiles(): void {
    const filesToRemove = this.uploadedFiles.filter((file) => !compareFiles(this.initialFiles, file));
    this.onedrive.deleteFiles(this.folderPath, filesToRemove);
  }
}
