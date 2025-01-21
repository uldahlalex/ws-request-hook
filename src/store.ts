// store.ts
import {BaseDto, PendingRequest} from './types';

export const globalMessageHandlers = new Map<
    string,
    Set<(message: BaseDto) => void>
>();

export const pendingRequests = new Map<string, PendingRequest>();