import { Component, Input, OnInit } from '@angular/core';
import { take } from 'rxjs/operators';

import { UserService } from 'app/shared/services/user.service';
import { formatDate, idToProperty, isOfType, isPhone, tooltipTriggers, trackByIndex } from 'app/shared/utils';

import { Message } from '@models/message';
import { EditionHistoryItem } from '@models/shared';
import { User } from '@models/user';

enum TEXT_LIST {
  MESSAGE = 'message',
  EDITION_HISTORY_ITEM = 'EditionHistoryItem',
}

@Component({
  selector: 'ngx-text-list',
  templateUrl: './text-list.component.html',
  styleUrls: ['./text-list.component.scss'],
})
export class TextListComponent implements OnInit {
  @Input() textList: (Message | EditionHistoryItem)[] = [];
  TEXT_LIST = TEXT_LIST;
  typeOfTextList: TEXT_LIST = TEXT_LIST.MESSAGE;

  currentUser: User = new User();

  isPhone = isPhone;
  formatDate = formatDate;
  idToProperty = idToProperty;
  trackByIndex = trackByIndex;
  tooltipTriggers = tooltipTriggers;

  constructor(public userService: UserService) {}

  ngOnInit(): void {
    if (this.textList && this.textList.length)
      if (isOfType(EditionHistoryItem, this.textList[0])) this.typeOfTextList = TEXT_LIST.EDITION_HISTORY_ITEM;
    this.userService.currentUser$.pipe(take(1)).subscribe((currentUser) => {
      this.currentUser = currentUser;
    });
  }

  getContentFromText(text: Message | EditionHistoryItem): string {
    if (isOfType(Message, text)) return text.body;
    else return text.comment;
  }
}
