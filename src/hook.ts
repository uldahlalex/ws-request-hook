// hook.ts
import { useCallback, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { BaseDto, WebSocketHookResult } from './types';
import { globalMessageHandlers, pendingRequests } from './store';

export function useWebSocketWithRequests(url: string): WebSocketHookResult {
    const { sendMessage, lastMessage, readyState } = useWebSocket(url, {
        share: true,
        retryOnError: true,
        shouldReconnect: () => true,
    });

    useEffect(() => {
        if (lastMessage) {
            try {
                const message = JSON.parse(lastMessage.data);

                if (!message.eventType) {
                    console.error('Received message without eventType:', message);
                    return;
                }

                if (message.requestId && pendingRequests.has(message.requestId)) {
                    const { resolve, reject, timeout } = pendingRequests.get(message.requestId)!;
                    clearTimeout(timeout);

                    if (message.error) {
                        reject(new Error(message.error));
                    } else {
                        // Create instance of the response DTO
                        const responseDto = Object.assign(Object.create(BaseDto.prototype), message);
                        resolve(responseDto);
                    }

                    pendingRequests.delete(message.requestId);
                    return;
                }

                const handlers = globalMessageHandlers.get(message.eventType);
                if (handlers) {
                    // Create instance of the event DTO
                    const eventDto = Object.assign(Object.create(BaseDto.prototype), message);
                    handlers.forEach(handler => handler(eventDto));
                }
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
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

        const promise = new Promise<TRes>((resolve, reject) => {
            const timeout = setTimeout(() => {
                pendingRequests.delete(requestId);
                reject(new Error('Request timed out'));
            }, timeoutMs) as unknown as number;

            pendingRequests.set(requestId, { resolve, reject, timeout });
        });

        sendMessage(JSON.stringify({
            ...request,
            requestId
        }));

        return promise;
    }, [sendMessage, readyState]);

    const onMessage = useCallback(<T extends BaseDto>(
        messageType: new (...args: any[]) => T,
        handler: (message: T) => void
    ) => {
        const eventType = new messageType().eventType;

        if (!globalMessageHandlers.has(eventType)) {
            globalMessageHandlers.set(eventType, new Set());
        }

        const handlers = globalMessageHandlers.get(eventType)!;
        handlers.add(handler as (message: BaseDto) => void);

        return () => {
            handlers.delete(handler as (message: BaseDto) => void);
            if (handlers.size === 0) {
                globalMessageHandlers.delete(eventType);
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