import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";
import { Construct } from "constructs";

export class RekognitionStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const importedSqsUrl = cdk.Fn.importValue("uploadQueueUrl");
        const importedSqsArn = cdk.Fn.importValue("uploadQueueArn");
        const importedSnsArn = cdk.Fn.importValue("snsArn");

        iam.Role.customizeRoles(this, {
            usePrecreatedRoles: {
                "RekognitionStack/imageRecognition/ServiceRole": "cdk-rekognition-role",
                "RekognitionStack/listImages/ServiceRole": "cdk-rekognition-role",
                "": "",
            },
        });

        const group = new iam.Group(this, "RekGroup", {});
        const user = new iam.User(this, "RekUser", {});
        user.addToGroup(group);

        const table = new dynamodb.Table(this, "Classifications", {
            partitionKey:  {
                name: "image",
                type: dynamodb.AttributeType.STRING,
            }
        });

        const lambdaFunctionImageRec = new lambda.Function(this, "imageRecognition", {
            functionName: "imageRecognition",
            runtime: lambda.Runtime.NODEJS_22_X,
            timeout: cdk.Duration.seconds(60),
            memorySize: 128,
            handler: "imageRecognition.handler",
            code: lambda.Code.fromAsset(path.join(__dirname, "../../assets/dist/ImageRecognitionLambda/")),
            environment: {
                "TABLE_NAME": table.tableName,
                "SQS_QUEUE_URL": importedSqsUrl,
                "TOPIC_ARN": importedSnsArn,
            }

        });

        lambdaFunctionImageRec.addEventSourceMapping("ImgRekognitionLambda", {
            eventSourceArn: importedSqsArn,
        });

        const rekognitionStatement = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["rekognition:DetectLabels"],
            resources: ["*"],
        });

        lambdaFunctionImageRec.addToRolePolicy(rekognitionStatement);


        const snsPermission = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                "sns:Publish",
            ],
            resources: ["*"],
        });

        lambdaFunctionImageRec.addToRolePolicy(snsPermission);

        const sqsPermission = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                "sqs:ChangeMessageVisibility",
                "sqs:DeleteMessage",
                "sqs:GetQueueAttributes",
                "sqs:GetQueueUrl",
                "sqs:ReceiveMessage",
            ],
            resources: ["*"],
        });

        lambdaFunctionImageRec.addToRolePolicy(sqsPermission);

        table.grantReadData(lambdaFunctionImageRec);

        const s3Permission = new iam.PolicyStatement({
           effect: iam.Effect.ALLOW,
           actions: [
                "s3:get",
           ],
           resources: ["*"],
        });

        lambdaFunctionImageRec.addToRolePolicy(s3Permission);

        const lambdaFunctionListImages = new lambda.Function(this, "listImages", {
            functionName: "listImages",
            runtime: lambda.Runtime.NODEJS_22_X,
            timeout: cdk.Duration.seconds(60),
            memorySize: 128,
            handler: "listImages.handler",
            code: lambda.Code.fromAsset(path.join(__dirname, "../../assets/dist/ListImagesLambda/")),
            environment: {
                "TABLE_NAME": table.tableName,
            },
        });

        const api = new apigateway.RestApi(this, "REST_API", {
            restApiName: "List Images Service",
            cloudWatchRole: false,
            description: "list images recognized",
        });

        const listImagesIntegration = new apigateway.LambdaIntegration(lambdaFunctionListImages, {
            requestTemplates: {
              "application/json": JSON.stringify({
                  statusCode: "200",
              }),
            },
        })

        api.root.addMethod("GET", listImagesIntegration);
        table.grantReadData(lambdaFunctionListImages);
    }
}
