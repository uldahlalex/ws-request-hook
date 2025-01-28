// cypress/component/WebSocketChat.cy.tsx
import React, {useEffect, useState} from 'react';
import {useWebSocketWithRequests} from '../../src';
import {ClientWantsToSignInDto, ServerAuthenticatesClientDto, StringConstants} from '../Api';
import '../support/component'

const noAuth = "no auth!!";
const authed = "Authenticated";

function TestChat() {
    const [authStatus, setAuthStatus] = useState<string>(noAuth);
    const {sendRequest, readyState} = useWebSocketWithRequests('wss://fs25-267099996159.europe-north1.run.app');

    useEffect(() => {
        if(readyState==1)
            authenticate()
    }, [readyState]);

    const authenticate = async () => {
        try {
            const dto: ClientWantsToSignInDto = {
                eventType: StringConstants.ClientWantsToSignInDto,
                requestId: crypto.randomUUID(),
                password: "abc",
                username: "bob"
            }
            const response = await sendRequest<ClientWantsToSignInDto, ServerAuthenticatesClientDto>(dto);
            console.log('Response received:', response);

            // Use the normalization helper
            if ((response.eventType == StringConstants.ServerAuthenticatesClientDto)) {
                setAuthStatus(authed);
            }
        } catch (error) {
            console.error('Authentication error:', error);
            setAuthStatus("still "+noAuth);
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