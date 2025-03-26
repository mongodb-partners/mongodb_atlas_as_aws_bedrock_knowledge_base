// Import necessary modules
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import {NetworkLoadBalancer} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import {IpTarget} from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import * as iam from 'aws-cdk-lib/aws-iam';

// Import dotenv to load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

// Define the stack
export class MongodbAtlasAsAwsBedrockKnowledgeBaseStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

   // Define the VPC

    // Validate the .env values
    const vpcId = process.env.VPC_ID;
    if (!vpcId) { throw new Error('VPC_ID is not defined in the environment variables');}

    const vpc = ec2.Vpc.fromLookup(this, 'Vpc', { isDefault: false, vpcId: vpcId });

    // Log specific VPC properties
    console.log(`VPC ID: ${vpc.vpcId}`);
    console.log(`VPC CIDR: ${vpc.vpcCidrBlock}`);

    
    // create subnet selection
    
    // Validate the .env values     
    const availabilityZones = process.env.AVAILABILITY_ZONES;
    if (!availabilityZones) {
      throw new Error('AVAILABILITY_ZONES is not defined in the environment variables');
    }
          
    const vpcSubnets = vpc.selectSubnets({ availabilityZones: availabilityZones.split(','), onePerAz: true });

    // Log the subnet details
    console.log(vpcSubnets.subnetIds);

    // Validate the .env values 
    const portsEnv = process.env.PORTS;
    if (!portsEnv) { throw new Error('PORTS is not defined in the environment variables'); }

    console.log(`Ports: ${portsEnv}`)
    const ports = portsEnv.split(',').map(Number);
    
    // Log the Port details
    console.log(`Ports: ${ports}`);
  
 

    const nlbSg = new ec2.SecurityGroup(this, 'nlb-sg', { vpc });
    ports.forEach(port => {
      // nlbSg.addIngressRule(ec2.Peer.ipv4(vpc.vpcCidrBlock), ec2.Port.tcp(port), 'allow from vpc');
      nlbSg.addIngressRule(ec2.Peer.ipv4("0.0.0.0/0"), ec2.Port.tcp(port), 'allow from everywhere');
    })
    
    console.log(`Security Group ID: ${nlbSg.securityGroupId}`);

    const lb = new NetworkLoadBalancer(this, 'load-balancer-for-service-endpoint', { vpc, securityGroups:[nlbSg], vpcSubnets });
    console.log(`Load Balancer ARN: ${lb.loadBalancerArn}`);

    // Validate the .env values
    const vpceIpsEnv = process.env.VPCE_IPS;
    if (!vpceIpsEnv) { throw new Error('VPCE_IPS is not defined in the environment variables'); }

    const vpce_ips = vpceIpsEnv.split(',');
    
     // Log the VPC Endpoint IP details
    console.log(`VPC Endpoint IPs: ${vpce_ips}`);


    ports.forEach(port => {
        const listener = lb.addListener(`listener-${port}`, { port: port });
        console.log(`Listener ARN for port ${port}: ${listener.listenerArn}`);

        const ips_with_ports = vpce_ips.map(vpce_ip => new IpTarget(vpce_ip, port));
        console.log(`IP Targets for port ${port}: ${JSON.stringify(ips_with_ports)}`);

        listener.addTargets(`target-${port}`, {
          port: port,
          targetGroupName: `target--${port}-to-vpce`,
          targets: ips_with_ports,
        })
      }
    );

    const service = new ec2.VpcEndpointService(this, 'EndpointService', {
      vpcEndpointServiceLoadBalancers: [lb],
      acceptanceRequired: false,
      allowedPrincipals: [new iam.ArnPrincipal('bedrock.amazonaws.com'),
        new iam.ArnPrincipal('preprod.bedrock.aws.internal'),
        new iam.ArnPrincipal('beta.bedrock.aws.internal')
      ],
      contributorInsights: true
    });

    const plVpce_sg = process.env.VPCE_SG;
    if (!plVpce_sg) { throw new Error('VPCE_SG is not defined in the environment variables'); }

      // Import the existing security group
    const existingSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      'ImportedVPCESecurityGroup',
      plVpce_sg // The security group ID of your VPC endpoint
    );

    // Now you can add rules to the imported security group
    existingSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(nlbSg.securityGroupId),
      ec2.Port.allTcp(),
      'allow from service'
    );

    }
    

 }
