const Event = require("../models/Event");
const Post = require("../models/Post");
const Restaurant = require("../models/Restaurant");
const MenuItem = require("../models/MenuItem");
const PostLike = require("../models/PostLike");
const MenuItemRating = require("../models/MenuItemRating");
const { splitDateTime } = require("./eventController");
const EventLike = require("../models/EventLike");
const EventRating = require("../models/EventRating");
const RestaurantFollow = require("../models/RestaurantFollow");

const searchController = async (req, res, next) => {
  try {
    let { minPrice, maxPrice, ratings, searchText } = req.query;
    const userId = req?.user?._id;

    // ------------------ NORMALIZE INPUT ------------------
    minPrice = minPrice ? parseInt(minPrice) : null;
    maxPrice = maxPrice ? parseInt(maxPrice) : null;
    ratings = ratings ? parseInt(ratings) : null;

    const isSearchEmpty = !searchText || searchText.trim() === "";
    const searchRegex = !isSearchEmpty ? new RegExp(searchText, "i") : null;

    // ------------------ BUILD FILTERS ------------------
    const eventFilter = { is_live: true };
    if (!isSearchEmpty) {
      eventFilter.event_title = { $regex: searchRegex };
    }

    const postFilter = {};
    if (!isSearchEmpty) {
      postFilter["details.name"] = { $regex: searchRegex };
    }
    if (ratings !== null) {
      postFilter["details.averageRating"] = { $gte: ratings };
    }

    const menuItemFilter = {};
    if (!isSearchEmpty) {
      menuItemFilter.name = { $regex: searchRegex };
    }
    if (minPrice !== null || maxPrice !== null) {
      menuItemFilter.price = {};
      if (minPrice !== null) menuItemFilter.price.$gte = minPrice;
      if (maxPrice !== null) menuItemFilter.price.$lte = maxPrice;
    }
    if (ratings !== null) {
      menuItemFilter.averageRating = { $gte: ratings };
    }

    const restaurantFilter = {};
    if (!isSearchEmpty) {
      restaurantFilter.name = { $regex: searchRegex };
    }

    // ------------------ PROMISES (SEPARATED) ------------------
    const eventPromise = Event.find(eventFilter).lean();

    const postPromise = Post.find(postFilter)
      .populate("restaurant_id", "name displayPicture")
      .populate({
        path: "media",
        options: { sort: { isPrimary: -1, order: 1 } },
      })
      .populate("likeCount")
      .lean();

    const menuItemPromise = MenuItem.find(menuItemFilter)
      .populate("restaurant_id")
      .populate({
        path: "images",
        options: { sort: { isPrimary: -1, order: 1 } },
      })
      .lean();

    const restaurantPromise = Restaurant.find(restaurantFilter).lean();

    // ------------------ EXECUTE MAIN QUERIES ------------------
    const [events, posts, menuItems, restaurants] = await Promise.all([
      eventPromise,
      postPromise,
      menuItemPromise,
      restaurantPromise,
    ]);

    // ================== EVENT LIKES ==================
    const eventIds = events.map((e) => e._id);

    const eventLikes = await EventLike.find({
      userId,
      eventId: { $in: eventIds },
    }).lean();

    const likedEventSet = new Set(eventLikes.map((l) => l.eventId.toString()));

    // ================== EVENT RATINGS ==================
    const eventRatings = await EventRating.find({
      userId,
      eventId: { $in: eventIds },
    }).lean();

    const eventRatingMap = {};
    eventRatings.forEach((r) => {
      eventRatingMap[r.eventId.toString()] = r.rating;
    });

    // ================== FORMAT EVENTS ==================
    const formattedEvents = events.map((event) => {
      const id = event._id.toString();

      const start = splitDateTime(event.start_at);
      const expire = splitDateTime(event.expires_at);

      const { start_at, expires_at, ...rest } = event;

      const myRating = eventRatingMap[id];
      const isRated = myRating !== undefined;

      return {
        ...rest,
        isLiked: likedEventSet.has(id),
        isRated,
        ...(isRated && { myRating }),
        start_date: start?.date || null,
        start_time: start?.time || null,
        expire_date: expire?.date || null,
        expire_time: expire?.time || null,
      };
    });

    // ================== POST LIKES ==================
    const postIds = posts.map((p) => p._id);

    const postLikes = await PostLike.find({
      postId: { $in: postIds },
      userId,
    }).lean();

    const likedPostSet = new Set(postLikes.map((l) => l.postId.toString()));

    const formattedPosts = posts.map((post) => ({
      _id: post._id,
      details: post.details,
      restaurant: post.restaurant_id,
      media: post.media || [],
      likeCount: post.likeCount || 0,
      isLiked: likedPostSet.has(post._id.toString()),
    }));

    // ================== MENU ITEM RATINGS ==================
    const menuItemIds = menuItems.map((m) => m._id);

    const menuRatings = await MenuItemRating.find({
      userId,
      menuItemId: { $in: menuItemIds },
    }).lean();

    const menuRatingMap = new Map();
    menuRatings.forEach((r) => {
      menuRatingMap.set(r.menuItemId.toString(), r.rating);
    });

    const formattedMenuItems = menuItems.map((item) => {
      const myRating = menuRatingMap.get(item._id.toString());

      return {
        _id: item._id,
        name: item.name,
        price: item.price,
        restaurant_id: item.restaurant_id,
        description: item.description,
        image_url: item.image_url,
        is_boosted: item.is_boosted,
        boosted_until: item.boosted_until,
        averageRating: item.averageRating,
        totalRatings: item.totalRatings,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        images: (item.images || []).map((img) => img.url),
        isRated: !!myRating,
        myRating: myRating || null,
      };
    });

    // ================== RESTAURANT FOLLOW ==================
    const restaurantIds = restaurants.map((r) => r._id);

    let followedSet = new Set();

    if (userId && restaurantIds.length) {
      const follows = await RestaurantFollow.find({
        userId,
        restaurantId: { $in: restaurantIds },
      }).lean();

      followedSet = new Set(follows.map((f) => f.restaurantId.toString()));
    }

    // ================== FORMAT RESTAURANTS ==================
    const formattedRestaurants = restaurants.map((r) => ({
      _id: r._id,
      name: r.name,
      displayPicture: r.displayPicture,
      isFollowed: followedSet.has(r._id.toString()),
      // if future distance will add
    }));
    // ================== RESPONSE ==================
    return res.status(200).json({
      message: "search results",
      data: {
        events: formattedEvents,
        posts: formattedPosts,
        menuItems: formattedMenuItems,
        restaurants: formattedRestaurants,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { searchController };
