import { Dropdown, Menu, MenuProps, Tree, Modal } from "antd";
// import type { DataNode, TreeProps } from "antd/es/tree";
import React, { useState } from "react";
import { TemplateTreeProps } from "./TemplateTree.types";

import { MenuInfo } from "rc-menu/lib/interface";
import EditElementForm from "./EditElementForm/EditElementForm";
import { TemplateTree as TemplateTreeNode } from "./../../types";
import { ModalState } from "./EditElementForm/EditElementForm.types";
import { updateTreeNode } from "../../api/main";

const TemplateTree = (props: TemplateTreeProps) => {
  const [modal, setModal] = useState<ModalState>({ isOpen: false, data: null });

  const items: MenuProps["items"] = [
    {
      label: "Edit",
      key: "edit",
    },
  ];

  const handleMenuClick = (e: MenuInfo, item: TemplateTreeNode) => {
    const map: Record<string, Function | undefined> = {
      "edit": () => setModal({ isOpen: true, data: item }),
    };

    map[e.key]?.();

    // message.info("Click on menu item.");
    console.log("click", e);
    console.log("item", item);
  };

  const onSubmit = (values: any) => {
    console.log("values", values);

    updateTreeNode({ value: values.value, key: values.key }).then(() => {
      props.refresh();
    });

    setModal({ isOpen: false, data: null });
    // const root: SaveTree["treeData"] = [
    //   { title: "root", key: "1", value: values.value, children: [] },
    // ];

    // saveTree({ treeData: root }).then(() => {
    //   setIsModalOpen(false);
    //   getTreeData()
    // });
  };

  const handleCancel = () => {
    setModal({ isOpen: false, data: null });
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
        open={modal.isOpen}
        onCancel={handleCancel}
        footer={null}
        width={1000}
      >
        {modal.data ? (
          <EditElementForm
            data={modal.data}
            onSubmit={onSubmit}
            onCancel={handleCancel}
          />
        ) : null}
      </Modal>
    </>
  );
};

export default TemplateTree;
