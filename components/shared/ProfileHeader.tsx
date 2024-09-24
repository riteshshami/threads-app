"use client";

import Image from "next/image";
import { Button } from "../ui/button";
import {
  addFollowerToUser,
  deleteFollowers,
  getFollowers,
} from "@/lib/actions/user.actions";
import { useEffect, useState } from "react";

interface Props {
  accountId: string; // The user whose profile is being viewed
  authUserId: string; // The currently logged-in user
  name: string;
  username: string;
  imgUrl: string;
  bio: string;
}

const ProfileHeader = ({
  accountId,
  authUserId,
  name,
  username,
  imgUrl,
  bio,
}: Props) => {
  const [followers, setFollowers] = useState<any[]>([]); // State to store the followers
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFollowing, setIsFollowing] = useState<boolean>(false); // Track if authUserId is following accountId

  // Fetch followers when the component mounts
  useEffect(() => {
    const fetchFollowers = async () => {
      setIsLoading(true);
      try {
        const result = await getFollowers(accountId);
        console.log("Result", result);
        setFollowers(result.followers as string[]);

        // Check if the current authenticated user is already following
        const following = result.followers.includes(authUserId);
        if (following) {
          setIsFollowing(true);
        }
      } catch (error) {
        console.error("Error fetching followers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFollowers();
  }, [accountId, authUserId]);

  // Handle follow/unfollow button click
  const handleFollow = async () => {
    setIsFollowing(!isFollowing); // Optimistic update
    try {
      if (isFollowing) {
        await deleteFollowers(accountId, authUserId);
      } else {
        await addFollowerToUser(accountId, authUserId);
      }
      const updatedFollowers = await getFollowers(accountId);
      setFollowers(updatedFollowers.followers);
    } catch (error) {
      console.error("Error updating follow status:", error);
      setIsFollowing(isFollowing); // Revert the optimistic update on error
    }
  };

  return (
    <div className="flex w-full flex-col justify-between">
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-20 w-20 object-cover">
              <Image
                src={imgUrl}
                alt="Profile Image"
                fill
                className="rounded-full object-cover shadow-2xl"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-left text-heading3-bold text-light-1">
                {name}
              </h2>
              <p className="text-base-medium text-gray-1">@{username}</p>
            </div>
            <div>
              {/* Follow/Unfollow button */}
              {accountId === authUserId ? (
                <div></div>
              ) : (
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  onClick={handleFollow}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </Button>
              )}
            </div>
          </div>
          <div className="flex-1 mx-5 mt-5">
            <h2 className="text-center text-heading1-bold text-light-1">
              {followers.length}
            </h2>
            <p className="text-base-regular text-center text-gray-1">
              {followers.length > 1 ? "Followers" : "Follower"}
            </p>
          </div>
        </div>
      )}

      {/* TODO: Community */}

      <p className="mt-6 max-w-lg text-base-regular text-light-2">{bio}</p>
      <div className="mt-12 h-0.5 w-full bg-dark-3" />
    </div>
  );
};

export default ProfileHeader;
