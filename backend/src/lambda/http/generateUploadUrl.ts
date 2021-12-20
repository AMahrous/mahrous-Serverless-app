import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import middy from '@middy/core'
//import { cors, httpErrorHandler } from 'middy/middlewares'

//import { createAttachmentPresignedUrl } from '../../businessLogic/todos'
//import { getUserId } from '../utils'
import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

const todosBucket = process.env.TODOS_S3_BUCKET
const urlExpiration = 3000

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try{
    const todoId = event.pathParameters.todoId
    // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
    const signedUrl = getUploadUrl(todoId)

    return {
      statusCode: 201,
       headers: {
         'Access-Control-Allow-Origin': '*'
       },
      body: JSON.stringify({
          uploadUrl: signedUrl
      })
    }
    }catch(error)
    {
      console.log(error)
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

function getUploadUrl(todoId: string) {
  return s3.getSignedUrl('putObject', {
    Bucket: todosBucket,
    Key: todoId,
    Expires: urlExpiration
  })
}


/*
handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
*/