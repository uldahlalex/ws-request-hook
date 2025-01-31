## ws-request-hook

### Usage

#### Wrap your app in the provider:

```ts
// ./examples/src/main.tsx

```
____

##### For request-response pattern:

A) Make a model that extends BaseDto:

```ts
// ././examples/src/types-from-open-api.ts#L12-L20

```

B) Send request using sendRequest from the hook inside a react component:

(coming)

____
#### For Message listening:

A) Define a model that extends BaseDto

```ts
// ././examples/src/types-from-open-api.ts#L27-L31

```


B) Use onMessage from the hook inside React component (here demonstrated with useEffect)

(coming)