"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Button } from "../ui/button";
import {
  addFollowerToUser,
  deleteFollowers,
  getFollowers,
  getFollowersDetails,
} from "@/lib/actions/user.actions";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Props {
  accountId: string;
  authUserId: string;
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
  const [followerDetails, setFollowerDetails] = useState<any[]>([]);

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

    const fetchFollowersDetails = async () => {
      setIsLoading(true);
      try {
        const result = await getFollowersDetails(accountId);
        console.log("Result", result);
        setFollowerDetails(result.followers as Object[]);
      } catch (error) {
        console.error("Error fetching followers details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFollowers();
    fetchFollowersDetails();
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
            <Dialog>
              <DialogTrigger asChild>
                <p className="text-base-regular text-center text-gray-1 cursor-pointer">
                  Followers
                </p>
              </DialogTrigger>
              <DialogContent className="bg-dark-2 text-gray-1">
                <DialogHeader>
                  <DialogTitle>Followers</DialogTitle>
                </DialogHeader>
                <div>
                  <Table>
                    <TableBody>
                      {followerDetails.map((detail) => (
                        <TableRow className="hover:bg-dark-4">
                          <TableCell className="font-medium">
                            <Image
                              src={detail.image}
                              alt="Profile Picture"
                              width={50}
                              height={50}
                              className="rounded-full object-cover"
                            />
                          </TableCell>
                          <TableCell className="text-heading4-medium">{detail.name}</TableCell>
                          <TableCell className="text-right">
                            <Button>
                              <Link
                                key={detail._id}
                                href={`/profile/${detail.id}`}
                              >
                                View
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </DialogContent>
            </Dialog>
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
