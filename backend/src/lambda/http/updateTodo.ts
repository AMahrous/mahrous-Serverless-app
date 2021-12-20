import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import middy from '@middy/core'
//import { cors, httpErrorHandler } from 'middy/middlewares'

//import { updateTodo } from '../../businessLogic/todos'
//import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
//import { getUserId } from '../utils'
import * as AWS  from 'aws-sdk'
import { getUserId } from '../utils'
//import { TodoUpdate } from '../../models/TodoUpdate'

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE




export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    
    //const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
    // TODO: Update a TODO item with the provided id using values in the "updatedTodo" object
try{
  const todoId = event.pathParameters.todoId
    const userId = getUserId(event)

    console.log("Updating the item...")
    const updatedVersion = await docClient.update(
      {
        TableName:todosTable,
        Key:{
          userId: userId,
          todoId: todoId
        },
        UpdateExpression: "set #Name = :nameVal, dueDate = :dueDateVal, done = :doneVal",
        ConditionExpression: "userId = :userIdVal and todoId = :todoVal",
        ExpressionAttributeNames: {
            "#Name": "name"
        },
        ExpressionAttributeValues:{
            ":userIdVal": userId,
            ":todoVal": todoId,
            ":nameVal":'modifiedTodo',
            ":dueDateVal":'modified due date',
            ":doneVal":true
        },
        ReturnValues:"ALL_NEW"
      }
    ).promise()


    return {
      statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
      body: JSON.stringify({
          updatedVersion
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
  })



/*
handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
*/
