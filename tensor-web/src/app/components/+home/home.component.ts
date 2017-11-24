import {
  Component, Input, ElementRef, AfterViewInit, OnInit, ViewChild
} from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material';

// import { FirebaseApp } from 'angularfire2'; // for methods
// // import * as firebase from 'firebase'; // for typings
// import { AngularFirestore } from 'angularfire2/firestore';
// import { AngularFireAuth } from 'angularfire2/auth';

import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/operator/pairwise';
import 'rxjs/add/operator/switchMap';

import { ImagesService} from '../../services/images.service';
import { AuthService} from '../../services/auth.service';

import { environment } from '../../../environments/environment';

declare var firebase: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit {

  @ViewChild('myBoard') public canvas: ElementRef;
  @ViewChild('downloadButton') public downloadButton: ElementRef;

  @Input() public width = 400;
  @Input() public height = 400;

  items: any;

  auth: any;
  database: any;
  storage: any;

  authState: any;
  maxValue: any;

  // categoryList = ['duck', 'smile', 'car', 'pencil', 'star', 'burger', 'cookie', 'rabbit', 'moon', 'icecream'];
  categoryList = ['smile', 'car', 'pencil', 'burger', 'moon', 'hand', 'tornado', 'scissors', 'mug', 'sock' ];
  target: String;
  bannerMessage: String;
  currentTimer;
  initTimer;
  stopChrono: Boolean = true;
  chronoInterval;

  private cx: CanvasRenderingContext2D;

  constructor(
    private imagesService: ImagesService,
    public snackBar: MatSnackBar
    // private authService: AuthService,
    // private fb: FirebaseApp,
    // private ngstore: AngularFirestore,
    // private af: AngularFireAuth
  ) { }


  public ngOnInit() {
    // this.items = this.ngstore.collection('items').valueChanges();
    // this.initFirebase();
    // this.initTarget();
    // this.initChronometer();
  }


  public initFirebase() {
    // firebase.initializeApp(environment.firebase);

    // Get a reference to the storage service, which is used to create references in your storage bucket
    // this.auth = firebase.auth();
    // this.database = firebase.database();
    // this.storage = firebase.storage();
    // this.authService.anonymousLogin();
    // this.af.authState.subscribe((auth) => {
    //   this.authState = auth;
    // });
  }

  public ngAfterViewInit() {
    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
    this.initCanvasSize();
    this.cx = canvasEl.getContext('2d');
    this.cx.lineCap = 'round';
    this.cx.strokeStyle = '#000';
    this.cx.lineWidth = 10;
    this.captureEvents(canvasEl);
  }

  initTarget() {
    const pos = Math.round(Math.random() * (this.categoryList.length - 1));
    console.log('pos' + pos);
    this.target = this.categoryList[pos];
    this.bannerMessage = '...';
    this.initTimer = Date.now();
    this.initChronometer();
    this.onClearCanvas();
  }

  initChronometer() {
    const self = this;
    self.chronoInterval = setInterval(() => {
      if (!self.stopChrono) {
        self.currentTimer = Date.now() - self.initTimer;
      }
    }, 1000);
    self.stopChrono = false;
  }

  initCanvasSize() {
    this.canvas.nativeElement.width = window.innerWidth * 0.84;
    this.canvas.nativeElement.height = window.innerWidth * 0.84;
  }

  onClearCanvas() {
    const c = this.canvas.nativeElement;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.beginPath();
  }

  onResizeCanvas() {
    this.initCanvasSize();
  }

  private captureEvents(canvasEl: HTMLCanvasElement) {
    const self = this;
    const eventUp = Observable.fromEvent(canvasEl, 'mouseup');

    Observable
      .fromEvent(canvasEl, 'mousedown')
      .switchMap((e) => {
        return Observable
          .fromEvent(canvasEl, 'mousemove')
          .takeUntil(eventUp)
          .pairwise();
      })
      .subscribe((res: [MouseEvent, MouseEvent]) => {
        const rect = canvasEl.getBoundingClientRect();
        const prevPos = {
          x: res[0].clientX - rect.left,
          y: res[0].clientY - rect.top
        };
        const currentPos = {
          x: res[1].clientX - rect.left,
          y: res[1].clientY - rect.top
        };
        this.drawOnCanvas(prevPos, currentPos);
      });

      eventUp.subscribe( event => {
        console.log('eventUp');
        const dataURL = this.canvas.nativeElement.toDataURL('image/png');
        self.imagesService.sendImage(dataURL)
        .subscribe(result => {
          console.log('prediction: ' + result.prediction);
          self.maxValue = self.categoryList[self.getHighestValuePosition(result.prediction)];
          // config.duration = 2000;
          // self.snackBar.open(self.maxValue, 'close', self.getMessageConfig(self.target, self.maxValue));
          self.bannerMessage = self.checkPrediction(self.target, self.maxValue);
        });
      });
  }

  checkPrediction( target, prediction) {
    this.stopChrono = (target === prediction);
    return this.stopChrono ? 'Mmm... I know, it is ' + target : 'Could be ' + prediction + '?';
  }

  getMessageConfig( target, prediction) {
    const config = new MatSnackBarConfig();
    config.extraClasses = ['custom-class'];
    return config;
  }

  private getHighestValuePosition(list) {
    let maxValue = 0;
    list.forEach(value => {
      if (value > maxValue) {
        maxValue = value;
      }
    });
    return list.indexOf(maxValue);
  }

  private drawOnCanvas(prevPos: { x: number, y: number }, currentPos: { x: number, y: number }) {
    if (!this.cx) { return; }

    this.cx.beginPath();

    if (prevPos) {
      this.cx.moveTo(prevPos.x, prevPos.y); // from
      this.cx.lineTo(currentPos.x, currentPos.y);
      this.cx.stroke();
    }
  }

  ngOnDestroy() {
    if (this.chronoInterval) {
      clearInterval(this.chronoInterval);
    }
  }

}
