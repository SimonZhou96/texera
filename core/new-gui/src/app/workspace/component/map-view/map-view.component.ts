import { Component, OnInit } from '@angular/core';
import { WorkflowEditorComponent } from '../workflow-editor/workflow-editor.component';
@Component({
  selector: 'texera-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.scss']
})
export class MapViewComponent implements OnInit {

  constructor(workFlowEditorComponent: WorkflowEditorComponent) { }

  ngOnInit() {
  }

}
