import BroadcastMessage from "./BroadcastMessage.tsx";
import AuthAndSubscribe from "./AuthAndSubscribe.tsx";
import ListenToMessages from "./ListenToMessages.tsx";

export default function App() {
    return(<>
        <BroadcastMessage />
        <AuthAndSubscribe />
        <ListenToMessages />

    </>)
}