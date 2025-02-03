// @ts-ignore
import React, {useEffect, useState} from 'react';
import {useWsClient, WsClientProvider} from '../../src';
import {
    ClientWantsToBroadcastToTopicDto,
    ClientWantsToSignInDto,
    ClientWantsToSubscribeToTopicDto,
    ServerAuthenticatesClientDto,
    ServerBroadcastsMessageDto,
    ServerConfirmsDto,
    ServerHasSubscribedClientToTopicDto,
    StringConstants
} from '../Api';
import '../support/component'

const broadcastMessage = "Hello world!"; // Define this constant

interface TestChatProp {
    publisher: boolean
}

function TestChat({publisher}: TestChatProp) {
    const {
        sendRequest,
        onMessage,
        readyState
    } = useWsClient();
    const [receivedMessage, setReceivedMessage] = useState<string>("Waiting");

    useEffect(() => {
        if (readyState != 1) return;
        sendMessages()
    }, [readyState]);

    useEffect(() => {
        if(readyState!= 1) return;
        if(publisher==false) listenToBroadcast();
    }, [onMessage, readyState]);

    const listenToBroadcast = async () => {
        const unsubscribe = onMessage<ServerBroadcastsMessageDto>(StringConstants.ServerBroadcastsMessageDto,
            (message) => {
                console.log("Has now received: "+JSON.stringify(message));
                setReceivedMessage(message.message || "No message received");
            }
        );
        return () => unsubscribe();
    }

    const sendMessages = async () => {
        try {
            const signInDto: ClientWantsToSignInDto = {
                eventType: StringConstants.ClientWantsToSignInDto,
                password: "abc",
                username: "bob"
            }
            await sendRequest<ClientWantsToSignInDto, ServerAuthenticatesClientDto>(signInDto, StringConstants.ServerAuthenticatesClientDto);

            const subcribeDto: ClientWantsToSubscribeToTopicDto = {
                eventType: StringConstants.ClientWantsToSubscribeToTopicDto,
                topic: "Messages"
            };
            await sendRequest<ClientWantsToSubscribeToTopicDto, ServerHasSubscribedClientToTopicDto>(subcribeDto, StringConstants
                .ServerHasSubscribedClientToTopicDto);

            if(publisher == false) return;


            const broadcastDto: ClientWantsToBroadcastToTopicDto = {
                eventType: StringConstants.ClientWantsToBroadcastToTopicDto,
                topic: "Messages",
                message: broadcastMessage
            }
            setTimeout(async () =>  {
                const result = await sendRequest<ClientWantsToBroadcastToTopicDto, ServerConfirmsDto>(broadcastDto, StringConstants.ServerConfirmsDto)
                setReceivedMessage(result.eventType!)
            }
        , 1000)
        } catch (error) {
            console.error('Authentication error:', error);
        }
    };

    return (
        <div>
            {
                publisher == false ? <div data-testid="broadcast-message">{receivedMessage}</div> : <div data-testid="broadcast-message">ServerConfirms</div>
            }

        </div>
    );
}

describe('WebSocket Chat Component', () => {
    beforeEach(() => {
        cy.mount(
            <>
                <WsClientProvider url="wss://fs25-267099996159.europe-north1.run.app/">
                <TestChat publisher={true}/>
            </WsClientProvider>
                <WsClientProvider url="wss://fs25-267099996159.europe-north1.run.app/">
                <TestChat publisher={false}/>
            </WsClientProvider>
            </>
        );
    });

    it('should receive broadcast message', () => {
        cy.get('[data-testid="broadcast-message"]')
            .should('contain', broadcastMessage);
    });
});