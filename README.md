# Introduction

This repository contains the CDK script and instructions on how to configure an Amazon Bedrock Knowledge Base with PrivateLink connecting to MongoDB Atlas. 


# Solution Architecture

Amazon Bedrock can connect to your Knowledge Base over the Internet and via a PrivateLink.  To connect over the PrivateLink, we need to create an Endpoint Service.  This Endpoint Service needs to be backed by a Network Load Balancer forwarding traffic to MongoDB Atlas PrivateLink. 

![alt text](genAI-Bedrock-PL-blog.drawio.png)


# Prerequisites

* MongoDB Atlas Account
* AWS Account 
* AWS CLI
* NPM
* Node.js

# Implementation Steps
The steps below describe the required configuration.

* Configure the [PrivateLink connection in MongoDB Atlas](https://aws.amazon.com/blogs/apn/connecting-applications-securely-to-a-mongodb-atlas-data-plane-with-aws-privatelink/).  Note the VPC ID of the VPC where you create the PL.

* Once PrivateLink configuration is done, in AWS Console, navigate to VPC | Endpoints.  Select your MongoDB Atlas endpoint and select the Subnets tab.  Note the IP addresses and the AZs, we use them later in the configuration.

![alt text](image.png)

* Next, look up the ports for your MongoDB Atlas cluster, by running the command below.

```
nslookup -type=SRV _mongodb._tcp.cluster2-pl-0.XXXX.mongodb.net
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
* Modify [cdk.json](cdk.json) `context` section to replacing the placeholders with the information collected in the previous steps. 

```
  "availabilityZones": ["<az1>", "<az2>"],
    "ports": [1031, 1032, 1030],
    "vpc_id": "<vpc_id>",
    "vpce_ips": ["<ip1>", "<ip2>"],
```

# Running the script
## Step 1
`cdk bootstrap`

## Step 2

`cdk deploy`

# Bedrock KB Configuration

* When the script completes, in AWS Console | CloudFormation, navigate to Resources tab and click on the vpce link
![alt text](image-1.png)

* Select your service endpoint and note the service name on the details page.
![alt text](image-2.png)

* Proceed with the configuration of the KB in Bedrock as per [blog](https://www.mongodb.com/developer/products/atlas/rag-workflow-with-atlas-amazon-bedrock). When asked for Hostname enter the PrivateLink DNS name.  It looks something like `cluster2-pl-0.XXXX.mongodb.net `. The rest of the configuration is same, with an additional step where you supply PrivateLink service name.  Here you supply the Endpoint Service name, that you have configured with this script:
![alt text](image-3.png)

* Complete the rest of the steps as per the [blog](https://www.mongodb.com/developer/products/atlas/rag-workflow-with-atlas-amazon-bedrock).

# Conclusion
 When you complete, the configuration ensures your data stays private and does not travel over the Internet.

# Cleanup
* Run the command below to delete the resources.
`cdk destroy`


# CDK Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
