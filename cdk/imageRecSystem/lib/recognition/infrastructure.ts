import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as eventsources from "aws-cdk-lib/aws-lambda-event-sources";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";
import { Construct } from "constructs";

export class RekognitionStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const importedSqsUrl = cdk.Fn.importValue("uploadQueueUrl");
        const importedSqsArn = cdk.Fn.importValue("uploadQueueArn");
        const importedSnsArn = cdk.Fn.importValue("uploadSnsArn");

        iam.Role.customizeRoles(this, {
            usePrecreatedRoles: {
                "RekognitionStack/imageRecognition/ServiceRole":
                    "cdk-rekognition-role",
                "RekognitionStack/ListImagesLambda/ServiceRole":
                    "cdk-rekognition-role",
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
            code: lambda.Code.fromAsset(path.join(__dirname, "../../assets/dist/imageRecognitionLambda/")),
            environment: {
                "TABLE_NAME": table.tableName,
                "SQS_QUEUE_URL": importedSqsUrl,
                "TOPIC_ARN": importedSnsArn,
            }

        });

        lambdaFunctionImageRec.addEventSourceMapping("ImgRekognitionLambda", {
            eventSourceArn: importedSqsArn,
        });
    }
}
