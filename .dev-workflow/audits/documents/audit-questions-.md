# Audit Configuration Questions

Please answer these questions to customize your custom audit:

## Scope Configuration
1. Would you like to focus on specific directories? (y/n)
   If yes, which directories? (comma-separated)
   [Suggested: src/contexts,src/services,src/components]

2. Are there any files or patterns to exclude? (y/n)
   If yes, which patterns? (e.g., *.test.js, docs/*)

3. Should we include third-party dependencies in the audit? (y/n)

## Risk Tolerance
4. What is your risk tolerance level?
   a) Conservative (flag all potential issues)
   b) Balanced (standard thresholds)
   c) Pragmatic (focus on critical issues only)

5. Do you have specific compliance requirements? (y/n)
   If yes, which standards? (e.g., OWASP, PCI-DSS, HIPAA)

## Reporting Preferences
6. How detailed should the report be?
   a) Executive summary only
   b) Standard report with findings
   c) Detailed report with evidence
   d) Full forensic report

7. Would you like remediation tasks created automatically? (y/n)

## Integration Options
8. Should we integrate with other dev-agent tools? (y/n)
   - Run tests after audit? (requires dev-agent-test)
   - Create fix branch? (requires dev-agent-git)
   - Generate task plan? (requires dev-agent-pm-taskplan)
   - Deep code analysis? (requires dev-agent-reverse)

Press Enter when ready to continue with default settings,
or provide answers in format: 1:n,2:n,3:y,4:b,5:n,6:b,7:y,8:y
