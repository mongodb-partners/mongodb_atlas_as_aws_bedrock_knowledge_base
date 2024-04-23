# Introduction

Amazon Bedrock, Amazon Web Services (AWS) managed cloud service for gen AI, empowers developers to build applications on top of powerful foundation models like Anthropic's Claude, Cohere Embed, and Amazon Titan. By integrating with Atlas Vector Search, Amazon Bedrock enables customers to leverage the vector database capabilities of Atlas to bring up-to-date context grounded in proprietary data. 

With the click of a button, Amazon Bedrock now integrates MongoDB Atlas as a vector database into its fully managed, end-to-end Retrieval Augmented Generation (RAG) workflow, negating the need to build custom integrations to data sources or manage data flows. 


# Retrieval Augmented Generation(RAG)

One of the biggest challenges when working with gen AI is trying to avoid hallucinations, or erroneous results returned by the foundation model (FM) being used.  The FMs are trained on public information that gets outdated quickly and the models cannot take advantage of the proprietary information that enterprises possess.

One way to tackle hallucinating FMs is to supplement a query with your own data using a workflow known as Retrieval Augmented Generation, or RAG. In a RAG workflow the FM will seek specific data, for instance a customer's previous purchase history, from a designated database that acts as a “source of truth” to augment the results returned by the FM. In order for a gen AI FM to search for, locate, and augment its responses, the relevant data needs to be turned into a vector and stored in a vector database.

# Solution Architecture

<img width="785" alt="image" src="https://github.com/mongodb-partners/mongodb_atlas_as_aws_bedrock_knowledge_base/assets/101570105/03966378-a96d-4797-97f5-744f7d8c3b73">

# Prerequisite

MongoDB Atlas Account
AWS Account 
AWS CLI
NPM

# Implementation Steps


## Step 1

Git clone the repository

` git clone `

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

# Conclusion:
This blog demonstrates the process of establishing a Knowledge Base in Amazon bedrock, using MongoDB Atlas as the vector database. Once set up,  Amazon Bedrock will use your MongoDB Atlas Knowledge Base for data ingestion, and subsequently craft an Agent capable of responding to inquiries based on your accurate, proprietary data. 



## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
