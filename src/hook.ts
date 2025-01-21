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

                if (message.requestId && pendingRequests.has(message.requestId)) {
                    const { resolve, reject, timeout } = pendingRequests.get(message.requestId)!;
                    clearTimeout(timeout);

                    if (message.error) {
                        reject(new Error(message.error));
                    } else {
                        resolve(message);
                    }

                    pendingRequests.delete(message.requestId);
                    return;
                }

                if (message.eventType) {
                    const handlers = globalMessageHandlers.get(message.eventType);
                    if (handlers) {
                        handlers.forEach(handler => handler(message));
                    }
                }
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        }
    }, [lastMessage]);

    const sendRequest = useCallback(async <TRequest extends BaseDto, TResponse extends BaseDto>(
        dto: TRequest,
        timeoutMs: number = 5000
    ): Promise<TResponse> => {
        if (readyState !== ReadyState.OPEN) {
            throw new Error('WebSocket is not connected');
        }

        const requestId = crypto.randomUUID();

        const promise = new Promise<TResponse>((resolve, reject) => {
            const timeout = setTimeout(() => {
                pendingRequests.delete(requestId);
                reject(new Error('Request timed out'));
            }, timeoutMs) as unknown as number;

            pendingRequests.set(requestId, { resolve, reject, timeout });
        });

        sendMessage(JSON.stringify({
            ...dto,
            requestId
        }));

        return promise;
    }, [sendMessage, readyState]);

    const onMessage = useCallback(<T extends BaseDto>(
        eventType: string,
        handler: (message: T) => void
    ) => {
        if (!globalMessageHandlers.has(eventType)) {
            globalMessageHandlers.set(eventType, new Set());
        }

        const handlers = globalMessageHandlers.get(eventType)!;
        handlers.add(handler);

        return () => {
            handlers.delete(handler);
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