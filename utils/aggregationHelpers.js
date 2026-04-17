const { default: mongoose } = require("mongoose");

// ==================== IMAGE LOOKUP & TRANSFORMATION ====================

/**
 * Returns pipeline stages for looking up and formatting images
 * @param {boolean} shouldIncludeImages
 * @returns {Array} array of pipeline stages
 */
const getImagePipelineStages = (shouldIncludeImages) => {
  if (!shouldIncludeImages) {
    return [
      {
        $addFields: {
          images: [], // Always return images: [] for consistency
        },
      },
    ];
  }

  return [
    // Step 1: Lookup images
    {
      $lookup: {
        from: "menuitemimages",
        localField: "_id",
        foreignField: "menuItemId",
        as: "images",
      },
    },
    // Step 2: Sort by order + createdAt, then map to URLs only
    {
      $addFields: {
        images: {
          $map: {
            input: {
              $sortArray: {
                input: "$images",
                sortBy: { order: 1, createdAt: 1 },
              },
            },
            as: "img",
            in: "$$img.url",
          },
        },
      },
    },
  ];
};

const getMenuItemRatingLookupStages = (userId) => {
  return [
    ...(userId
      ? [
          {
            $lookup: {
              from: "menuitemratings",
              let: { menuItemId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$menuItem", "$$menuItemId"] },
                        {
                          $eq: ["$user", new mongoose.Types.ObjectId(userId)],
                        },
                      ],
                    },
                  },
                },
              ],
              as: "userRating",
            },
          },
          {
            $addFields: {
              isRated: { $gt: [{ $size: "$userRating" }, 0] },
              myRating: { $arrayElemAt: ["$userRating.rating", 0] },
            },
          },
          { $project: { userRating: 0 } },
        ]
      : [{ $addFields: { isRated: false, myRating: null } }]),
  ];
};

// ==================== USER RATING LOOKUP ====================

/**
 * Returns pipeline stages for user-specific rating (if user is logged in)
 * @param {string|ObjectId} userId
 * @returns {Array} array of pipeline stages
 */
const getUserRatingPipelineStages = (userId) => {
  if (!userId) return [];

  return [
    {
      $lookup: {
        from: "menuitemratings",
        let: { menuItemId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$menuItem", "$$menuItemId"] },
                  { $eq: ["$user", new mongoose.Types.ObjectId(userId)] },
                ],
              },
            },
          },
          { $limit: 1 },
        ],
        as: "userRating",
      },
    },
    {
      $addFields: {
        isRated: { $gt: [{ $size: "$userRating" }, 0] },
        myRating: { $arrayElemAt: ["$userRating.rating", 0] },
      },
    },
    { $project: { userRating: 0 } },
  ];
};

// ==================== RESTAURANT LOOKUP ====================

const getRestaurantLookupStages = () => [
  {
    $lookup: {
      from: "restaurants",
      localField: "restaurant_id",
      foreignField: "_id",
      as: "restaurant_id",
    },
  },
  {
    $addFields: {
      restaurant_id: { $arrayElemAt: ["$restaurant_id", 0] },
    },
  },
];

const getPostImageLookupStages = () => {
  return [
    {
      $lookup: {
        from: "postimages",
        localField: "_id",
        foreignField: "postId",
        as: "media",
      },
    },
    {
      $addFields: {
        media: {
          $sortArray: {
            input: "$media",
            sortBy: { order: 1 },
          },
        },
      },
    },
  ];
};

const getPostLikeLookupStages = (userId) => {
  return [
    {
      $lookup: {
        from: "postlikes", // Fixed: Use lowercase (MongoDB collection name)
        localField: "_id",
        foreignField: "postId",
        as: "likeCount",
      },
    },
    {
      $addFields: {
        likeCount: { $size: "$likeCount" },
      },
    },
    ...(userId
      ? [
          {
            $lookup: {
              from: "postlikes", // Fixed: Use lowercase for consistency
              let: { postId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$postId", "$$postId"] },
                        {
                          $eq: ["$userId", new mongoose.Types.ObjectId(userId)],
                        },
                      ],
                    },
                  },
                },
              ],
              as: "userLike",
            },
          },
          {
            $addFields: {
              isLiked: { $gt: [{ $size: "$userLike" }, 0] },
            },
          },
          { $project: { userLike: 0 } },
        ]
      : [{ $addFields: { isLiked: false } }]),
  ];
};

/**
 * Get recent likes lookup stage for posts
 * @param {Date} sinceDate - Date filter for recent likes
 * @returns {Array} pipeline stages for recent likes lookup
 */
const getRecentLikesLookupStages = (sinceDate) => {
  return [
    {
      $lookup: {
        from: "postlikes",
        let: { postId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$postId", "$$postId"] },
                  { $gte: ["$createdAt", new Date(sinceDate)] },
                ],
              },
            },
          },
        ],
        as: "recentLikes",
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$recentLikes" },
      },
    },
  ];
};

/**
 * Get recent comments lookup stage
 * @param {Date} sinceDate - Date filter for recent comments
 * @returns {Array} pipeline stages for recent comments lookup
 */
const getRecentCommentsLookupStages = (sinceDate) => {
  return [
    {
      $lookup: {
        from: "comments",
        let: { postId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$postId", "$$postId"] },
                  { $gte: ["$createdAt", new Date(sinceDate)] },
                ],
              },
            },
          },
        ],
        as: "recentComments",
      },
    },
    {
      $addFields: {
        commentsCount: { $size: "$recentComments" },
      },
    },
  ];
};

/**
 * Get recent restaurant followers lookup stage
 * @param {Date} sinceDate - Date filter for recent follows
 * @returns {Array} pipeline stages for recent followers lookup
 */
const getRecentFollowersLookupStages = (sinceDate) => {
  return [
    {
      $lookup: {
        from: "restaurantfollows",
        let: { restaurantId: "$restaurant_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$restaurant_id", "$$restaurantId"] },
                  { $gte: ["$followed_at", new Date(sinceDate)] },
                ],
              },
            },
          },
        ],
        as: "recentFollowers",
      },
    },
    {
      $addFields: {
        restaurantFollowersCount: { $size: "$recentFollowers" },
      },
    },
  ];
};

/**
 * Get recent ratings lookup stage for menu items
 * @param {Date} sinceDate - Date filter for recent ratings
 * @returns {Array} pipeline stages for recent ratings lookup
 */
const getRecentRatingsLookupStages = (sinceDate) => {
  return [
    {
      $lookup: {
        from: "menuitemratings",
        let: { menuItemId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$menuItem", "$$menuItemId"] },
                  { $gte: ["$createdAt", new Date(sinceDate)] },
                ],
              },
            },
          },
        ],
        as: "recentRatings",
      },
    },
    {
      $addFields: {
        ratingsCount: { $size: "$recentRatings" },
        avgRating: { $avg: "$recentRatings.rating" },
      },
    },
  ];
};

/**
 * Calculate trending score for unified content (posts + menuItems)
 * @returns {Array} pipeline stages for trending score calculation
 */
const getTrendingScoreStages = () => {
  return [
    // calculate hours since creation
    {
      $addFields: {
        hoursSinceCreation: {
          $divide: [{ $subtract: [new Date(), "$createdAt"] }, 1000 * 60 * 60],
        },
      },
    },

    // Calculate engagement score
    {
      $addFields: {
        engagementScore: {
          $add: [
            // Likes/ratings weight based on content type
            {
              $cond: [
                { $eq: ["$contentType", "post"] },
                { $multiply: [{ $ifNull: ["$likesCount", 0] }, 0.3] },
                { $multiply: [{ $ifNull: ["$ratingsCount", 0] }, 0.4] },
              ],
            },
            // Comments weight (universal)
            { $multiply: [{ $ifNull: ["$commentsCount", 0] }, 0.8] },
            // Restaurant followers weight
            {
              $multiply: [{ $ifNull: ["$restaurantFollowersCount", 0] }, 0.15],
            },
            // Rating quality bonus (menu items only)
            {
              $cond: [
                { $eq: ["$contentType", "menuItem"] },
                { $multiply: [{ $ifNull: ["$avgRating", 0] }, 0.5] },
                0,
              ],
            },
            // Boost bonus
            {
              $cond: [
                {
                  $and: [
                    { $eq: ["$is_boosted", true] },
                    { $gt: ["$boosted_until", new Date()] },
                  ],
                },
                3.0,
                0,
              ],
            },
            // Base score - so even without engagement, posts show up
            0.5,
          ],
        },
        // Time decay factor
        timeDecay: {
          $exp: {
            $multiply: [-0.005, "$hoursSinceCreation"],
          },
        },
      },
    },

    // Calculate final trending score
    {
      $addFields: {
        trendingScore: {
          $multiply: ["$engagementScore", "$timeDecay"],
        },
      },
    },

    // Filter out low scores - REMOVED for now
    {
      $match: {
        trendingScore: { $gt: 0.01 },
      },
    },
  ];
};

/**
 * Get unified pipeline for posts with all necessary lookups
 * @param {string} sinceDate - Date filter for createdAt
 * @param {string} userId - Optional user ID for user-specific data
 * @returns {Array} pipeline stages for posts
 */
const getUnifiedPostPipeline = (sinceDate, userId) => {
  const isUserLoggedIn = !!userId;

  return [
    // Match posts - NO time filter on createdAt
    {
      $match: {
        type: "normal",
      },
    },
    // Restaurant lookup
    ...getRestaurantLookupStages(),
    // Post images lookup
    ...getPostImageLookupStages(),
    // Map images to URLs
    {
      $addFields: {
        images: {
          $map: {
            input: "$media",
            as: "img",
            in: "$$img.url",
          },
        },
      },
    },
    // Recent likes lookup
    ...getRecentLikesLookupStages(sinceDate),
    // User like check
    ...getPostLikeLookupStages(userId),
    // Recent comments lookup
    ...getRecentCommentsLookupStages(sinceDate),
    // Recent restaurant followers lookup
    ...getRecentFollowersLookupStages(sinceDate),
    // Unify fields
    {
      $addFields: {
        contentType: "post",
        title: { $ifNull: ["$details.name", "Untitled Post"] },
        description: { $ifNull: ["$details.description", ""] },
        price: { $ifNull: ["$details.price", null] },
        is_boosted: { $ifNull: ["$details.is_boosted", false] },
        boosted_until: "$details.boosted_until",
        ingredients: { $ifNull: ["$details.ingredients", []] },
        cautions: { $ifNull: ["$details.cautions", []] },
        ratingsCount: 0,
        avgRating: 0,
      },
    },
  ];
};

/**
 * Get unified pipeline for menu items with all necessary lookups
 * @param {string} sinceDate - Date filter for createdAt
 * @param {string} userId - Optional user ID for user-specific data
 * @returns {Array} pipeline stages for menu items
 */
const getUnifiedMenuItemPipeline = (sinceDate, userId) => {
  const isUserLoggedIn = !!userId;

  return [
    // Match menu items - NO time filter
    {
      $match: {},
    },
    // Restaurant lookup
    ...getRestaurantLookupStages(),
    // Menu item images lookup
    ...getImagePipelineStages(true),
    // Recent ratings lookup
    ...getRecentRatingsLookupStages(sinceDate),
    // User rating check
    ...getMenuItemRatingLookupStages(userId),
    // Recent comments lookup
    ...getRecentCommentsLookupStages(sinceDate),
    // Recent restaurant followers lookup
    ...getRecentFollowersLookupStages(sinceDate),
    // Unify fields
    {
      $addFields: {
        contentType: "menuItem",
        title: { $ifNull: ["$name", "Untitled Item"] },
        description: { $ifNull: ["$description", ""] },
        price: { $ifNull: ["$price", null] },
        type: "menuItem",
        details: {
          description: "$description",
          name: "$name",
          price: "$price",
          ingredients: "$ingredients",
          cautions: "$cautions",
          is_boosted: "$is_boosted",
          boosted_until: "$boosted_until",
          averageRating: "$averageRating",
          totalRatings: "$totalRatings",
        },
        likesCount: 0,
      },
    },
  ];
};

/**
 * Format trending items for consistent frontend response
 * @param {Array} items - Raw trending items from aggregation
 * @param {boolean} isUserLoggedIn - Whether user is logged in
 * @returns {Array} formatted items
 */
const formatTrendingResponse = (items, isUserLoggedIn = false) => {
  return items.map((item) => {
    const baseResponse = {
      id: item._id,
      type: item.type || "normal",
      contentType: item.contentType,
      isPost: item.contentType === "post",
      isMenuItem: item.contentType === "menuItem",

      // Basic info
      title: item.title,
      description: item.description,
      price: item.price,

      // Ingredients and cautions (for menuItems)
      ingredients: item.ingredients || [],
      cautions: item.cautions || [],

      // Media
      media: item.images || [],

      // Timestamps
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,

      // Restaurant info
      restaurantInfo: {
        restaurant_id: item.restaurant_id?._id || item.restaurant_id,
        restaurantName: item.restaurant_id?.name,
        restaurantImage: item.restaurant_id?.displayPicture,
      },

      // Engagement metrics
      engagementMetrics: {
        likes: item.likesCount || 0,
        comments: item.commentsCount || 0,
        ratings: item.ratingsCount || 0,
        averageRating: Math.round((item.avgRating || 0) * 10) / 10,
        restaurantFollowers: item.restaurantFollowersCount || 0,
        hoursSinceCreation: Math.round(item.hoursSinceCreation * 10) / 10,
      },

      // Trending score
      trendingScore: Math.round(item.trendingScore * 100) / 100,

      // Boost info
      is_boosted: item.is_boosted || false,
      boosted_until: item.boosted_until,
    };

    // Add user-specific fields if logged in
    if (isUserLoggedIn) {
      baseResponse.isLiked = item.isLiked || false;
      baseResponse.isRated = item.isRated || false;
      baseResponse.myRating = item.myRating || null;
    }

    return baseResponse;
  });
};
/**
 * Get complete trending pipeline combining posts and menu items
 * @param {Object} options - Pipeline options
 * @param {string} options.sinceDate - Date filter for createdAt
 * @param {number} options.limit - Result limit
 * @param {string} options.userId - Optional user ID
 * @returns {Array} complete aggregation pipeline
 */
const getTrendingPipeline = ({ sinceDate, limit = 20, userId }) => {
  const isUserLoggedIn = !!userId;

  // Get post pipeline stages
  const postStages = getUnifiedPostPipeline(sinceDate, userId);
  // Get menuItem pipeline stages
  const menuItemStages = getUnifiedMenuItemPipeline(sinceDate, userId);

  return [
    // Dummy stage to start pipeline
    {
      $match: { _id: { $exists: true } },
    },

    // Use $facet with proper structure
    {
      $facet: {
        posts: postStages,
        menuItems: menuItemStages,
      },
    },
    // Combine results
    {
      $project: {
        items: {
          $concatArrays: ["$posts", "$menuItems"],
        },
      },
    },
    // Unwind the combined array
    {
      $unwind: "$items",
    },
    // Replace root with the item
    {
      $replaceRoot: { newRoot: "$items" },
    },
    // Calculate trending scores
    ...getTrendingScoreStages(),
    // Sort by trending score
    {
      $sort: {
        trendingScore: -1,
      },
    },
    // Apply limit
    {
      $limit: parseInt(limit),
    },
    // Final projection
    {
      $project: {
        _id: 1,
        contentType: 1,
        type: 1,
        title: 1,
        description: 1,
        price: 1,
        images: 1,
        createdAt: 1,
        updatedAt: 1,
        restaurant_id: 1,
        trendingScore: 1,
        likesCount: 1,
        commentsCount: 1,
        ratingsCount: 1,
        avgRating: 1,
        restaurantFollowersCount: 1,
        hoursSinceCreation: 1,
        ingredients: 1,
        cautions: 1,
        is_boosted: 1,
        boosted_until: 1,
        ...(isUserLoggedIn && {
          isLiked: 1,
          isRated: 1,
          myRating: 1,
        }),
      },
    },
  ];
};

module.exports = {
  getImagePipelineStages,
  getPostImageLookupStages,
  getUserRatingPipelineStages,
  getRestaurantLookupStages,
  getPostLikeLookupStages,
  getMenuItemRatingLookupStages,
  getTrendingScoreStages,
  getUnifiedPostPipeline,
  getUnifiedMenuItemPipeline,
  formatTrendingResponse,
  getTrendingPipeline,
  getRecentLikesLookupStages,
  getRecentCommentsLookupStages,
  getRecentFollowersLookupStages,
  getRecentRatingsLookupStages,
};
