const likeAndUnlikePostService = async (postId, userId) => {
  // not valid post id
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    throw new AppError("Invalid post ID", 400);
  }

  const post = await Post.findById(id);

  // not found post with the id
  if (!post) {
    throw new AppError("Post not found", 404);
  }

  const existingLike = await PostLike.findOne({ postId: id, userId });
  if (existingLike) {
    // unlike the post
    const likeDetails = await PostLike.findByIdAndDelete(existingLike._id);
    console.log(18, likeDetails);
    return {
      status: "success",
      message: "Post unliked successfully",
      liked: false,
    };
  } else {
    // like the post
    const newLike = await PostLike.create({ postId: id, userId });
    console.log(27, newLike);
    return {
      status: "success",
      message: "Post liked successfully",
      liked: true,
    };
  }
};

module.exports = {
  likeAndUnlikePostService,
};
