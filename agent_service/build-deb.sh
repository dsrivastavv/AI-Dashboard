#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

dpkg-buildpackage -us -uc -b

echo "Built package(s) in: ${SCRIPT_DIR}/.."
