## ws-request-hook

### Usage

#### Wrap your app in the provider:

```ts
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

A) Make a model that extends BaseDto:

```ts
// ././examples/src/types-from-open-api.ts#L12-L20


import {BaseDto} from "ws-request-hook";

export type ClientWantsToBroadcastToTopicDto = BaseDto & {
  message?: string;
  requestId?: string;
  topic?: string;
};

```

B) Send request using sendRequest from the hook inside a react component:

(coming)

____
#### For Message listening:

A) Define a model that extends BaseDto

```ts
// ././examples/src/types-from-open-api.ts#L27-L31

export type ServerBroadcastsMessageDto = BaseDto & {
  message?: string;
  sender?: string;
  topic?: string;
};
```


B) Use onMessage from the hook inside React component (here demonstrated with useEffect)

(coming)