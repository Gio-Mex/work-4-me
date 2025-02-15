import type { Message } from "./message";

export interface Chat {
  jobId: string;
  userId: string;
  workerId: string;
  messages: Array<Message>;
}