import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import middy from '@middy/core'
//import { cors, httpErrorHandler } from 'middy/middlewares'

//import { deleteTodo } from '../../businessLogic/todos'
//import { getUserId } from '../utils'
import * as AWS  from 'aws-sdk'
import { getUserId } from '../utils'


const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // TODO: Remove a TODO item by id
    try{
      const todoId = event.pathParameters.todoId
        const userId = getUserId(event)
    
        console.log("Updating the item...")
        const deletedItem = await docClient.delete(
          {
            TableName:todosTable,
            Key:{
              userId: userId,
              todoId: todoId
            },
            ConditionExpression: "userId = :userIdVal and todoId = :todoVal",
            ExpressionAttributeValues:{
                ":userIdVal": userId,
                ":todoVal": todoId
            },
            ReturnValues:"ALL_OLD"
          }
        ).promise()
    
    
        return {
          statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*'
            },
          body: JSON.stringify({
              deletedItem
          })
        }
      }catch (error){
        return {
          statusCode: 400,
            headers: {
              'Access-Control-Allow-Origin': '*'
            },
          body: JSON.stringify({
              error
          })
        }
      }
      

  }
)



/*
handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
*/