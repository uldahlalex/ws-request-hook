import {
    ClientWantsToSubscribeToTopicDto,
    ServerHasSubscribedClientToTopicDto,
    StringConstants
} from "../types-from-open-api.ts";
import {useWsClient} from "../../../src";

export default function SubscribeToTopic() {

    const { sendRequest } = useWsClient();


    const subscribeToTopic = async() => {
        const subcribeDto: ClientWantsToSubscribeToTopicDto = {
            eventType: StringConstants.ClientWantsToSubscribeToTopicDto,
            topic: "Messages"
        };
        const subscribeResult = await sendRequest<ClientWantsToSubscribeToTopicDto, ServerHasSubscribedClientToTopicDto>(subcribeDto, "ServerHasSubscribedClientToTopicDto");
        console.log(subscribeResult)
    }
    return (<>
        <div className="border border-red-500">sub component</div>
        <button onClick={subscribeToTopic}>sub to topic</button>
    </>)
}