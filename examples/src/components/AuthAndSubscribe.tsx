import {
    ClientWantsToSignInDto,
    ClientWantsToSubscribeToTopicDto,
    ServerAuthenticatesClientDto,
    ServerHasSubscribedClientToTopicDto,
    StringConstants
} from "../types-from-open-api.ts";
import {useEffect} from "react";
import { useWsClient} from "../../../src";

export default function AuthAndSubscribe() {

    const { sendRequest, readyState } = useWsClient();


    useEffect(() => {
        if(readyState != 1) {
            return;
        }
        signInAndSubscribe()
    }, [readyState]);

    const signInAndSubscribe = async () => {
        const signInDto: ClientWantsToSignInDto = {
            eventType: StringConstants.ClientWantsToSignInDto,
            password: "abc",
            username: "bob"
        }
        const signInResult = await sendRequest<ClientWantsToSignInDto, ServerAuthenticatesClientDto>(signInDto);
        console.log(signInResult)

        const subcribeDto: ClientWantsToSubscribeToTopicDto = {
            eventType: StringConstants.ClientWantsToSubscribeToTopicDto,
            topic: "Messages"
        };
        const subscribeResult = await sendRequest<ClientWantsToSubscribeToTopicDto, ServerHasSubscribedClientToTopicDto>(subcribeDto);
        console.log(subscribeResult)

    };
    return (<>
        <div className="border border-red-500">auth and sub component</div>
    </>)
}