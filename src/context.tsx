// src/context.tsx
import React, { createContext, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useWebSocketWithRequests } from './hook';
import { BaseDto } from './types';

export interface WsClientContextType {
    readyState: number;
    sendRequest: <TRequest extends BaseDto, TResponse extends BaseDto>(
        request: TRequest
    ) => Promise<TResponse>;
    onMessage: <T extends BaseDto>(
        eventType: string,
        callback: (data: T) => void
    ) => () => void;
}

const WsClientContext = createContext<WsClientContextType | null>(null);

interface WsClientProviderProps {
    url: string;
    children: ReactNode;
}

export function WsClientProvider({ url, children }: WsClientProviderProps) {
    const ws = useWebSocketWithRequests(url);
    return <WsClientContext.Provider value={ws}>{children}</WsClientContext.Provider>;
}

export function useWsClient() {
    const context = useContext(WsClientContext);
    if (!context) {
        throw new Error('useWsClient must be used within a WsClientProvider');
    }
    return context;
}

// Helper hooks
export function useWsSubscription<T extends BaseDto>(
    eventType: string,
    callback: (data: T) => void
) {
    const { onMessage } = useWsClient();

    useEffect(() => {
        const unsubscribe = onMessage<T>(eventType, callback);
        return () => unsubscribe();
    }, [eventType, callback, onMessage]);
}

export function useWsRequest<TRequest extends BaseDto, TResponse extends BaseDto>() {
    const { sendRequest } = useWsClient();
    return useCallback(
        (request: TRequest) => sendRequest<TRequest, TResponse>(request),
        [sendRequest]
    );
}