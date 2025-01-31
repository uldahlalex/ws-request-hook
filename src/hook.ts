import { useCallback, useEffect, useRef, useState } from 'react';
import { BaseDto } from "./types";

// In hook.ts
export interface WsHookResult {
    readyState: number;
    sendRequest: <
        TReq extends BaseDto,
        TRes extends BaseDto>(
        request: TReq,
        expectedResponseEventType: string,
        timeoutMs?: number
    ) => Promise<TRes>;
    onMessage: <T extends BaseDto>(
        eventType: string,
        handler: (message: T) => void
    ) => () => void;
}


interface PendingRequest {
    resolve: (value: BaseDto) => void;
    reject: (reason: any) => void;
    timeout: NodeJS.Timeout;
    expectedResponseEventType: string;
}

// Constants
const REQUEST_TIMEOUT = 5000;

// Global State
const globalMessageHandlers = new Map<string, Set<(message: BaseDto) => void>>();
const pendingRequests = new Map<string, PendingRequest>();

// Utility Functions
export function removeDto(eventType: string): string {
    return eventType.replace(/Dto$/, '');
}

export function normalizeEventType(eventType: string | undefined): string {
    if (!eventType) return '';
    return eventType
        .toLowerCase()
        .replace(/dto$/i, '')
        .replace(/[^a-z0-9]/g, '');
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

function removeHandler(eventType: string, handler: (message: BaseDto) => void) {
    const handlers = globalMessageHandlers.get(eventType);
    if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
            globalMessageHandlers.delete(eventType);
        }
    }
}

function handlePendingRequest(message: BaseDto) {
    const requestId = message.requestId!;
    const pendingRequest = pendingRequests.get(requestId);

    if (!pendingRequest) {
        console.error('No pending request found for ID:', requestId);
        return;
    }

    const { resolve, reject, timeout, expectedResponseEventType } = pendingRequest;
    clearTimeout(timeout);

    if (!compareEventTypes(expectedResponseEventType, message.eventType)) {
        // If it's not the expected type, just pass through the message
        reject(message);
        pendingRequests.delete(requestId);
        return;
    }

    if (message.error) {
        reject(message); // Pass through the raw message
    } else {
        resolve(message as BaseDto);
    }
    pendingRequests.delete(requestId);
}

function handleBroadcastMessage(message: BaseDto) {
    const normalizedMessage = {
        ...message,
        requestId: (message as any).RequestId || message.requestId,
        eventType: message.eventType || (message as any).EventType
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

// Main Hook
export function useWebSocketWithRequests(url: string): WsHookResult {
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

    const sendRequest = useCallback(<TReq extends BaseDto, TRes extends BaseDto>(
        request: TReq,
        expectedResponseEventType: string,
        timeoutMs: number = REQUEST_TIMEOUT
    ): Promise<TRes> => {
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
            }, timeoutMs);

            pendingRequests.set(enrichedRequest.requestId, {
                resolve: resolve as (value: BaseDto) => void,
                reject,
                timeout,
                expectedResponseEventType
            });

            ws.current.send(JSON.stringify(enrichedRequest));
        });
    }, []);

    const onMessage = useCallback(<T extends BaseDto>(
        eventType: string,
        handler: (message: T) => void
    ) => {
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