import {BaseDto} from "./hook";


export interface WebSocketHookResult {
    sendRequest: <TReq extends BaseDto, TRes extends BaseDto>(
        request: TReq,
        timeoutMs?: number
    ) => Promise<TRes>;

    onMessage: <T extends BaseDto>(
        eventType: string,
        handler: (message: T) => void
    ) => () => void;

    readyState: number;
}

export type PendingRequest = {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: number;
};