
// hook.ts
import { useCallback, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import {BaseDto, MessageHandler, WebSocketHookResult} from './types';
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

    const sendRequest = useCallback(async <
        TReq, TEReq extends string,
        TRes, TERes extends string
    >(
        dto: BaseDto<TReq, TEReq>,
        timeoutMs: number = 5000
    ): Promise<BaseDto<TRes, TERes>> => {
        if (readyState !== ReadyState.OPEN) {
            throw new Error('WebSocket is not connected');
        }

        const requestId = crypto.randomUUID();

        const promise = new Promise<BaseDto<TRes, TERes>>((resolve, reject) => {
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

    const onMessage = useCallback(<T, E extends string>(
        eventType: E,
        handler: MessageHandler<T, E>
    ) => {
        if (!globalMessageHandlers.has(eventType)) {
            globalMessageHandlers.set(eventType, new Set());
        }

        // Type assertion here since we know the handler is compatible
        const handlers = globalMessageHandlers.get(eventType)! as Set<MessageHandler<T, E>>;
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