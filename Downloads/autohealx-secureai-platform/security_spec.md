# Security Specification - AutoHealX

## Data Invariants
1. An Incident must have a valid `serviceName` and `severity`.
2. An Action must reference an existing `incidentId`.
3. Only Admins can execute High Risk actions.
4. All actions must be cryptographically signed.
5. Users can only read their own private profiles, but can read all public incidents if authenticated.

## The Dirty Dozen Payloads (Rejection Targets)
1. **Unauthorized Write**: Unauthenticated user trying to create an incident.
2. **Identity Spoofing**: User A trying to update User B's profile.
3. **Status Leapfrog**: Changing action status from "pending" to "executed" without an "approved" step.
4. **Invalid Severity**: Creating an incident with severity "apocalypse".
5. **PII Leak**: Listing all users to get their private data.
6. **No Signature**: Creating an action without a signature field.
7. **Malformed ID**: Using a 1MB string as a document ID.
8. **Shadow Field**: Adding `isAdmin: true` to a user profile update.
9. **Old Timestamp**: Creating a log with a timestamp from 2020.
10. **Resource Exhaustion**: Sending a message field with 10MB of text.
11. **Orphaned Action**: Creating an action for a non-existent incident.
12. **Role Escalation**: A "viewer" trying to approve an action.

## Test Runner (Mock Logic)
- `permission_denied` for any write without valid auth.
- `permission_denied` for any update changing `createdAt` or `uid`.
- `permission_denied` for any action execution without `approvedBy` being an admin.
