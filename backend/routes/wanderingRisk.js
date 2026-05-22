const express = require('express');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({
    feature: 'Wandering Risk',
    summary: { residentsMonitored: 36, elevatedRisk: 6, doorAlerts: 4, carePlanUpdates: 5 },
    signals: [
      { signal: 'Night door activity', weight: 'high', observation: 'Three exits between 11 PM and 5 AM' },
      { signal: 'Sleep disruption', weight: 'medium', observation: 'Two consecutive nights below four hours' },
      { signal: 'Cognitive exercise drop', weight: 'medium', observation: 'Missed orientation tasks for three days' },
      { signal: 'Medication change', weight: 'medium', observation: 'New sedative or anticholinergic started' }
    ],
    residents: [
      { name: 'Evelyn H.', risk: 'high', lastSignal: 'Front door opened at 2:14 AM', action: 'Add overnight hallway check and family notification' },
      { name: 'George M.', risk: 'medium', lastSignal: 'Missed evening orientation routine', action: 'Review sleep log and update activity plan' },
      { name: 'Lena R.', risk: 'medium', lastSignal: 'Safe-zone boundary alert in garden', action: 'Adjust outdoor escort schedule' }
    ]
  });
});

module.exports = router;
