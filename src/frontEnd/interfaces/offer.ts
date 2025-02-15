import type { Ratings } from "./ratings";

export interface Offer {
  id: number;
  workerId: string;
  worker: string;
  workerRatings: Ratings | null;
  date: number;
  amount: number;
}