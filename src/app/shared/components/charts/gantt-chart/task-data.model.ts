// This code was initially made by https://github.com/mfandre

export class TaskModel {
  taskName!: string;
  taskId!: number | string;
  groupName!: string;
  groupOrder!: number;
  start!: Date;
  end!: Date;
  owner!: string;
  progressPercentage!: number;
  isFinished!: number;
  isAction!: number;
  isContract!: boolean;
  finishedDate?: Date;

  /**
   * url to image
   */
  image!: string;

  /**
   * Array of taskId dependency
   */
  taskDependencies!: number[] | string[];
}
