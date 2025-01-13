import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as path from "path";

export class OrchestrateServerlessWorkflowsStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const labBucket = new s3.Bucket(this, "lab-bucket-stepfunctions", {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        const processS3Event = new lambda.Function(this, "process_s3_event", {
            functionName: "process_s3_event",
            runtime: lambda.Runtime.NODEJS_22_X,
            timeout: cdk.Duration.seconds(60),
            memorySize: 128,
            handler: "process_s3_event.handler",
            code: lambda.Code.fromAsset(
                path.join(__dirname, "../assets/dist/")
            ),
            environment: {
                'BUCKET_NAME': labBucket.bucketName
            }
        });

        labBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(processS3Event));

        const servicePolicy = new iam.Policy(this,"serviceRolePolicy", {
                policyName: "CustomlambdaExecutionRole",
                statements: [
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        actions: [
                                "dynamodb:*",
                                "dax:*",
                                "application-autoscaling:DeleteScalingPolicy",
                                "application-autoscaling:DeregisterScalableTarget",
                                "application-autoscaling:DescribeScalableTargets",
                                "application-autoscaling:DescribeScalingActivities",
                                "application-autoscaling:DescribeScalingPolicies",
                                "application-autoscaling:PutScalingPolicy",
                                "application-autoscaling:RegisterScalableTarget",
                                "cloudwatch:DeleteAlarms",
                                "cloudwatch:DescribeAlarmHistory",
                                "cloudwatch:DescribeAlarms",
                                "cloudwatch:DescribeAlarmsForMetric",
                                "cloudwatch:GetMetricStatistics",
                                "cloudwatch:ListMetrics",
                                "cloudwatch:PutMetricAlarm",
                                "cloudwatch:GetMetricData",
                                "datapipeline:ActivatePipeline",
                                "datapipeline:CreatePipeline",
                                "datapipeline:DeletePipeline",
                                "datapipeline:DescribeObjects",
                                "datapipeline:DescribePipelines",
                                "datapipeline:GetPipelineDefinition",
                                "datapipeline:ListPipelines",
                                "datapipeline:PutPipelineDefinition",
                                "datapipeline:QueryObjects",
                                "ec2:DescribeVpcs",
                                "ec2:DescribeSubnets",
                                "ec2:DescribeSecurityGroups",
                                "iam:GetRole",
                                "iam:ListRoles",
                                "kms:DescribeKey",
                                "kms:ListAliases",
                                "sns:CreateTopic",
                                "sns:DeleteTopic",
                                "sns:ListSubscriptions",
                                "sns:ListSubscriptionsByTopic",
                                "sns:ListTopics",
                                "sns:Subscribe",
                                "sns:Unsubscribe",
                                "sns:SetTopicAttributes",
                                "lambda:CreateFunction",
                                "lambda:ListFunctions",
                                "lambda:ListEventSourceMappings",
                                "lambda:CreateEventSourceMapping",
                                "lambda:DeleteEventSourceMapping",
                                "lambda:GetFunctionConfiguration",
                                "lambda:DeleteFunction",
                                "resource-groups:ListGroups",
                                "resource-groups:ListGroupResources",
                                "resource-groups:GetGroup",
                                "resource-groups:GetGroupQuery",
                                "resource-groups:DeleteGroup",
                                "resource-groups:CreateGroup",
                                "tag:GetResources",
                                "kinesis:ListStreams",
                                "kinesis:DescribeStream",
                                "kinesis:DescribeStreamSummary",
                                "rekognition:*",
                                "s3:*",
                                "s3-object-lambda:*",
                                "sqs:*",
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents",
                                "states:*",
                               "comprehend:*",
                                "s3:ListAllMyBuckets",
                                "s3:ListBucket",
                                "s3:GetBucketLocation",
                                "iam:ListRoles",
                                "iam:GetRole",
                        ],
                        resources: ["*"],
                    }),
                ],
            },
        );

        processS3Event.role?.attachInlinePolicy(servicePolicy);


    }
}
