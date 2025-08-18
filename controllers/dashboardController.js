const User = require('../models/User');
const Tailor = require('../models/Tailor');

// Get Dashboard Data
exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Get dashboard statistics
    const totalTailors = await Tailor.countDocuments({ isApproved: true });
    const availableTailors = await Tailor.countDocuments({ 
      isApproved: true, 
      isVerified: true 
    });

    // Dashboard data
    const dashboardData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        isVerified: user.isVerified
      },
      stats: {
        totalTailors,
        availableTailors,
        totalOrders: 0, // Will be implemented later
        pendingOrders: 0 // Will be implemented later
      },
      quickActions: [
        {
          title: 'Order Now',
          description: 'Place a new tailoring order',
          icon: 'shopping-bag',
          route: '/order'
        },
        {
          title: 'View Items',
          description: 'See your ordered items',
          icon: 'package',
          route: '/items'
        },
        {
          title: 'Find Tailors',
          description: 'Browse available tailors',
          icon: 'users',
          route: '/tailors'
        },
        {
          title: 'Profile',
          description: 'Update your information',
          icon: 'user',
          route: '/profile'
        }
      ]
    };

    res.status(200).json({
      status: 'success',
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
};

// Get Dashboard Summary
exports.getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const summary = {
      welcomeMessage: `Welcome back, ${req.user.name}!`,
      notifications: [
        {
          type: 'info',
          message: 'Complete your profile to get better recommendations',
          show: !req.user.phone || !req.user.address
        },
        {
          type: 'warning',
          message: 'Please verify your email address',
          show: !req.user.isVerified
        }
      ].filter(notification => notification.show),
      recentActivity: [], // Will be implemented later
      recommendedTailors: await Tailor.aggregate([
        { $match: { isApproved: true, isVerified: true } },
        { $addFields: {
            experience: {
              $cond: {
                if: { $or: [
                  { $eq: ["$experience", null] },
                  { $eq: ["$experience", undefined] },
                  { $eq: ["$experience", 0] }
                ]},
                then: { $add: [{ $floor: { $multiply: [{ $random: {} }, 18] } }, 3] }, // Random 3-20
                else: "$experience"
              }
            },
            specialization: {
              $cond: {
                if: { $eq: [{ $size: "$specialization" }, 0] },
                then: ["Suits", "Formal Wear", "Business Attire"], // Default specializations
                else: {
                  $filter: {
                    input: "$specialization",
                    as: "spec",
                    cond: { 
                      $in: ["$$spec", [
                        "Suits", "Dresses", "Shirts", "Pants", "Skirts", 
                        "Blazers", "Evening Gowns", "Wedding Dresses", 
                        "Business Attire", "Casual Wear", "Formal Wear", 
                        "Alterations"
                      ]]
                    }
                  }
                }
              }
            }
          }
        },
        { $sort: { experience: -1 } }, // Sort by experience
        { $limit: 3 }
      ])
    };

    res.status(200).json({
      status: 'success',
      data: summary
    });

  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard summary',
      error: error.message
    });
  }
};
