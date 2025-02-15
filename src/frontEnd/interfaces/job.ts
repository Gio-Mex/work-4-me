import type { User } from "./user";
import type { Offer } from "./offer";

export interface Job {
  _id?: string;
  category: string;
  title: string;
  description: string;
  offers?: Array<Offer>;
  amount: number;
  date: number;
  userId: any;
  userDetails?: User;
  status: string;
  workerId?: any;
  workerDetails?: User;
  evaluated?: boolean;
}