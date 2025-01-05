#!/bin/bash
cd assets
npm install
zip -r ../function.zip .
cd ..
aws lambda update-function-code --function-name consumer --zip-file fileb://function.zip
rm function.zip
sam local invoke producer -t ./cdk.out/SqsFunStack.template.json --event event.json
aws sqs receive-message --queue-url https://sqs.us-east-1.amazonaws.com/950033952142/MyMessageQueue --max-number-of-messages 10 --visibility-timeout 30
