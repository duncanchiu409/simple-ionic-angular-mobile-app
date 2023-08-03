import { Injectable } from '@angular/core';

import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  public photos :UserPhoto[];

  constructor() {
    this.photos = []
  }

  public async addNewPhoto(){
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100
    })

    this.photos.unshift(
      {
        filePath: 'soon ...',
        webviewPath: capturedPhoto.webPath!
      }
    )
  }
}

export interface UserPhoto{
  filePath :string,
  webviewPath? :string
}