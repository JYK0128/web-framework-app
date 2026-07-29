/** 중복 예약을 막는 setTimeout 래퍼. */
export class Timer {
  private _id: number | null = null;
  private readonly _fn: () => void;
  private readonly _delay: number;

  constructor(fn: () => void, delay: number) {
    this._fn = fn;
    this._delay = delay;
  }

  get isActive(): boolean {
    return this._id !== null;
  }

  start(): void {
    if (this.isActive) return;

    this._id = window.setTimeout(() => {
      this._id = null;
      this._fn();
    }, this._delay);
  }

  stop(): void {
    if (this._id === null) return;

    window.clearTimeout(this._id);
    this._id = null;
  }

  close(): void {
    this.stop();
  }
}
