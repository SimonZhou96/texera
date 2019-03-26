import { Component, OnInit } from '@angular/core';
import { PreviewMapService } from './../../service/preview-map/preview-map.service';
import { WorkflowActionService } from './../../service/workflow-graph/model/workflow-action.service';

import { Observable } from 'rxjs/Observable';

import * as joint from 'jointjs';
import '../../../common/rxjs-operators';

@Component({
  selector: 'texera-preview-map',
  templateUrl: './preview-map.component.html',
  styleUrls: ['./preview-map.component.scss']
})
export class PreviewMapComponent implements OnInit {

  private readonly WORKFLOW_EDITOR_PREVIEW_WRAPPER_ID = 'texera-workflow-editor-preview-wrapper-id';
  private readonly WORKFLOW_EDITOR_PREVIEW_ID = 'texera-workflow-editor-preview-body-id';
  private previewMap: joint.dia.Paper | undefined;
  constructor(private previewMapService: PreviewMapService,
    private workflowActionService: WorkflowActionService) { }

  ngOnInit() {
    this.initializePreviewMap();
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

  private getWrapperElementOffset(): { x: number, y: number } {
    const offset = $('#' + this.WORKFLOW_EDITOR_PREVIEW_WRAPPER_ID).offset();
    if (offset === undefined) {
      throw new Error('fail to get Workflow Editor wrapper element offset');
    }
    return { x: offset.left, y: offset.top };
  }

  private getPreviewMapOptions(map: joint.dia.Paper): joint.dia.Paper.Options {
    const previewMapOptions: joint.dia.Paper.Options = {
        interactive: false,
        gridSize: 10,
        drawGrid: true
    };

    return previewMapOptions;
  }

  private setPreviewMapDimensions(): void {
    const elementSize = this.getWrapperElementSize();
    this.getPreviewMap().setDimensions(elementSize.width, elementSize.height);
  }

  private setPreviewMapOffset(): void {
    const elementOffset = this.getWrapperElementOffset();
    this.getPreviewMap().translate(-elementOffset.x, -elementOffset.y);
  }
}
