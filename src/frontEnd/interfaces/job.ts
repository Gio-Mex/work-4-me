import type { User } from "./user";
import type { Offer } from "./offer";

export interface Job {
  _id?: string;
  category: string;
  title: string;
  description: string;
  offers?: Array<Offer>;
  amount: number;
  address: string;
  city: string;
  date: number;
  userId: any;
  userDetails?: User;
  status: string;
  notification: boolean;
  workerId?: any;
  workerDetails?: User;
  evaluated?: boolean;
}