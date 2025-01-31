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
