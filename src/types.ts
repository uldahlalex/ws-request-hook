// types.ts
export abstract class BaseDto {
    readonly eventType: string;

    protected constructor() {
        // Get the class name as the eventType
        this.eventType = this.constructor.name;
    }
}

export interface WebSocketHookResult {
    sendRequest: <TReq extends BaseDto, TRes extends BaseDto>(
        request: TReq,
        timeoutMs?: number
    ) => Promise<TRes>;

    onMessage: <T extends BaseDto>(
        messageType: new (...args: any[]) => T,
        handler: (message: T) => void
    ) => () => void;

    readyState: number;
}

export type PendingRequest = {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: number;
};