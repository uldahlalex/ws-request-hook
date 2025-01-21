import { BaseDto, MessageHandler } from './types';

export const globalMessageHandlers = new Map<string, Set<MessageHandler<any>>>();

export const pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: number;  // Changed from NodeJS.Timeout to number
}>();