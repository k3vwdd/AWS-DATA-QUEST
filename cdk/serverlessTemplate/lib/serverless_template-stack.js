import { Stack, Duration } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import { HttpApi, HttpMethod } from "aws-cdk-lib/aws-apigatewayv2";
import {
    HttpLambdaIntegration,
} from "aws-cdk-lib/aws-apigatewayv2-integrations";

import {
    Role,
    ServicePrincipal,
    CompositePrincipal,
    PolicyStatement,
} from "aws-cdk-lib/aws-iam";
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
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
            tableName: "app_table",
        });

        const role = new Role(this, "dynamodbRole", {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            assumedBy: new CompositePrincipal(
                new ServicePrincipal("lambda.amazonaws.com"),
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
                    "dynamodb:ListTables",
                    "dynamodb:DescribeTable",
                    "dynamodb:UpdateTable",
                    "dynamodb:DescribeStream",
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                ],
            }),
        );

        const lambdaFunc = new Function(this, "testFunction", {
            functionName: "testFunctionName",
            runtime: Runtime.NODEJS_20_X,
            timeout: Duration.seconds(3),
            memorySize: 128,
            handler: "index.handler",
            code: Code.fromAsset(path.join(__dirname, "../assets")),
            role: role,
            environment: {
                TABLE_NAME: table.tableName,
            },
        });

        table.grantReadData(lambdaFunc);

        const httpApi = new HttpApi(this, "testHelloWorldApi", {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            ApiName: "HttptestApi",
        });

        httpApi.addRoutes({
            path: "/hello",
            methods: [HttpMethod.GET],
            integration: new HttpLambdaIntegration("LambdaHello", lambdaFunc),
        });

        new cdk.CfnOutput(this, "apiUrl", {
            value: httpApi.url,
        });
    }
}
