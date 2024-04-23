# Introduction

This repository contains the CDK script and instruction on how to configure Amazon Bedrock Knowledge Base with PrivateLink to MongoDB Atlas. 


# Solution Architecture

Amazon Bedrock can connect to your Knowledge Base over the Internet and via a PrivateLink.  To connect over the PrivateLink, we need to create an Endpoint Service.  This Endpoint Service needs to be backed by a Network Load Balancer forwarding traffic to MongoDB Atlas PrivateLink. 

![alt text](genAI-Bedrock-PL-blog.drawio.png)


# Prerequisite

MongoDB Atlas Account
AWS Account 
AWS CLI
NPM

# Implementation Steps
The steps below describe the required configuration.

* Configure the PrivateLink connection in MongoDB Atlas.  Note the VPC ID of the VPC where you create the PL.

* In AWS Console, navigate to VPC | Endpoints.  Select your endpoint and select the Subnets tab.  Note the IP addresses and the AZs, we use them later in the configuration

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

* Next use the CDK script in this repo to create Service Endpoint fronting your PrivateLink Endpoint.  In order to run the script you need the information you collected in the previous steps: VPC ID, MongoDB Atlas cluster ports, AZs, and PL IPs.

## Step 1

Git clone the repository

` git clone https://github.com/mongodb-partners/mongodb_atlas_as_aws_bedrock_knowledge_base.git`

## Step 2

Update the parameter file

## Step 3

`cdk bootstrap`


## Step 4

`cdk deploy`

## Step 5

Test the output

# clean up

`cdk destroy`

* When the script completes, in AWS Console | CloudFormation, navigate to Resources tab and click on the vpce link
![alt text](image-1.png)

* Select your service endpoint and note the service name on the details page.
![alt text](image-2.png)

* Proceed with the configuration of the [KB in Bedrock](http://link.to.blog).  It is the same as before with an additional step where you supply PrivateLink service name:
![alt text](image-3.png)

# Conclusion
 When you complete, the configuration ensures your data stays private and does not travel over the Internet.




## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
