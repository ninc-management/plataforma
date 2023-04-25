import { isEqual } from 'lodash';
import { Observable, Subject } from 'rxjs';

export class SizeLimitedQueue<T> {
  private _queue: T[] = [];
  private maxLenght: number;
  private _inserted$: Subject<T> = new Subject<T>();

  get inserted$(): Observable<T> {
    return this._inserted$.asObservable();
  }

  get length(): number {
    return this._queue.length;
  }

  constructor(maxLenght: number) {
    this.maxLenght = maxLenght;
  }

  queue(data: T): void {
    if (this._queue.length == this.maxLenght) {
      this.dequeue();
    }
    this._queue.unshift(data);
    this._inserted$.next(data);
  }

  dequeue(): void {
    if (!this.isEmpty()) {
      this._queue.pop();
    }
  }

  head(): T {
    return this._queue[0];
  }

  tail(): T {
    return this._queue[this._queue.length - 1];
  }

  isEmpty(): boolean {
    return this._queue.length === 0;
  }

  elementsAfter(el: T): T[] {
    const lastIndex = this._queue.findIndex((e) => isEqual(e, el));
    if (lastIndex == -1) return [];
    return this._queue.slice(0, lastIndex).reverse();
  }
}
