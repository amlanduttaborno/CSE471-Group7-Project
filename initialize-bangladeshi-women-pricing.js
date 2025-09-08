const mongoose = require('mongoose');
const Pricing = require('./models/Pricing');
require('dotenv').config();

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected to Atlas...');
  } catch (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
};

// Initialize pricing data for Bangladeshi women's dresses
const initializeBangladeshiWomenPricing = async () => {
  try {
    await connectDB();

    // Clear existing pricing data
    await Pricing.deleteMany({});
    console.log('Cleared existing pricing data');

    // Customer-provided fabric pricing configurations for Bangladeshi women's dresses
    const customerFabricPricing = [
      {
        fabricProvider: 'customer',
        garmentType: 'kurti',
        basePrice: 1500,
        complexityMultiplier: 0.8,
        patternBonus: {
          plain: 0,
          striped: 100,
          checkered: 150,
          floral: 200,
          geometric: 250,
          custom: 300
        },
        specialFeatures: {
          embroidery: 400,
          beadwork: 300,
          sequins: 350,
          applique: 250,
          handStitching: 500
        },
        finishingBonus: {
          basic: 0,
          premium: 200,
          deluxe: 400
        },
        urgencyMultiplier: {
          normal: 1.0,
          urgent: 1.5,
          express: 2.0
        },
        description: 'Simple kurti for everyday wear - customer provides fabric'
      },
      {
        fabricProvider: 'customer',
        garmentType: 'salwar-kameez',
        basePrice: 2200,
        complexityMultiplier: 1.2,
        patternBonus: {
          plain: 0,
          striped: 100,
          checkered: 150,
          floral: 200,
          geometric: 250,
          custom: 300
        },
        specialFeatures: {
          embroidery: 400,
          beadwork: 300,
          sequins: 350,
          applique: 250,
          handStitching: 500
        },
        finishingBonus: {
          basic: 0,
          premium: 200,
          deluxe: 400
        },
        urgencyMultiplier: {
          normal: 1.0,
          urgent: 1.5,
          express: 2.0
        },
        description: 'Traditional salwar-kameez set - customer provides fabric'
      },
      {
        fabricProvider: 'customer',
        garmentType: 'churidar',
        basePrice: 2100,
        complexityMultiplier: 1.1,
        patternBonus: {
          plain: 0,
          striped: 100,
          checkered: 150,
          floral: 200,
          geometric: 250,
          custom: 300
        },
        specialFeatures: {
          embroidery: 400,
          beadwork: 300,
          sequins: 350,
          applique: 250,
          handStitching: 500
        },
        finishingBonus: {
          basic: 0,
          premium: 200,
          deluxe: 400
        },
        urgencyMultiplier: {
          normal: 1.0,
          urgent: 1.5,
          express: 2.0
        },
        description: 'Fitted churidar set - customer provides fabric'
      },
      {
        fabricProvider: 'customer',
        garmentType: 'frock',
        basePrice: 1600,
        complexityMultiplier: 0.9,
        patternBonus: {
          plain: 0,
          striped: 100,
          checkered: 150,
          floral: 200,
          geometric: 250,
          custom: 300
        },
        specialFeatures: {
          embroidery: 400,
          beadwork: 300,
          sequins: 350,
          applique: 250,
          handStitching: 500
        },
        finishingBonus: {
          basic: 0,
          premium: 200,
          deluxe: 400
        },
        urgencyMultiplier: {
          normal: 1.0,
          urgent: 1.5,
          express: 2.0
        },
        description: 'Casual frock dress - customer provides fabric'
      },
      {
        fabricProvider: 'customer',
        garmentType: 'palazzo-set',
        basePrice: 2000,
        complexityMultiplier: 1.0,
        patternBonus: {
          plain: 0,
          striped: 100,
          checkered: 150,
          floral: 200,
          geometric: 250,
          custom: 300
        },
        specialFeatures: {
          embroidery: 400,
          beadwork: 300,
          sequins: 350,
          applique: 250,
          handStitching: 500
        },
        finishingBonus: {
          basic: 0,
          premium: 200,
          deluxe: 400
        },
        urgencyMultiplier: {
          normal: 1.0,
          urgent: 1.5,
          express: 2.0
        },
        description: 'Modern palazzo set - customer provides fabric'
      },
      {
        fabricProvider: 'customer',
        garmentType: 'burkha',
        basePrice: 2300,
        complexityMultiplier: 1.3,
        patternBonus: {
          plain: 0,
          striped: 100,
          checkered: 150,
          floral: 200,
          geometric: 250,
          custom: 300
        },
        specialFeatures: {
          embroidery: 400,
          beadwork: 300,
          sequins: 350,
          applique: 250,
          handStitching: 500
        },
        finishingBonus: {
          basic: 0,
          premium: 200,
          deluxe: 400
        },
        urgencyMultiplier: {
          normal: 1.0,
          urgent: 1.5,
          express: 2.0
        },
        description: 'Traditional burkha - customer provides fabric'
      },
      {
        fabricProvider: 'customer',
        garmentType: 'sharee-blouse',
        basePrice: 2800,
        complexityMultiplier: 1.4,
        patternBonus: {
          plain: 0,
          striped: 100,
          checkered: 150,
          floral: 200,
          geometric: 250,
          custom: 300
        },
        specialFeatures: {
          embroidery: 400,
          beadwork: 300,
          sequins: 350,
          applique: 250,
          handStitching: 500
        },
        finishingBonus: {
          basic: 0,
          premium: 200,
          deluxe: 400
        },
        urgencyMultiplier: {
          normal: 1.0,
          urgent: 1.5,
          express: 2.0
        },
        description: 'Elegant sharee blouse - customer provides fabric'
      },
      {
        fabricProvider: 'customer',
        garmentType: 'lehenga',
        basePrice: 4200,
        complexityMultiplier: 1.8,
        patternBonus: {
          plain: 0,
          striped: 100,
          checkered: 150,
          floral: 200,
          geometric: 250,
          custom: 300
        },
        specialFeatures: {
          embroidery: 400,
          beadwork: 300,
          sequins: 350,
          applique: 250,
          handStitching: 500
        },
        finishingBonus: {
          basic: 0,
          premium: 200,
          deluxe: 400
        },
        urgencyMultiplier: {
          normal: 1.0,
          urgent: 1.5,
          express: 2.0
        },
        description: 'Bridal/party lehenga - customer provides fabric'
      },
      {
        fabricProvider: 'customer',
        garmentType: 'three-piece',
        basePrice: 3500,
        complexityMultiplier: 1.6,
        patternBonus: {
          plain: 0,
          striped: 100,
          checkered: 150,
          floral: 200,
          geometric: 250,
          custom: 300
        },
        specialFeatures: {
          embroidery: 400,
          beadwork: 300,
          sequins: 350,
          applique: 250,
          handStitching: 500
        },
        finishingBonus: {
          basic: 0,
          premium: 200,
          deluxe: 400
        },
        urgencyMultiplier: {
          normal: 1.0,
          urgent: 1.5,
          express: 2.0
        },
        description: 'Complete three-piece set - customer provides fabric'
      },
      {
        fabricProvider: 'customer',
        garmentType: 'maxi-dress',
        basePrice: 2500,
        complexityMultiplier: 1.3,
        patternBonus: {
          plain: 0,
          striped: 100,
          checkered: 150,
          floral: 200,
          geometric: 250,
          custom: 300
        },
        specialFeatures: {
          embroidery: 400,
          beadwork: 300,
          sequins: 350,
          applique: 250,
          handStitching: 500
        },
        finishingBonus: {
          basic: 0,
          premium: 200,
          deluxe: 400
        },
        urgencyMultiplier: {
          normal: 1.0,
          urgent: 1.5,
          express: 2.0
        },
        description: 'Long maxi dress - customer provides fabric'
      },
      {
        fabricProvider: 'customer',
        garmentType: 'kaftan',
        basePrice: 1800,
        complexityMultiplier: 0.9,
        patternBonus: {
          plain: 0,
          striped: 100,
          checkered: 150,
          floral: 200,
          geometric: 250,
          custom: 300
        },
        specialFeatures: {
          embroidery: 400,
          beadwork: 300,
          sequins: 350,
          applique: 250,
          handStitching: 500
        },
        finishingBonus: {
          basic: 0,
          premium: 200,
          deluxe: 400
        },
        urgencyMultiplier: {
          normal: 1.0,
          urgent: 1.5,
          express: 2.0
        },
        description: 'Comfortable kaftan - customer provides fabric'
      },
      {
        fabricProvider: 'customer',
        garmentType: 'tunic',
        basePrice: 1700,
        complexityMultiplier: 0.8,
        patternBonus: {
          plain: 0,
          striped: 100,
          checkered: 150,
          floral: 200,
          geometric: 250,
          custom: 300
        },
        specialFeatures: {
          embroidery: 400,
          beadwork: 300,
          sequins: 350,
          applique: 250,
          handStitching: 500
        },
        finishingBonus: {
          basic: 0,
          premium: 200,
          deluxe: 400
        },
        urgencyMultiplier: {
          normal: 1.0,
          urgent: 1.5,
          express: 2.0
        },
        description: 'Simple tunic top - customer provides fabric'
      }
    ];

    // Tailor-provided fabric pricing configurations for Bangladeshi women's dresses
    const tailorFabricPricing = [
      {
        fabricProvider: 'tailor',
        garmentType: 'kurti',
        basePrice: 1500,
        complexityMultiplier: 0.8,
        fabricPricing: {
          formal: 200,
          casual: 150,
          premium: 400,
          luxury: 600,
          cotton: 180,
          silk: 500,
          denim: 220,
          wool: 300,
          linen: 250,
          polyester: 150
        },
        patternBonus: {
          plain: 0,
          striped: 100,
          checkered: 150,
          floral: 200,
          geometric: 250,
          custom: 300
        },
        specialFeatures: {
          embroidery: 400,
          beadwork: 300,
          sequins: 350,
          applique: 250,
          handStitching: 500
        },
        finishingBonus: {
          basic: 0,
          premium: 200,
          deluxe: 400
        },
        urgencyMultiplier: {
          normal: 1.0,
          urgent: 1.5,
          express: 2.0
        },
        description: 'Simple kurti - tailor provides fabric'
      },
      {
        fabricProvider: 'tailor',
        garmentType: 'salwar-kameez',
        basePrice: 1800,
        complexityMultiplier: 1.2,
        fabricPricing: {
          formal: 400,
          casual: 300,
          premium: 600,
          luxury: 900,
          cotton: 350,
          silk: 700,
          denim: 400,
          wool: 500,
          linen: 450,
          polyester: 300
        },
        patternBonus: {
          plain: 0,
          striped: 100,
          checkered: 150,
          floral: 200,
          geometric: 250,
          custom: 300
        },
        specialFeatures: {
          embroidery: 400,
          beadwork: 300,
          sequins: 350,
          applique: 250,
          handStitching: 500
        },
        finishingBonus: {
          basic: 0,
          premium: 200,
          deluxe: 400
        },
        urgencyMultiplier: {
          normal: 1.0,
          urgent: 1.5,
          express: 2.0
        },
        description: 'Traditional salwar-kameez - tailor provides fabric'
      },
      {
        fabricProvider: 'tailor',
        garmentType: 'churidar',
        basePrice: 1700,
        complexityMultiplier: 1.1,
        fabricPricing: {
          formal: 350,
          casual: 250,
          premium: 550,
          luxury: 800,
          cotton: 300,
          silk: 650,
          denim: 350,
          wool: 450,
          linen: 400,
          polyester: 250
        },
        patternBonus: {
          plain: 0,
          striped: 100,
          checkered: 150,
          floral: 200,
          geometric: 250,
          custom: 300
        },
        specialFeatures: {
          embroidery: 400,
          beadwork: 300,
          sequins: 350,
          applique: 250,
          handStitching: 500
        },
        finishingBonus: {
          basic: 0,
          premium: 200,
          deluxe: 400
        },
        urgencyMultiplier: {
          normal: 1.0,
          urgent: 1.5,
          express: 2.0
        },
        description: 'Fitted churidar set - tailor provides fabric'
      },
      {
        fabricProvider: 'tailor',
        garmentType: 'frock',
        basePrice: 1500,
        complexityMultiplier: 0.9,
        fabricPricing: {
          formal: 250,
          casual: 200,
          premium: 450,
          luxury: 650,
          cotton: 220,
          silk: 550,
          denim: 270,
          wool: 350,
          linen: 300,
          polyester: 200
        },
        patternBonus: {
          plain: 0,
          striped: 100,
          checkered: 150,
          floral: 200,
          geometric: 250,
          custom: 300
        },
        specialFeatures: {
          embroidery: 400,
          beadwork: 300,
          sequins: 350,
          applique: 250,
          handStitching: 500
        },
        finishingBonus: {
          basic: 0,
          premium: 200,
          deluxe: 400
        },
        urgencyMultiplier: {
          normal: 1.0,
          urgent: 1.5,
          express: 2.0
        },
        description: 'Casual frock dress - tailor provides fabric'
      },
      {
        fabricProvider: 'tailor',
        garmentType: 'palazzo-set',
        basePrice: 1600,
        complexityMultiplier: 1.0,
        fabricPricing: {
          formal: 300,
          casual: 250,
          premium: 500,
          luxury: 750,
          cotton: 280,
          silk: 600,
          denim: 320,
          wool: 400,
          linen: 350,
          polyester: 250
        },
        patternBonus: {
          plain: 0,
          striped: 100,
          checkered: 150,
          floral: 200,
          geometric: 250,
          custom: 300
        },
        specialFeatures: {
          embroidery: 400,
          beadwork: 300,
          sequins: 350,
          applique: 250,
          handStitching: 500
        },
        finishingBonus: {
          basic: 0,
          premium: 200,
          deluxe: 400
        },
        urgencyMultiplier: {
          normal: 1.0,
          urgent: 1.5,
          express: 2.0
        },
        description: 'Modern palazzo set - tailor provides fabric'
      },
      {
        fabricProvider: 'tailor',
        garmentType: 'burkha',
        basePrice: 1900,
        complexityMultiplier: 1.3,
        fabricPricing: {
          formal: 400,
          casual: 300,
          premium: 600,
          luxury: 900,
          cotton: 350,
          silk: 700,
          denim: 400,
          wool: 500,
          linen: 450,
          polyester: 300
        },
        patternBonus: {
          plain: 0,
          striped: 100,
          checkered: 150,
          floral: 200,
          geometric: 250,
          custom: 300
        },
        specialFeatures: {
          embroidery: 400,
          beadwork: 300,
          sequins: 350,
          applique: 250,
          handStitching: 500
        },
        finishingBonus: {
          basic: 0,
          premium: 200,
          deluxe: 400
        },
        urgencyMultiplier: {
          normal: 1.0,
          urgent: 1.5,
          express: 2.0
        },
        description: 'Traditional burkha - tailor provides fabric'
      },
      {
        fabricProvider: 'tailor',
        garmentType: 'sharee-blouse',
        basePrice: 2400,
        complexityMultiplier: 1.4,
        fabricPricing: {
          formal: 500,
          casual: 400,
          premium: 700,
          luxury: 1000,
          cotton: 450,
          silk: 850,
          denim: 500,
          wool: 600,
          linen: 550,
          polyester: 400
        },
        patternBonus: {
          plain: 0,
          striped: 100,
          checkered: 150,
          floral: 200,
          geometric: 250,
          custom: 300
        },
        specialFeatures: {
          embroidery: 400,
          beadwork: 300,
          sequins: 350,
          applique: 250,
          handStitching: 500
        },
        finishingBonus: {
          basic: 0,
          premium: 200,
          deluxe: 400
        },
        urgencyMultiplier: {
          normal: 1.0,
          urgent: 1.5,
          express: 2.0
        },
        description: 'Elegant sharee blouse - tailor provides fabric'
      },
      {
        fabricProvider: 'tailor',
        garmentType: 'lehenga',
        basePrice: 3500,
        complexityMultiplier: 1.8,
        fabricPricing: {
          formal: 800,
          casual: 600,
          premium: 1000,
          luxury: 1500,
          cotton: 700,
          silk: 1300,
          denim: 800,
          wool: 1000,
          linen: 850,
          polyester: 600
        },
        patternBonus: {
          plain: 0,
          striped: 100,
          checkered: 150,
          floral: 200,
          geometric: 250,
          custom: 300
        },
        specialFeatures: {
          embroidery: 400,
          beadwork: 300,
          sequins: 350,
          applique: 250,
          handStitching: 500
        },
        finishingBonus: {
          basic: 0,
          premium: 200,
          deluxe: 400
        },
        urgencyMultiplier: {
          normal: 1.0,
          urgent: 1.5,
          express: 2.0
        },
        description: 'Bridal/party lehenga - tailor provides fabric'
      },
      {
        fabricProvider: 'tailor',
        garmentType: 'three-piece',
        basePrice: 2800,
        complexityMultiplier: 1.6,
        fabricPricing: {
          formal: 700,
          casual: 500,
          premium: 900,
          luxury: 1300,
          cotton: 600,
          silk: 1200,
          denim: 700,
          wool: 900,
          linen: 750,
          polyester: 500
        },
        patternBonus: {
          plain: 0,
          striped: 100,
          checkered: 150,
          floral: 200,
          geometric: 250,
          custom: 300
        },
        specialFeatures: {
          embroidery: 400,
          beadwork: 300,
          sequins: 350,
          applique: 250,
          handStitching: 500
        },
        finishingBonus: {
          basic: 0,
          premium: 200,
          deluxe: 400
        },
        urgencyMultiplier: {
          normal: 1.0,
          urgent: 1.5,
          express: 2.0
        },
        description: 'Complete three-piece set - tailor provides fabric'
      },
      {
        fabricProvider: 'tailor',
        garmentType: 'maxi-dress',
        basePrice: 2100,
        complexityMultiplier: 1.3,
        fabricPricing: {
          formal: 450,
          casual: 350,
          premium: 650,
          luxury: 950,
          cotton: 400,
          silk: 800,
          denim: 450,
          wool: 550,
          linen: 500,
          polyester: 350
        },
        patternBonus: {
          plain: 0,
          striped: 100,
          checkered: 150,
          floral: 200,
          geometric: 250,
          custom: 300
        },
        specialFeatures: {
          embroidery: 400,
          beadwork: 300,
          sequins: 350,
          applique: 250,
          handStitching: 500
        },
        finishingBonus: {
          basic: 0,
          premium: 200,
          deluxe: 400
        },
        urgencyMultiplier: {
          normal: 1.0,
          urgent: 1.5,
          express: 2.0
        },
        description: 'Long maxi dress - tailor provides fabric'
      },
      {
        fabricProvider: 'tailor',
        garmentType: 'kaftan',
        basePrice: 1500,
        complexityMultiplier: 0.9,
        fabricPricing: {
          formal: 300,
          casual: 200,
          premium: 500,
          luxury: 700,
          cotton: 250,
          silk: 600,
          denim: 300,
          wool: 400,
          linen: 350,
          polyester: 200
        },
        patternBonus: {
          plain: 0,
          striped: 100,
          checkered: 150,
          floral: 200,
          geometric: 250,
          custom: 300
        },
        specialFeatures: {
          embroidery: 400,
          beadwork: 300,
          sequins: 350,
          applique: 250,
          handStitching: 500
        },
        finishingBonus: {
          basic: 0,
          premium: 200,
          deluxe: 400
        },
        urgencyMultiplier: {
          normal: 1.0,
          urgent: 1.5,
          express: 2.0
        },
        description: 'Comfortable kaftan - tailor provides fabric'
      },
      {
        fabricProvider: 'tailor',
        garmentType: 'tunic',
        basePrice: 1500,
        complexityMultiplier: 0.8,
        fabricPricing: {
          formal: 250,
          casual: 180,
          premium: 450,
          luxury: 650,
          cotton: 200,
          silk: 550,
          denim: 250,
          wool: 350,
          linen: 300,
          polyester: 180
        },
        patternBonus: {
          plain: 0,
          striped: 100,
          checkered: 150,
          floral: 200,
          geometric: 250,
          custom: 300
        },
        specialFeatures: {
          embroidery: 400,
          beadwork: 300,
          sequins: 350,
          applique: 250,
          handStitching: 500
        },
        finishingBonus: {
          basic: 0,
          premium: 200,
          deluxe: 400
        },
        urgencyMultiplier: {
          normal: 1.0,
          urgent: 1.5,
          express: 2.0
        },
        description: 'Simple tunic top - tailor provides fabric'
      }
    ];

    // Insert all pricing configurations
    const allPricingData = [...customerFabricPricing, ...tailorFabricPricing];
    await Pricing.insertMany(allPricingData);

    console.log(`Successfully initialized ${allPricingData.length} pricing configurations for Bangladeshi women's dresses`);
    console.log('Pricing data initialized successfully!');

    // Test the pricing calculation
    console.log('\nTesting pricing calculation...');
    
    const testOrder = {
      garmentType: 'salwar-kameez',
      fabricProvider: 'tailor',
      fabricType: 'silk',
      pattern: 'floral',
      specialFeatures: ['embroidery', 'beadwork'],
      finishing: 'premium',
      urgency: 'normal'
    };

    const pricing = await Pricing.calculatePrice(testOrder);
    console.log('Test order (Salwar-Kameez):', testOrder);
    console.log('Calculated pricing:', pricing);

  } catch (error) {
    console.error('Error initializing pricing data:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the initialization
initializeBangladeshiWomenPricing();
