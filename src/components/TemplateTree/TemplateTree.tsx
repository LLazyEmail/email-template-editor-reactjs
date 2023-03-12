import { Dropdown, Menu, MenuProps, Tree, Modal } from "antd";
// import type { DataNode, TreeProps } from "antd/es/tree";
import React, { useState } from "react";
import { ModalState, TemplateTreeProps } from "./TemplateTree.types";

import { MenuInfo } from "rc-menu/lib/interface";
import EditElementForm from "./EditElementForm/EditElementForm";
import { TemplateTree as TemplateTreeNode } from "./../../types";
import { updateTreeNode, addTreeNode, deleteTreeNode } from "../../api/main";
import AddElementForm from "./AddElementForm/AddElementForm";

const TemplateTree = (props: TemplateTreeProps) => {
  const [modalAddElement, setModalAddElement] = useState<ModalState>({
    isOpen: false,
    data: null,
  });
  const [modalEditElement, setModalEditElement] = useState<ModalState>({
    isOpen: false,
    data: null,
  });

  const items: MenuProps["items"] = [
    {
      label: "Add",
      key: "add",
    },
    {
      label: "Edit",
      key: "edit",
    },
    {
      label: "Delete",
      key: "delete",
    },
  ];

  const handleMenuClick = (e: MenuInfo, item: TemplateTreeNode) => {
    const map: Record<string, Function | undefined> = {
      add: () => setModalAddElement({ isOpen: true, data: item }),
      edit: () => setModalEditElement({ isOpen: true, data: item }),
      delete: () => {
        deleteTreeNode({ key: item.key as string }).then(() => {
          props.refresh();
        });
      },
    };

    map[e.key]?.();

    // message.info("Click on menu item.");
    console.log("click", e);
    console.log("item", item);
  };

  const onSubmitModalEdit = (values: any) => {
    console.log("values", values);

    updateTreeNode({
      value: values.value,
      key: values.key,
      title: values.title,
    }).then(() => {
      props.refresh();
      setModalEditElement({ isOpen: false, data: null });
    });

    // const root: SaveTree["treeData"] = [
    //   { title: "root", key: "1", value: values.value, children: [] },
    // ];

    // saveTree({ treeData: root }).then(() => {
    //   setIsModalOpen(false);
    //   getTreeData()
    // });
  };

  const onSubmitModalAdd = (formValues: any) => {
    console.log("values", formValues);
    const { currentItemKey, values } = formValues;

    addTreeNode({
      parentKey: currentItemKey,
      item: {
        key: new Date().toISOString(),
        title: values.title,
        value: values.value,
        children: [],
      },
    }).then(() => {
      props.refresh();
    });

    setModalAddElement({ isOpen: false, data: null });
  };

  const handleCancelModalEdit = () => {
    setModalEditElement({ isOpen: false, data: null });
  };

  const handleCancelModalAdd = () => {
    setModalAddElement({ isOpen: false, data: null });
  };

  console.log("modalEditElement", modalEditElement);

  return (
    <>
      <Tree
        defaultExpandAll
        treeData={props.treeData}
        titleRender={(item) => (
          <Dropdown
            menu={{ items, onClick: (e) => handleMenuClick(e, item) }}
            trigger={["contextMenu"]}
          >
            <span>{item.title as string}</span>
          </Dropdown>
        )}
      />
      <Modal
        title="Edit element"
        open={modalEditElement.isOpen}
        onCancel={handleCancelModalEdit}
        footer={null}
        width={1000}
        destroyOnClose
      >
        {modalEditElement.data ? (
          <EditElementForm
            data={modalEditElement.data}
            onSubmit={onSubmitModalEdit}
            onCancel={handleCancelModalEdit}
          />
        ) : null}
      </Modal>

      <Modal
        title="Add element"
        open={modalAddElement.isOpen}
        onCancel={handleCancelModalAdd}
        footer={null}
        width={1000}
        destroyOnClose
      >
        {modalAddElement.data ? (
          <AddElementForm
            data={modalAddElement.data}
            onSubmit={onSubmitModalAdd}
            onCancel={handleCancelModalAdd}
          />
        ) : null}
      </Modal>
    </>
  );
};

export default TemplateTree;
