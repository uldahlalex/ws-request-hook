import {useEffect, useState} from 'react';
// @ts-ignore
import React from 'react'
import {useWebSocketWithRequests, useWsClient, WsClientProvider} from '../../src';
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

function TestChat() {
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
        const unsubscribe = onMessage<ServerBroadcastsMessageDto>(StringConstants.ServerBroadcastsMessageDto,
            (message) => {
                console.log("Has now received: "+JSON.stringify(message));
                setReceivedMessage(message.message || "No message received");
            }
        );
        return () => unsubscribe();
    }, [onMessage, readyState]);

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

            const broadcastDto: ClientWantsToBroadcastToTopicDto = {
                eventType: StringConstants.ClientWantsToBroadcastToTopicDto,
                topic: "Messages",
                message: broadcastMessage
            }
            await sendRequest<ClientWantsToBroadcastToTopicDto, ServerConfirmsDto>(broadcastDto, StringConstants.ServerConfirmsDto);
        } catch (error) {
            console.error('Authentication error:', error);
        }
    };

    return (
        <div>
            <div data-testid="broadcast-message">{receivedMessage}</div>
        </div>
    );
}

describe('WebSocket Chat Component', () => {
    beforeEach(() => {
        cy.mount(
            <WsClientProvider url="wss://fs25-267099996159.europe-north1.run.app/">
            <TestChat/>
            </WsClientProvider>
        );
    });

    it('should receive broadcast message', () => {
        cy.get('[data-testid="broadcast-message"]')
            .should('contain', broadcastMessage);
    });
});