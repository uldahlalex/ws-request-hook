export class MockWebSocket {
  private listeners: { [key: string]: Function[] } = {};
  public url: string;
  public sentMessages: string[] = [];
  public readyState: number = 0; // CONNECTING

  constructor(url: string) {
    this.url = url;
    // Simulate connection after creation
    setTimeout(() => {
      this.readyState = 1; // OPEN
      this.dispatchEvent(new Event('open'));
    }, 0);
  }

  send(data: string) {
    this.sentMessages.push(data);
  }

  clearSentMessages() {
    this.sentMessages = [];
  }

  addEventListener(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  removeEventListener(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  dispatchEvent(event: any) {
    if (this.listeners[event.type]) {
      this.listeners[event.type].forEach(callback => callback(event));
    }
  }

  close() {
    this.readyState = 3; // CLOSED
    this.dispatchEvent(new Event('close'));
  }
}