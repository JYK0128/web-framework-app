/** 이전값과 현재값을 함께 보관한다. 값은 복사하지 않는다. */
export class BufferedValue<T> {
  private _previous: T;
  private _current: T;

  constructor(initial: T) {
    this._previous = initial;
    this._current = initial;
  }

  get previous(): T {
    return this._previous;
  }

  get current(): T {
    return this._current;
  }

  set(value: T): void {
    this._current = value;
  }

  commit(next: T): void {
    this._previous = this._current;
    this._current = next;
  }
}
