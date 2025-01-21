import { renderHook, act } from '@testing-library/react';
import { useWebSocketWithRequests, ReadyState } from '../src/hook';
import { TestRequest, TestResponse, createMockMessage } from './utils';
import { MockWebSocket } from './__mocks__/websocket';

describe('useWebSocketWithRequests', () => {
  let mockWs: MockWebSocket;

  beforeEach(() => {
    mockWs = new MockWebSocket('ws://test.com');
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('should handle successful request-response cycle', async () => {
    const { result } = renderHook(() => 
      useWebSocketWithRequests('ws://test.com')
    );

    // Wait for connection
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });

    const request = new TestRequest('test data');
    const responsePromise = act(async () => {
      const promise = result.current.sendRequest<TestRequest, TestResponse>(request);
      
      // Get the requestId from the sent message
      const sentMessage = JSON.parse(mockWs.sentMessages[0]);
      
      mockWs.dispatchEvent(createMockMessage({
        eventType: 'TestResponse',
        result: 'success',
        requestId: sentMessage.requestId
      }));

      return promise;
    });

    const response = await responsePromise;
    expect(response.result).toBe('success');
  });
  it('should handle request timeout', async () => {
    const { result } = renderHook(() => 
      useWebSocketWithRequests('ws://test.com')
    );

    // Wait for connection
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });

    const request = new TestRequest('test data');
    const responsePromise = act(async () => {
      const promise = result.current.sendRequest<TestRequest, TestResponse>(request, 1000);
      await jest.advanceTimersByTimeAsync(1001);
      return promise;
    });

    await expect(responsePromise).rejects.toThrow('Request timed out');
  });

  it('should handle message subscription and unsubscription', async () => {
    const { result } = renderHook(() => 
      useWebSocketWithRequests('ws://test.com')
    );

    // Wait for connection
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });

    const handler = jest.fn();
    let unsubscribe: (() => void) | undefined;

    await act(async () => {
      unsubscribe = result.current.onMessage(TestResponse, handler);
      
      mockWs.dispatchEvent(createMockMessage({
        eventType: 'TestResponse',
        result: 'test'
      }));
    });

    expect(handler).toHaveBeenCalled();

    await act(async () => {
      unsubscribe?.();
      
      mockWs.dispatchEvent(createMockMessage({
        eventType: 'TestResponse',
        result: 'test2'
      }));
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle invalid message format', async () => {
    const { result } = renderHook(() => 
      useWebSocketWithRequests('ws://test.com')
    );

    // Wait for connection
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await act(async () => {
      mockWs.dispatchEvent(new MessageEvent('message', {
        data: 'invalid json'
      }));
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});