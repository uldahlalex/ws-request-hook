import { BaseDto } from '../src/types';

export class TestRequest extends BaseDto {
  constructor(public readonly data: string) {
    super();
  }
}

export class TestResponse extends BaseDto {
  constructor(public readonly result: string) {
    super();
  }
}

export const createMockMessage = (data: any) => 
  new MessageEvent('message', {
    data: JSON.stringify(data)
  });