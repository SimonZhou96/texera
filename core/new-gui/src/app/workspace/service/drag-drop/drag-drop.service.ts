import { Point, OperatorPredicate, OperatorLink, OperatorPort } from './../../types/workflow-common.interface';
import { keyWordSearchPredicate, wordCountPredicate,
  keyWordSearchWordCountLink, viewResultPredicate,
    wordCountViewResultLink } from './../../service/workflow-graph/model/mock-workflow-data';
import { WorkflowActionService } from './../workflow-graph/model/workflow-action.service';
import { Observable } from 'rxjs/Observable';
import { WorkflowUtilService } from './../workflow-graph/util/workflow-util.service';
import { JointUIService } from './../joint-ui/joint-ui.service';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { ZoomInOutService } from './../zoom-in-out/zoom-in-out.service';
import * as joint from 'jointjs';
import { constants } from 'os';

/**
 * The OperatorDragDropService class implements the behavior of dragging an operator label from the side bar
 *  and drop it as an operator box on to the main workflow editor.
 *
 * This behavoir is implemented using jQueryUI draggable and droppable.
 *  1. jQueryUI draggable allows providing a custom DOM element that is displayed when dragging around.
 *  2. the custom DOM element (called "flyPaper") is a JointJS paper that only contains one operator box and has the exact same size of it.
 *  3. when dragging ends, the temporary DOM element ("flyPaper") is destoryed by jQueryUI
 *  4. when dragging ends (operator is dropped), it will notify the observer of the event,
 *    the Operator UI Serivce is responsible for creating an operator at the place dropped.
 *
 * The method mentioned above is the best working way to implement this functionailtiy as of 02/2018.
 * Here are some other methods that have been tried but didn't work.
 *
 *  1. Using HTML5 native drag and drop API.
 *    This doesn't work because the problem of the "ghost image" (the image that follows the mouse when dragging).
 *    The native HTML5 drag/drop API requires that the "ghost" image must be visually the same as the original element.
 *    However, in our case, the dragging operator is not the same as the original element.
 *    There is **NO** workaround for this problem: see this post for details: https://kryogenix.org/code/browser/custom-drag-image.html
 *      (part of the post isn't exactly true on Chrome anymore because the Chrome itself changed)
 *    The HTML5 drag and Drop API itself is also considered a disaster: https://www.quirksmode.org/blog/archives/2009/09/the_html5_drag.html
 *
 *  2. Using some angular drag and drop libraries for Angular, for example:
 *    ng2-dnd: https://github.com/akserg/ng2-dnd
 *    ng2-dragula: https://github.com/valor-software/ng2-dragula
 *    ng-drag-drop: https://github.com/ObaidUrRehman/ng-drag-drop
 *
 *    These drag and drop libraries have the same ghost image problem mentioned above. Moreover, some of them are designed
 *      for moving a DOM element to another place by dragging and dropping, which is not we want.
 *
 * @author Zuozhi Wang
 *
 */
@Injectable()
export class DragDropService {

  private static readonly DRAG_DROP_TEMP_OPERATOR_TYPE = 'drag-drop-temp-operator-type';
  // a subject that can make user add operator faster.
  private workflowEditorUtilitySubject: Subject<number> = new Subject<number>();
  // a subject that can restore the value passed from navigation.component.ts
  private workflowEditorZoomSubject: Subject<number> = new Subject<number>();
  // initially the index of the utility that user choose is 0;
  private utilityIndex: number = 0;
  // initially the zoom ratio is 1
  private newZoomRatio: number = 1;
  // dragOffset has two elements, first is the drag offset alongside x axis, second is the drag offset alongside y axis.
  private dragOffset: Point = {x : 0,  y : 0};
  /** mapping of DOM Element ID to operatorType */
  private elementOperatorTypeMap = new Map<string, string>();
  /** the current operatorType of the operator being dragged */
  private currentOperatorType = DragDropService.DRAG_DROP_TEMP_OPERATOR_TYPE;

  private utilityTemplateOffset = 150;
  /** Subject for operator dragging is started */
  private operatorDragStartedSubject = new Subject<{ operatorType: string }>();

  /** Subject for operator is dropped on the main workflow editor (equivalent to dragging is stopped) */
  private operatorDroppedSubject = new Subject<{
    operatorType: string,
    offset: Point
  }>();

  constructor(
    private jointUIService: JointUIService,
    private workflowUtilService: WorkflowUtilService,
    private workflowActionService: WorkflowActionService,
    private zoomInOutService: ZoomInOutService
  ) {
    this.handleOperatorDropEvent();
  }

  /**
   * Handles the event of operator being dropped.
   * Adds the operator to the workflow graph at the same position of it being dropped.
   */
  public handleOperatorDropEvent(): void {
    this.getOperatorDropStream().subscribe(
      value => {
        // construct the operator from the drop stream value
        const operator = this.workflowUtilService.getNewOperatorPredicate(value.operatorType);
        /**
         * get the new drop coordinate of operator, when users drag or zoom the panel, to make sure the operator will
         drop on the right location.
         */

        const newOperatorOffset: Point = {
          x:  (value.offset.x - this.dragOffset.x) / this.zoomInOutService.getZoomRatio(),
          y: (value.offset.y - this.dragOffset.y) / this.zoomInOutService.getZoomRatio()
        };

        // add the operator
        this.workflowActionService.addOperator(operator, newOperatorOffset);
        // highlight the operator after adding the operator
        this.workflowActionService.getJointGraphWrapper().highlightOperator(operator.operatorID);
        // reset the current operator type to an non-exist type
        this.currentOperatorType = DragDropService.DRAG_DROP_TEMP_OPERATOR_TYPE;
      }
    );
  }

  /**
   * Gets an observable for operator dragging started event
   * Contains an object with:
   *  - operatorType - the type of the dragged operator
   */
  public getOperatorStartDragStream(): Observable<{ operatorType: string }> {
    return this.operatorDragStartedSubject.asObservable();
  }
  /**
   * Gets an observable for operator making utility.
   */
  public getWorkFlowEditorUtilityStream(): Observable<number> {
    return this.workflowEditorUtilitySubject.asObservable();
  }

  /**
   * get subject from drag-and-drop service in order to get the zoom ratio value.
   */
  public getWorkflowEditorZoomStream(): Observable<number> {
    return this.workflowEditorZoomSubject.asObservable();
  }

  /**
   * Gets an observable for operator is dropped on the main workflow editor event
   * Contains an object with:
   *  - operatorType - the type of the operator dropped
   *  - offset - the x and y point where the operator is dropped (relative to document root)
   */
  public getOperatorDropStream(): Observable<{ operatorType: string, offset: Point }> {
    return this.operatorDroppedSubject.asObservable();
  }

  /**
   * This method will update the drag offset so that dropping
   *  a new operator will appear at the correct location on the UI.
   *
   * @param offset new offset from panning
   */
  public setOffset(offset: Point) {
    this.dragOffset = {x: offset.x, y: offset.y};
  }

  public setUtilityIndex(index: number) {
      this.utilityIndex = index;
      this.workflowEditorUtilitySubject.next(this.utilityIndex);
  }

  /**
   * This method will update the zoom ratio, which will be used
   *  in calculating the position of the operator dropped on the UI.
   *
   * @param ratio new ratio from zooming
   */
  public setZoomProperty(ratio: number) {
      this.newZoomRatio = ratio;
      console.log('zoom property: ', this.newZoomRatio);
      this.workflowEditorZoomSubject.next(this.newZoomRatio);
  }

  /**
   * This function is intended by be used by the operator labels to make the element draggable.
   * It also binds hanlder functions the following property or events:
   *  - helper: a function the DOM element to display when dragging to make it look like an operator
   *  - start: triggers when dragging starts
   *
   * more detail at jQuery UI draggable documentation: http://api.jqueryui.com/draggable/
   *
   * @param dragElementID the DOM Element ID
   * @param operatorType the operator type that the element corresponds to
   */
  public registerOperatorLabelDrag(dragElementID: string, operatorType: string): void {
    this.elementOperatorTypeMap.set(dragElementID, operatorType);

    // register callback functions for jquery UI
    jQuery('#' + dragElementID).draggable({
      helper: () => this.createFlyingOperatorElement(operatorType),
      // declare event as type any because the jQueryUI type declaration is wrong
      // it should be of type JQuery.Event, which is incompatible with the the declared type Event
      start: (event: any, ui) => this.handleOperatorStartDrag(event, ui),
      // The draggable element will be created with the mouse starting point at the center
      cursorAt : {
        left: JointUIService.DEFAULT_OPERATOR_WIDTH / 2,
        top: JointUIService.DEFAULT_OPERATOR_HEIGHT / 2
      }
    });
  }

  /**
   * This function should be only used by the Workflow Editor Componenet
   *  to register itself as a droppable area.
  */
  public registerWorkflowEditorDrop(dropElementID: string): void {
    jQuery('#' + dropElementID).droppable({
      drop: (event: any, ui) => this.handleOperatorDrop(event, ui)
    });
  }
  /**
   * creates an series of operators that can form as a workflow directly.
   *
   */

  public createNewOperator(utilityIndex: number, offsetX: number, offsetY: number) {
    console.log('offset: ', offsetX, offsetY);
    const firstOperatorOffset: Point = {
      x:  offsetX * 2,
      y:  offsetY * 3
    };
    const secondOperatorOffset: Point = {
      x:  offsetX * 3,
      y:  offsetY * 3
    };
    const thirdOperatorOffset: Point = {
      x:  offsetX * 4,
      y:  offsetY * 3
    };
    if (utilityIndex === 0) {
        this.workflowActionService.addOperator(keyWordSearchPredicate, firstOperatorOffset);
        this.workflowActionService.addOperator(wordCountPredicate, secondOperatorOffset);
        this.workflowActionService.addOperator(viewResultPredicate, thirdOperatorOffset);
        this.workflowActionService.addLink(keyWordSearchWordCountLink);
        this.workflowActionService.addLink(wordCountViewResultLink);
    }
  }

  /**
   * Creates a DOM Element that visually looks identical to the operator when dropped on main workflow editor
   *
   * This function temporarily creates a DOM element which contains a JointJS paper that has the exact size of the operator,
   *    then create the operator Element based on the operatorType and make it fully occupy the JointJS paper.
   *
   * The temporary JointJS paper element has ID "flyingJointPaper". This DOM elememtn will be destroyed by jQueryUI when the dragging ends.
   *
   * @param operatorType - the type of the operator
   */

  private createFlyingOperatorElement(operatorType: string): JQuery<HTMLElement> {
    // set the current operator type from an nonexist placeholder operator type
    //  to the operator type being dragged
    this.currentOperatorType = operatorType;

    // create a temporary ghost element
    jQuery('body').append('<div id="flyingJointPaper" style="position:fixed;z-index:100;pointer-event:none;"></div>');

    // create an operator and get the UI element from the operator type
    const operator = this.workflowUtilService.getNewOperatorPredicate(operatorType);
    const operatorUIElement = this.jointUIService.getJointOperatorElement(operator, { x: 0, y: 0 });

    // create the jointjs model and paper of the ghost element
    const tempGhostModel = new joint.dia.Graph();
    const tempGhostPaper = new joint.dia.Paper({
      el: jQuery('#flyingJointPaper'),
      width: JointUIService.DEFAULT_OPERATOR_WIDTH,
      height: JointUIService.DEFAULT_OPERATOR_HEIGHT,
      model: tempGhostModel,
    });

    // add the operator JointJS element to the paper
    tempGhostModel.addCell(operatorUIElement);

    // return the jQuery object of the DOM Element
    return jQuery('#flyingJointPaper');
  }

  /**
   * Hanlder function for jQueryUI's drag started event.
   * It converts the event to the drag started Subject.
   *
   * @param event JQuery.Event type, although JQueryUI typing says the type is Event, the object's actual type is JQuery.Event
   * @param ui jQueryUI Draggable Event UI
   */
  private handleOperatorStartDrag(event: JQuery.Event, ui: JQueryUI.DraggableEventUIParams): void {
    const eventElement = event.target;
    if (!(eventElement instanceof Element)) {
      throw new Error('Incorrect type: in most cases, this element is type Element');
    }
    if (eventElement === undefined) {
      throw new Error('drag and drop: cannot find element when drag is started');
    }
    // get the operatorType based on the DOM element ID
    const operatorType = this.elementOperatorTypeMap.get(eventElement.id);
    if (operatorType === undefined) {
      throw new Error(`drag and drop: cannot find operator type ${operatorType} from DOM element ${eventElement}`);
    }
    // set the currentOperatorType
    this.currentOperatorType = operatorType;
    // notify the subject of the event
    this.operatorDragStartedSubject.next({ operatorType });
  }

  /**
   * Hanlder function for jQueryUI's drag stopped event.
   * It converts the event to the drag stopped Subject.
   * Notice that we view Drag Stopped is equivalent to the operator being Dropped
   *
   * @param event
   * @param ui
   */
  private handleOperatorDrop(event: JQuery.Event, ui: JQueryUI.DraggableEventUIParams): void {
    // notify the subject of the event
    // use ui.offset instead of ui.position because offset is relative to document root, where position is relative to parent element
    this.operatorDroppedSubject.next({
      operatorType: this.currentOperatorType,
      offset: {
        x: ui.offset.left,
        y: ui.offset.top
      }
    });
  }

}
