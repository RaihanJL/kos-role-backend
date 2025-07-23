import Rules from "../models/RulesModel.js";

// Get rules (untuk semua user)
export const getRules = async (req, res) => {
  const rules = await Rules.findOne();
  res.json(rules);
};

// Update rules (hanya admin)
export const updateRules = async (req, res) => {
  try {
    let rules = await Rules.findOne();
    if (!rules) {
      rules = await Rules.create({ content: req.body.content });
    } else {
      rules.content = req.body.content;
      await rules.save();
    }
    res.json(rules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};