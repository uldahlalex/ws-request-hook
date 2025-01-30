import {ClientWantsToBroadcastToTopicDto, ServerConfirmsDto, StringConstants} from "../types-from-open-api.ts";
import { useWsClient} from "../../../src";

export default function BroadcastMessage() {

    const {
        readyState,
        sendRequest
    } = useWsClient();

    const broadcast = async () => {
        if(readyState != 1) {
            console.log("Connection not open")
            return;
        }
        const broadcastDto: ClientWantsToBroadcastToTopicDto = {
            eventType: StringConstants.ClientWantsToBroadcastToTopicDto,
            requestId: crypto.randomUUID(),
            topic: "Messages",
            message: "Hello world"
        }
        const broadcastConfirmationResult = await sendRequest<ClientWantsToBroadcastToTopicDto, ServerConfirmsDto>(broadcastDto);
        console.log(broadcastConfirmationResult)
    }

    return (
        <div className="border border-red-500 h-32">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={() => broadcast()}>click to broadcast message to clients
            </button>
        </div>
    );
}