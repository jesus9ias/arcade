import type { StackProps } from 'aws-cdk-lib';
import type * as cloudfront from 'aws-cdk-lib/aws-cloudfront';

/**
 * Configuration for the future `GameBackendStack`.
 *
 * PLACEHOLDER — not implemented. This file reserves the public interface for the
 * first game that requires server-side logic (e.g. leaderboards or persistent
 * state). When implemented, the construct will extend an existing game's
 * CloudFront distribution with an API Gateway (HTTP API) origin backed by Lambda
 * functions and a single-table DynamoDB store.
 *
 * Intended responsibilities (documented, not yet built):
 * - add an API Gateway HTTP API as an additional CloudFront origin under a path
 *   prefix (e.g. `/api/*`);
 * - provision Lambda functions (Node 24) for the game's endpoints;
 * - provision a single-table DynamoDB table and grant least-privilege access.
 */
export interface GameBackendStackProps extends StackProps {
  /** The distribution created by {@link GameStack} that this backend extends. */
  distribution: cloudfront.IDistribution;
  // Future configuration (to be designed with the first backend game):
  // - apiRoutes: definitions mapping paths/methods to Lambda handlers
  // - tableName / table config for the single-table DynamoDB store
}

// The `GameBackendStack` class is intentionally not implemented yet.
// It will be added in the same file when the first backend game is specified.
