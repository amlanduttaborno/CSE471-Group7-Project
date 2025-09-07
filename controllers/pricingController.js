const Pricing = require('../models/Pricing');

const pricingController = {
  // Calculate price for an order
  calculatePrice: async (req, res) => {
    try {
      const {
        garmentType,
        fabricProvider,
        fabricType,
        pattern = 'plain',
        specialFeatures = [],
        finishing = 'basic',
        urgency = 'normal'
      } = req.body;

      // Validate required fields
      if (!garmentType || !fabricProvider) {
        return res.status(400).json({
          success: false,
          message: 'Garment type and fabric provider are required'
        });
      }

      // Calculate pricing using the model method
      const pricingResult = await Pricing.calculatePrice({
        garmentType,
        fabricProvider,
        fabricType,
        pattern,
        specialFeatures,
        finishing,
        urgency
      });

      res.json({
        success: true,
        data: pricingResult
      });

    } catch (error) {
      console.error('Pricing calculation error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error calculating price'
      });
    }
  },

  // Get pricing configuration for a specific garment and fabric provider
  getPricingConfig: async (req, res) => {
    try {
      const { garmentType, fabricProvider } = req.params;

      const pricingConfig = await Pricing.findOne({
        garmentType,
        fabricProvider,
        isActive: true
      });

      if (!pricingConfig) {
        return res.status(404).json({
          success: false,
          message: 'Pricing configuration not found'
        });
      }

      res.json({
        success: true,
        data: pricingConfig
      });

    } catch (error) {
      console.error('Get pricing config error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching pricing configuration'
      });
    }
  },

  // Get all pricing configurations
  getAllPricingConfigs: async (req, res) => {
    try {
      const { fabricProvider, garmentType, page = 1, limit = 20 } = req.query;
      
      // Build query
      const query = { isActive: true };
      if (fabricProvider) query.fabricProvider = fabricProvider;
      if (garmentType) query.garmentType = garmentType;

      // Calculate pagination
      const skip = (page - 1) * limit;
      
      // Get pricing configurations with pagination
      const pricingConfigs = await Pricing.find(query)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ fabricProvider: 1, garmentType: 1 });

      const total = await Pricing.countDocuments(query);

      res.json({
        success: true,
        data: {
          pricingConfigs,
          pagination: {
            current: parseInt(page),
            total: Math.ceil(total / limit),
            count: pricingConfigs.length,
            totalRecords: total
          }
        }
      });

    } catch (error) {
      console.error('Get all pricing configs error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching pricing configurations'
      });
    }
  },

  // Update pricing configuration (admin only)
  updatePricingConfig: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const pricingConfig = await Pricing.findById(id);
      if (!pricingConfig) {
        return res.status(404).json({
          success: false,
          message: 'Pricing configuration not found'
        });
      }

      // Update the configuration
      await pricingConfig.updatePricing(updates);

      res.json({
        success: true,
        message: 'Pricing configuration updated successfully',
        data: pricingConfig
      });

    } catch (error) {
      console.error('Update pricing config error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating pricing configuration'
      });
    }
  },

  // Create new pricing configuration (admin only)
  createPricingConfig: async (req, res) => {
    try {
      const pricingData = req.body;

      // Check if configuration already exists
      const existingConfig = await Pricing.findOne({
        garmentType: pricingData.garmentType,
        fabricProvider: pricingData.fabricProvider,
        isActive: true
      });

      if (existingConfig) {
        return res.status(400).json({
          success: false,
          message: 'Pricing configuration already exists for this combination'
        });
      }

      const newPricingConfig = new Pricing(pricingData);
      await newPricingConfig.save();

      res.status(201).json({
        success: true,
        message: 'Pricing configuration created successfully',
        data: newPricingConfig
      });

    } catch (error) {
      console.error('Create pricing config error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating pricing configuration'
      });
    }
  },

  // Delete pricing configuration (admin only)
  deletePricingConfig: async (req, res) => {
    try {
      const { id } = req.params;

      const pricingConfig = await Pricing.findById(id);
      if (!pricingConfig) {
        return res.status(404).json({
          success: false,
          message: 'Pricing configuration not found'
        });
      }

      // Soft delete by setting isActive to false
      pricingConfig.isActive = false;
      await pricingConfig.save();

      res.json({
        success: true,
        message: 'Pricing configuration deleted successfully'
      });

    } catch (error) {
      console.error('Delete pricing config error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting pricing configuration'
      });
    }
  },

  // Get fabric options for a specific provider and garment type
  getFabricOptions: async (req, res) => {
    try {
      const { garmentType, fabricProvider } = req.params;

      const pricingConfig = await Pricing.findOne({
        garmentType,
        fabricProvider,
        isActive: true
      });

      if (!pricingConfig) {
        return res.status(404).json({
          success: false,
          message: 'Pricing configuration not found'
        });
      }

      let fabricOptions = [];

      if (fabricProvider === 'tailor') {
        // For tailor-provided fabric, return fabric types with pricing
        fabricOptions = Object.keys(pricingConfig.fabricPricing)
          .filter(key => pricingConfig.fabricPricing[key] > 0)
          .map(fabric => ({
            value: fabric,
            label: fabric.charAt(0).toUpperCase() + fabric.slice(1),
            price: pricingConfig.fabricPricing[fabric]
          }));
      } else {
        // For customer-provided fabric, return preference-based options
        fabricOptions = [
          { value: 'cotton', label: 'Cotton' },
          { value: 'silk', label: 'Silk' },
          { value: 'denim', label: 'Denim' },
          { value: 'wool', label: 'Wool' },
          { value: 'linen', label: 'Linen' },
          { value: 'polyester', label: 'Polyester' }
        ];
      }

      res.json({
        success: true,
        data: {
          fabricOptions,
          patternOptions: Object.keys(pricingConfig.patternBonus).map(pattern => ({
            value: pattern,
            label: pattern.charAt(0).toUpperCase() + pattern.slice(1),
            price: pricingConfig.patternBonus[pattern]
          })),
          specialFeatureOptions: Object.keys(pricingConfig.specialFeatures).map(feature => ({
            value: feature,
            label: feature.charAt(0).toUpperCase() + feature.slice(1),
            price: pricingConfig.specialFeatures[feature]
          })),
          finishingOptions: Object.keys(pricingConfig.finishingBonus).map(finishing => ({
            value: finishing,
            label: finishing.charAt(0).toUpperCase() + finishing.slice(1),
            price: pricingConfig.finishingBonus[finishing]
          }))
        }
      });

    } catch (error) {
      console.error('Get fabric options error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching fabric options'
      });
    }
  }
};

module.exports = pricingController;
