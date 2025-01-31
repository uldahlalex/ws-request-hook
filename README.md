# ws-request-hook

### Usage

#### Wrap your app in the provider:

```tsx
// ./examples/src/main.tsx

import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {WsClientProvider} from "../../src";
import App from "./components/App.tsx";


createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <WsClientProvider url="wss://fs25-267099996159.europe-north1.run.app/">
          <App />
      </WsClientProvider>
  </StrictMode>,
)

```
____

##### For request-response pattern:

1) After wrapping your app in the provider, make request + response models that extends BaseDto:

```ts
// ./examples/src/types-from-open-api.ts#L12-L25


import {BaseDto} from "ws-request-hook";

export type ClientWantsToBroadcastToTopicDto = BaseDto & {
  message?: string;
  requestId?: string;
  topic?: string;
};

export type ServerAuthenticatesClientDto = BaseDto & {
  requestId?: string;
  jwt?: string;
};

```

3) Send request using "sendRequest" from the hook inside a React component:

```tsx
// ./examples/src/components/SignIn.tsx

import {ClientWantsToSignInDto, ServerAuthenticatesClientDto, StringConstants} from "../types-from-open-api.ts";
import {useWsClient} from "../../../src";

export default function SignIn() {

    const { sendRequest } = useWsClient();

    const signIn = async () => {
        const signInDto: ClientWantsToSignInDto = {
            eventType: StringConstants.ClientWantsToSignInDto,
            password: "abc",
            username: "bob"
        }
        const signInResult: ServerAuthenticatesClientDto = await sendRequest<ClientWantsToSignInDto, ServerAuthenticatesClientDto>(signInDto,"ServerAuthenticatesClientDto");
        console.log(signInResult)
    };

    return (<>
        <div className="border border-red-500">auth component</div>
        <button onClick={signIn}>sign in</button>
    </>)
}
```

____
#### For Message listening:

1) After wrapping your App component in the Provider, define a response model that extends BaseDto

```ts
import {BaseDto} from "ws-request-hook";

export type ServerBroadcastsMessageDto = BaseDto & {
  message?: string;
  sender?: string;
  topic?: string;
};
```


2) Use onMessage from the hook inside React component (here demonstrated with useEffect)

```tsx
// ./examples/src/components/ListenToMessages.tsx

import {useEffect, useState} from 'react';
import {useWsClient} from '../../../src';
import {ServerBroadcastsMessageDto, StringConstants} from '../types-from-open-api.ts';


export default function ListenToMessages() {
    const {
        onMessage,
        readyState
    } = useWsClient();

    const [receivedMessage, setReceivedMessage] = useState<string>("Waiting for broadcast");

    useEffect(() => {
        if (readyState != 1) return;
        reactToBroadcasts();
    }, [onMessage, readyState]);

    const reactToBroadcasts = async() => {
        const unsubscribe = onMessage<ServerBroadcastsMessageDto>(
            StringConstants.ServerBroadcastsMessageDto,
            (message) => {
                setReceivedMessage(message.message || "No message received");
            }
        );
        return () => unsubscribe();
    }


    return (
        <div className="border border-red-500">
            <div data-testid="broadcast-message">{receivedMessage}</div>
        </div>
    );
}


```

Don't forget to call unsubscribe() - if you need to re-trigger the event, wrap it inside a useEffect() hook


_____

Behavior explanation:
- Request-response with sendRequest attaches a requestId on the object. Once the client receives the ID, it is assumed this is the response for the request.
  - The websocket server should therefore only attach the requestId to the message going back to the client which is intended to be a "response" for the original request.

