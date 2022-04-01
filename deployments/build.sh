#!/usr/bin/env bash

set -eo pipefail
set -x

RUNTIME_IMAGE=${1:-"12-alpine"}
BUILD_IMAGE=${2:-"12-bullseye"}

CURRENT_DIR=$(dirname "$BASH_SOURCE")

GIT_SHA1="$(git rev-parse HEAD)"
GIT_SHORT_ID="${GIT_SHA1:0:8}"
GIT_TAG=$(git describe --exact-match --tags $(git log -n1 --pretty='%h') 2>/dev/null || echo "")

DOCKER_TAG="${GIT_TAG:-$GIT_SHORT_ID}"
docker build --build-arg RUNTIME=${RUNTIME_IMAGE} --build-arg BUILDPACK=${BUILD_IMAGE} -t "codimd:$DOCKER_TAG" -f "$CURRENT_DIR/Dockerfile" "$CURRENT_DIR/.."
