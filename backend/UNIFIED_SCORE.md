## API Response Update: Unified Scoring

All product analysis endpoints now include a `unified_score` object for consistent frontend display.

### Example Response
```json
{
  ...,
  "unified_score": {
    "overall_eco_score": "High", // "High", "Moderate", or "Low"
    "health_score": "Moderate",  // "High", "Moderate", or "Low"
    "confidence": 1.0            // 0-1, 1.0 = high confidence
  }
}
```

- Use this object for all eco/health impact displays in the frontend.
- The scoring logic is centralized in `backend/utils/scoreCalculator.js`.
