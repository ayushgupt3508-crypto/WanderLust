# WanderLust

WanderLust is a vehicle rental web application where customers can search for available vehicles by date ranges and make bookings, while administrators manage fleet inventory, vehicle availability, and customer bookings.

## Monorepo Overview

This repository is structured as a monorepo containing both the frontend client and the backend server:

- `client/`: Frontend single-page application built with React (owned by the frontend team).
- `server/`: Backend REST API built with Node.js, Express, TypeScript, and Prisma (owned by the backend team).
- `docs/`: Shared project documentation, architecture notes, and `docs/api-contract.md`.
- `.github/workflows/`: CI/CD pipelines and automated GitHub Actions workflows.

## Team Rules & Ownership

To ensure smooth collaboration between frontend and backend teams, everyone adheres to these boundary rules:

1. **Backend Ownership**: Backend owner edits only code inside `server/` and database configurations. Never edit `client/`.
2. **Frontend Ownership**: Frontend team edits only code inside `client/`. Never edit `server/`.
3. **Contract First**: `docs/api-contract.md` is the single source of truth for all API routes, request payloads, response envelopes, and error codes. Any change to `docs/api-contract.md` requires discussion and an approved Pull Request (PR) before implementation.
