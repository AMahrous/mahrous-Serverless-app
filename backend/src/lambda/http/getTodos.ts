import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import middy from '@middy/core'
//import { cors } from 'middy/middlewares'

//import { getTodosForUser as getTodosForUser } from '../../businessLogic/todos'
import { getUserId } from '../utils'
import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

const docClient = new XAWS.DynamoDB.DocumentClient()

const todosTable = process.env.TODOS_TABLE


// TODO: Get all TODO items for a current user
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Write your code here
  try{
  console.log('Caller event', event)
  //const userId = event.pathParameters.userId
  const userId = getUserId(event)

  const todos = await getTodosForUser(userId)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      items: todos
    })
  }
  } catch(error)
    {
      console.log(error)
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error
        })
      }
    }
  })
/*handler.use(
  cors({
    credentials: true
  })
)
*/



async function getTodosForUser(userId: string) {
  const result = await docClient.query({
    TableName: todosTable,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    },
    ScanIndexForward: false
  }).promise()

  return result.Items
}