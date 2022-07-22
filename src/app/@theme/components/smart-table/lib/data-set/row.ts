import { Cell } from './cell';
import { Column } from './column';
import { DataSet } from './data-set';
import { accessNestedProperty } from 'app/shared/utils';

export class Row {
  isSelected: boolean = false;
  isInEditing: boolean = false;
  cells: Array<Cell> = [];

  constructor(public index: number = 0, protected data: any = {}, protected _dataSet?: DataSet) {
    this.process();
  }

  getCell(column: Column): Cell | undefined {
    return this.cells.find((el) => el.getColumn() === column);
  }

  getCells() {
    return this.cells;
  }

  getData(): any {
    return this.data;
  }

  getIsSelected(): boolean {
    return this.isSelected;
  }

  getNewData(): any {
    const values = Object.assign({}, this.data);
    this.getCells().forEach((cell) => (values[cell.getColumn().id] = cell.newValue));
    return values;
  }

  setData(data: any): any {
    this.data = data;
    this.process();
  }

  process() {
    this.cells = [];
    if (this._dataSet)
      this._dataSet.getColumns().forEach((column: Column) => {
        const cell = this.createCell(column);
        this.cells.push(cell);
      });
  }

  createCell(column: Column): Cell {
    const defValue = (column as any).settings.defaultValue ? (column as any).settings.defaultValue : '';
    const propertiesToAccess = column.id.split('.');

    if (propertiesToAccess.length > 1) {
      const value = accessNestedProperty(this.data, propertiesToAccess, defValue);
      return new Cell(value, this, column, this._dataSet);
    }

    const value = typeof this.data[column.id] === 'undefined' ? defValue : this.data[column.id];
    return new Cell(value, this, column, this._dataSet);
  }
}
