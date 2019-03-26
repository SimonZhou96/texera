import { Component, OnInit } from '@angular/core';
import { ExecuteWorkflowService } from './../../service/execute-workflow/execute-workflow.service';
import { TourService } from 'ngx-tour-ng-bootstrap';
import { environment } from '../../../../environments/environment';
import { DragDropService } from './../../service/drag-drop/drag-drop.service';
import { ZoomInOutService } from './../../service/zoom-in-out/zoom-in-out.service';

/**
 * NavigationComponent is the top level navigation bar that shows
 *  the Texera title and workflow execution button
 *
 * This Component will be the only Component capable of executing
 *  the workflow in the WorkflowEditor Component.
 *
 * Clicking the run button on the top-right hand corner will begin
 *  the execution. During execution, the run button will be replaced
 *  with a pause/resume button to show that graph is under execution.
 *
 * @author Zuozhi Wang
 * @author Henry Chen
 *
 */
@Component({
  selector: 'texera-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {

  // zoomDifference represents the ratio that is zoom in/out everytime.
  public static readonly ZOOM_DIFFERENCE: number = 0.02;


  public isWorkflowRunning: boolean = false; // set this to true when the workflow is started
  public isWorkflowPaused: boolean = false; // this will be modified by clicking pause/resume while the workflow is running

   // the newZoomRatio represents the ratio of the size of the the new window to the original one.
   private newZoomRatio: number = 1;
  constructor(private dragDropService: DragDropService,
    private executeWorkflowService: ExecuteWorkflowService, public tourService: TourService,
    private zoomInOutService: ZoomInOutService) {
    // return the run button after the execution is finished, either
    //  when the value is valid or invalid
    executeWorkflowService.getExecuteEndedStream().subscribe(
      () => {
        this.isWorkflowRunning = false;
        this.isWorkflowPaused = false;
      },
      () => {
        this.isWorkflowRunning = false;
        this.isWorkflowPaused = false;
      }
    );

    // update the pause/resume button after a pause/resume request
    //  is returned from the backend.
    // this will swap button between pause and resume
    executeWorkflowService.getExecutionPauseResumeStream()
      .subscribe(state => this.isWorkflowPaused = (state === 0));
  }

  ngOnInit() {
  }

  public onClickDelete(): void {

  }
  /**
   * Executes the current existing workflow on the JointJS paper. It will
   *  also set the `isWorkflowRunning` variable to true to show that the backend
   *  is loading the workflow by displaying the pause/resume button.
   */
  public onButtonClick(): void {
    if (! environment.pauseResumeEnabled) {
      if (! this.isWorkflowRunning) {
        this.isWorkflowRunning = true;
        this.executeWorkflowService.executeWorkflow();
      }
    } else {
      if (!this.isWorkflowRunning && !this.isWorkflowPaused) {
        this.isWorkflowRunning = true;
        this.executeWorkflowService.executeWorkflow();
      } else if (this.isWorkflowRunning && this.isWorkflowPaused) {
        this.executeWorkflowService.resumeWorkflow();
      } else if (this.isWorkflowRunning && !this.isWorkflowPaused) {
        this.executeWorkflowService.pauseWorkflow();
      } else {
        throw new Error('internal error: workflow cannot be both running and paused');
      }
    }
  }

  public getRunButtonText(): string {
    if (! environment.pauseResumeEnabled) {
      return 'Run';
    } else {
      if (!this.isWorkflowRunning && !this.isWorkflowPaused) {
        return 'Run';
      } else if (this.isWorkflowRunning && this.isWorkflowPaused) {
        return 'Resume';
      } else if (this.isWorkflowRunning && !this.isWorkflowPaused) {
        return 'Pause';
      } else {
        throw new Error('internal error: workflow cannot be both running and paused');
      }
    }
  }

  public runSpinner(): boolean {
    if (! environment.pauseResumeEnabled) {
      if (this.isWorkflowRunning && !this.isWorkflowPaused) {
        return true;
      } else {
        return false;
      }
    } else {
      if (!this.isWorkflowRunning && !this.isWorkflowPaused) {
        return false;
      } else if (this.isWorkflowRunning && this.isWorkflowPaused) {
        return false;
      } else if (this.isWorkflowRunning && !this.isWorkflowPaused) {
        return true;
      } else {
        throw new Error('internal error: workflow cannot be both running and paused');
      }
    }
  }
  public onClickUtility(): void {
    // initial version, default index is 0;
    this.dragDropService.setUtilityIndex(0);
  }

  public setZoomProperty(ratio: number) {
    this.newZoomRatio = ratio;
  }
  /**
   * send the offset value to the work flow editor panel using drag and drop service.
   * when users click on the button, we change the zoomoffset to make window larger or smaller.
  */
  public onClickZoomIn(): void {
    this.zoomInOutService.getButtonZoomStream().subscribe(
      zoomRatio => {
        this.newZoomRatio = zoomRatio;
      }
    );
    // make the ratio small.
    this.newZoomRatio += NavigationComponent.ZOOM_DIFFERENCE;
    this.zoomInOutService.setZoomRatio(this.zoomInOutService.getZoomRatio() + NavigationComponent.ZOOM_DIFFERENCE);
    this.zoomInOutService.setmouseWheelZoomProperty(this.zoomInOutService.getZoomRatio());
  }
  public onClickZoomOut(): void {
    this.zoomInOutService.getButtonZoomStream().subscribe(
      zoomRatio => {
        this.newZoomRatio = zoomRatio;
      }
    );
    // make the ratio big.
    this.newZoomRatio -= NavigationComponent.ZOOM_DIFFERENCE;
    this.zoomInOutService.setZoomRatio(this.zoomInOutService.getZoomRatio() - NavigationComponent.ZOOM_DIFFERENCE);
    this.zoomInOutService.setmouseWheelZoomProperty(this.zoomInOutService.getZoomRatio());
  }
}
