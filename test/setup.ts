import { MockWebSocket } from './__mocks__/websocket';

global.WebSocket = MockWebSocket as any;