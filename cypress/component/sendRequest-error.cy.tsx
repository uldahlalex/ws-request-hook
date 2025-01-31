// cypress/component/WebSocketChat.cy.tsx
// @ts-ignore
import React, {useEffect, useState} from 'react';
import {BaseDto, compareEventTypes, useWsClient, WsClientProvider} from '../../src';
import {ClientWantsToSignInDto, ServerAuthenticatesClientDto, StringConstants} from '../Api';
import '../support/component'

export type ServerSendsErrorMessagesDto = BaseDto & {
    topic?: string;
    requestId?: string;
};

const dto: ClientWantsToSignInDto = {
    eventType: StringConstants.ClientWantsToSignInDto,
    password: "abc",
    username: "Taken username"
}

function TestChat() {
    const [authStatus, setAuthStatus] = useState<string>("");
    const {sendRequest, readyState} = useWsClient();

    useEffect(() => {
        if (readyState != 1) return;
        sendRequests();
    }, [readyState]);

    const sendRequests = async () => {
        try {
            await sendRequest<ClientWantsToSignInDto, ServerAuthenticatesClientDto>(dto, StringConstants.ServerAuthenticatesClientDto);
        } catch (error) {
            console.log(error)
            const errorDto = error as unknown as ServerSendsErrorMessagesDto;
            if (errorDto.eventType === 'ServerSendsErrorMessages') {
                setAuthStatus("failed successfully");
            }
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
            .should('contain', "failed successfully");
    });
});