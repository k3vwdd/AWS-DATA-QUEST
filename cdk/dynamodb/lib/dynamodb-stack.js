const { Stack, Duration } = require("aws-cdk-lib");
// const sqs = require('aws-cdk-lib/aws-sqs');
const lambda = require("aws-cdk-lib/aws-lambda");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const iam = require("aws-cdk-lib/aws-iam");

class DynamodbStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'DynamodbQueue', {
    //   visibilityTimeout: Duration.seconds(300)
    // });

    // const helloWorldFunction = new lambda.Function(this, "HelloWorldFunction", {
    //   runtime: lambda.Runtime.NODEJS_20_X,
    //   code: lambda.Code.fromAsset("lambda"), // The directory where the lambda code is sitting in.
    //   handler: "hello.handler", // Points to the 'hello' file in the lambda directory.
    // });

    const role = new iam.Role(this, "myNewRole", {
      assumedBy: new iam.CompositePrincipal(
        //new iam.ServicePrincipal("cloudwatch.amazonaws.com"),
        //new iam.ServicePrincipal("dynamodb.amazonaws.com"),
        new iam.ServicePrincipal("lambda.amazonaws.com"),
      ),
    });

    role.addToPolicy(
      new iam.PolicyStatement({
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
      }),
    );

    const table = new dynamodb.TableV2(this, "vehicles", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      tableName: "vehicles",
    });

    const labFunction = new lambda.Function(this, "labFunction", {
      runtime: lambda.Runtime.PYTHON_3_11,
      code: lambda.Code.fromAsset("lambda"),
      handler: "lambdaSampleVehicleCode.lambda_handler",
      role: role,
    });

    const api = new apigateway.LambdaRestApi(this, "DIY-API", {
      handler: labFunction,
      proxy: false,
    });

    const vehicleResource = api.root.addResource("vehicles");
    vehicleResource.addMethod("Post");

    // const api = new apigateway.LambdaRestApi(this, "HelloWorldApi", {
    //   handler: helloWorldFunction,
    //   proxy: false,
    // });

    // '/hello' resource

    // const helloResource = api.root.addResource("hello");
    // helloResource.addMethod("Get");
  }
}

module.exports = { DynamodbStack };
