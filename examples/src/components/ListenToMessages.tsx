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

