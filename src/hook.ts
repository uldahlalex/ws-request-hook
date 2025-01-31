import {useCallback, useEffect, useRef, useState} from 'react';
import {BaseDto} from "./types";


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

export function normalizeEventType(eventType: string | undefined): string {
    if (!eventType) return '';
    return eventType
        .toLowerCase()
        .replace(/dto$/i, '')  // Remove 'dto' or 'Dto' or 'DTO' from end
        .replace(/[^a-z0-9]/g, ''); // Remove all non-alphanumeric characters
}

export function compareEventTypes(type1: string | undefined, type2: string | undefined): boolean {
    return normalizeEventType(type1) === normalizeEventType(type2);
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
    const normalizedMessage = {
        ...message,
        requestId: (message as any).RequestId || message.requestId,
        eventType: message.eventType || (message as any).EventType // Handle potential Pascal case
    };

    if (normalizedMessage.requestId && pendingRequests.has(normalizedMessage.requestId)) {
        return handlePendingRequest(normalizedMessage);
    }

    const matchingHandlerEntry = Array.from(globalMessageHandlers.entries())
        .find(([handlerEventType]) =>
            compareEventTypes(handlerEventType, normalizedMessage.eventType));

    if (!matchingHandlerEntry) {
        return;
    }

    const [, handlers] = matchingHandlerEntry;
    handlers.forEach(handler => handler(normalizedMessage));
}


function handlePendingRequest(message: BaseDto) {

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
            setReadyState(socket.readyState);
        };

        socket.onclose = () => {
            setReadyState(socket.readyState);
        };

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
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

            const enrichedRequest = {
                ...request,
                requestId: request.requestId || crypto.randomUUID()
            };

            const timeout = setTimeout(() => {
                pendingRequests.delete(enrichedRequest.requestId);
                reject(new Error('Request timed out'));
            }, REQUEST_TIMEOUT);

            pendingRequests.set(enrichedRequest.requestId, {
                resolve: resolve as (value: BaseDto) => void,
                reject,
                timeout
            });

            ws.current.send(JSON.stringify(enrichedRequest));
        });
    }, []);

    const onMessage = useCallback(<T extends BaseDto>(
        eventType: string,
        handler: (message: T) => void
    ) => {
        // Store with normalized event type
        const normalizedEventType = normalizeEventType(eventType);
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