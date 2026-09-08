import { type FC, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AccountRegister, AuthorRegister } from "../../shared/ui/register";
import type { OptionType } from "../../shared/ui/dropdown/types";
import { handleError } from "../../utils/errors/errorUtils";
import type { TLoginUserData } from "../../utils/types";
import {
  fetchRegister,
  fetchUpdateMyProfile,
  fetchUpdateWantToLearn,
} from "../../services/auth/actions";
import { useDispatch } from "../../services/store";
 
export const Register: FC = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
 
  const [avatar, setAvatar] = useState("");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<OptionType | null>(null);
  const [city, setCity] = useState<OptionType | null>(null);
  const [learningSkills, setLearningSkills] = useState<string[]>([]);
 
  const [registrationError, setRegistrationError] = useState<string | null>(
    null,
  );
 
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || "/";
 
  const dispatch = useDispatch();
 
  const handleSubmit = async () => {
    setRegistrationError(null);
 
    try {
      const credentials: TLoginUserData = { email, password };
      await dispatch(fetchRegister(credentials)).unwrap();
 
      // PATCH /users/me — шлём только реально заполненные поля
      const profilePayload: Record<string, string> = {};
      if (name.trim()) profilePayload.name = name.trim();
      if (birthDate) profilePayload.birthdate = birthDate;
      if (gender?.value) profilePayload.gender = String(gender.value);
      if (city?.value) profilePayload.cityId = String(city.value);
      if (avatar) profilePayload.avatar = avatar;
 
      if (Object.keys(profilePayload).length > 0) {
        await dispatch(fetchUpdateMyProfile(profilePayload)).unwrap();
      }
 
      // PATCH /users/me/want-to-learn — только если что-то выбрали
      if (learningSkills.length > 0) {
        await dispatch(fetchUpdateWantToLearn(learningSkills)).unwrap();
      }
 
      navigate(from, {
        replace: true,
        state: { showRegistrationSuccess: true },
      });
    } catch (err) {
      setRegistrationError(handleError(err).message);
    }
  };
 
  if (step === 1) {
    return (
      <AccountRegister
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        onNext={() => setStep(2)}
      />
    );
  }
 
  // Шаг 2 — последний. Раньше был ещё шаг 3 (создание своего навыка),
  // но его временно убрали из регистрации: заводить свой навык теперь
  // будет отдельный раздел личного кабинета ("Мои навыки"), сам компонент
  // SkillRegister не удалён и переиспользуется там позже.
  return (
    <AuthorRegister
      avatar={avatar}
      setAvatar={setAvatar}
      name={name}
      setName={setName}
      birthDate={birthDate}
      setBirthDate={setBirthDate}
      gender={gender}
      setGender={setGender}
      city={city}
      setCity={setCity}
      learningSkills={learningSkills}
      setLearningSkills={setLearningSkills}
      onNext={handleSubmit}
      onBack={() => setStep(1)}
      errorText={registrationError || ""}
    />
  );
};