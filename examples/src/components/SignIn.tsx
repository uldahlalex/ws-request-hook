import {ClientWantsToSignInDto, ServerAuthenticatesClientDto, StringConstants} from "../types-from-open-api.ts";
import {useWsClient} from "../../../src";

export default function SignIn() {

    const { sendRequest } = useWsClient();

    const signIn = async () => {
        const signInDto: ClientWantsToSignInDto = {
            eventType: StringConstants.ClientWantsToSignInDto,
            password: "abc",
            username: "bob"
        }
        const signInResult: ServerAuthenticatesClientDto = await sendRequest<ClientWantsToSignInDto, ServerAuthenticatesClientDto>(signInDto,"ServerAuthenticatesClient");
        console.log(signInResult)
    };

    return (<>
        <div className="border border-red-500">auth component</div>
        <button onClick={signIn}>sign in</button>
    </>)
}