<h1 align="center"> Resume Craft Backend </h1>     

<div align="center">

Comms Planner Backend

[![Test](https://github.com/Simpplr/editorial-calendar-be/actions/workflows/pull-request.yml/badge.svg?branch=develop)](https://github.com/Simpplr/editorial-calendar-be/actions/workflows/pull-request.yml) [![Coverage](https://sonar.simpplr.xyz/api/project_badges/measure?project=comms-planner-be&metric=coverage&token=sqb_eed13f29e1e10a18b465c7fbef4958105d243323)](https://sonar.simpplr.xyz/dashboard?id=editorial-calendar-be) [![Quality Gate Status](https://sonar.simpplr.xyz/api/project_badges/measure?project=comms-planner-be&metric=alert_status&token=sqb_eed13f29e1e10a18b465c7fbef4958105d243323)](https://sonar.simpplr.xyz/dashboard?id=editorial-calendar-be) [![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org) [![npm type definitions](https://img.shields.io/npm/types/typescript.svg)](https://www.typescriptlang.org/)

[Features](#-features) | [Installation](#-installation) | [Usage](#-usage) | [Development](#-development)

</div>

## What's inside?

This turbo repo uses [pnpm](https://pnpm.io) as a packages manager.

It includes the following services:

- Comms Planner API Service

It also includes following packages

- Comms Planner Common
- Comms Planner Api Contracts

Each package/service is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This turbo repo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting
- [Docker](https://www.docker.com/products/docker-desktop/) for services

### Install

To install dependencies

```
pnpm install
```

To configure husky

```
pnpm prepare
```

### Build

To build all services and packages, run the following command:

```
cd comms-planner-be
pnpm run build
```

### Develop

To develop all services and packages, run the following command:

```
cd comms-planner-be 
pnpm run dev
```

## Testing

Before creating a PR, run the following commands to lint, build and test everything:

```sh
pnpm lint:fix
pnpm build
pnpm test
```
