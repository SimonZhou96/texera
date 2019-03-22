import { RouterTestingModule } from '@angular/router/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { NavigationComponent } from './navigation.component';
import { ExecuteWorkflowService } from './../../service/execute-workflow/execute-workflow.service';
import { WorkflowActionService } from './../../service/workflow-graph/model/workflow-action.service';
import { TourService } from 'ngx-tour-ng-bootstrap';

import { CustomNgMaterialModule } from '../../../common/custom-ng-material.module';

import { StubOperatorMetadataService } from '../../service/operator-metadata/stub-operator-metadata.service';
import { OperatorMetadataService } from '../../service/operator-metadata/operator-metadata.service';
import { JointUIService } from '../../service/joint-ui/joint-ui.service';
import { DragDropService } from '../../service/drag-drop/drag-drop.service';
import { WorkflowUtilService } from '../../service/workflow-graph/util/workflow-util.service';


import { Observable } from 'rxjs/Observable';
import { marbles } from 'rxjs-marbles';
import { HttpClient } from '@angular/common/http';
import { mockExecutionResult } from '../../service/execute-workflow/mock-result-data';
import { environment } from '../../../../environments/environment';

class StubHttpClient {

  public post<T>(): Observable<string> { return Observable.of('a'); }

}

describe('NavigationComponent', () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;
  let executeWorkFlowService: ExecuteWorkflowService;
  let dragDropService: DragDropService;
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NavigationComponent],
      imports: [
        CustomNgMaterialModule,
        RouterTestingModule.withRoutes([]),
      ],
      providers: [
        WorkflowActionService,
        JointUIService,
        ExecuteWorkflowService,
        DragDropService,
        { provide: OperatorMetadataService, useClass: StubOperatorMetadataService },
        { provide: HttpClient, useClass: StubHttpClient },
        TourService,
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
    executeWorkFlowService = TestBed.get(ExecuteWorkflowService);
    dragDropService = TestBed.get(DragDropService);
    fixture.detectChanges();
    environment.pauseResumeEnabled = true;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should execute the workflow when run button is clicked', marbles((m) => {

    const httpClient: HttpClient = TestBed.get(HttpClient);
    spyOn(httpClient, 'post').and.returnValue(
      Observable.of(mockExecutionResult)
    );


    const runButtonElement = fixture.debugElement.query(By.css('.texera-navigation-run-button'));
    m.hot('-e-').do(event => runButtonElement.triggerEventHandler('click', null)).subscribe();

    const executionEndStream = executeWorkFlowService.getExecuteEndedStream().map(value => 'e');

    const expectedStream = '-e-';
    m.expect(executionEndStream).toBeObservable(expectedStream);

  }));

  it('should show pause/resume button when the workflow execution begins and hide the button when execution ends', marbles((m) => {

    const httpClient: HttpClient = TestBed.get(HttpClient);
    spyOn(httpClient, 'post').and.returnValue(
      Observable.of(mockExecutionResult)
    );

    // expect initially the pause/resume button is not showing

    expect(component.isWorkflowRunning).toBeFalsy();
    expect(component.isWorkflowPaused).toBeFalsy();

    executeWorkFlowService.getExecuteStartedStream().subscribe(
      () => {
        fixture.detectChanges();
        expect(component.isWorkflowRunning).toBeTruthy();
        expect(component.isWorkflowPaused).toBeFalsy();
      }
    );

    executeWorkFlowService.getExecuteEndedStream().subscribe(
      () => {
        fixture.detectChanges();
        expect(component.isWorkflowRunning).toBeFalsy();
        expect(component.isWorkflowPaused).toBeFalsy();
      }
    );

    m.hot('-e-').do(() => component.onButtonClick()).subscribe();

  }));

  it('should call pauseWorkflow function when isWorkflowPaused is false', () => {
    const pauseWorkflowSpy = spyOn(executeWorkFlowService, 'pauseWorkflow').and.callThrough();
    component.isWorkflowRunning = true;
    component.isWorkflowPaused = false;

    (executeWorkFlowService as any).workflowExecutionID = 'MOCK_EXECUTION_ID';

    component.onButtonClick();
    expect(pauseWorkflowSpy).toHaveBeenCalled();
  });

  it('should call resumeWorkflow function when isWorkflowPaused is true', () => {
    const resumeWorkflowSpy = spyOn(executeWorkFlowService, 'resumeWorkflow').and.callThrough();
    component.isWorkflowRunning = true;
    component.isWorkflowPaused = true;

    (executeWorkFlowService as any).workflowExecutionID = 'MOCK_EXECUTION_ID';

    component.onButtonClick();
    expect(resumeWorkflowSpy).toHaveBeenCalled();
  });

  it('should not call resumeWorkflow or pauseWorkflow if the workflow is not currently running', () => {
    const pauseWorkflowSpy = spyOn(executeWorkFlowService, 'pauseWorkflow').and.callThrough();
    const resumeWorkflowSpy = spyOn(executeWorkFlowService, 'resumeWorkflow').and.callThrough();

    component.onButtonClick();
    expect(pauseWorkflowSpy).toHaveBeenCalledTimes(0);
    expect(resumeWorkflowSpy).toHaveBeenCalledTimes(0);
  });

  it('it should update isWorkflowPaused variable to true when 0 is returned from getExecutionPauseResumeStream', marbles((m) => {
    const endMarbleString = '-e-|';
    const endMarblevalues = {
      e: 0
    };

    spyOn(executeWorkFlowService, 'getExecutionPauseResumeStream').and.returnValue(
      m.hot(endMarbleString, endMarblevalues)
    );

    const mockComponent = new NavigationComponent(dragDropService, executeWorkFlowService, TestBed.get(TourService));

    executeWorkFlowService.getExecutionPauseResumeStream()
      .subscribe({
        complete: () => {
          expect(mockComponent.isWorkflowPaused).toBeTruthy();
        }
      });
  }));

  it('it should update isWorkflowPaused variable to false when 1 is returned from getExecutionPauseResumeStream', marbles((m) => {
    const endMarbleString = '-e-|';
    const endMarblevalues = {
      e: 1
    };

    spyOn(executeWorkFlowService, 'getExecutionPauseResumeStream').and.returnValue(
      m.hot(endMarbleString, endMarblevalues)
    );

    const mockComponent = new NavigationComponent(dragDropService, executeWorkFlowService, TestBed.get(TourService));

    executeWorkFlowService.getExecutionPauseResumeStream()
      .subscribe({
        complete: () => {
          expect(mockComponent.isWorkflowPaused).toBeFalsy();
        }
      });
  }));
  it('should change zoom to be smaller when user click on the zoom out buttons', marbles((m) => {
    // expect initially the zoom ratio is 1;
  const originalZoomRatio = 1;

  m.hot('-e-').do(() => component.onClickZoomOut()).subscribe();
  dragDropService.getWorkflowEditorZoomStream().subscribe(
    newRatio => {
      fixture.detectChanges();
      expect(newRatio).toBeLessThan(originalZoomRatio);
      expect(newRatio).toEqual(originalZoomRatio - NavigationComponent.ZOOM_DIFFERENCE);
    }
  );

 }));

 it('should change zoom to be bigger when user click on the zoom in buttons', marbles((m) => {
   // expect initially the zoom ratio is 1;
  const originalZoomRatio = 1;

  m.hot('-e-').do(() => component.onClickZoomIn()).subscribe();
  dragDropService.getWorkflowEditorZoomStream().subscribe(
    newRatio => {
      fixture.detectChanges();
      expect(newRatio).toBeGreaterThan(originalZoomRatio);
      expect(newRatio).toEqual(originalZoomRatio + NavigationComponent.ZOOM_DIFFERENCE);
    }
  );


 }));

 it('should execute the zoom in function when we click on the Zoom In button', marbles((m) => {
   m.hot('-e-').do(event => component.onClickZoomIn()).subscribe();
   const zoomEndStream = dragDropService.getWorkflowEditorZoomStream().map(value => 'e');
   const expectedStream = '-e-';
   m.expect(zoomEndStream).toBeObservable(expectedStream);
 }));

 it('should execute the zoom out function when we click on the Zoom Out button', marbles((m) => {
   m.hot('-e-').do(event => component.onClickZoomOut()).subscribe();
   const zoomEndStream = dragDropService.getWorkflowEditorZoomStream().map(value => 'e');
   const expectedStream = '-e-';
   m.expect(zoomEndStream).toBeObservable(expectedStream);
 }));

 it('it should update isWorkflowPaused variable to false when 1 is returned from getExecutionPauseResumeStream', marbles((m) => {
   const endMarbleString = '-e-|';
   const endMarblevalues = {
     e: 1
   };

   spyOn(executeWorkFlowService, 'getExecutionPauseResumeStream').and.returnValue(
     m.hot(endMarbleString, endMarblevalues)
   );

   const mockComponent = new NavigationComponent(dragDropService, executeWorkFlowService, TestBed.get(TourService));

   executeWorkFlowService.getExecutionPauseResumeStream()
     .subscribe({
       complete: () => {
         expect(mockComponent.isWorkflowPaused).toBeFalsy();
       }
     });
 }));
});
