import {useEffect, useState} from "react";
import {useWebSocketWithRequests} from "../../src";
import '../../src/Api';
import {ServerBroadcastsMessage, ClientWantsToBroadcastToTopicDto} from "../../src/Api";
import React from "react";

function TestChatRoom() {
    const [messages, setMessages] = useState<Array<{id: string, text: string}>>([]);
    const [newMessage, setNewMessage] = useState('');
    const { sendRequest, onMessage, readyState } = useWebSocketWithRequests('ws://localhost:8181');

    useEffect(() => {
        if (readyState !== 1) return;
        const dto: ClientWantsToBroadcastToTopicDto = {
            message: '',
            topic: 'Messages',
            requestId: 'A'
        }
      
    }, [onMessage, readyState]);

    const handleSend = async (e: React.FormEvent) => {

    };

    return (
        <div>
            <div data-testid="messages">
                {messages.map(msg => (
                    <div key={msg.id} data-testid="message">
                        {msg.text}
                    </div>
                ))}
            </div>
            <form data-testid="message-form" onSubmit={handleSend}>
                <input
                    data-testid="message-input"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
}

describe('Chat Room', () => {
    beforeEach(() => {
        cy.mount(<TestChatRoom />);
    });

    it('should send and receive messages', () => {
        // Type and send a message
        cy.get('[data-testid="message-input"]')
            .type('Hello, World!');
        cy.get('[data-testid="message-form"]')
            .submit();

        // Verify message was sent and received
        cy.get('[data-testid="message"]')
            .should('contain', 'Hello, World!');
    });

    it('should handle incoming messages', () => {
        // Simulate receiving a message
        // You might need to set up a mock WebSocket server for this
        cy.get('[data-testid="messages"]')
            .should('exist');
    });
});