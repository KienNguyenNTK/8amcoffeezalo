import { authorize, getAccessToken, getPhoneNumber, getUserInfo } from "zmp-sdk";
import axios from "axios";
import { userService } from '../firebase/userService';
import { auth } from "../firebase/config";
import { notification } from "antd";

class AuthService {
  private userInfo: any = null;
  private tokenUserInfo: any = null;
  private tokenPhoneNumber: any = null;
  private phoneNumber: any = null;

  async authorizeLogin() {
    try {
      const data = await authorize({
        scopes: ['scope.userInfo', 'scope.userPhonenumber']
      });
      console.log('authorize: ', data);

      await Promise.all([
        this.getUserPhoneNumber(),
        this.getUser(),
        this.getUserInfoFromToken()
      ]);

      if (this.tokenUserInfo && this.tokenPhoneNumber) {
        await this.getPhoneNumberFromToken();
      }

      if (this.phoneNumber && this.userInfo) {
        return await this.registerUser();
      }

      return null;
    } catch (error) {
      console.log('authorize error: ', error);
      throw error;
    }
  }

  private async getUser() {
    try {
      const { userInfo } = await getUserInfo({
        autoRequestPermission: true,
      });
      this.userInfo = userInfo;
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      console.log('getUserInfo: ', userInfo);
    } catch (error) {
      console.log('getUserInfo error: ', error);
      throw error;
    }
  }

  private async getUserPhoneNumber() {
    try {
      const phoneNumber = await getPhoneNumber();
      console.log('getPhoneNumber: ', phoneNumber);
      let { token } = phoneNumber;
      this.tokenPhoneNumber = token;
    } catch (error) {
      console.log('getPhoneNumber error: ', error);
      throw error;
    }
  }

  private async getUserInfoFromToken() {
    try {
      const userInfo = await getAccessToken();
      console.log('getAccessToken: ', userInfo);
      this.tokenUserInfo = userInfo;
    } catch (error) {
      console.log('getAccessToken error: ', error);
      throw error;
    }
  }

  private async getPhoneNumberFromToken() {
    try {
      const response = await axios.get('https://graph.zalo.me/v2.0/me/info', {
        headers: {
          'access_token': this.tokenUserInfo,
          'code': this.tokenPhoneNumber,
          'secret_key': 'g8RUo6XKj3V7RoSuEom1'
        }
      });

      console.log('Phone number: ', response.data.data.number);
      this.phoneNumber = response.data.data.number;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  private async registerUser() {
    try {
      // // Get Zalo user list to find user_id
      // const lstUser = await axios.get('https://openapi.zalo.me/v3.0/oa/user/getlist?data={"offset":0,"count":15}', {
      //   headers: {
      //     'access_token': import.meta.env.VITE_ACCESS_TOKEN,
      //     'Content-Type': 'application/json'
      //   }
      // });

      // let zaloUserId = '';

      // // Find matching user by name
      // for (const user of lstUser.data.data.users) {
      //   const userDetail = await axios.get(`https://openapi.zalo.me/v3.0/oa/user/detail?data={"user_id":"${user.user_id}"}`, {
      //     headers: {
      //       'access_token': import.meta.env.VITE_ACCESS_TOKEN,
      //       'Content-Type': 'application/json'
      //     }
      //   });

      //   if (userDetail.data.data.display_name.toLowerCase() === this.userInfo.name.toLowerCase()) {
      //     zaloUserId = user.user_id;
      //     break;
      //   }
      // }

      const idUser = localStorage.getItem('idUser');

      if (idUser) {
        const userData = {
          phoneNumber: this.phoneNumber,
          name: this.userInfo.name,
          password: this.userInfo.id,
          zaloUserId: '',
          localId: idUser
        };

        const user = await userService.getUserByLocalId(idUser);

        if (user && user.id) {
          await userService.updateUser(user.id, userData)
            .then((req) => {
              console.log('User updated successfully', req);
              localStorage.setItem('user', JSON.stringify(req));
              return req;
            })
            .catch((error) => {
              console.error('Could not update user:', error);
              throw error;
            });
        }
      }

      else {
        const req = {
          name: this.userInfo.name,
          phoneNumber: this.phoneNumber,
          password: this.userInfo.id,
          zaloUserId: ''
        }

        await userService.createUser(req)
          .then((req) => {
            console.log('User created successfully', req);
            localStorage.setItem('user', JSON.stringify(req));
            return req;
          })
          .catch((error) => {
            console.error('Could not create user:', error);
            throw error;
          });
      }
      return null;
    } catch (error) {
      console.error('Error in user registration:', error);
      throw error;
    }
  }

  async isAuthenticated() {

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('user authService', user);
    if (!user || Object.keys(user).length === 0) {
      return false;
    }
    const firebaseUser = await userService.getUserByPhoneNumber(user.phoneNumber);
    console.log('firebaseUser', firebaseUser);
    return !!user && !!firebaseUser;
  }

  async getAuthenticatedUser() {
    // this.getUser();
    const user = localStorage.getItem('user');
    if (!user) {
      return null;
    }
    const firebaseUser = await userService.getUserByPhoneNumber(JSON.parse(user).phoneNumber);
    if (!firebaseUser) {
      return null;
    }
    return JSON.parse(user);
  }

  async logout() {
    try {
      await auth.signOut();
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }
}

export const authService = new AuthService(); 