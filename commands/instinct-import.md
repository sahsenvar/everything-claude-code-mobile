---
description: Import instincts from an exported file.
---

> **Operating discipline:** follow the `ecc-operating-discipline` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).

# Instinct Import Command

Import instincts from others.

## Usage

```
/instinct-import path/to/instincts.json
```

## Behavior

- Merges with existing instincts
- Maintains confidence scores
- Deduplicates similar patterns
