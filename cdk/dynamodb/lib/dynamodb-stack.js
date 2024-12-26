const { Stack, Duration } = require("aws-cdk-lib");
// const sqs = require('aws-cdk-lib/aws-sqs');
const lambda = require("aws-cdk-lib/aws-lambda");
const apigateway = require("aws-cdk-lib/aws-apigateway");


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

    const helloWorldFunction = new lambda.Function(this, "HelloWorldFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("lambda"), // The directory where the lambda code is sitting in.
      handler: "hello.handler", // Points to the 'hello' file in the lambda directory.
    });

    const api = new apigateway.LambdaRestApi(this, "HelloWorldApi", {
      handler: helloWorldFunction,
      proxy: false,
    });

    // /helo resource

    const helloResource = api.root.addResource("hello");
    helloResource.addMethod("Get");
  }
}

module.exports = { DynamodbStack };
