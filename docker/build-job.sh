#!/bin/bash
JENKINS_URL="http://localhost:8080"
JOB_NAME="english-talks-tmc"

CRUMB=$(curl -s "$JENKINS_URL/crumbIssuer/api/xml" | sed -n 's/.*<crumb>\([^<]*\)<\/crumb>.*/\1/p')
echo "Crumb: $CRUMB"

echo "Triggering build for: $JOB_NAME"
RESULT=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$JENKINS_URL/job/$JOB_NAME/build" \
  -H "Jenkins-Crumb: $CRUMB")

echo "HTTP Response: $RESULT"

if [ "$RESULT" = "201" ] || [ "$RESULT" = "302" ] || [ "$RESULT" = "200" ]; then
    echo "BUILD TRIGGERED!"
    echo "View at: $JENKINS_URL/blue/organizations/jenkins/$JOB_NAME/"
else
    echo "Build trigger failed, trying alternative method..."
    # Copy workspace files and trigger via CLI
    mkdir -p /var/jenkins_home/workspace/$JOB_NAME
    echo "Workspace created"
fi
