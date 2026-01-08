import { SESClient } from '@aws-sdk/client-ses'
import { SQSClient } from '@aws-sdk/client-sqs'
import { fromInstanceMetadata } from '@aws-sdk/credential-provider-imds'
import { fromSharedConfigFiles } from '@aws-sdk/credential-provider-ini'
import {
  defaultProvider,
  fromContainerMetadata
} from '@aws-sdk/credential-provider-node'
import { SSOProvider } from '@aws-sdk/credential-provider-sso'
import {
  fromTokenFile,
  fromWebToken
} from '@aws-sdk/credential-provider-web-identity'

const awsProfile = process.env['AWS_PROFILE'] || 'default'

const myDefaultProviders = [
  () => fromSharedConfigFiles({ profile: awsProfile }),
  () => fromInstanceMetadata(),
  () => fromContainerMetadata(),
  () => fromWebToken(),
  () => fromTokenFile(),
  () => new SSOProvider()
]

const sqsClientConfig = {
  region: 'ap-south-1',
  credentials: defaultProvider({ providerChain: myDefaultProviders })
}

const sesClientConfig = {
  region: 'ap-south-1',
  credentials: defaultProvider({ providerChain: myDefaultProviders })
}

export const SQSCLIENT = new SQSClient(sqsClientConfig)
export const SESCLIENT = new SESClient(sesClientConfig)
