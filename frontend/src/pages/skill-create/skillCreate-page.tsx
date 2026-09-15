import { useState, type FC } from "react";
import { SkillRegister } from "../../shared/ui/register";
import type { OptionType } from "../../shared/ui/dropdown/types";
import { useDispatch } from "../../services/store";
import { useLocation, useNavigate } from "react-router-dom";
import { appendSkill } from "../../services/skill/actions";
import { handleError } from "../../utils/errors/errorUtils";
import type { TSkillData } from "../../utils/types";

export const SkillCreate: FC = () => {
  const [skillName, setSkillName] = useState("");
  const [skillSubcategory, setSkillSubcategory] = useState<OptionType | null>(
    null,
  );
  const [skillDescription, setSkillDescription] = useState("");
  const [skillImages, setSkillImages] = useState<string[]>([]);
  const [registrationError, setRegistrationError] = useState<string | null>(
    null,
  );

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string })?.from || "/";

  const handleSubmit = async () => {

    setRegistrationError(null);

    try {
        const skillData: TSkillData = {
            title: skillName,
            description: skillDescription,
            skillSubcategory: String(skillSubcategory?.value),
            images: skillImages,
        }

        await dispatch(appendSkill(skillData)).unwrap();

      navigate(from, {
        replace: true,
        state: { showRegistrationSuccess: true },
      });

    } catch (err) {
        setRegistrationError(handleError(err).message);
    }
  }

  return (
    <SkillRegister
      skillName={skillName}
      setSkillName={setSkillName}
      skillSubcategory={skillSubcategory}
      setSkillSubcategory={setSkillSubcategory}
      skillDescription={skillDescription}
      setSkillDescription={setSkillDescription}
      skillImages={skillImages}
      setSkillImages={setSkillImages}
      onBack={() => navigate(-1)}
      onSubmit={handleSubmit}
      errorText={registrationError || ""}
    />
  );
};
