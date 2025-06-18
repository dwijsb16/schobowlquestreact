import {User} from './user';
export interface Player extends User {
    grade: string;
    linkedUsers: string[];
  }