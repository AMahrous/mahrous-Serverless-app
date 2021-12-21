import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'mahrous-serverless-todo-app',
  frameworkVersion: '2',
  plugins: ['serverless-esbuild'],
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    stage: 'dev',
    region: 'us-east-1',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      TODOS_TABLE: 'Todos-${self:provider.stage}',
      TODOS_CREATED_AT_INDEX: 'CreatedAtIndex',
      TODOS_S3_BUCKET: 'mahrous-todos-s3-bucket-${self:provider.stage}',
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000'
    },
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: [
          'dynamodb:PutItem',
          'dynamodb:GetItem',
          'dynamodb:Query',
          'dynamodb:DeleteItem',
          'dynamodb:UpdateItem'
        ],
        Resource: 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.TODOS_TABLE}'
      },
      {
        Effect: 'Allow',
        Action: [
          's3:PutObject',
          's3:GetObject'
        ],
        Resource: 'arn:aws:s3:::${self:provider.environment.TODOS_S3_BUCKET}/*'
      }
    ],
    lambdaHashingVersion: '20201221',
  },
  // import the function via paths
  functions: {
    Auth: {
      handler: 'src/lambda/auth/auth0Authorizer.handler'
    },
    CreateTodo: {
      handler: 'src/lambda/http/createTodo.handler',
      events: [
        {
          http: {
            method: 'post',
            path: 'todos',
            cors: true,
            authorizer: 'Auth',
            request: {
              schemas:{
                'application/json': '${file(models/create-todo-model.json)}'
              }
            }
          }
        }
      ]
    },
    DeleteTodo: {
      handler: 'src/lambda/http/deleteTodo.handler',
      events: [
        {
          http: {
            method: 'delete',
            path: 'todos/{todoId}',
            cors: true,
            authorizer: 'Auth',
          }
        }
      ]
    },
    GenerateUploadUrl: {
      handler: 'src/lambda/http/generateUploadUrl.handler',
      events: [
        {
          http: {
            method: 'post',
            path: 'todos/{todoId}/attachment',
            cors: true
          }
        }
      ]
    },
    GetTodos: {
      handler: 'src/lambda/http/getTodos.handler',
      events: [
        {
          http: {
            method: 'get',
            path: 'todos',
            cors: true
          }
        }
      ]
    },
    UpdateTodo: {
      handler: 'src/lambda/http/updateTodo.handler',
      events: [
        {
          http: {
            method: 'patch',
            path: 'todos/{todoId}',
            cors: true,
            //authorizer: 'Auth',
            request: {
              schemas:{
                'application/json': '${file(models/update-todo-model.json)}'
              }
            }
          }
        }
      ]
    }
  },
  resources: {
    Resources: {
      GatewayResponseDefault4XX: {
        Type: "AWS::ApiGateway::GatewayResponse",
        Properties: {
          ResponseParameters: {
            "gatewayresponse.header.Access-Control-Allow-Origin": "'*'",
            "gatewayresponse.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
            "gatewayresponse.header.Access-Control-Allow-Methods": "'*'"
          },
          ResponseType: "DEFAULT_4XX",
          RestApiId: {
            Ref: "ApiGatewayRestApi"
          }
        }
      },
      TodosTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          AttributeDefinitions: [
            {
              AttributeName: 'userId',
              AttributeType: 'S'
            },
            {
              AttributeName: 'todoId',
              AttributeType: 'S'
            },
            {
              AttributeName: 'createdAt',
              AttributeType: 'S'
            }
          ],
          KeySchema: [
            {
              AttributeName: 'userId',
              KeyType: 'HASH'
            },
            {
              AttributeName: 'todoId',
              KeyType: 'RANGE'
            }
          ],
          LocalSecondaryIndexes: [
            {
              IndexName: '${self:provider.environment.TODOS_CREATED_AT_INDEX}',
              KeySchema: [
                {
                  AttributeName: 'userId',
                  KeyType: 'HASH'
                },
                {
                  AttributeName: 'createdAt',
                  KeyType: 'RANGE'
                }
              ],
              Projection: {
                ProjectionType: 'ALL'
              }
            }
          ],
          BillingMode: 'PAY_PER_REQUEST',
          TableName: '${self:provider.environment.TODOS_TABLE}'
        }
      },
      AttachmentsBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: '${self:provider.environment.TODOS_S3_BUCKET}',
          /*NotificationConfiguration:{
            TopicConfigurations: [
              {
                Event: 's3:ObjectCreated:*',
                Topic: {
                  Ref: 'ImagesTopic'
                }
              }
            ]
          },*/
          CorsConfiguration:{
            CorsRules: [
              {
                AllowedOrigins: [
                  '*'
                ],
                AllowedHeaders: [
                  '*'
                ],
                AllowedMethods: [
                  'GET',
                  'PUT',
                  'POST',
                  'DELETE',
                  'HEAD'
                ],
                MaxAge: '3000'
              }
            ]
          }
        }
      },
      BucketPolicy: {
        Type: 'AWS::S3::BucketPolicy',
        Properties: {
          PolicyDocument: {
            Id: 'MyPolicy',
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'PublicReadForGetBucketObjects',
                Effect: 'Allow',
                Principal: '*',
                Action: 's3:*',
                Resource: 'arn:aws:s3:::${self:provider.environment.TODOS_S3_BUCKET}/*'
              }
            ]
          },
          Bucket: {
            Ref: 'AttachmentsBucket'
          }
        }
      }
    }
  },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node14',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
  },
};

module.exports = serverlessConfiguration;
