import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import {NetworkLoadBalancer} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import {IpTarget} from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import * as iam from 'aws-cdk-lib/aws-iam';

export class MongodbAtlasAsAwsBedrockKnowledgeBaseStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // define network load balancer
    const vpc = ec2.Vpc.fromLookup(this, this.node.tryGetContext("vpc_id"), { isDefault: true });

    // create subnet selection
    const vpcSubnets = vpc.selectSubnets({
      // subnets: [subnet1, subnet2],
      availabilityZones: this.node.tryGetContext("availabilityZones")
    });

    const ports = this.node.tryGetContext("ports") as number[];

    const nlbSg = new ec2.SecurityGroup(this, 'nlb-sg', { vpc });
    ports.forEach(port => {
      // nlbSg.addIngressRule(ec2.Peer.ipv4(vpc.vpcCidrBlock), ec2.Port.tcp(port), 'allow from vpc');
      nlbSg.addIngressRule(ec2.Peer.ipv4("0.0.0.0/0"), ec2.Port.tcp(port), 'allow from everywhere');
    })
    
    const lb = new NetworkLoadBalancer(this, 'load-balancer-for-service-endpoint', { vpc, securityGroups:[nlbSg], vpcSubnets });

    const vpce_ips = this.node.tryGetContext("vpce_ips") as string[];

    ports.forEach(port => {
        const listener = lb.addListener(`listener-${port}`, { port: port });

        const ips_with_ports = vpce_ips.map(vpce_ip => new IpTarget(vpce_ip, port));

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

 }
}
