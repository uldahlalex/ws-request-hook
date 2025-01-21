// store.ts
import { BaseDto, MessageHandler } from './types';

// Or alternatively, make it fully generic:
export const globalMessageHandlers = new Map<
    string,
    Set<MessageHandler<unknown, string>>
>();

export const pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: number;
}>();