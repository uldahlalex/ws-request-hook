// cypress/component/WebSocketChat.cy.tsx
import React, {useEffect, useState} from 'react';
import {useWebSocketWithRequests} from '../../src';
import {ClientWantsToSignInDto, ServerAuthenticatesClientDto} from '../../src/Api';
import '../support/component'

const noAuth = "no auth!!";
const authed = "Authenticated";

function TestChat() {
    const [authStatus, setAuthStatus] = useState<string>(noAuth);
    const {sendRequest, readyState} = useWebSocketWithRequests('wss://fs25-267099996159.europe-north1.run.app');

    useEffect(() => {
        authenticate()
    }, []);

    const authenticate = async () => {
        try {
            const dto: ClientWantsToSignInDto = {
                eventType: "ClientWantsToSignInDto",
                requestId: crypto.randomUUID(),
                password: "abc",
                username: "bob"
            }
            const response = await sendRequest<ClientWantsToSignInDto, ServerAuthenticatesClientDto>(dto);
            setAuthStatus(authed);
        } catch (error) {
            setAuthStatus(noAuth);
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