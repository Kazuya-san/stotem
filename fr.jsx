import { Suspense, lazy, useLayoutEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import Home from "../pages/Home";
import Loader from "../components/Loader";
// import Login from "../pages/Login";
// import Register from "../pages/Register";

import Navbar from "../common/Navbar";
import { Footer } from "../common/Footer";
// import SingleEvent from "../pages/SingleEvent";
// import CreateEvent from "../pages/CreateEvent";
// import MyProfile from "../pages/MyProfile";
// import MyEvents from "../pages/MyEvents";
// import CreatedEvents from "../pages/CreatedEvents";
// import EditEvent from "../pages/EditEvent";
// import AttendeesTable from "../pages/AttendeesTable";
// import AdminAllUsers from "../pages/AdminAllUsers";
// import Notfound from "../pages/Notfound";

const Wrapper = ({ children }) => {
  const location = useLocation();
  useLayoutEffect(() => {
    document.documentElement.scrollTo(0, 0);
  }, [location.pathname]);
  return children;
};

const HomeComponent = lazy(() => import("../pages/Home"));
const LoginComponent = lazy(() => import("../pages/Login"));
const RegisterComponent = lazy(() => import("../pages/Register"));
const SingleEventComponent = lazy(() => import("../pages/SingleEvent"));
const CreateEventComponent = lazy(() => import("../pages/CreateEvent"));
const MyProfileComponent = lazy(() => import("../pages/MyProfile"));
const MyEventsComponent = lazy(() => import("../pages/MyEvents"));
const CreatedEventsComponent = lazy(() => import("../pages/CreatedEvents"));
const EditEventComponent = lazy(() => import("../pages/EditEvent"));
const AttendeesTableComponent = lazy(() => import("../pages/AttendeesTable"));
const AdminAllUsersComponent = lazy(() => import("../pages/AdminAllUsers"));
const NotfoundComponent = lazy(() => import("../pages/Notfound"));

const FallBack = () => {
  return (
    <div className="h-[78.8vh] flex justify-center items-cente">
      <Loader />
    </div>
  );
};

const Router = () => {
  return (
    <BrowserRouter>
      <Wrapper>
        <Navbar />
        <Suspense fallback={<FallBack />}>
          <Routes>
            <Route path="/login" element={<LoginComponent />} />
            <Route path="/register" element={<RegisterComponent />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<HomeComponent />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/create-event" element={<CreateEventComponent />} />
            </Route>

            <Route path="/event/:id" element={<SingleEventComponent />} />

            <Route element={<ProtectedRoute />}>
              <Route
                path="/attendees/:id"
                element={<AttendeesTableComponent />}
              />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/my-profile" element={<MyProfileComponent />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/all-users" element={<AdminAllUsersComponent />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="my-events" element={<MyEventsComponent />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route
                path="my-createdevents"
                element={<CreatedEventsComponent />}
              />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="edit-event/:id" element={<EditEventComponent />} />
            </Route>
            <Route path="*" element={<NotfoundComponent />} />
          </Routes>
        </Suspense>
        <Footer />
      </Wrapper>
    </BrowserRouter>
  );
};

export default Router;
