---
type: incident
title: API gateway outage — cascading timeout failure
severity: sev1
status: postmortem-complete
detected: "2026-02-15T14:32:00"
mitigated: "2026-02-15T15:47:00"
duration-minutes: 75
impact: Complete API unavailability for 75 minutes affecting all customers
root-cause: Connection pool exhaustion in gateway proxy due to upstream retry storm
owner: Marcus Johnson
teams-affected:
  - Platform
  - Product
---
Major outage caused by retry storm during upstream service deployment. Marcus led incident response. Postmortem completed Feb 20.
