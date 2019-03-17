import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { UserDictionaryService } from '../../../../service/user-dictionary/user-dictionary.service';
import { UserDictionary } from '../../../../type/user-dictionary';
import { FileUploader } from 'ng2-file-upload';

// sub component for add-dictionary popup window
@Component({
  selector: 'texera-resource-section-add-dict-modal',
  templateUrl: 'ngbd-modal-resource-add.component.html',
  styleUrls: ['./ngbd-modal-resource-add.component.scss', '../../../dashboard.component.scss'],
  providers: [
    UserDictionaryService,
  ]

})
export class NgbdModalResourceAddComponent {
  @Output() addedDictionary =  new EventEmitter<UserDictionary>();

  public newDictionary: any; // potential issue
  public name: string = '';
  public dictContent: string = '';
  public separator: string = '';
  public selectFile: any = null; // potential issue

  public duplicateFile:any=[];//store the name of invalid file due to duplication
  public haveDropZoneOver:boolean = false;//state for user draging over the area
  public invalidFileNumbe:number=0;//counter for the number of invalid file in the uploader due to invalid type
  //uploader: https://github.com/valor-software/ng2-file-upload/blob/development/src/file-upload/file-uploader.class.ts
  public uploader:FileUploader = new FileUploader({url: "test"}); //Uploader is from outside library. Here it is used to capture the file and store it. It is capable of sending file but we don't use it. the url="test" is meanless since we send it through our own way.
  
  constructor(
    public activeModal: NgbActiveModal,
    public userDictionaryService: UserDictionaryService
  ) {}

  public onChange(event: any): void {
    this.selectFile = event.target.files[0];
  }

  public onClose(): void {
    this.activeModal.close('Close');
  }

  public addKey(): void {

    if (this.selectFile !== null) {
        this.userDictionaryService.uploadDictionary(this.selectFile);
    }

    if (this.name !== '') {
      this.newDictionary = <UserDictionary> {
        id : '1',
        name : this.name,
        items : [],
      };

      if (this.dictContent !== '' && this.separator !== '') {
        this.newDictionary.items = this.dictContent.split(this.separator);
      }
      this.addedDictionary.emit(this.newDictionary);

      this.name = '';
      this.dictContent = '';
      this.separator = '';
    }
    this.onClose();
  }
  public uploadFile(){
    //For "upload" button. Upload the file in the queue and then clear the queue
    //FileItem: https://github.com/valor-software/ng2-file-upload/blob/development/src/file-upload/file-item.class.ts
    //typeof queue -> [FileItem]
    //typeof FileItem._file -> File
    this.uploader.queue.forEach((item)=>this.userDictionaryService.uploadDictionary(item._file));
    this.uploader.clearQueue()
  }
  public removeFile(item:any){
    //For "delete" button. Remove the specific file
    //typeof item -> FileItem
    console.log("Removed file:",item._file.name,", the type is",item._file.type);
    //when the user remove one file which is not text type, drop the number of counter with one
    if (!item._file.type.includes("text")){
      this.invalidFileNumbe--;
    }
    item.remove();
    //after one file has been removed, check if duplication still exist
    this.checkDuplicateFiles()
  }
  public haveFileOver(e:any):void {
    // typeof e -> bool
    //when user drag file over the area, this function will be called with a bool
    this.haveDropZoneOver = e;
  }
  public checkThisFileDuplicate(filename:string){
    //passed by single file name. check if this file is duplicated in the array
    return this.duplicateFile.includes(filename);
  }
  public checkDuplicateFiles(){
    //go through the uploader to check if there exist file with the same name, store the duplicate file in this.duplicateFile
    let filesArray = this.uploader.queue.map(item => item._file.name);
    let duplicate:any=[];
    for (var i=0; i<filesArray.length;i++){
      if (filesArray.indexOf(filesArray[i]) !== i && !duplicate.includes(filesArray[i])){
        duplicate.push(filesArray[i]);
        }
    }
    this.duplicateFile=duplicate;
}
  public getFileDropped(e:any):void{
    // typeof e -> FileList
    //when receive file, check it's type to find if it's valid. if not, counter for invalidfile will plus one. Also check duplicates at the end
    //the real file is store in this.uploader.
    let filelist:FileList=e;
    for(var i=0;i<filelist.length;i++){
      if (!filelist[i].type.includes("text")){
        this.invalidFileNumbe++;
        console.log("Invalid file captured:",filelist[i].name,", the type is",filelist[i].type);
      }
      else{
        console.log("Captured file:",filelist[i].name);
      }
    }
    this.checkDuplicateFiles();
  }
}
