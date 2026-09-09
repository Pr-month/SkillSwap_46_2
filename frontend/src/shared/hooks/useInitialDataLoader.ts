import { useEffect } from "react";
import { useDispatch, useSelector } from "../../services/store";
import { fetchSkillFeed } from "../../services/skillFeed/actions";
import {
  fetchCategories,
  fetchSubCategories,
} from "../../services/category/actions";
import { fetchMyRequests } from "../../services/request/actions";

export const useInitialDataLoader = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.currentUser);
  const sentRequests = useSelector((state) => state.requests.sent);
  const receivedRequests = useSelector((state) => state.requests.received);

  useEffect(() => {
    dispatch(fetchSkillFeed({ page: 1, limit: 50 }));
    dispatch(fetchCategories());
    dispatch(fetchSubCategories());

    if (
      currentUser &&
      sentRequests.length === 0 &&
      receivedRequests.length === 0
    ) {
      dispatch(fetchMyRequests());
    }
  }, [dispatch, currentUser, sentRequests.length, receivedRequests.length]);
};