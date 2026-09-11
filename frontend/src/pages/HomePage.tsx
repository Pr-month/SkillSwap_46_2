import { useMemo, type FC } from "react";
import styles from "./home-page.module.css";
import { useInitialDataLoader } from "../shared/hooks/useInitialDataLoader";
import {
  selectFilteredSkillFeed,
  selectNewestSkillFeed,
  selectPopularSkillFeed,
  selectRecommendedSkillFeed,
} from "../services/skillFeed/selectors";
import { FilterBar } from "../widgets/filter-bar";
import { UserSection } from "../widgets/user-section/user-section";
import { selectCategories } from "../services/category/slice";
import { getActiveFilters } from "../utils/filter/getActiveFilters";
import { useFilterActions } from "../shared/hooks/useFilterActions";
import { ECity } from "../shared/constants/cities";
import { SelectedFilters } from "../widgets/filter-bar/selected-filters";
import { genderOptions, skillOptions } from "../widgets/filter-bar";
import { useSelector } from "../services/store";
 
const CITY_LABELS: Record<string, string> = Object.entries(ECity).reduce(
  (acc, [, value]) => {
    acc[value] = value;
    return acc;
  },
  {} as Record<string, string>,
);
 
export const HomePage: FC = () => {
  useInitialDataLoader();
 
  const filteredSkillFeed = useSelector(selectFilteredSkillFeed);
  const popular = useSelector(selectPopularSkillFeed);
  const newest = useSelector(selectNewestSkillFeed);
  const recommended = useSelector(selectRecommendedSkillFeed);
 
  const filterState = useSelector((state) => state.filter);
  const categories = useSelector(selectCategories);
 
  const activeFilters = useMemo(() => {
    return getActiveFilters({
      filterState,
      categories,
      skillOptions,
      genderOptions,
      cityLabels: CITY_LABELS,
    });
  }, [filterState, categories]);
 
  const hasActiveFilters = activeFilters.length > 0;
  const hasSearchQuery = !!filterState.searchQuery?.trim();
 
  const { handleResetFilters, handleRemoveFilter } =
    useFilterActions(activeFilters);
 
  let content = null;
 
  if (hasSearchQuery || hasActiveFilters) {
    content = (
      <div className={styles.content}>
        {activeFilters.length > 0 && (
          <SelectedFilters
            filters={activeFilters}
            onReset={handleResetFilters}
            onRemove={handleRemoveFilter}
          />
        )}
        <UserSection
          title={`Подходящие предложения: ${filteredSkillFeed.length}`}
          items={filteredSkillFeed}
          emptyMessage="Ничего не найдено по вашему запросу"
          isSorted={true}
        />
      </div>
    );
  } else {
    content = (
      <div className={styles.content}>
        <UserSection
          title="Популярное"
          items={popular}
          actionText="Смотреть все"
          onActionClick={() => {}}
        />
 
        <UserSection
          title="Новое"
          items={newest}
          actionText="Смотреть все"
          onActionClick={() => {}}
        />
 
        <UserSection
          title="Рекомендуем"
          items={recommended}
          emptyMessage="Нет рекомендаций для вас"
        />
      </div>
    );
  }
 
  return (
    <main className={styles.main}>
      <FilterBar />
      {content}
    </main>
  );
};