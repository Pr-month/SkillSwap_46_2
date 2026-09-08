import {
  useEffect,
  useMemo,
  useState,
  type FC,
  type SyntheticEvent,
} from "react";
import { format, subYears, isBefore, isAfter, parse } from "date-fns";
import { genderOptions, type AuthorRegisterProps } from "./types";
import styles from "./author-register.module.css";
import userInfo from "../../../../assets/images/user-info.svg";
import { resolveAssetUrl } from "../../../lib/resolveAssetUrl";
import { Button } from "../../button";
import { BasicInput } from "../../input/basic-input";
import { AuthLayout } from "../../auth-layout";
import { Avatar } from "../../avatar";
import { Dropdown } from "../../dropdown";
import type { OptionType } from "../../dropdown/types";
import { DatePicker } from "../../datepicker";
import { useDispatch, useSelector } from "../../../../services/store";
import {
  selectCategories,
  selectSubCategoriesByCategoryId,
} from "../../../../services/category/slice";
import {
  fetchCategories,
  fetchSubCategories,
} from "../../../../services/category/actions";
import { useImageUpload } from "../../../hooks/useImageUpload";
import { getCities, type ICity } from "../../../../api/cityApi";
import { USE_TOAST } from "../../../../config/apiConfig";
 
export const AuthorRegister: FC<AuthorRegisterProps> = ({
  avatar,
  setAvatar,
  name,
  setName,
  birthDate,
  setBirthDate,
  gender,
  setGender,
  city,
  setCity,
  setLearningSkills,
  onNext,
  onBack,
  errorText,
}) => {
  const dispatch = useDispatch();
 
  const categories = useSelector(selectCategories);
  const getSubcategoriesByCategoryId = useSelector(
    selectSubCategoriesByCategoryId,
  );
 
  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchSubCategories());
  }, [dispatch]);
 
  const { uploadSingle } = useImageUpload();
  
  const [cities, setCities] = useState<ICity[]>([]);
 
  useEffect(() => {
    getCities()
      .then(setCities)
      .catch((err) => console.error("Не удалось загрузить города", err));
  }, []);
 
  const cityOptions = cities.map((c) => ({ value: c.id, title: c.name }));
 
  const [selectedCategory, setSelectedCategory] = useState<OptionType | null>(
    null,
  );
  const [selectedSubcategory, setSelectedSubcategory] =
    useState<OptionType | null>(null);
 
  const today = new Date();
  const minBirthDateObject = subYears(today, 112);
  const maxBirthDateObject = subYears(today, 18);
 
  const minBirthDate = format(minBirthDateObject, "yyyy-MM-dd");
  const maxBirthDate = format(maxBirthDateObject, "yyyy-MM-dd");
 
  const birthDateError = useMemo(() => {
    if (!birthDate) {
      return "";
    }
 
    const parsed = parse(birthDate, "yyyy-MM-dd", new Date());
 
    if (Number.isNaN(parsed.getTime())) {
      return "Введите корректную дату";
    }
 
    if (
      isBefore(parsed, minBirthDateObject) ||
      isAfter(parsed, maxBirthDateObject)
    ) {
      return "Можно указать возраст только от 18 до 112 лет";
    }
 
    return "";
  }, [birthDate, minBirthDateObject, maxBirthDateObject]);
 
  const handleAvatarEdit = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const result = await uploadSingle(file);
        if (result?.url) {
          setAvatar(result.url);
        }
      }
    };
    input.click();
  };
 
  // Одна категория и одна подкатегория — без списка тегов и кнопки
  // "Добавить". Множественный выбор интересов переедет в личный кабинет
  // отдельной задачей позже.
  const availableCategories = categories;
 
  const availableSubcategories = useMemo(() => {
    if (!selectedCategory) return [];
 
    return getSubcategoriesByCategoryId(selectedCategory.value).map(
      (sub) => ({
        value: sub.id,
        title: sub.name,
      }),
    );
  }, [selectedCategory, getSubcategoriesByCategoryId]);
 
  const handleCategoryChange = (option: OptionType | null) => {
    setSelectedCategory(option);
    setSelectedSubcategory(null);
    setLearningSkills([]);
  };
 
  const handleSubcategoryChange = (option: OptionType | null) => {
    setSelectedSubcategory(option);
    setLearningSkills(option ? [String(option.value)] : []);
  };
 
  // Обязательно только имя. Остальные поля опциональны — так же, как на
  // бэкенде для PATCH /users/me (там всё, кроме имени, необязательно).
  // Дату рождения всё же не даём отправить, если она заполнена, но с ошибкой.
  const isDisabled = !name.trim() || Boolean(birthDateError);
 
  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault();
 
    if (!isDisabled) {
      onNext();
    }
  };
 
  return (
    <AuthLayout
      type="register"
      currentStep={2}
      totalSteps={2}
      image={userInfo}
      description={{
        title: "Расскажите немного о себе",
        text: "Это поможет другим людям лучше вас узнать, чтобы выбрать для обмена",
      }}
    >
      <form className={styles.form} name="register" onSubmit={handleSubmit}>
        <div className={styles.fields}>
          <Avatar
            src={resolveAssetUrl(avatar)}
            size="large"
            isEditable={true}
            onEdit={handleAvatarEdit}
            className={styles.avatar}
          />
          <BasicInput
            label="Имя"
            placeholder="Введите ваше имя"
            onChange={(value) => setName(value)}
            value={name}
            required
          />
          <div className={styles.birthDate__sex__fields}>
            <div className={styles.form__field}>
              <label className={styles.label}>Дата рождения</label>
              <DatePicker
                placeholder="дд.мм.гггг"
                value={birthDate}
                onChange={setBirthDate}
                minDate={minBirthDate}
                maxDate={maxBirthDate}
                error={Boolean(birthDateError)}
                helperText={birthDateError}
                required
              />
            </div>
            <Dropdown
              title="Пол"
              placeholder="Не указан"
              options={genderOptions}
              selected={gender}
              onChange={setGender}
            />
          </div>
          <Dropdown
            title="Город"
            placeholder="Не указан"
            options={cityOptions}
            selected={city}
            onChange={setCity}
            searchable
            searchPlaceholder="Введите город"
          />
          <Dropdown
            title="Категория навыка, которому хотите научиться"
            placeholder="Выберите категорию"
            options={availableCategories.map((cat) => ({
              value: cat.id,
              title: cat.name,
            }))}
            selected={selectedCategory}
            onChange={handleCategoryChange}
          />
          <Dropdown
            title="Подкатегория навыка, которому хотите научиться"
            placeholder="Выберите подкатегорию"
            options={availableSubcategories}
            selected={selectedSubcategory}
            onChange={handleSubcategoryChange}
            disabled={!selectedCategory}
          />
        </div>
        <div className={styles.buttons}>
        {errorText && !USE_TOAST && (
          <p className={styles.error}>{errorText}</p>
        )}
          <Button
            variant="secondary"
            onClick={onBack}
            className={styles.button}
          >
            Назад
          </Button>
          <Button
            variant="primary"
            type="submit"
            className={styles.button}
            disabled={isDisabled}
          >
            Зарегистрироваться
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};