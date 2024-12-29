const { Stack, Duration, RemovalPolicy } = require("aws-cdk-lib");
const rds = require("aws-cdk-lib/aws-rds");
const ec2 = require("aws-cdk-lib/aws-ec2");

class RdsSetupStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "MyVPC", {
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }
      ],
    });

    const subnetGroup = new rds.SubnetGroup(this, "RdsSubnetGroup", {
      vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    const dbSecurityGroup = new ec2.SecurityGroup(this, "DbSecurityGroup", {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: true,
    });

    const instance = new rds.DatabaseInstance(this, "Database", {
      engine: rds.DatabaseInstanceEngine.mariaDb({
        version: rds.MariaDbEngineVersion.VER_10_11_6,
      }),
      credentials: rds.Credentials.fromGeneratedSecret("admin"),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      subnetGroup,
      securityGroups: [dbSecurityGroup],
      databaseName: "mydatabase",
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.LARGE
      ),
      storageType: rds.StorageType.GP3,
      allocatedStorage: 20,
      multiAz: true,
      maxAllocatedStorage: 1000,
      backupRetention: Duration.days(7),
      enablePerformanceInsights: true,
      removalPolicy: RemovalPolicy.DESTROY,
      deletionProtection: false,
    });
  }
}

module.exports = { RdsSetupStack };
