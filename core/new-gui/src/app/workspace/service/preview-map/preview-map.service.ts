import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { Point } from '../../types/workflow-common.interface';

@Injectable({
  providedIn: 'root'
})
export class PreviewMapService {

  private workFlowEditorPreviewSubject: Subject<joint.dia.Paper> = new Subject<joint.dia.Paper>();
  private workFlowEditorTranslateSubject: Subject<Point> = new Subject<Point>();
  private workFlowEditorZoomSubject: Subject<number> = new Subject<number>();
  constructor() { }

  public getWorkFlowEditorPreviewStream(): Observable<joint.dia.Paper> {
    return this.workFlowEditorPreviewSubject.asObservable();
  }
  public intializePreviewPaper(aimPaper: joint.dia.Paper | undefined): void {
    this.workFlowEditorPreviewSubject.next(aimPaper);
  }
  public sendTranslateOffset(x: number, y: number) {
    const translateOffset: Point = {x: x, y: y};
    this.workFlowEditorTranslateSubject.next(translateOffset);
  }
  public getWorkFlowEditorTranslateStream(): Observable<Point> {
    return this.workFlowEditorTranslateSubject.asObservable();
  }
  public sendZoomValue(value: number) {
    this.workFlowEditorZoomSubject.next(value);
  }
  public getWorkFlowEditorZoomStream(): Observable<number> {
    return this.workFlowEditorZoomSubject.asObservable();
  }
}
