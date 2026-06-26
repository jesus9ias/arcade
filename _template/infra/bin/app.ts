#!/usr/bin/env node
import 'dotenv/config';
import { App } from 'aws-cdk-lib';
import { GameStack } from '@arcade/infra';

const STACK_ID = '<Game>Stack';

const app = new App();

new GameStack(app, STACK_ID, {
  subdomain: process.env.SUBDOMAIN!,
  domainName: process.env.DOMAIN_NAME!,
  hostedZoneId: process.env.HOSTED_ZONE_ID!,
  certificateArn: process.env.CERTIFICATE_ARN!,
  env: {
    account: process.env.AWS_ACCOUNT_ID!,
    region: process.env.AWS_REGION!,
  },
});
