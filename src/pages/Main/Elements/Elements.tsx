import React, { useEffect, useState } from "react";
import { Button, List, Modal, Typography } from "antd";
import { addElement, getAllElements } from "../../../api/main";
import { Element } from "../../../api/main.types";
import AddElementForm from "./AddElementForm/AddElementForm";
import { ModalState } from "./EditElementForm/EditElementForm.types";
import EditElementForm from "./EditElementForm/EditElementForm";

const Elements = () => {
  const [isModalOpenAddElement, setIsModalOpenAddElement] = useState(false);
  const [modalEditElement, setModalEditElement] = useState<ModalState>({
    isOpen: false,
    data: null,
  });
  const [elements, setElements] = useState<Element[]>([]);

  const getElements = () => {
    getAllElements().then((data) => {
      setElements(data);
    });
  };

  useEffect(() => {
    getElements();
  }, []);

  const handleCancelAddElement = () => {
    setIsModalOpenAddElement(false);
  };

  const showModalAddElement = () => {
    setIsModalOpenAddElement(true);
  };

  const onSubmitAddElement = (values: any) => {
    console.log("call");

    addElement({
      key: new Date().toISOString() + "1",
      value: values.value,
      title: values.title,
    }).then(() => {
      setIsModalOpenAddElement(false);
      getElements();
    });
  };

  const onShowModalEditElement = (item: Element) => {
    setModalEditElement({
      isOpen: true,
      data: item,
    });
  };

  const handleCancelEditElement = () => {
    setModalEditElement({ isOpen: false, data: null });
  };

  return (
    <>
      <Typography.Title level={3}>Elements</Typography.Title>
      <List
        header={
          <Button type="primary" onClick={showModalAddElement}>
            Add element
          </Button>
        }
        bordered
        dataSource={elements}
        renderItem={(item) => {
          console.log("item", item);

          return (
            <List.Item
              actions={[
                <Button onClick={() => onShowModalEditElement(item)}>
                  edit
                </Button>,
              ]}
            >
              {item.title}
            </List.Item>
          );
        }}
      />

      <Modal
        title="Add element"
        open={isModalOpenAddElement}
        onCancel={handleCancelAddElement}
        footer={null}
        width={1000}
        destroyOnClose
      >
        <AddElementForm
          onSubmit={onSubmitAddElement}
          onCancel={handleCancelAddElement}
        />
      </Modal>

      <Modal
        title="Edit element"
        open={modalEditElement.isOpen}
        onCancel={handleCancelEditElement}
        footer={null}
        width={1000}
        destroyOnClose
      >
        {modalEditElement.data ? (
          <EditElementForm
            onSubmit={() => {}}
            data={modalEditElement.data}
            onCancel={handleCancelEditElement}
          />
        ) : null}
      </Modal>
    </>
  );
};

export default Elements;
