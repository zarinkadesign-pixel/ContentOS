# Astana Rent Bot v3 — Proprietary License v1.0 (Summary)

**Astana Rent Bot v3 — Telegram Rental Marketplace Platform**  
Copyright (c) 2026 AMAImedia.com · All rights reserved.

This repository is distributed under the **Astana Rent Bot Proprietary License v1.0 (March 2026)**.  
See the [`LICENSE`](./LICENSE) file for the complete legal terms.

---

## ✓ Allowed

- Deploying and operating the bot for the commissioned Telegram channel
- Modifying `.env` configuration and Telegram message strings
- Creating private backups for disaster recovery

---

## ✗ Not Allowed (without written permission)

- **Redistribution** of the source code to third parties
- **Reselling** or sublicensing the platform as a product or service
- Building a **competing rental platform** based on this codebase
- Using the code for **AI training datasets** or model pipelines
- **Removing copyright notices** from any file
- Deploying under a **different brand or domain**

---

## Protected Components

| Component | Status |
|-----------|--------|
| RandomScheduler algorithm | Proprietary |
| AI Search Engine (NL → SearchFilter) | Proprietary |
| Commission Calculation Engine | Proprietary |
| Violation Escalation System | Proprietary |
| SheetRepo layer + deduplication caches | Proprietary |
| Excel Report Generator (3-sheet) | Proprietary |
| 14-Step Listing FSM | Proprietary |

---

## Sealed Constants (protected)

```
COMMISSION_RATE     = 0.50   (50% of monthly rent)
PLATFORM_PCT        = 0.60   (platform share)
REALTOR_PCT         = 0.40   (realtor share)
FREEZE_ON_VIOLATION = 2
BAN_ON_VIOLATION    = 3
FREEZE_DAYS         = 7
```

---

## Commercial Licensing

For licensing inquiries or custom development:  
📧 info@amaimedia.com · 📞 +1 716 575 7575 · 🌐 amaimedia.com
