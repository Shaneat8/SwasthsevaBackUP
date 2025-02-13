import React, { useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";
import { ShowLoader } from "../../redux/loaderSlice";
import { GetAllDoctors, UpdateDoctor } from "../../apicalls/doctors";
import { message, Table } from "antd";

function DoctorsList() {
  const [doc, setDoc] = React.useState();
  const dispatch = useDispatch();
  const getData =useCallback( async () => {
    try {
      dispatch(ShowLoader(true));
      const response = await GetAllDoctors();
      dispatch(ShowLoader(false));
      if (response.success) {
        setDoc(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      dispatch(ShowLoader(false));
    }
  },[dispatch]);

  const changeStatus = async (payload) => {
    try {
      dispatch(ShowLoader(true));
      const response = await UpdateDoctor(payload);
      dispatch(ShowLoader(false));
      if (response.success) {
        message.success(response.message);
        getData();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      message.error(error.message);
      dispatch(ShowLoader(false));
    }
  };

  useEffect(() => {
    getData();
  },[getData]);

  const cols = [
    {
      title: "First Name",
      dataIndex: "firstName",
    },
    {
      title: "Last Name",
      dataIndex: "lastName",
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Phone",
      dataIndex: "phone",
    },
    {
      title: "Speciality",
      dataIndex: "Specialist",
    },
    {
      title: "Registration ID",
      dataIndex: "reg_id",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text, record) => {
        return text.toUpperCase();
      },
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (text, record) => {
        if (record.status === "pending") {
          return (
            <div className="flex gap-1">
              <span
                className="underline cursor-pointer"
                onClick={() =>
                  changeStatus({
                    ...record,
                    status: "rejected",
                  })
                }
              >
                Reject
              </span>
              <span
                className="underline cursor-pointer"
                onClick={() =>
                  changeStatus({
                    ...record,
                    status: "approved",
                  })
                }
              >
                Approve
              </span>
            </div>
          );
        }

        if (record.status === "approved") {
          return (
            <div className="flex gap-1">
              <span
                className="underline cursor-pointer"
                onClick={() =>
                  changeStatus({
                    ...record,
                    status: "blocked",
                  })
                }
              >
                Block
              </span>
            </div>
          );
        }
        if (record.status === "rejected") {
          return (
            <div className="flex gap-1">
              <span
                className="cursor-pointer underline"
                onClick={() =>
                  changeStatus({
                    ...record,
                    status: "approved",
                  })
                }
              >
                Approve{" "}
              </span>
            </div>
          );
        }

        if (record.status === "blocked") {
          return (
            <div className="flex gap-1">
              <span
                className="underline cursor-pointer"
                onClick={() =>
                  changeStatus({
                    ...record,
                    status: "approved",
                  })
                }
              >
                Unblock
              </span>
            </div>
          );
        }
      },
    },
  ];

  return (
    <div>
      <Table columns={cols} dataSource={doc} />
    </div>
  );
}

export default DoctorsList;
