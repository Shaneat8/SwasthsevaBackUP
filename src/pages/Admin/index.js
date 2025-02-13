import React, { useCallback, useEffect } from "react";
import { message, Tabs } from "antd";
import UsersList from "./UsersList";
import DoctorsList from "./DoctorsList";
import MedicineList from "./MedicineList";
import { useDispatch } from "react-redux";
import { ShowLoader } from "../../redux/loaderSlice";
import { GetUserById } from "../../apicalls/users";

function Admin() {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const dispatch = useDispatch();
  const checkIsAdmin = useCallback(async () => {
    try {
      dispatch(ShowLoader(true));
      const response = await GetUserById(user.id);
      dispatch(ShowLoader(false));
      if (response.success && response.data.role === "admin") {
        setIsAdmin(true);
      } else {
        throw new Error("You are not an Admin!");
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error(error.message);
    }
  }, [dispatch, user.id]);

  useEffect(() => {
    checkIsAdmin();
  }, [checkIsAdmin]);

  const tabItems = [
    {
      key: "1",
      label: "Users",
      children: <UsersList />,
    },
    {
      key: "2",
      label: "Doctors",
      children: <DoctorsList />,
    },
    {
      key: "3",
      label : "Medicine",
      children : <MedicineList/>,
    }
  ];

  return (
    isAdmin && (
      <div className="bg-white p-1">
        <Tabs items={tabItems} />
        {/* <Tabs>
        <Tabs.TabPane tab="Users" key="1">
            <UsersList/>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Doctors" key="2">
            <DoctorsList/>
        </Tabs.TabPane>
        </Tabs> */}
      </div>
    )
  );
}

export default Admin;
