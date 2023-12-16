// This code was initially made by https://github.com/mfandre

import { getMinDate } from './date-manipulator';
import { TaskModel } from './task-data.model';
import { CONTRACT_STATOOS } from 'app/shared/services/contract.service';

import { Contract } from '@models/contract';

export class TaskDataManipulator {
  COLOURS: string[];
  _contract: Contract;

  constructor(colours: string[], contract: Contract) {
    this.COLOURS = colours;
    this._contract = contract;
  }

  mapData(taskData: TaskModel[]): any[] {
    //Im changing the item object to array... this is why the encode is filled with indexed
    const _groupData = this.mapGroups(taskData);
    const mappedData = [];

    for (let index = 0; index < taskData.length; index++) {
      const item = taskData[index];
      let shouldDrawGroupConnector = 0;
      const groupInfo = _groupData[item.groupName];

      /*
        the group connector must be draw in every task inside a group except the first
        which will have the group title
      */
      if (groupInfo != undefined && groupInfo.tasks.length > 1) {
        if (groupInfo.tasks.indexOf(item.taskId) != 0) shouldDrawGroupConnector = 1;
      }

      const color = groupInfo.color;
      const index_attributes = [
        index,
        item.taskName,
        item.start,
        item.end,
        item.taskId,
        item.progressPercentage,
        item.owner,
        item.image,
        item.groupName,
        shouldDrawGroupConnector,
        color,
        item.isFinished,
        item.isAction,
        item.finishedDate,
        item.isContract,
        item.status,
      ];

      mappedData.push(index_attributes);
    }

    return mappedData;
  }

  mapZebra(taskData: TaskModel[]): any[] {
    const mappedData = [];
    const maxDate = this.getMaxDate(taskData);
    const minDate = getMinDate(taskData, this._contract);

    for (let index = 0; index < taskData.length; index++) {
      const item = taskData[index];
      const index_attributes = [index, minDate, maxDate, item.taskId];
      mappedData.push(index_attributes);
    }
    return mappedData;
  }

  getMaxDate(taskData: TaskModel[]): Date {
    const contractLastStatus = this._contract.statusHistory[this._contract.statusHistory.length - 1];
    if (contractLastStatus && contractLastStatus.status == CONTRACT_STATOOS.ENTREGUE && contractLastStatus.end) {
      return new Date(contractLastStatus.end);
    }

    const maxDate = new Date(-8640000000000000);
    return taskData.reduce((maxDate, item) => {
      if (item.end > maxDate) maxDate = item.end;
      return maxDate;
    }, maxDate);
  }

  mapGroups(taskData: TaskModel[]): any {
    /**
     * return a hash
     * {
     *  "groupName1" => { color: "#222", tasks: [taskId1, taskId2, ..., taskIdN]}
     *  "groupName2" => { color: "#222", tasks: [taskId1, taskId2, ..., taskIdN]}
     * }
     */

    let countColor = 0;
    const mappedGroups: any = {};
    //Im creating a map of groups => taskId
    for (let i = 0; i < taskData.length; i++) {
      if (mappedGroups[taskData[i].groupName] == undefined) {
        mappedGroups[taskData[i].groupName] = {};
        mappedGroups[taskData[i].groupName].color = this.getColorHex(countColor); //this.getRandomHexColor()
        mappedGroups[taskData[i].groupName].tasks = [taskData[i].taskId];
        countColor = countColor + 1;
      } else mappedGroups[taskData[i].groupName].tasks.push(taskData[i].taskId);
    }

    return mappedGroups;
  }

  compareTasks(a: TaskModel, b: TaskModel): number {
    let dateComp = 0;
    if (a.start > b.start) dateComp = 1;
    if (b.start > a.start) dateComp = -1;

    let groupOrderComp = 0;
    if (a.groupOrder > b.groupOrder) groupOrderComp = 1;
    if (b.groupOrder > a.groupOrder) groupOrderComp = -1;

    let taskIdComp = 0;
    if (a.taskId > b.taskId) taskIdComp = 1;
    if (b.taskId > a.taskId) taskIdComp = -1;

    return groupOrderComp || taskIdComp || dateComp;
  }

  getTaskById(taskData: TaskModel[], id: any): TaskModel | null {
    for (let i = 0; i < taskData.length; i++) {
      if (taskData[i].taskId == id) {
        return taskData[i];
      }
    }

    return null;
  }

  getTaskByIdInMappedData(mappedData: any, id: any): any[] | null {
    for (let i = 0; i < mappedData.length; i++) {
      if (mappedData[i][4] == id) {
        return mappedData[i];
      }
    }

    return null;
  }

  randomInt(min: number, max: number): number {
    return min + Math.floor((max - min) * Math.random());
  }

  getRandomHexColor(): string {
    //const randomColor = Math.floor(Math.random()*16777215).toString(16);
    //return "#" + randomColor;

    return this.COLOURS[this.randomInt(0, this.COLOURS.length)];
  }

  getColorHex(index: number): string {
    if (index >= this.COLOURS.length) index = 0;

    return this.COLOURS[index];
  }
}
