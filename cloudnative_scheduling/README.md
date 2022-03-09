# Cloud Native Scheduler Example

## Summary

Ever wondered how to perform scheduled Tasks for your fleets of servers ?
AWS offers the SystemsManager to perform patching etc.
But what if you want to shutdown your custom Applications and you are not able to check the state of the app ?
Are there open connections ?
Is something buffered and has to be saved ?

This example shows how you can build your own scheduler that schekfs for state, triggers action and inform you
if the scheduling job is done.

For this I use Eventbridge Events, AWS Step Functions and AWS Lambda

### DISCLAIMER:
> This is only an example how to poll the state of an maschine.
> I installed a WebServer as a Database Server just as an example
> If you want to get the state of a Database you have to write your own Script/App that reports you the state

## How to install

## State Maschine
![alt text](./documentation/State%20Maschine.jpg "State Maschine")
