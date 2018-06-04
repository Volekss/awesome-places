import { Component } from '@angular/core';
import {NgForm} from "@angular/forms";
import {LoadingController, ModalController, ToastController} from "ionic-angular";
import {SetLocationPage} from "../set-location/set-location";
import {Location} from "../../models/location";
import {Geolocation} from "@ionic-native/geolocation";
import {File} from "@ionic-native/file";
import {Camera, CameraOptions} from "@ionic-native/camera";
import {PlacesService} from "../../services/places";

declare var cordova: any;

@Component({
  selector: 'page-add-place',
  templateUrl: 'add-place.html',
})
export class AddPlacePage {
  location: Location = {
    lat: 40.7624324,
    lng: -73.9759827
  };
  isLocationSet = false;
  imageURL = '';



  constructor(private modalCtrl: ModalController, private geolocation: Geolocation, private camera: Camera,
              private loadingCtrl: LoadingController, private toastCtrl: ToastController,
              private placesService: PlacesService, private file: File) {}

  onSubmit(form: NgForm) {
    const values = form.value;
    this.placesService.addPlace(values.title, values.description, this.location, this.imageURL);
    form.reset();
    this.location = {
      lat: 40.7624324,
      lng: -73.9759827
    };
    this.imageURL = '';
    this.isLocationSet = false;
  }

  onOpenMap() {
    const modal = this.modalCtrl.create(SetLocationPage, {location: this.location, isSet: this.isLocationSet});
    modal.present();
    modal.onDidDismiss(
      data => {
        if (data) {
          this.location = data.location;
          this.isLocationSet = true;
        }
      }
    );
  }

  onLocate() {
    const loader = this.loadingCtrl.create({
      content: 'Getting your location...'
    });
    loader.present();
    this.geolocation.getCurrentPosition().then((resp) => {
      loader.dismiss();
      this.location.lat = resp.coords.latitude;
      this.location.lng = resp.coords.longitude;
      this.isLocationSet = true;
    }).catch((error) => {
      loader.dismiss();

      const toast = this.toastCtrl.create({
        message: 'Couldn\'t get location, please pick it manually!',
        duration: 2500
      });
      toast.present();
      console.log('Error getting location', error);
    });
  }

  onTakePhoto() {
    const options: CameraOptions = {
      quality: 50,
      destinationType: this.camera.DestinationType.FILE_URI,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE
    };

    this.camera.getPicture(options).then((imageData) => {
      const currentName = imageData.replace(/^.*[\\\/]/, '');
      const path = imageData.replace(/[^\/]*$/, '');
      const newFileName = new Date().getUTCMilliseconds() + '.jpg';
      this.file.moveFile(path, currentName, cordova.file.dataDirectory, newFileName)
        .then(
          data => {
            this.imageURL = data.nativeURL;
            this.file.removeFile(path, currentName);
          }
        )
        .catch(
          err => {
            this.imageURL = '';
            this.toastCtrl.create({
              message: 'Could not take the image. Please try again',
              duration: 2500
            }).present();
            this.camera.cleanup();
          }
        );
      this.imageURL = imageData;
    }, (err) => {
      const toast = this.toastCtrl.create({
        message: err,
        duration: 2500
      });
      toast.present();
    });

  }


}
