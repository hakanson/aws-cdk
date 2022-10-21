import { AccountRootPrincipal, Role } from '@aws-cdk/aws-iam';
import { App, CfnOutput, Stack } from '@aws-cdk/core';
import { ExpectedResult, IntegTest } from '@aws-cdk/integ-tests';
import { ProfilingGroup } from '../lib';

const app = new App();

const stack = new Stack(app, 'ProfilingGroupTestStack');

const profilingGroup1 = new ProfilingGroup(stack, 'ProfilingGroupWithExplicitlySetName', {
  profilingGroupName: 'ExplicitlySetName',
});
const profilingGroup2 = new ProfilingGroup(stack, 'ProfilingGroupWithImplicitlySetName');

const publishAppRole = new Role(stack, 'PublishAppRole', {
  assumedBy: new AccountRootPrincipal(),
});
profilingGroup1.grantPublish(publishAppRole);
profilingGroup2.grantPublish(publishAppRole);

const importedGroupWithExplicitlySetName = ProfilingGroup.fromProfilingGroupName(
  stack,
  'ImportedProfilingGroupWithExplicitlySetName',
  profilingGroup1.profilingGroupName,
);

const importedGroupWithImplicitlySetName = ProfilingGroup.fromProfilingGroupName(
  stack,
  'ImportedProfilingGroupWithImplicitlySetName',
  profilingGroup2.profilingGroupName,
);

new CfnOutput(stack, 'ExplicitlySetProfilingGroupName', {
  value: importedGroupWithExplicitlySetName.profilingGroupName,
});

new CfnOutput(stack, 'ImplicitlySetProfilingGroupName', {
  value: importedGroupWithImplicitlySetName.profilingGroupName,
});

const testCase = new IntegTest(app, 'test', {
  testCases: [stack],
});

const describe = testCase.assertions.awsApiCall('CloudFormation', 'describeStacks', {
  StackName: 'ProfilingGroupTestStack',
});

describe.assertAtPath('Stacks.0.Outputs.0.OutputKey', ExpectedResult.stringLikeRegexp('ExplicitlySetProfilingGroupName'));
describe.assertAtPath('Stacks.0.Outputs.0.OutputValue', ExpectedResult.stringLikeRegexp('ExplicitlySetName'));

describe.assertAtPath('Stacks.0.Outputs.1.OutputKey', ExpectedResult.stringLikeRegexp('ImplicitlySetProfilingGroupName'));
describe.assertAtPath('Stacks.0.Outputs.1.OutputValue', ExpectedResult.stringLikeRegexp('ProfilingGroupTestStackProfilingGroupWithImplicitlySetName98463923'));

app.synth();