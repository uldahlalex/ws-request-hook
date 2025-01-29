import {useCallback, useEffect, useRef, useState} from 'react';

export interface BaseDto {
    eventType?: string;
    requestId?: string;
    error?: string;
}

const globalMessageHandlers = new Map<string, Set<(message: BaseDto) => void>>();
const pendingRequests = new Map<string, {
    resolve: (value: BaseDto) => void,
    reject: (reason: any) => void,
    timeout: NodeJS.Timeout
}>();

const REQUEST_TIMEOUT = 5000;

export function removeDto(eventType: string): string {
    return eventType.replace(/Dto$/, '');
}

export function compareEventTypes(type1: string, type2: string): boolean {
    return removeDto(type1) === removeDto(type2);
}

function getOrCreateHandlerSet(eventType: string): Set<(message: BaseDto) => void> {
    let handlers = globalMessageHandlers.get(eventType);
    if (!handlers) {
        handlers = new Set();
        globalMessageHandlers.set(eventType, handlers);
    }
    return handlers;
}

function handleBroadcastMessage(message: BaseDto) {
    // First normalize the message to handle case-insensitive properties
    const normalizedMessage = {
        ...message,
        requestId: (message as any).RequestId || message.requestId,
        eventType: message.eventType
    };

    console.log('Normalized message:', normalizedMessage);

    if (normalizedMessage.requestId && pendingRequests.has(normalizedMessage.requestId)) {
        return handlePendingRequest(normalizedMessage);
    }

    console.log('Searching for handlers for message type:', normalizedMessage.eventType);
    console.log('Current registered handlers:', Array.from(globalMessageHandlers.keys()));

    const matchingHandlerEntry = Array.from(globalMessageHandlers.entries())
        .find(([handlerEventType]) => {
            const matches = compareEventTypes(handlerEventType, normalizedMessage.eventType!);
            console.log(`Comparing: "${handlerEventType}" with "${normalizedMessage.eventType}" => ${matches}`);
            return matches;
        });

    if (!matchingHandlerEntry) {
        console.log('No handlers registered for message type:', normalizedMessage.eventType);
        return;
    }

    const [, handlers] = matchingHandlerEntry;
    handlers.forEach(handler => handler(normalizedMessage));
}

function handlePendingRequest(message: BaseDto) {
    console.log('Handling pending request:', message);
    console.log('Current pending requests:', Array.from(pendingRequests.keys()));

    const requestId = message.requestId!;
    const pendingRequest = pendingRequests.get(requestId);

    if (!pendingRequest) {
        console.error('No pending request found for ID:', requestId);
        return;
    }

    const { resolve, reject, timeout } = pendingRequest;
    clearTimeout(timeout);

    if (message.error) {
        console.error('Request failed with error:', message.error);
        reject(new Error(message.error));
    } else {
        console.log('Resolving request with response:', message);
        resolve(message as BaseDto);
    }
    pendingRequests.delete(requestId);
}

function removeHandler(eventType: string, handler: (message: BaseDto) => void) {
    const handlers = globalMessageHandlers.get(eventType);
    if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
            globalMessageHandlers.delete(eventType);
        }
    }
}

export function useWebSocketWithRequests(url: string) {
    const [readyState, setReadyState] = useState<number>(0);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        const socket = new WebSocket(url);
        ws.current = socket;

        socket.onopen = () => {
            console.log('WebSocket connected');
            setReadyState(socket.readyState);
        };

        socket.onclose = () => {
            console.log('WebSocket disconnected');
            setReadyState(socket.readyState);
        };

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log('Received WebSocket message:', message);
            handleBroadcastMessage(message);
        };

        return () => {
            pendingRequests.forEach(({reject, timeout}) => {
                clearTimeout(timeout);
                reject(new Error('WebSocket closed'));
            });
            pendingRequests.clear();
            socket.close();
        };
    }, [url]);

    const sendRequest = useCallback(<T extends BaseDto, R extends BaseDto>(request: T): Promise<R> => {
        return new Promise((resolve, reject) => {
            if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket is not connected'));
                return;
            }

            const timeout = setTimeout(() => {
                pendingRequests.delete(request.requestId!);
                reject(new Error('Request timed out'));
            }, REQUEST_TIMEOUT);

            pendingRequests.set(request.requestId!, {
                resolve: resolve as (value: BaseDto) => void,
                reject,
                timeout
            });

            ws.current.send(JSON.stringify(request));
        });
    }, []);

    const onMessage = useCallback(<T extends BaseDto>(
        eventType: string,
        handler: (message: T) => void
    ) => {
        const normalizedEventType = removeDto(eventType);
        console.log('Registering handler for normalized event type:', normalizedEventType);
        const handlers = getOrCreateHandlerSet(normalizedEventType);
        handlers.add(handler as (message: BaseDto) => void);

        return () => removeHandler(normalizedEventType, handler as (message: BaseDto) => void);
    }, []);

    return {
        sendRequest,
        onMessage,
        readyState
    };
}