import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PreviewMapService {

  private workFlowEditorPreviewSubject: Subject<joint.dia.Paper> = new Subject<joint.dia.Paper>();

  constructor() { }

  public getWorkFlowEditorPreviewStream(): Observable<joint.dia.Paper> {
    return this.workFlowEditorPreviewSubject.asObservable();
  }
  public intializePreviewPaper(aimPaper: joint.dia.Paper | undefined): void {
    this.workFlowEditorPreviewSubject.next(aimPaper);
  }
}
