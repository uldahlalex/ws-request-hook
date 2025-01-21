export type BaseDto<T, E extends string> = {
    eventType: E;
} & T;

export type MessageHandler<T, E extends string> = (message: BaseDto<T, E>) => void;

export interface WebSocketHookResult {
    sendRequest: <
        TReq, TEReq extends string,
        TRes, TERes extends string
    >(
        dto: BaseDto<TReq, TEReq>,
        timeoutMs?: number
    ) => Promise<BaseDto<TRes, TERes>>;

    onMessage: <T, E extends string>(
        eventType: E,
        handler: MessageHandler<T, E>
    ) => () => void;

    readyState: number;
}