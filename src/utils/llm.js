import { AzureChatOpenAI } from '@langchain/openai'

export const llm = new AzureChatOpenAI({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_KEY,
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE,
  azureOpenAIApiDeploymentName: 'gpt-4o',
  azureOpenAIApiVersion: '2024-08-01-preview',
  azureOpenAIBasePath: process.env.AZURE_OPENAI_API_BASE_PATH,
  temperature: 0,
  maxTokens: 4096,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  cache: true
})

export const modelTurbo = new AzureChatOpenAI({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_KEY,
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE,
  azureOpenAIApiDeploymentName: 'gpt-4o-mini',
  azureOpenAIApiVersion: '2024-12-01-preview', // this is found from the endpoint url
  azureOpenAIBasePath: process.env.AZURE_OPENAI_API_BASE_PATH,
  temperature: 0,
  topP: 1,
  maxTokens: 512,
  frequencyPenalty: 0,
  presencePenalty: 0,
  cache: true
})
