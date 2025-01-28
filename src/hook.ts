// hook.ts
import { useCallback, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { BaseDto, WebSocketHookResult } from './types';
import { globalMessageHandlers, pendingRequests } from './store';
export function normalizeEventType(eventType: string): string {
    // Convert to lower case and remove 'dto' suffix if present
    return eventType.toLowerCase().replace(/dto$/, '');
}

export function normalizeMessage(message: any): any {
    // Create a new object with normalized keys and values
    return Object.entries(message).reduce((acc, [key, value]) => {
        // Convert first character to lowercase for camelCase
        const normalizedKey = key.charAt(0).toLowerCase() + key.slice(1);
        return {
            ...acc,
            [normalizedKey]: value
        };
    }, {});
}

export function eventTypesMatch(type1: string, type2: string): boolean {
    return normalizeEventType(type1) === normalizeEventType(type2);
}

export function useWebSocketWithRequests(url: string): WebSocketHookResult {
    const { sendMessage, lastMessage, readyState } = useWebSocket(url, {
        share: true,
        retryOnError: true,
        shouldReconnect: () => true,
    });


    useEffect(() => {
        if (lastMessage) {
            try {
                const rawMessage = JSON.parse(lastMessage.data);
                const message = normalizeMessage(rawMessage);
                console.log('Received WebSocket message (normalized):', message);

                if (!message.eventType) {
                    console.error('Received message without eventType:', message);
                    return;
                }

                // Handle responses to requests
                if (message.requestId && pendingRequests.has(message.requestId)) {
                    console.log('Processing request response for requestId:', message.requestId);
                    const { resolve, reject, timeout } = pendingRequests.get(message.requestId)!;
                    clearTimeout(timeout);

                    if (message.error) {
                        console.error('Request failed with error:', message.error);
                        reject(new Error(message.error));
                    } else {
                        console.log('Resolving request with response:', message);

                        const responseDto = {
                            ...message,
                            eventType: message.eventType
                        } as BaseDto;

                        resolve(responseDto);
                    }

                    pendingRequests.delete(message.requestId);
                    return;
                }

                // Handle broadcast messages
                // Find any handler where the normalized event types match
                const matchingHandlerEntry = Array.from(globalMessageHandlers.entries())
                    .find(([handlerEventType]) =>
                        eventTypesMatch(handlerEventType, message.eventType)
                    );

                if (matchingHandlerEntry) {
                    const [_, handlers] = matchingHandlerEntry;
                    console.log('Processing broadcast message of type:', message.eventType);

                    const eventDto = {
                        ...message,
                    } as BaseDto;

                    handlers.forEach(handler => {
                        try {
                            handler(eventDto);
                        } catch (handlerError) {
                            console.error('Error in message handler:', handlerError);
                        }
                    });
                } else {
                    console.log('No handlers registered for message type:', message.eventType);
                }
            } catch (error) {
                console.error('Failed to parse or process WebSocket message:', error);
            }
        }
    }, [lastMessage]);
    const sendRequest = useCallback(async <TReq extends BaseDto, TRes extends BaseDto>(
        request: TReq,
        timeoutMs: number = 5000
    ): Promise<TRes> => {
        if (readyState !== ReadyState.OPEN) {
            throw new Error('WebSocket is not connected');
        }

        const requestId = crypto.randomUUID();
        const normalizedRequest = normalizeMessage({
            ...request,
            requestId
        });

        const promise = new Promise<TRes>((resolve, reject) => {
            const timeout = setTimeout(() => {
                pendingRequests.delete(requestId);
                reject(new Error('Request timed out'));
            }, timeoutMs) as unknown as number;

            pendingRequests.set(requestId, { resolve, reject, timeout });
        });

        sendMessage(JSON.stringify(normalizedRequest));

        return promise;
    }, [sendMessage, readyState]);
    const onMessage = useCallback(<T extends BaseDto>(
        messageType: new (...args: any[]) => T,
        handler: (message: T) => void
    ) => {
        const eventType = new messageType().eventType;
        const normalizedEventType = normalizeEventType(eventType);

        if (!globalMessageHandlers.has(normalizedEventType)) {
            globalMessageHandlers.set(normalizedEventType, new Set());
        }

        const handlers = globalMessageHandlers.get(normalizedEventType)!;
        handlers.add(handler as (message: BaseDto) => void);

        return () => {
            handlers.delete(handler as (message: BaseDto) => void);
            if (handlers.size === 0) {
                globalMessageHandlers.delete(normalizedEventType);
            }
        };
    }, []);

    return {
        sendRequest,
        onMessage,
        readyState
    };
}

export { ReadyState };