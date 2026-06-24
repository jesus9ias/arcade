// @arcade/infra — public exports.

// GameStack: full implementation (S3 + CloudFront + Route 53).
export { GameStack } from './constructs/GameStack';
export type { GameStackProps } from './constructs/GameStack';

// GameBackendStack: placeholder — only its intended props interface exists today.
// The construct is implemented when the first backend game is specified.
export type { GameBackendStackProps } from './constructs/GameBackendStack';
