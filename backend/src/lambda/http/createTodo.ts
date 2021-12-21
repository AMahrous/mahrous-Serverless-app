import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import middy from '@middy/core'
//import { cors } from 'middy/middlewares'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils';
//import { createTodo } from '../../businessLogic/todos'

import * as AWS  from 'aws-sdk'
import { TodoItem } from '../../models/TodoItem'
const uuid = require('uuid')

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
const bucketName = process.env.TODOS_S3_BUCKET


export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const newTodo: CreateTodoRequest = JSON.parse(event.body)
    // TODO: Implement creating a new TODO item
    const userId = getUserId(event)
    const createdAt = new Date().toISOString()
    const todoId = uuid.v4()

    const newItem: TodoItem = {
      userId: userId,
      todoId: todoId,
      createdAt: createdAt,
      ...newTodo,
      done: false,
      attachmentUrl: `https://${bucketName}.s3.amazonaws.com/${todoId}`
    }

    console.log('Storing new item: ', newItem)

    await docClient
      .put({
        TableName: todosTable,
        Item: newItem
      })
      .promise()

    return {
      statusCode: 201,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
      body: JSON.stringify({
          item: newItem
      })
    }
  })

  /*
handler.use(
  cors({
    credentials: true
  })
)
*/