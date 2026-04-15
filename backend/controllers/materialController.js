const Material = require('../models/Material');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

exports.getMaterials = async (req, res) => {
  try {
    const { search, lowStock, page = 1, limit = 50 } = req.query;
    const filter = { isActive: true };
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } }
    ];

    let query = Material.find(filter).sort('name');
    if (lowStock === 'true') {
      const materials = await query;
      const low = materials.filter(m => m.stockQuantity <= m.minimumStock);
      return res.json({ success: true, data: low, total: low.length });
    }

    const total = await Material.countDocuments(filter);
    const materials = await query.skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, data: materials, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createMaterial = async (req, res) => {
  try {
    const material = await Material.create({ ...req.body, lastUpdatedBy: req.user._id });
    res.status(201).json({ success: true, data: material });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ success: false, message: 'Material code already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateMaterial = async (req, res) => {
  try {
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdatedBy: req.user._id },
      { new: true }
    );
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });
    res.json({ success: true, data: material });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    await Material.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Material deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.bulkUpload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    const results = { created: 0, updated: 0, errors: [] };

    for (const row of rows) {
      try {
        const data = {
          name: row['Name'] || row['name'],
          code: String(row['Code'] || row['code'] || '').trim(),
          unit: row['Unit'] || row['unit'],
          stockQuantity: Number(row['Stock Quantity'] || row['stockQuantity'] || 0),
          minimumStock: Number(row['Minimum Stock'] || row['minimumStock'] || 0),
          category: row['Category'] || row['category'],
          lastUpdatedBy: req.user._id
        };

        if (!data.name || !data.code || !data.unit) {
          results.errors.push(`Row skipped - missing required fields: ${JSON.stringify(row)}`);
          continue;
        }

        const existing = await Material.findOne({ code: data.code });
        if (existing) {
          await Material.findByIdAndUpdate(existing._id, data);
          results.updated++;
        } else {
          await Material.create(data);
          results.created++;
        }
      } catch (rowErr) {
        results.errors.push(`Error for code ${row['Code'] || row['code']}: ${rowErr.message}`);
      }
    }

    fs.unlinkSync(filePath);
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.downloadTemplate = (req, res) => {
  const template = [
    { Name: 'Example Material', Code: 'MAT001', Unit: 'pcs', 'Stock Quantity': 100, 'Minimum Stock': 10, Category: 'Electrical' }
  ];
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(template);
  xlsx.utils.book_append_sheet(wb, ws, 'Materials');
  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename=material_template.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
};
