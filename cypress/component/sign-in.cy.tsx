// cypress/component/WebSocketChat.cy.tsx
import React, {useEffect, useState} from 'react';
import {useWebSocketWithRequests} from '../../src';
import {ClientWantsToSignInDto, ServerAuthenticatesClientDto, StringConstants} from '../Api';
import '../support/component'
import {compareEventTypes, removeDto} from "../../src/hook";

const noAuth = "no auth!!";
const authed = "Authenticated";

const dto: ClientWantsToSignInDto = {
    eventType: StringConstants.ClientWantsToSignInDto,
    requestId: crypto.randomUUID(),
    password: "abc",
    username: "bob"
}

function TestChat() {
    const [authStatus, setAuthStatus] = useState<string>(noAuth);
    const {sendRequest, readyState} = useWebSocketWithRequests('wss://fs25-267099996159.europe-north1.run.app');

    useEffect(() => {
        if (readyState != 1) return;
        sendRequests();
    }, [readyState]);

    const sendRequests = async () => {
        try {
            console.log("Sending auth request:", dto);
            const response = await sendRequest<ClientWantsToSignInDto, ServerAuthenticatesClientDto>(dto);
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
        cy.mount(<TestChat/>);
    });

    it('should authenticate', () => {
        cy.get('[data-testid="auth-status"]')
            .should('contain', authed);
    });
});