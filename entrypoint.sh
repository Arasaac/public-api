#!/bin/sh
set -e


# Check if secrets directory exists
if [ -d "/run/secrets" ]; then
    # Loop through all secrets and set them as environment variables
    for file in /run/secrets/*; do
        secret_name=$(basename "${file}")
        # Check if secret ends with _FILE
        if echo "${secret_name}" | grep -q '_FILE$'; then
            env_name=$(echo "${secret_name}" | sed 's/_FILE$//' | tr '[:lower:]' '[:upper:]')
            secret_value=$(cat "${file}")
            export "${env_name}"="${secret_value}"
        else
            env_name=$(echo "${secret_name}" | tr '[:lower:]' '[:upper:]')
            secret_value=$(cat "${file}")
            export "${env_name}"="${secret_value}"
        fi
    done
else
    echo "WARNING: Secrets directory '/run/secrets' not found!"
fi

# Run command with node if the first argument contains a "-" or is not a system command. The last
# part inside the "{}" is a workaround for the following bug in ash/dash:
# https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=874264
if [ "${1#-}" != "${1}" ] || [ -z "$(command -v "${1}")" ] || { [ -f "${1}" ] && ! [ -x "${1}" ]; }; then
  set -- node "$@"
fi

exec "$@"