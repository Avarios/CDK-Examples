import { Stack, Construct, Duration } from '@aws-cdk/core';
import { Wait, StateMachine, Choice, Condition, Succeed, WaitTime } from '@aws-cdk/aws-stepfunctions';
import { LambdaInvoke, SnsPublish } from '@aws-cdk/aws-stepfunctions-tasks';
import { Function } from '@aws-cdk/aws-lambda';

export interface StateMachineProps {
    DbPollFunction:Function,
    AppPollFunction:Function,
    ShutdownDbFunction:Function,
    ShutdownAppFunction:Function
}

export class StateMaschine extends Construct {
    constructor(parent: Stack, id: string, props:StateMachineProps) {
        super(parent, id);
        let trueCondition = Condition.booleanEqualsJsonPath('$.result', 'true');
        let falseCondition = Condition.booleanEqualsJsonPath('$.result', 'true');

        let dbPollJob = new LambdaInvoke(this, 'invokedbpoll', {
            lambdaFunction: props.DbPollFunction,
            outputPath: '$.result'
        });

        let appPollJob = new LambdaInvoke(this, 'invokeapppoll', {
            lambdaFunction: props.AppPollFunction,
            outputPath: '$.result'
        });

        let appShutDownJob = new LambdaInvoke(this,'invokeAppShutdown', {
            lambdaFunction: props.ShutdownAppFunction
        });

        let dbShutdownJob = new LambdaInvoke(this,'invokeDbShutdown', {
            lambdaFunction: props.ShutdownDbFunction
        });

        let checkStatusJob = new Choice(this, 'waitUntilDbShutdown', {
            inputPath: '$.result'
        });

        let waitJob = new Wait(this,'waitForTrueState', {
            time:WaitTime.duration(Duration.seconds(30))
        });

        let waitForApp = checkStatusJob.when(trueCondition,dbShutdownJob)
            .when(falseCondition, waitJob.next(appPollJob));
           
        let waitForDb = checkStatusJob.when(trueCondition,new Succeed(this,'stateSuccess'))
            .when(falseCondition, waitJob.next(dbPollJob));

        appShutDownJob.next(waitForApp);
        dbShutdownJob.next(waitForDb);

        new StateMachine(this,'schedulestatemachine', {
            definition:appShutDownJob,
            timeout: Duration.minutes(5)
        });
    }
}