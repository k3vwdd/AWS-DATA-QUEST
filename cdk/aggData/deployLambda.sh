#!/bin/bash

# First, build the TypeScript files
echo "Building TypeScript files..."
npm run build:lambda

# If arguments are provided, use those as function names
if [ $# -gt 0 ]; then
    FUNCTIONS=("$@")
else
    # Otherwise, find all js files in dist
    echo "Finding Lambda functions..."
    cd assets/dist/
    FUNCTIONS=($(find . -type f -name "*.js" ! -name "*.map" -exec basename {} .js \;))
    cd ../../
fi

# Create zip file from dist directory
echo "Creating deployment package..."
cd assets/dist/
zip -r ../../function.zip .
cd ../../

# Update each Lambda function
echo "Updating Lambda functions..."
for func in "${FUNCTIONS[@]}"
do
    echo "Updating $func..."
    aws lambda update-function-code \
        --function-name $func \
        --zip-file fileb://function.zip \
        --publish \
        --no-cli-pager

    # Check if the update was successful
    if [ $? -eq 0 ]; then
        echo "Successfully updated $func"
    else
        echo "Failed to update $func"
    fi
done

# Cleanup
echo "Cleaning up..."
rm function.zip

echo "Deployment complete!"
