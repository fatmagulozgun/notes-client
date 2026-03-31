import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { fetchMe, refreshAccessToken } from "../../features/auth/authSlice";

function ProtectedRoute({ children }) {
  const { user, initialized, accessToken } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const didFetchRef = useRef(false);

  useEffect(() => {
    if (!initialized || !user) {
      if (didFetchRef.current) return;
      didFetchRef.current = true;

      if (accessToken) {
        dispatch(fetchMe()).finally(() => {});
      } else {
        dispatch(refreshAccessToken()).finally(() => {});
      }
    }
  }, [dispatch, initialized, user, accessToken]);

  useEffect(() => {
    // Token değişince tekrar fetch edilebilir.
    didFetchRef.current = false;
  }, [accessToken]);

  if (!initialized) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
