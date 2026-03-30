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

module.exports = {
  getImagePipelineStages,
  getUserRatingPipelineStages,
  getRestaurantLookupStages,
};
