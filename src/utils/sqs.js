import { SendMessageCommand } from '@aws-sdk/client-sqs'
import 'dotenv/config'
import { SQSCLIENT } from '../config/aws'
const sqsClient = SQSCLIENT

export const addToSqsScQue = async body => {
  try {
    console.log('Adding request to SQS')

    const desktopParams = {
      DelaySeconds: 0,
      MessageBody: JSON.stringify(body),
      QueueUrl: process.env.SQS_SC_DESKTOP_QUE_URL
    }

    const dcommand = new SendMessageCommand(desktopParams)
    const dresult = await sqsClient.send(dcommand)
    console.log('Sqs Desktop Invoke Result', dresult)

    const mobileParams = {
      DelaySeconds: 0,
      MessageBody: JSON.stringify(body),
      QueueUrl: process.env.SQS_SC_MOBILE_QUE_URL
    }

    const mcommand = new SendMessageCommand(mobileParams)
    const mresult = await sqsClient.send(mcommand)
    console.log('Sqs Desktop Invoke Result', mresult)
  } catch (error) {
    console.log(error)
  }
}
