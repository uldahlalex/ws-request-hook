// cypress/component/WebSocketChat.cy.tsx
import {useEffect, useState} from 'react';
// @ts-ignore
import React from 'react'
import {useWebSocketWithRequests, useWsClient, useWsRequest, WsClientProvider} from '../../src';
import {ClientWantsToSignInDto, ServerAuthenticatesClientDto, StringConstants} from '../Api';
import '../support/component'
import {compareEventTypes, removeDto} from "../../src";

const noAuth = "no auth!!";
const authed = "Authenticated";

const dto: ClientWantsToSignInDto = {
    eventType: StringConstants.ClientWantsToSignInDto,
    password: "abc",
    username: "bob"
}

function TestChat() {
    const [authStatus, setAuthStatus] = useState<string>(noAuth);
    const {sendRequest, readyState} = useWsClient();
    useEffect(() => {
        if (readyState != 1) return;
        sendRequests();
    }, [readyState]);

    const sendRequests = async () => {
        try {
            console.log("Sending auth request:", dto);
            const response = await sendRequest<ClientWantsToSignInDto, ServerAuthenticatesClientDto>(dto, StringConstants.ServerAuthenticatesClientDto);
            console.log("Received auth response:", response);

            const expected = StringConstants.ServerAuthenticatesClientDto;
            const actual = response.eventType!;

            console.log(`Comparing event types:`, {
                expected,
                actual,
                matches: compareEventTypes(expected, actual)
            });

            setAuthStatus(compareEventTypes(expected, actual) ? authed : "Unauthenticated!");
        } catch (error) {
            console.error("Auth request failed:", error);
            setAuthStatus("Auth failed!");
        }
    };

    return (
        <div>
            <div data-testid="auth-status">{authStatus}</div>
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

    it('should authenticate', () => {
        cy.get('[data-testid="auth-status"]')
            .should('contain', authed);
    });
});