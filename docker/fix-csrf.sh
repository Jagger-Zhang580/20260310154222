#!/bin/bash
# Disable CSRF completely in Jenkins config
CONFIG="/var/jenkins_home/config.xml"

# Remove the entire crumbIssuer section
sed -i '/<crumbIssuer/,/<\/crumbIssuer>/d' "$CONFIG"

# Verify
echo "Current config (CSRF section):"
grep -i crumb "$CONFIG" || echo "CSRF/Crumb removed successfully!"

echo ""
echo "Restarting Jenkins..."
