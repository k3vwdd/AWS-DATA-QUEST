import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as snsSubs from "aws-cdk-lib/aws-sns-subscriptions";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaEvents from "aws-cdk-lib/aws-lambda-event-sources";
import * as iam from "aws-cdk-lib/aws-iam";
import * as api from "aws-cdk-lib/aws-apigateway";
import * as path from "path";

export class IntegrationStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const rekognitionQueue = new sqs.Queue(this, "rekognitionImageQueue", {
            visibilityTimeout: cdk.Duration.seconds(60),
        });

        const sqsSubscription = new snsSubs.SqsSubscription(rekognitionQueue, {
            rawMessageDelivery: true,
        });

        const rekognitionEventTopic = new sns.Topic(
            this,
            "rekognitionImageTopic",
            {},
        );

        const saveXmlLambda = new lambda.Function(this, "SaveXmlLambda", {
            functionName: "saveXmlLambda",
            runtime: lambda.Runtime.NODEJS_22_X,
            timeout: cdk.Duration.seconds(60),
            memorySize: 128,
            handler: "saveXmlLambda.handler",
            code: lambda.Code.fromAsset(path.join(__dirname, "../../assets/dist/SaveXmlLambda/")),
        });

        rekognitionEventTopic.addSubscription(sqsSubscription);

        const mockThirdPartyAPI = new api.RestApi(this, "mockThirdPartyAPI", {
            restApiName: "3rdPartyServer",
            cloudWatchRole: true,
            description: "Mocks a 3rdParty integration server.",
            deploy: true,
//            defaultCorsPreflightOptions: {
//                allowOrigins: api.Cors.ALL_ORIGINS,
//                allowMethods: api.Cors.ALL_METHODS,
//                allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key']
//            }
        });

        const postXmlFileIntegration = new api.LambdaIntegration(saveXmlLambda, {
//            requestTemplates: {
//                'application/xml': '$input.body'
//            },
//            integrationResponses: [{
//                statusCode: '200',
//                responseParameters: {
//                    'method.response.header.Content-Type': "'application/xml'",
//                    'method.response.header.Access-Control-Allow-Origin': "'*'"
//                }
//            }]
        });

        mockThirdPartyAPI.root.addMethod("POST", postXmlFileIntegration, {
//            methodResponses: [{
//                statusCode: '200',
//                responseModels: {
//                    'application/xml': api.Model.EMPTY_MODEL
//                },
//                responseParameters: {
//                    'method.response.header.Content-Type': true,
//                    'method.response.header.Access-Control-Allow-Origin': true
//                }
//            }]
        });
        const intergrationLambdaFunction = new lambda.Function(this, "IntergrationLambdaFunction", {
            functionName: "intergrationLambdaFunction",
            runtime: lambda.Runtime.NODEJS_22_X,
            timeout: cdk.Duration.seconds(60),
            memorySize: 128,
            handler: "sendEmail.handler",
            code: lambda.Code.fromAsset(path.join(__dirname, "../../assets/dist/IntergrationLambda/")),
        });

        const invokeEventSource = new lambdaEvents.SqsEventSource(rekognitionQueue);
        intergrationLambdaFunction.addEventSource(invokeEventSource);

        // SSM Parameter Store permissions
        const ssmPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                "ssm:GetParameter",
            ],
            resources: ["*"],
        });

        intergrationLambdaFunction.addToRolePolicy(ssmPolicy);

        new cdk.CfnOutput(this, 'ThirdPartyAPIUrl', {
            value: mockThirdPartyAPI.url,
            description: 'URL of the mock third party API'
        });

        new cdk.CfnOutput(this, "snsArn", {
            value: rekognitionEventTopic.topicArn,
            exportName: "snsArn",
        });
    }
}
