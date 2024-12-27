const { Stack, Duration } = require("aws-cdk-lib");
const s3 = require("aws-cdk-lib/aws-s3");
const s3deploy = require("aws-cdk-lib/aws-s3-deployment");
const iam = require("aws-cdk-lib/aws-iam");

class SpaStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const spaBucket = new s3.Bucket(this, "spa-lab-bucket", {
      bucketName: "spa-lab-bucket",
      websiteIndexDocument: "index.html",
      publicReadAccess: true,
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
    });

    new s3deploy.BucketDeployment(this, "DeploySpaWebsite", {
      sources: [
        s3deploy.Source.asset(
          "/home/k3vwd/work/aws-solutions-architect/AWS-DATA-QUEST/cdk/spa/lib/spa-files",
        ),
      ],
      destinationBucket: spaBucket,
    });

    new iam.PolicyStatement({
      actions: ["s3:GetObject"],
      resources: [spaBucket],
    });
  }
}

module.exports = { SpaStack };
