#!/bin/bash
JENKINS_URL="http://localhost:8080"
JOB_NAME="english-talks-tmc"

CRUMB=$(curl -s "$JENKINS_URL/crumbIssuer/api/xml" | sed -n 's/.*<crumb>\([^<]*\)<\/crumb>.*/\1/p')
echo "Crumb: $CRUMB"

RESULT=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$JENKINS_URL/job/$JOB_NAME/build" -H "Jenkins-Crumb: $CRUMB")
echo "Build trigger HTTP: $RESULT"

if [ "$RESULT" = "201" ] || [ "$RESULT" = "302" ]; then
    echo "BUILD TRIGGERED SUCCESSFULLY!"
    echo "Blue Ocean: $JENKINS_URL/blue/organizations/jenkins/$JOB_NAME/"
else
    echo "Trying with cookie..."
    curl -s -c /tmp/cookies -b /tmp/cookies -X POST "$JENKINS_URL/job/$JOB_NAME/build" -H "Jenkins-Crumb: $CRUMB" -w "%{http_code}" -o /dev/null
fi
