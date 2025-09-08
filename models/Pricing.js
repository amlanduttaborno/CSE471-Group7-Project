const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema({
  fabricProvider: {
    type: String,
    required: true,
    enum: ['customer', 'tailor'],
    index: true
  },
  garmentType: {
    type: String,
    required: true,
    enum: ['kurti', 'salwar-kameez', 'churidar', 'frock', 'palazzo-set', 'burkha', 'sharee-blouse', 'lehenga', 'three-piece', 'maxi-dress', 'kaftan', 'tunic'],
    index: true
  },
  
  // Base pricing configuration
  basePrice: {
    type: Number,
    required: true,
    min: 1500,
    max: 5000
  },
  
  // Complexity multipliers
  complexityMultiplier: {
    type: Number,
    required: true,
    min: 0.8,
    max: 2.0
  },
  
  // Fabric-specific pricing (only for tailor-provided fabric)
  fabricPricing: {
    formal: { type: Number, default: 0 },
    casual: { type: Number, default: 0 },
    premium: { type: Number, default: 0 },
    luxury: { type: Number, default: 0 },
    cotton: { type: Number, default: 0 },
    silk: { type: Number, default: 0 },
    denim: { type: Number, default: 0 },
    wool: { type: Number, default: 0 },
    linen: { type: Number, default: 0 },
    polyester: { type: Number, default: 0 }
  },
  
  // Pattern complexity bonuses
  patternBonus: {
    plain: { type: Number, default: 0 },
    striped: { type: Number, default: 100 },
    checkered: { type: Number, default: 150 },
    floral: { type: Number, default: 200 },
    geometric: { type: Number, default: 250 },
    custom: { type: Number, default: 300 }
  },
  
  // Special features pricing
  specialFeatures: {
    embroidery: { type: Number, default: 400 },
    beadwork: { type: Number, default: 300 },
    sequins: { type: Number, default: 350 },
    applique: { type: Number, default: 250 },
    handStitching: { type: Number, default: 500 }
  },
  
  // Finishing work bonuses
  finishingBonus: {
    basic: { type: Number, default: 0 },
    premium: { type: Number, default: 200 },
    deluxe: { type: Number, default: 400 }
  },
  
  // Urgency multipliers
  urgencyMultiplier: {
    normal: { type: Number, default: 1.0 },
    urgent: { type: Number, default: 1.5 },
    express: { type: Number, default: 2.0 }
  },
  
  // Min and max price constraints
  minPrice: {
    type: Number,
    required: true,
    default: 1500
  },
  maxPrice: {
    type: Number,
    required: true,
    default: 5000
  },
  
  // Additional metadata
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Version control for pricing updates
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
pricingSchema.index({ fabricProvider: 1, garmentType: 1, isActive: 1 });

// Static method to calculate price based on order details
pricingSchema.statics.calculatePrice = async function(orderDetails) {
  const {
    garmentType,
    fabricProvider,
    fabricType,
    pattern = 'plain',
    specialFeatures = [],
    finishing = 'basic',
    urgency = 'normal'
  } = orderDetails;

  // Find the pricing configuration
  const pricingConfig = await this.findOne({
    fabricProvider: fabricProvider,
    garmentType: garmentType,
    isActive: true
  });

  if (!pricingConfig) {
    throw new Error(`Pricing configuration not found for ${fabricProvider} ${garmentType}`);
  }

  // Start with base price
  let totalPrice = pricingConfig.basePrice;

  // Apply complexity multiplier
  totalPrice *= pricingConfig.complexityMultiplier;

  // Add fabric cost (if tailor provides fabric)
  if (fabricProvider === 'tailor' && fabricType && pricingConfig.fabricPricing[fabricType]) {
    totalPrice += pricingConfig.fabricPricing[fabricType];
  }

  // Add pattern bonus
  if (pattern && pricingConfig.patternBonus[pattern]) {
    totalPrice += pricingConfig.patternBonus[pattern];
  }

  // Add special features cost
  if (Array.isArray(specialFeatures)) {
    specialFeatures.forEach(feature => {
      if (pricingConfig.specialFeatures[feature]) {
        totalPrice += pricingConfig.specialFeatures[feature];
      }
    });
  }

  // Add finishing bonus
  if (finishing && pricingConfig.finishingBonus[finishing]) {
    totalPrice += pricingConfig.finishingBonus[finishing];
  }

  // Apply urgency multiplier
  if (urgency && pricingConfig.urgencyMultiplier[urgency]) {
    totalPrice *= pricingConfig.urgencyMultiplier[urgency];
  }

  // Ensure price stays within bounds
  totalPrice = Math.max(pricingConfig.minPrice, Math.min(pricingConfig.maxPrice, totalPrice));

  return {
    totalPrice: Math.round(totalPrice),
    breakdown: {
      basePrice: pricingConfig.basePrice,
      complexityMultiplier: pricingConfig.complexityMultiplier,
      fabricCost: fabricProvider === 'tailor' && fabricType ? pricingConfig.fabricPricing[fabricType] || 0 : 0,
      patternBonus: pricingConfig.patternBonus[pattern] || 0,
      specialFeaturesTotal: specialFeatures.reduce((sum, feature) => sum + (pricingConfig.specialFeatures[feature] || 0), 0),
      finishingBonus: pricingConfig.finishingBonus[finishing] || 0,
      urgencyMultiplier: pricingConfig.urgencyMultiplier[urgency] || 1.0
    },
    pricingConfigId: pricingConfig._id
  };
};

// Instance method to update pricing configuration
pricingSchema.methods.updatePricing = function(updates) {
  Object.keys(updates).forEach(key => {
    if (this.schema.paths[key]) {
      this[key] = updates[key];
    }
  });
  this.version += 1;
  return this.save();
};

module.exports = mongoose.model('Pricing', pricingSchema, 'pricing');
