import {
  Component, Input, ElementRef, AfterViewInit, OnDestroy, ViewChild
} from '@angular/core';

import { Observable } from 'rxjs/Observable';

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
export class HomeComponent implements AfterViewInit, OnDestroy {

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

  categoryList = ['smile', 'car', 'pencil', 'burger', 'moon', 'hand', 'tornado', 'scissors', 'mug', 'sock' ];
  target: String;
  bannerMessage: String;
  currentTimer;
  initTimer;
  stopChrono: Boolean = true;
  chronoInterval;

  private cx: CanvasRenderingContext2D;

  constructor(
    private imagesService: ImagesService
  ) { }


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

    const eventUp = Observable.merge(
      Observable.fromEvent(canvasEl, 'mouseup'),
      Observable.fromEvent(canvasEl, 'touchend'));

    const eventDown = Observable.merge(
      Observable.fromEvent(canvasEl, 'mousedown'),
      Observable.fromEvent(canvasEl, 'touchstart'));

    const eventMove = Observable.merge(
        Observable.fromEvent(canvasEl, 'mousemove'),
        Observable.fromEvent(canvasEl, 'touchmove'));

    eventDown
      .switchMap((e) => {
        return eventMove
                .takeUntil(eventUp)
                .pairwise();
      })
      .subscribe((res: any) => {
        const rect = canvasEl.getBoundingClientRect();
        const isMouseEvent = res[0].type === 'mousemove';
        const prevPos = {
          x: (isMouseEvent ? res[0].clientX : res[0].targetTouches[0].clientX) - rect.left,
          y: (isMouseEvent ? res[0].clientY : res[0].targetTouches[0].clientY) - rect.top
        };
        const currentPos = {
          x: (isMouseEvent ? res[1].clientX : res[1].targetTouches[0].clientX) - rect.left,
          y: (isMouseEvent ? res[1].clientY : res[1].targetTouches[0].clientY) - rect.top
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
          self.bannerMessage = self.checkPrediction(self.target, self.maxValue);
        });
      });
  }

  checkPrediction( target, prediction) {
    this.stopChrono = (target === prediction);
    return this.stopChrono ? 'Mmm... I know, it is ' + target : 'Could be ' + prediction + '?';
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
