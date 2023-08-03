import { Injectable, ɵNOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR } from '@angular/core';

import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  public photos :UserPhoto[];
  public PHOTO_STORAGE :string;
  private platform :Platform;

  constructor(platform :Platform) {
    this.photos = []
    this.PHOTO_STORAGE = 'photos'
    this.platform = platform
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
    if(this.platform.is('hybrid')){
      const file = await Filesystem.readFile({
        path: photo.path!
      })

      return file.data
    }
    else{
      const response = await fetch(photo.webPath!)
      const blob = await response.blob()

      return await this.convertBlobToBase64(blob) as string;
    }
  }

  private async savePicture(photo :Photo){
    const base64Data = await this.readAsBase64(photo)

    const fileName = Date.now() + '.jpeg'
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    })

    if(this.platform.is('hybrid')){
      return {
        filePath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri)
      }
    }
    else{
      return {
        filePath: fileName,
        webviewPath: photo.webPath
      }
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

    if(!this.platform.is('hybrid')){
      for(let photo of this.photos){
        const readFile = await Filesystem.readFile({
          path: photo.filePath,
          directory: Directory.Data
        })

        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`
      }
    }
  }
}

export interface UserPhoto{
  filePath :string,
  webviewPath? :string
}