import { Injectable, ɵNOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR } from '@angular/core';

import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  public photos :UserPhoto[];
  public PHOTO_STORAGE :string;

  constructor() {
    this.photos = []
    this.PHOTO_STORAGE = 'photos'
  }

  private convertBlobToBase64(blob :Blob){
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader()
      
      fileReader.onerror = reject
      fileReader.onload = () => {
        resolve(fileReader.result)
      }
      fileReader.readAsDataURL(blob)
    })
  }

  private async readAsBase64(photo :Photo){
    const response = await fetch(photo.webPath!)
    const blob = await response.blob()
    
    return await this.convertBlobToBase64(blob) as string;
  }

  private async savePicture(photo :Photo){
    const base64Data = await this.readAsBase64(photo)

    const fileName = Date.now() + '.jpeg'
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    })

    return {
      filePath: fileName,
      webviewPath: photo.webPath
    }
  }

  public async addNewPhoto(){
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100
    })

    const savedImageFile = await this.savePicture(capturedPhoto);
    this.photos.unshift(savedImageFile)

    Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos)
    })
  }

  public async loadSaved(){
    const { value } = await Preferences.get({key: this.PHOTO_STORAGE});
    this.photos = (value ? JSON.parse(value) : []) as UserPhoto[];

    for(let photo of this.photos){
      const readFile = await Filesystem.readFile({
        path: photo.filePath,
        directory: Directory.Data
      })

      photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`
    }
  }
}

export interface UserPhoto{
  filePath :string,
  webviewPath? :string
}