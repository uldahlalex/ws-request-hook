// store.ts
import {BaseDto, PendingRequest} from './types';

export const globalMessageHandlers = new Map<
    string,
    Set<(message: BaseDto) => void>
>();

const pendingRequests = new Map<string, {
    resolve: (value: BaseDto) => void,
    reject: (reason: any) => void,
    timeout: NodeJS.Timeout,
    expectedResponseEventType: string
}>();