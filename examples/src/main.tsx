import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import ListenToMessages from './components/ListenToMessages.tsx'
import BroadcastMessage from "./components/BroadcastMessage.tsx";
import AuthAndSubscribe from "./components/AuthAndSubscribe.tsx";
import {WsClientProvider} from "../../src";


createRoot(document.getElementById('root')!).render(


  <StrictMode>

      <WsClientProvider url="wss://fs25-267099996159.europe-north1.run.app/">
          <BroadcastMessage />
          <AuthAndSubscribe />
          <ListenToMessages />
      </WsClientProvider>


  </StrictMode>,
)
