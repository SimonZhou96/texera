import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class ZoomInOutService {

  private controlZoomRatio: number = 1;
  private mouseWheelZoomSubject: Subject<number> = new Subject<number>();
  private buttonZoomSubject: Subject<number> = new Subject<number>();
    constructor() { }

  public setmouseWheelZoomProperty(mouseWheelZoomRatio: number): void {
    this.mouseWheelZoomSubject.next(mouseWheelZoomRatio);
  }
  public setbuttonZoomProperty(buttonZoomRatio: number): void {
    this.mouseWheelZoomSubject.next(buttonZoomRatio);
  }

  public getMouseWheelZoomStream(): Observable<number> {
    return this.mouseWheelZoomSubject.asObservable();
  }

  public getButtonZoomStream(): Observable<number> {
    return this.buttonZoomSubject.asObservable();
  }

  public setZoomRatio(newRatio: number) {
    this.controlZoomRatio = newRatio;
  }

  public getZoomRatio(): number {
    return this.controlZoomRatio;
  }
}
