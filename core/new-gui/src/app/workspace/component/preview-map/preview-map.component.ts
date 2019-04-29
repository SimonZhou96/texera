import { Component, OnInit } from '@angular/core';
import { PreviewMapService } from './../../service/preview-map/preview-map.service';
import { WorkflowActionService } from './../../service/workflow-graph/model/workflow-action.service';

import { Observable } from 'rxjs/Observable';

import * as joint from 'jointjs';
import '../../../common/rxjs-operators';
import { Point } from '../../types/workflow-common.interface';

@Component({
  selector: 'texera-preview-map',
  templateUrl: './preview-map.component.html',
  styleUrls: ['./preview-map.component.scss']
})
export class PreviewMapComponent implements OnInit {

  private readonly WORKFLOW_EDITOR_PREVIEW_WRAPPER_ID = 'texera-workflow-editor-preview-wrapper-id';
  private readonly WORKFLOW_EDITOR_PREVIEW_ID = 'texera-workflow-editor-preview-body-id';
  private translateOffsetX: number = 0;
  private translateOffsetY: number = 0;
  private zoomValue: number = 1;
  private previewMap: joint.dia.Paper | undefined;
  constructor(private previewMapService: PreviewMapService,
    private workflowActionService: WorkflowActionService) { }

  ngOnInit() {
    this.initializeZoomOffset();
    this.intializeTranslateOffset();
    this.initializePreviewMap();
  }
  ngAfterInit() {
    // this.initializeZoomOffset();
    // this.intializeTranslateOffset();
    this.initializePreviewMap();
  }
  public intializeTranslateOffset(): void {
    this.previewMapService.getWorkFlowEditorTranslateStream().subscribe(offset => {
      this.translateOffsetX = offset.x;
      this.translateOffsetY = offset.y;
      if (this.previewMap !== undefined) {
        this.previewMap.translate(offset.x, offset.y);
      }
    });
  }
  public initializeZoomOffset(): void {
    this.previewMapService.getWorkFlowEditorZoomStream().subscribe(zoomValue => {
      this.zoomValue = zoomValue;
      if (this.previewMap !== undefined) {
        this.previewMap.scale(this.zoomValue * 0.15);
      }
    });
  }
  public initializePreviewMap(): void {
    this.previewMapService.getWorkFlowEditorPreviewStream().subscribe ((map) => {
      let previewMapOptions = this.getPreviewMapOptions(map);

      previewMapOptions = this.workflowActionService.attachJointPaper(previewMapOptions);

      previewMapOptions.el = document.getElementById(this.WORKFLOW_EDITOR_PREVIEW_ID);
      map = new joint.dia.Paper(previewMapOptions);
      this.previewMap = map;
      this.previewMap.scale(0.15);
      this.previewMap.drawGrid();
      this.setPreviewMapDimensions();
      // this.setPreviewMapOffset();
    });
  }

  private getPreviewMap(): joint.dia.Paper {
    if (this.previewMap === undefined) {
      throw new Error('preview map is undefined!');
    }
    return this.previewMap;
  }
  /**
     * Gets the width and height of the parent wrapper element
     */
  private getWrapperElementSize(): { width: number, height: number } {
    const width = $('#' + this.WORKFLOW_EDITOR_PREVIEW_WRAPPER_ID).width();
    const height = $('#' + this.WORKFLOW_EDITOR_PREVIEW_WRAPPER_ID).height();

    if (width === undefined || height === undefined) {
      throw new Error('fail to get Workflow Editor wrapper element size');
    }

    return { width, height };
  }


  /**
   * Gets the document offset coordinates of the wrapper element's top-left corner.
   */


  private getPreviewMapOptions(map: joint.dia.Paper): joint.dia.Paper.Options {
    const previewMapOptions: joint.dia.Paper.Options = {
        interactive: false,
        // draw dots in the background of the paper
        drawGrid: {name: 'fixedDot', args: {color: 'black', scaleFactor: 8, thickness: 1.2 } },
        // set grid size
        gridSize: 20,
    };

    return previewMapOptions;
  }

  private setPreviewMapDimensions(): void {
    const elementSize = this.getWrapperElementSize();
    this.getPreviewMap().setDimensions(elementSize.width, elementSize.height);
  }

}
