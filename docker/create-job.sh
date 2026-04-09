#!/bin/bash
# Create Jenkins Pipeline Job via API (BusyBox compatible)
JENKINS_URL="http://localhost:8080"
JOB_NAME="english-talks-tmc"

echo "Getting crumb..."
CRUMB=$(curl -s "$JENKINS_URL/crumbIssuer/api/xml" | sed -n 's/.*<crumb>\([^<]*\)<\/crumb>.*/\1/p')
echo "Crumb: $CRUMB"

if [ -z "$CRUMB" ]; then
    echo "ERROR: Could not get crumb"
    exit 1
fi

echo "Creating job: $JOB_NAME"
HTTP_CODE=$(curl -s -w "%{http_code}" -o /tmp/result.txt -X POST "$JENKINS_URL/createItem?name=$JOB_NAME" \
  -H "Content-Type: application/xml" \
  -H "Jenkins-Crumb: $CRUMB" \
  -d @/tmp/job.xml)

echo "HTTP Response: $HTTP_CODE"
cat /tmp/result.txt 2>/dev/null

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "201" ]; then
    echo ""
    echo "SUCCESS: Job '$JOB_NAME' created!"
    echo "Classic UI: $JENKINS_URL/job/$JOB_NAME/"
    echo "Blue Ocean: $JENKINS_URL/blue/organizations/jenkins/$JOB_NAME/"
else
    echo ""
    echo "Creating via direct file copy instead..."
    JOBS_DIR="/var/jenkins_home/jobs/$JOB_NAME"
    mkdir -p "$JOBS_DIR"
    cp /tmp/job.xml "$JOBS_DIR/config.xml"
    echo "Job config copied to: $JOBS_DIR/config.xml"
    echo "Restarting Jenkins to load new job..."
    curl -s -X POST "$JENKINS_URL/safeRestart" -H "Jenkins-Crumb: $CRUMB" 2>/dev/null || true
    echo "Job will be available after Jenkins restarts"
fi
