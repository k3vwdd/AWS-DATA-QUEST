#!/bin/bash

echo "Fetching S3 buckets..."
BUCKETS=$(aws s3api list-buckets --output json | jq -r '.Buckets[].Name')

# Create an array of buckets for selection
mapfile -t bucket_array <<< "$BUCKETS"

# List buckets with numbers
counter=1
for bucket in "${bucket_array[@]}"; do
    echo "$counter. $bucket"
    ((counter++))
done

# Prompt for selection
echo -e "\nSelect an action:"
echo "1. List bucket contents"
echo "2. Empty bucket"
echo "3. Delete bucket"
read -r action_choice

echo -e "\nEnter the number of the bucket (1-${#bucket_array[@]}):"
read -r selection

# Validate input
if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -gt "${#bucket_array[@]}" ]; then
    echo "Invalid selection. Please enter a number between 1 and ${#bucket_array[@]}"
    exit 1
fi

# Get selected bucket name
selected_bucket="${bucket_array[$((selection-1))]}"

case $action_choice in
    1)
        echo -e "\nListing contents of bucket: $selected_bucket"
        aws s3 ls "s3://$selected_bucket" --recursive
        ;;
    2)
        echo -e "\nYou selected to empty bucket: $selected_bucket"
        echo -e "\n⚠️  WARNING: This will permanently delete all files in the bucket! ⚠️"
        echo -n "Are you sure you want to proceed? (y/N): "
        read -r confirm
        if [[ "${confirm,,}" == "y" ]]; then
            echo "Emptying bucket $selected_bucket..."
            aws s3 rm "s3://$selected_bucket" --recursive
            echo "Bucket emptied successfully."
        else
            echo "Operation cancelled."
        fi
        ;;
    3)
        echo -e "\nYou selected to delete bucket: $selected_bucket"
        echo -e "\n⚠️  WARNING: This will permanently delete the bucket and all its contents! ⚠️"
        echo -n "Are you sure you want to proceed? (y/N): "
        read -r confirm
        if [[ "${confirm,,}" == "y" ]]; then
            echo "First emptying bucket $selected_bucket..."
            aws s3 rm "s3://$selected_bucket" --recursive
            echo "Now deleting bucket $selected_bucket..."
            aws s3api delete-bucket --bucket "$selected_bucket"
            echo "Bucket deleted successfully."
        else
            echo "Operation cancelled."
        fi
        ;;
    *)
        echo "Invalid action selected"
        exit 1
        ;;
esac
