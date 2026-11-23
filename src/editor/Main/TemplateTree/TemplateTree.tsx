"use client";

import { Dropdown, MenuProps, Tree, Modal, notification } from "antd";
import { notifyError } from "../notifyError";
// import type { DataNode, TreeProps } from "antd/es/tree";
import React, { useState } from "react";
import { AddElementFormValues, ModalState, TemplateTreeProps } from "./TemplateTree.types";

import EditElementForm from "./EditElementForm/EditElementForm";
import { TemplateTree as TemplateTreeNode } from "../../../types";
import { updateTreeNode, addTreeNode, deleteTreeNode } from "../../../api/main";
import type { UpdateTreeNode } from "../../../api/main.types";
import AddElementForm from "./AddElementForm/AddElementForm";
import { buildElementNode, buildHtmlNode } from "./nodeBuilders";

type MenuInfo = Parameters<NonNullable<MenuProps["onClick"]>>[0];

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
    const map: Record<string, (() => void) | undefined> = {
      add: () => setModalAddElement({ isOpen: true, data: item }),
      edit: () => setModalEditElement({ isOpen: true, data: item }),
      delete: () => {
        deleteTreeNode({ key: item.key as string })
          .then(() => {
            props.refresh();
          })
          .catch(notifyError("Could not delete the node"));
      },
    };

    map[e.key]?.();

    // message.info("Click on menu item.");
  };

  const onSubmitModalEdit = (values: UpdateTreeNode) => {
    updateTreeNode({
      value: values.value,
      key: values.key,
      title: values.title,
    })
      .then(() => {
        props.refresh();
        setModalEditElement({ isOpen: false, data: null });
      })
      .catch(notifyError("Could not update the node"));

    // const root: SaveTree["treeData"] = [
    //   { title: "root", key: "1", value: values.value, children: [] },
    // ];

    // saveTree({ treeData: root }).then(() => {
    //   setIsModalOpen(false);
    //   getTreeData()
    // });
  };

  const onSubmitModalAdd = (formValues: AddElementFormValues) => {
    const { currentItemKey, values, element } = formValues;

    if (values.type === "element" && !element) {
      notification.error({ title: "Error: element not found" });

      return;
    }

    const data =
      values.type === "element" && element
        ? buildElementNode({
            parentKey: currentItemKey,
            title: values.title,
            elementValue: element.value,
            fills: values.children,
          })
        : buildHtmlNode({
            parentKey: currentItemKey,
            title: values.title,
            value: values.value ?? "",
          });

    addTreeNode(data)
      .then(() => {
        props.refresh();
      })
      .catch(notifyError("Could not add the node"));

    setModalAddElement({ isOpen: false, data: null });
  };

  const handleCancelModalEdit = () => {
    setModalEditElement({ isOpen: false, data: null });
  };

  const handleCancelModalAdd = () => {
    setModalAddElement({ isOpen: false, data: null });
  };

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
        destroyOnHidden
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
        destroyOnHidden
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
