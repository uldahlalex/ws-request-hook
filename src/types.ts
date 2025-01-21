export interface BaseDto {
    eventType: string;
    [key: string]: any;
}

export type MessageHandler<T extends BaseDto> = (message: T) => void;

export interface WebSocketHookResult {
    sendRequest: <TRequest extends BaseDto, TResponse extends BaseDto>(
        dto: TRequest,
        timeoutMs?: number
    ) => Promise<TResponse>;
    onMessage: <T extends BaseDto>(
        eventType: string,
        handler: MessageHandler<T>
    ) => () => void;
    readyState: number;
}