import type { Ratings } from "./ratings";

export interface User {
  _id: string;
  name: string;
  lastName: string;
  avatar: string | File;
  address: string;
  city: string;
  province: string;
  email: string;
  password: string;
  isWorker: boolean;
  skills: Array<string>;
  ratings: Ratings;
  notifications: Array<string>;
}