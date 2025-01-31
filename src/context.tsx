import React, { createContext, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useWebSocketWithRequests, WsHookResult } from './hook';
import { BaseDto } from './types';

// Context using the imported WsHookResult type
const WsClientContext = createContext<WsHookResult | null>(null);

// Provider Props
interface WsClientProviderProps {
    url: string;
    children: ReactNode;
}

// Provider Component
export function WsClientProvider({ url, children }: WsClientProviderProps) {
    const ws = useWebSocketWithRequests(url);
    return <WsClientContext.Provider value={ws}>{children}</WsClientContext.Provider>;
}

// Main hook to access WebSocket client
export function useWsClient(): WsHookResult {
    const context = useContext(WsClientContext);
    if (!context) {
        throw new Error('useWsClient must be used within a WsClientProvider');
    }
    return context;
}

// Subscription hook
export function useWsSubscription<T extends BaseDto>(
    eventType: string,
    handler: (message: T) => void
) {
    const { onMessage } = useWsClient();

    useEffect(() => {
        const unsubscribe = onMessage<T>(eventType, handler);
        return () => unsubscribe();
    }, [eventType, handler, onMessage]);
}

// Request hook
export function useWsRequest<TReq extends BaseDto, TRes extends BaseDto>() {
    const { sendRequest } = useWsClient();
    return useCallback(
        (request: TReq, expectedResponseEventType: string, timeoutMs?: number) =>
            sendRequest<TReq, TRes>(request, expectedResponseEventType, timeoutMs),
        [sendRequest]
    );
}

// Export everything that should be available to consumers
export type { WsHookResult };