import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as snsSubs from "aws-cdk-lib/aws-sns-subscriptions";
import * as path from "path";
import { Construct } from "constructs";

export class APIStack extends cdk.Stack {

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // "cdk-apistack-role" role was created manually in the console
        iam.Role.customizeRoles(this, {
            usePrecreatedRoles: {
                "APIStack/BucketNotificationsHandler050a0587b7544547bf325f094a3db834/Role": "cdk-apistack-role",
                "APIStack/ImageGetAndSaveLambda/ServiceRole": "cdk-apistack-role",
            },
        });

        const bucket = new s3.Bucket(this, "CW-Workshop-Images",{});

        const imageGetAndSaveLambda = new lambda.Function(this, "ImageGetAndSaveLambda", {
            functionName: "ImageGetAndSaveLambda",
            runtime: lambda.Runtime.NODEJS_22_X,
            timeout: cdk.Duration.seconds(60),
            memorySize: 128,
            handler: "getSaveImage.handler",
            code: lambda.Code.fromAsset(path.join(__dirname, "../../assets/dist/ImageGetAndSaveLambda/")),
            environment: {
                'BUCKET_NAME': bucket.bucketName
            }
        });

        bucket.grantReadWrite(imageGetAndSaveLambda);

        const api = new apigateway.RestApi(this, "RESTAPI", {
            restApiName: "Image Upload Service",
            cloudWatchRole: false,
            description: "CW workshop - Upload a image for workshop.",
        });

        const getImageIntegration = new apigateway.LambdaIntegration(imageGetAndSaveLambda, {
            requestTemplates: {
                "application/json": JSON.stringify({
                    statusCode: "200",
                }),
            },
        });

        api.root.addMethod("GET", getImageIntegration);


        const uploadQueue = new sqs.Queue(this, "uploadedImageQueue", {
            visibilityTimeout: cdk.Duration.seconds(60),
        });

        const sqsSubscription = new snsSubs.SqsSubscription(uploadQueue, {
            rawMessageDelivery: true,
        });

        const uploadEventTopic = new sns.Topic(this, "uploadedImageTopic", {});

        uploadEventTopic.addSubscription(sqsSubscription);

        bucket.addEventNotification(s3.EventType.OBJECT_CREATED_PUT, new s3n.SnsDestination(uploadEventTopic));


        new cdk.CfnOutput(this, "apiUrl", {
            value: api.url,
            exportName: "apiUrl",
        });

        new cdk.CfnOutput(this, "uploadQueueUrl", {
            value: uploadQueue.queueUrl,
            exportName: "uploadQueueUrl",
        });

        new cdk.CfnOutput(this, "uploadQueueArn", {
            value: uploadQueue.queueArn,
            exportName: "uploadQueueArn",
        });

        new cdk.CfnOutput(this, "uploadSnsArn", {
            value: uploadEventTopic.topicArn,
            exportName: "uploadSnsArn",
        });

    }
}


