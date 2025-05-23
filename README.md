# Introduction

This repository contains the CDK script and instructions on how to configure an Amazon Bedrock Knowledge Base with PrivateLink connecting to MongoDB Atlas. 


# Solution Architecture

Amazon Bedrock can connect to your Knowledge Base over the Internet and via a PrivateLink.  To connect over the PrivateLink, we need to create an Endpoint Service.  This Endpoint Service needs to be backed by a Network Load Balancer forwarding traffic to MongoDB Atlas PrivateLink. 

![Solution architecture diagram of the Amazon Bedrock Knowledge Base with PrivateLink connecting to MongoDB Atlas](images/genAI-Bedrock-PL-blog.drawio.png)


# Prerequisites

* [MongoDB Atlas Account](https://www.mongodb.com/cloud/atlas/register)
* [AWS Account](https://portal.aws.amazon.com/billing/signup)
* [AWS CLI](https://aws.amazon.com/cli/)
* [NPM](https://www.npmjs.com/get-npm)
* [Node.js](https://nodejs.org/en/download/)
* [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html)


# Implementation Steps

Ensure you read the [blog](https://www.mongodb.com/developer/products/atlas/rag-workflow-with-atlas-amazon-bedrock/) , before implementing the below steps.

The steps below describe the required configuration.

* Configure the [PrivateLink connection in MongoDB Atlas](https://aws.amazon.com/blogs/apn/connecting-applications-securely-to-a-mongodb-atlas-data-plane-with-aws-privatelink/).  Note the VPC ID of the VPC where you create the PL.

* Once PrivateLink configuration is done, in AWS Console, navigate to VPC | Endpoints.  Select your MongoDB Atlas endpoint and select the Subnets tab.  Note the IP addresses and the AZs, we use them later in the configuration.

![Amazon VPC console showing the Endpoints section with the MongoDB Atlas endpoint selected and the Subnets tab open, displaying the IP addresses and Availability Zones](images/vpc-endpoints-subnets.png)

* Next, look up the ports for your MongoDB Atlas cluster, by running the command below. Replace the values for XXXX to that of your MongoDB Atlas server.

```
nslookup -type=SRV _mongodb._tcp.XXXXX-pl-0.XXXX.mongodb.net
```
The command  produces output as follows:
```
Server:		10.XXX.XX.XX
Address:	10.XXX.XX.XX#53

Non-authoritative answer:
_mongodb._tcp.cluster2-pl-0.XXXX.mongodb.net	service = 0 0 1030 pl-0-us-west-2.XXXX.mongodb.net.
_mongodb._tcp.cluster2-pl-0.XXX.mongodb.net	service = 0 0 1031 pl-0-us-west-2.XXXX.mongodb.net.
_mongodb._tcp.cluster2-pl-0.XXXX.mongodb.net	service = 0 0 1032 pl-0-us-west-2.XXXX.mongodb.net
```

* The ports in this case are 1030, 1031, and 1032.  They might be different in your case.

* Next use the CDK script in this repo to create Service Endpoint fronting your PrivateLink Endpoint.  In order to run the script, you need the information you collected in the previous steps: VPC ID, MongoDB Atlas cluster ports, AZs, and PL IPs.

# Running the script
## Step 1

- Clone the repository 

`git clone https://github.com/mongodb-partners/mongodb_atlas_as_aws_bedrock_knowledge_base.git`
  
- Copy .env-example to .env

  ` cd mongodb_atlas_as_aws_bedrock_knowledge_base `
  
  ` cp .env-example .env `

  ` npm install aws-cdk-lib dotenv `
  
- Update the .env file with appropriate values

```
AWS_ACCOUNT_ID = "XXXXXX" # the AWS account ID
AWS_REGION = "us-east-1" # the AWS region

# VPC / VPCE configuration
VPC_ID="vpc-XXXXXX" # the VPC ID where the VPC endpoints will be created
SUBNET_IDS = subnet-xxxxxx,subnet-xxxxxx # the subnet IDs where the VPC endpoints will be created
PORTS = "1024, 1025, 1026" # the ports that will be opened in the security group
VPCE_IPS = "10.x.x.x,10.x.x.x" # the IPs of the VPC endpoints
VPCE_SG = "sg-xxxxxx" # the security group of the MongoDB Atlas Private Link endpoint

# Optional: Custom deployment role ARN to avoid using AdministratorAccess
# DEPLOYMENT_ROLE_ARN = "arn:aws:iam::ACCOUNT_ID:role/MongoDBAtlasBedrockKBDeployRole"
```

## Step 2 (Optional but Recommended): Create a Custom Deployment Role

To avoid using `AdministratorAccess` permissions, you can create a custom IAM role with the minimum required permissions:

1. Create the policy document (a sample file `mongodb-atlas-bedrock-kb-policy.json` is provided in this repository)

```bash
aws iam create-policy \
  --policy-name MongoDBAtlasBedrockKBDeployPolicy \
  --policy-document file://mongodb-atlas-bedrock-kb-policy.json
```

2. Create the role that will be used for deployment

```bash
aws iam create-role \
  --role-name MongoDBAtlasBedrockKBDeployRole \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"cloudformation.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
```

3. Attach the policy to the role

```bash
aws iam attach-role-policy \
  --role-name MongoDBAtlasBedrockKBDeployRole \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/MongoDBAtlasBedrockKBDeployPolicy
```

4. Create a policy to allow the CDK bootstrap role to pass your custom role:
    1. Below command will create an IAM policy using the permissions defined in the pass-role-policy.json file
        ```
        aws iam create-policy \
          --policy-name CDKPassRolePolicy \
          --policy-document file://pass-role-policy.json
        ```
    2. Below command will attach the policy to the Cloudformation deploy role
        ```
        aws iam attach-role-policy \
          --role-name cdk-hnb659fds-deploy-role-YOUR_ACCOUNT_ID-REGION \
          --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/CDKPassRolePolicy
        ```
        Note: Replace YOUR_ACCOUNT_ID with your AWS account ID and REGION with your AWS region (e.g., us-east-1).

5. Update your `.env` file with the role ARN

```
DEPLOYMENT_ROLE_ARN = "arn:aws:iam::YOUR_ACCOUNT_ID:role/MongoDBAtlasBedrockKBDeployRole"
```

## Step 3

```
cdk bootstrap --cloudformation-execution-policies "arn:aws:iam::YOUR_ACCOUNT_ID:policy/MongoDBAtlasBedrockKBDeployPolicy"
```
Replace `YOUR_ACCOUNT_ID` with your AWS Account ID

## Step 4

```
cdk deploy --role-arn "arn:aws:iam::YOUR_ACCOUNT_ID:role/MongoDBAtlasBedrockKBDeployRole"
```
Replace `YOUR_ACCOUNT_ID` with your AWS Account ID

# Bedrock KB Configuration
* Note: The customer’s VPC endpoint service must be in the same account as the knowledge base. For preventing a VPC endpoint service from being re-used across multiple knowledge bases within the same AWS account, customers can utilize the [bedrock:ThirdPartyKnowledgeBaseCredentialsSecretArn](https://docs.aws.amazon.com/service-authorization/latest/reference/list_amazonbedrock.html#amazonbedrock-bedrock_ThirdPartyKnowledgeBaseCredentialsSecretArn) condition key.


  https://github.com/mongodb-partners/mongodb_atlas_as_aws_bedrock_knowledge_base/blob/main/images/Cloudformation_resouces.png

* When the script completes, in AWS Console | CloudFormation, navigate to Resources tab and click on the vpce link
![CloudFormation console showing the Resources tab with the vpce link highlighted](images/Cloudformation_resouces.png)

* Select your service endpoint and note the service name on the details page.
![Details page of the selected service endpoint showing the service name](images/service-endpoints.png)

* Proceed with the configuration of the KB in Bedrock as per [blog](https://www.mongodb.com/developer/products/atlas/rag-workflow-with-atlas-amazon-bedrock). When asked for Hostname enter the PrivateLink DNS name.  It looks something like `cluster2-pl-0.XXXX.mongodb.net `. The rest of the configuration is same, with an additional step where you supply PrivateLink service name.  Here you supply the Endpoint Service name, that you have configured with this script:
![Bedrock Knowledge Base configuration screen with the PrivateLink DNS name and Endpoint Service name fields highlighted](images/bedrock-atlas-pl.png)

* Complete the rest of the steps as per the [blog](https://www.mongodb.com/developer/products/atlas/rag-workflow-with-atlas-amazon-bedrock).

# Conclusion
 When you complete, the configuration ensures your data stays private and does not travel over the Internet.

# Cleanup
* Run the command below to delete the resources.
`cdk destroy --all`


# CDK Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
