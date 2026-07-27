# Security policy

## Supported version

Security fixes are applied to the current `main` branch.

## Reporting

Please use GitHub's private vulnerability reporting for this repository when
available. If it is unavailable, open a minimal issue that says a private
security report is needed without including exploit details or sensitive data.

Include the affected version, impact, reproduction outline, and a suggested
mitigation. Do not attach real carrier exports, bills of lading, customer
names, addresses, or credentials.

## Data boundary

Dwell Docket parses the selected CSV in the browser and creates the result as a
browser-local object URL. The app does not upload the file, call an application
API, store data, or include analytics. The local development server only serves
static repository files.

That design does not make an untrusted CSV harmless. Review repository changes
before running them, use current browser and Node releases, and never add CSV
content through `innerHTML`.

## Scope

Reports about dependency vulnerabilities, path traversal, CSV formula
injection, cross-site scripting, unsafe file handling, or accidental network
transmission are in scope. Eligibility disputes and detention-rate
interpretation are product-policy questions, not security vulnerabilities.
