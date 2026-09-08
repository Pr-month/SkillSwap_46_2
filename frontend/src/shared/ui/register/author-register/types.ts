import type { Dispatch, SetStateAction } from "react";
import type { OptionType } from "../../dropdown/types";

export type AuthorRegisterProps = {
  avatar: string;
  setAvatar: Dispatch<SetStateAction<string>>;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  birthDate: string;
  setBirthDate: Dispatch<SetStateAction<string>>;
  gender: OptionType | null;
  setGender: Dispatch<SetStateAction<OptionType | null>>;
  city: OptionType | null;
  setCity: Dispatch<SetStateAction<OptionType | null>>;
  learningSkills: string[];
  setLearningSkills: Dispatch<SetStateAction<string[]>>;
  onNext: () => void;
  onBack: () => void;
  errorText?: string;
};

export const genderOptions: OptionType[] = [
  { value: "MALE", title: "Мужской" },
  { value: "FEMALE", title: "Женский" },
];
