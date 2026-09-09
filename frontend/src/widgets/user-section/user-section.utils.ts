import type { IUserProfile, TId } from "../../utils/types";

export type ValidTId = Exclude<TId, null | undefined>;

export type PreparedUser = IUserProfile & {
  age: number | null;
  canTeach: string;
  wantsToLearn: string[];
  userSkill: ValidTId;
  skillCreatedAt: string;
};

export const filterPreparedUsers = (users: PreparedUser[]): PreparedUser[] =>
  users.filter((user) => {
    return (
      Boolean(user.name?.trim()) &&
      user.userSkill !== null &&
      user.userSkill !== undefined &&
      (user.age === null || user.age >= 14)
    );
  });
