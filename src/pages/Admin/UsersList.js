import React, { useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";
import { ShowLoader } from "../../redux/loaderSlice";
import { Table } from "antd";
import { GetAllUsers } from "../../apicalls/users";

function UsersList() {
  const [users, setUsers] = React.useState();
  const dispatch = useDispatch();
  const getData =useCallback( async () => {
    try {
      dispatch(ShowLoader(true));
      const response = await GetAllUsers();
      dispatch(ShowLoader(false));
      if (response.success) {
        setUsers(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      dispatch(ShowLoader(false));
    }
  },[dispatch]);

  useEffect(() => {
    getData();
  },[getData]);

  const cols=[{
    title:"User ID",
    dataIndex:"id",
  },
  {
    title:"Name",
    dataIndex:"name",
  },
  {
    title:"Email",
    dataIndex:"email",
  },
  {
    title:"Role",
    dataIndex:"role", 
    render:(role)=>
      role.toUpperCase(),
  },
  
]

  return (
  <div>
    <Table columns={cols} dataSource={users} />
  </div>
);
}

export default UsersList;
