#!/usr/bin/env bash

if ! [ -e .env ]; then
  echo "create .env"
  cp env.example .env
fi
