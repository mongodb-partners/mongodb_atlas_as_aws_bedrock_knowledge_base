#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MongodbAtlasAsAwsBedrockKnowledgeBaseStack } from '../lib/mongodb_atlas_as_aws_bedrock_knowledge_base-stack';
import * as dotenv from 'dotenv';
import * as iam from 'aws-cdk-lib/aws-iam';

// Load environment variables from .env file
dotenv.config({ path: '../.env' });

const app = new cdk.App();

// Define the custom deployment role ARN
// If DEPLOYMENT_ROLE_ARN is not provided in .env, CDK will use default behavior
const deploymentRoleArn = process.env.DEPLOYMENT_ROLE_ARN || undefined;

new MongodbAtlasAsAwsBedrockKnowledgeBaseStack(app, 'MongodbAtlasAsAwsBedrockKnowledgeBaseStack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  env: { account: process.env.AWS_ACCOUNT_ID, region: process.env.AWS_REGION},

  // Use a custom deployment role if provided
  ...(deploymentRoleArn && { 
    deploymentRoles: {
      'MongodbAtlasAsAwsBedrockKnowledgeBaseStack': deploymentRoleArn
    }
  }),

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});