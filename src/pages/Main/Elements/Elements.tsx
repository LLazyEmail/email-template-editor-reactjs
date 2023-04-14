import React, { useEffect, useState } from "react";
import { Button, List, Modal, Typography } from "antd";
import { addElement, getAllElements } from "../../../api/main";
import { Element } from "../../../api/main.types";
import AddElementForm from "./AddElementForm/AddElementForm";

const Elements = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [elements, setElements] = useState<Element[]>([]);

  const getElements = () => {
    getAllElements().then((data) => {
      setElements(data);
    });
  };

  useEffect(() => {
    getElements();
  }, []);

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const onSubmit = (values: any) => {
    console.log("call");

    addElement({
      key: new Date().toISOString() + "1",
      value: values.value,
      title: values.title,
    }).then(() => {
      setIsModalOpen(false);
      getElements();
    });
  };

  return (
    <>
      <Typography.Title level={3}>Elements</Typography.Title>
      <List
        header={
          <Button type="primary" onClick={showModal}>
            Add element
          </Button>
        }
        bordered
        dataSource={elements}
        renderItem={(item) => (
          <List.Item actions={[<a key="list-loadmore-edit">edit</a>]}>
            {item.title}
          </List.Item>
        )}
      />

      <Modal
        title="Add element"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={1000}
        destroyOnClose
      >
        <AddElementForm onSubmit={onSubmit} onCancel={handleCancel} />
      </Modal>
    </>
  );
};

export default Elements;
