import { Injectable } from '@angular/core';

import { AngularFireDatabaseModule, AngularFireDatabase } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';

import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

declare var firebase: any;

@Injectable()
export class AuthService {
  authState: any = null;
  constructor(private af: AngularFireAuth,
              private db: AngularFireDatabase) { }

  //// Social Auth ////
  githubLogin() {
    const provider = new firebase.auth.GithubAuthProvider()
    return this.socialSignIn(provider);
  }

  googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider()
    return this.socialSignIn(provider);
  }

  facebookLogin() {
    const provider = new firebase.auth.FacebookAuthProvider()
    return this.socialSignIn(provider);
  }

  twitterLogin(){
    const provider = new firebase.auth.TwitterAuthProvider()
    return this.socialSignIn(provider);
  }

  private socialSignIn(provider) {
    return this.af.auth.signInWithPopup(provider)
      .then((credential) =>  {
          this.authState = credential.user;
      })
      .catch(error => console.log(error));
  }

  //// Email/Password Auth ////
  emailSignUp(email: string, password: string) {
    return this.af.auth.createUserWithEmailAndPassword(email, password)
      .then((user) => {
        this.authState = user;
      })
      .catch(error => console.log(error));
  }

  emailLogin(email:string, password:string) {
     return this.af.auth.signInWithEmailAndPassword(email, password)
       .then((user) => {
         this.authState = user;
       })
       .catch(error => console.log(error));
  }

  // Sends email allowing user to reset password
  resetPassword(email: string) {
    const auth = firebase.auth();

    return auth.sendPasswordResetEmail(email)
      .then(() => console.log('email sent'))
      .catch((error) => console.log(error));
  }

  //// Anonymous Auth ////
  anonymousLogin() {
    return this.af.auth.signInAnonymously()
    .then((user) => {
      return user.uid;
    })
    .catch(error => console.log(error));
  }

  //// Sign Out ////
  signOut(): void {
    this.af.auth.signOut();
  }
}
