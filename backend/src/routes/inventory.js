const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Этот роут еще в разработке' });
});

module.exports = router;
