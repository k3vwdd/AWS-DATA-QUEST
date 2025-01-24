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
        });

        const postXmlFileIntegration = new api.LambdaIntegration(saveXmlLambda, {
        });

        mockThirdPartyAPI.root.addMethod("POST", postXmlFileIntegration, {});

        const integrationLambdaFunction = new lambda.Function(this, "IntegrationLambdaFunction", {
            functionName: "intergrationLambdaFunction",
            runtime: lambda.Runtime.NODEJS_22_X,
            timeout: cdk.Duration.seconds(60),
            memorySize: 128,
            handler: "sendEmail.handler",
            code: lambda.Code.fromAsset(path.join(__dirname, "../../assets/dist/IntergrationLambda/")),
        });

        const invokeEventSource = new lambdaEvents.SqsEventSource(rekognitionQueue);
        integrationLambdaFunction.addEventSource(invokeEventSource);

        const integrationLambdaFunctionPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                "sqs:ChangeMessageVisibility",
                "sqs:DeleteMessage",
                "sqs:GetQueueAttributes",
                "sqs:GetQueueUrl",
                "sqs:ReceiveMessage"
            ],
        });

        const saveS3Policy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                "s3:Abort*",
                "s3:DeleteObject*",
                "s3:GetBucket*",
                "s3:GetObject*",
                "s3:List*",
                "s3:PutObject",
                "s3:PutObjectLegalHold",
                "s3:PutObjectRetention",
                "s3:PutObjectTagging",
                "s3:PutObjectVersionTagging"
            ],
            resources: [
                "Insert bucket arn",
                "Insert bucket arn/*"
            ],
        });

        saveXmlLambda.addToRolePolicy(saveS3Policy);

        // SSM Parameter Store permissions
        const ssmPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                "ssm:GetParameter",
            ],
            resources: ["*"],
        });

        integrationLambdaFunction.addToRolePolicy(ssmPolicy);

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
