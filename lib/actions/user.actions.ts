"use server";

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";
import Thread from "../models/thread.model";
import { FilterQuery, SortOrder } from "mongoose";

interface Params {
  userId: string;
  username: string;
  name: string;
  bio: string;
  image: string;
  path: string;
}

export async function updateUser({
  userId,
  username,
  name,
  bio,
  image,
  path,
}: Params): Promise<void> {
  connectToDB();
  console.log("Database connected");

  try {
    await User.findOneAndUpdate(
      { id: userId },
      {
        username: username.toLowerCase(),
        name,
        bio,
        image,
        onboarded: true,
      },
      { upsert: true }
    );

    if (path === "/profile/edit") {
      revalidatePath(path);
    }
  } catch (error: any) {
    throw new Error(`Failed to create/update user: ${error.message}`);
  }
}

export async function fetchUser(userId: string) {
  try {
    connectToDB();

    return await User.findOne({ id: userId });
    // .populate({
    //   path: 'communities',
    //   model: Community
    // })
  } catch (error: any) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
}

export async function fetchUserPosts(userId: string) {
  try {
    connectToDB();

    // Find all threads authored by user with given user id

    // TODO: Populate community
    const thread = User.findOne({ id: userId }).populate({
      path: "threads",
      model: Thread,
      populate: {
        path: "children",
        model: Thread,
        populate: {
          path: "author",
          model: User,
          select: "name image id",
        },
      },
    });

    return thread;
  } catch (error: any) {
    throw new Error(`Unable to fetch user posts ${error.message}`);
  }
}

export async function fetchUsers({
  userId,
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
}: {
  userId: string;
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortOrder;
}) {
  try {
    connectToDB();

    const skipAmount = (pageNumber - 1) * pageSize;

    const regex = new RegExp(searchString, "i");

    const query: FilterQuery<typeof User> = {
      id: { $ne: userId },
    };

    if (searchString.trim() !== "") {
      query.$or = [
        { username: { $regex: regex } },
        { name: { $regex: regex } },
      ];
    }

    const sortOptions = { createdAt: sortBy };

    const usersQuery = User.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize);

    const totalUsersCount = await User.countDocuments(query);

    const users = await usersQuery.exec();

    const isNext = totalUsersCount > skipAmount + users.length;

    return { users, isNext };
  } catch (error: any) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }
}

export async function getActivity(userId: string) {
  try {
    connectToDB();

    // find all threads created by user
    const userThreads = await Thread.find({ author: userId });

    // Collect all the child threads id: (replies) from the 'children' field
    const childThreadsIds = userThreads.reduce((acc, userThread) => {
      return acc.concat(userThread.children);
    }, []);

    const replies = await Thread.find({
      _id: { $in: childThreadsIds },
      author: { $ne: userId },
    }).populate({
      path: "author",
      model: User,
      select: "name image _id",
    });

    return replies;
  } catch (error: any) {
    throw new Error(`Failed to fetch activity: ${error.message}`);
  }
}

export async function addFollowerToUser(userId: string, followerId: string) {
  connectToDB();

  try {
    const originalUser = await User.findOne({ id: userId });
    if (!originalUser) {
      throw new Error("User not found");
    }

    const followerUser = await User.findOne({ id: followerId });
    if (!followerUser) {
      throw new Error("Follower not found");
    }

    if (userId === followerId) {
      throw new Error("User cannot follow itself");
    }

    const isAlreadyFollowing = originalUser.followers.includes(followerId);
    if (isAlreadyFollowing) {
      throw new Error("Already following the user");
    }

    originalUser.followers.push(followerId);
    await originalUser.save();

    return { message: "Follower added successfully" };
  } catch (error: any) {
    throw new Error(`Error in following the user ${error.message}`);
  }
}

export async function getFollowers(userId: string) {
  connectToDB();
  try {
    const user = await User.findOne({ id: userId }).populate("followers");
    if (!user) {
      throw new Error("User not found");
    }

    return {
      message: "Followers fetched successfully",
      followers: user.followers,
    };
  } catch (error: any) {
    throw new Error(`Error in following the user ${error.message}`);
  }
}

export async function deleteFollowers(userId: string, followerId: string) {
  connectToDB();
  try {
    const originalUser = await User.findOne({ id: userId });
    if (!originalUser) {
      throw new Error("User not found");
    }

    const followerUser = await User.findOne({ id: followerId });
    if (!followerUser) {
      throw new Error("Follower not found");
    }

    const isAlreadyFollowing = originalUser.followers.includes(followerId);
    if (!isAlreadyFollowing) {
      throw new Error("Follower not found in the followers list");
    }

    originalUser.followers.pull(followerId);
    await originalUser.save();

    return { message: "Follower removed successfully" };
  } catch (error: any) {
    throw new Error(`Error in unfollowing the user ${error.message}`);
  }
}

export async function getFollowersDetails(userId: string) {
  connectToDB();
  try {
    const originalUser = await User.findOne({ id: userId });
    if (!originalUser) {
      throw new Error("User not found");
    }

    const followers = originalUser.followers;

    const users = await User.find({
      id: { $in: followers }
    });

    return { message: "Followers details fetched successfully", followers: users};
  } catch (error: any) {
    throw new Error(`Error in fetching followers details ${error.message}`);
  }
}
