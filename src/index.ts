import { Request, Response, route } from './httpSupport'

import OpenAI from 'openai'




const combinerAndorchestrator = async (openAPIkey: string, openAiModel: string, query: string) => {
    const openai = new OpenAI({ apiKey: openAPIkey })

    const completion = await openai.chat.completions.create({
        messages: [{ role: `system`, content: `${query}` }],
        model: `${openAiModel}`,
    });

    return ((completion.choices[0].message.content as string))

}


const getIPFS = async (arr: string[]): Promise<string[]> => {
    const returnArray: string[] = []
    const starknetAgentIPFS = "QmNTaKwgqbUKC14gTdRvNtZqc2CXo75cbBrADw9bFbNhEQ"
    const hyperlaneAgentIPFS = "QmSM8MNdAuiqhq3a9HcRuDmuNQZSfzWa14jhfhB2uu5zK3"
    const stellarAgentIPFS = "QmQxF3Fym5iF8pUi62Vhz5QwVMAJndZWsMBb3JUyRBr4bg"
    const suiAgentIPFS = "QmZuXHdyzaQmJAYqPiUw4G6E8Ceuw3Q59k2zWuPQXo5JBT"
    const rootstackAgentIPFS = "QmcdMDAfit1Di4e4EGgrMFi4nMKo5KxV7rkYriPasLhfzt"
    const stacksAgentIPFS = "QmTcYgPfgEkLg3V6bYbomSzoZeqi6Bh1h8CWXBK2cJosLV"
    const akashAgentIPFS = "QmPU84ZGW9YZw4YCLry5joJByTdoy3qNwsqJwwAqpsE6ri"
    const polkadotAgentIPFS = "QmTHeDyqrGzVhdehcxVyGYqBXP7qVnNiyjdatJzgh4Kzy5"
    const web3authAgentIPFS = "QmdVYmzgdw9Vmwr6TKUKi8zaJ8PsUDr5X7tYRuNrfVYzfV"
    const phalaAgentIPFS = "QmUDN6rH5FdfpkB9fBYWwdKkXrU5vRwKsK1YzmTnxnadKd"
    for(let i =0;i<arr.length;i++){
        if(arr[i] === "starknetAgentIPFS"){
            returnArray.push(starknetAgentIPFS)
        }
        if(arr[i] === "hyperlaneAgentIPFS"){
            returnArray.push(hyperlaneAgentIPFS)
        }
        if(arr[i] === "stellarAgentIPFS"){
            returnArray.push(stellarAgentIPFS)
        }
        if(arr[i] === "suiAgentIPFS"){
            returnArray.push(suiAgentIPFS)
        }
        if(arr[i] === "rootstackAgentIPFS"){
            returnArray.push(rootstackAgentIPFS)
        }
        if(arr[i] === "stacksAgentIPFS"){
            returnArray.push(stacksAgentIPFS)
        }
        if(arr[i] === "akashAgentIPFS"){
            returnArray.push(akashAgentIPFS)
        }
        if(arr[i] === "polkadotAgentIPFS"){
            returnArray.push(polkadotAgentIPFS)
        }
        if(arr[i] === "web3authAgentIPFS"){
            returnArray.push(web3authAgentIPFS)
        }
        if(arr[i] === "phalaAgentIPFS"){
            returnArray.push(phalaAgentIPFS)
        }
    }
    return returnArray
}

const callAgent=async(ipfs:string,query:string):Promise<string>=>{
    const encoded = encodeURIComponent(query)
    const response = await fetch(`https://agents.phala.network/ipfs/${ipfs}/0?chatQuery=${encoded}`, {
        //@ts-ignore
        timeoutMs:120000,
        method: 'GET',
        headers: {
          'Accept': 'text/plain' 
        }
      });
      const text =(await response.text())
      return  text

}

async function GET(req: Request): Promise<Response> {
    const openaiApiKey = req.secret?.openaiApiKey as string;
    const openAiModel = (req.queries.openAiModel) ? req.queries.openAiModel[0] : 'gpt-4o';
    const query = req.queries.chatQuery[0] as string;
    const template = `I have a few AI agents who are specialised in responding to specific topics. So basically you have to act as a orchestrator for these agents.
    what you have to do is respond with the name of agents that needs to be called based on the context of the user query.
    For example if the user query is : "How to deploy and NFT contract in sui and starknet" then you should reply in an array format only [starknetAgentIPFS,suiAgentIPFS] .
    Here the query included question regarding two blockchains that are sui and starknet. so you should reply with an array of needed agents from our available agents. 
    each agent name starts with the protocol name such that . starknetAgentIPFS leads to agent that is specialised in responding to queries related to starknet protocol only
    our available agents are:
[starknetAgentIPFS,
hyperlaneAgentIPFS,
stellarAgentIPFS,
suiAgentIPFS,
rootstackAgentIPFS,
stacksAgentIPFS,
akashAgentIPFS,
polkadotAgentIPFS,
web3authAgentIPFS,
phalaAgentIPFS ] .

strictly respond in array format only
strictly respond from the available agents only
strictly choose maximum 2 agents only

user query: ${query}
`
    const response = await combinerAndorchestrator(openaiApiKey, openAiModel, template)
    const arr: string[] = response.replace(/^\[|]$/g, '').split(',').map(s => s.trim())
    const ipfs: string[] = await getIPFS(arr)
    const responses: Promise<string>[] = ipfs.map((ipfs) => {
        return callAgent(ipfs, query);
      });
      
      const results: string[] = await Promise.all(responses);
    const template2=`I will give you an array of strings which are basically responses from different ai agents.
    what you have to do is reply with one single response by combining and incorporating all the critical informations and instructions from the array of responses.
    i will also give the query that is used to invoke the agents to generate these responses, you have to analyse the context from the query and select appropriate sections from the response array.
    strictly maintain all the critical informations,code snippets and step by step instructions,
    if you the responses provided is not empty and doesnt have any error resemblence respond only with response
    if the responses are empty array or something that resembles an error only then you can generate response for the query. But dont mention anything 
    about query like "responses was empty" or "seems like there is an error in the response"

    query:${query}
    responses:${results}
    `
    const response2 = await combinerAndorchestrator(openaiApiKey, openAiModel, template2)

    return new Response(response2)
}

async function POST(req: Request): Promise<Response> {
    return new Response('Not Implemented')
}

export default async function main(request: string) {
    return await route({ GET, POST }, request)
}
