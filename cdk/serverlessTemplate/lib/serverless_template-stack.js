import { Stack, Duration } from "aws-cdk-lib";
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import { LambdaIntegration, LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { Role, ServicePrincipal, CompositePrincipal, PolicyStatement } from "aws-cdk-lib/aws-iam";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import path from "path";
import { fileURLToPath } from "url";

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ServerlessTemplateStack extends Stack {
    /**
     * @param {Construct} scope
     * @param {string} id
     * @param {StackProps=} props
     */
    constructor(scope, id, props) {
        super(scope, id, props);

        const table = new dynamodb.TableV2(this, "app_table", {
            partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
            tableName: "app_table",
        });

        const role = new Role(this, "dynamodbRole", {
            assumedBy: new CompositePrincipal(
                new ServicePrincipal("lambda.amazonaws.com")
            ),
        });

        role.addToPolicy(
            new PolicyStatement({
                resources: ["*"],
                actions: [
                    "dynamodb:DeleteItem",
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:Scan",
                    "dynamodb:UpdateItem",
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                ],
            })
        );

        const lambdaFunc = new Function(this, "testFunction", {
            functionName: "testFunctionName",
            runtime: Runtime.NODEJS_20_X,
            timeout: Duration.seconds(3),
            memorySize: 128,
            handler: "index.handler",
            code: Code.fromAsset(path.join(__dirname, "../assets")),
            role: role,
        });

        const api = new LambdaRestApi(this, "testHelloWorldApi", {
            restApiName: "testApi",
            handler: lambdaFunc,
            proxy: false,
        });

        const helloResource = api.root.addResource("hello");
        helloResource.addMethod("GET");
    }
}

