
export interface BaseDto {
    eventType?: string;
    requestId?: string;
    error?: string;
}


export interface WebSocketHookResult {
    sendRequest: <TReq extends BaseDto, TRes extends BaseDto>(
        request: TReq,
        expectedResponseEventType: string,
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