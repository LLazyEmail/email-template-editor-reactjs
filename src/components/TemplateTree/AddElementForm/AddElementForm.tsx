import React, { useEffect } from "react";
import { Button, Form, Input } from "antd";
import { AddElementFormProps } from "./AddElementForm.types";

const { TextArea } = Input;

const AddElementForm = ({ onCancel, onSubmit, data }: AddElementFormProps) => {
  const [form] = Form.useForm();

  const onReset = () => {
    form.resetFields();
  };

  //   useEffect(() => {
  //     form.setFieldsValue(data);
  //   }, []);

  //   const onFill = () => {
  //     form.setFieldsValue({ note: "Hello world!", gender: "male" });
  //   };

  return (
    <Form
      //   {...layout}
      form={form}
      name="control-hooks"
      onFinish={(values) => onSubmit({ ...values, key: data.key })}
      style={{ maxWidth: 1000 }}
      initialValues={{ value: data.value }}
    >
      <Form.Item name="value" label="Value" rules={[{ required: true }]}>
        <TextArea
          spellCheck="false"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          showCount
          rows={8}
        />
      </Form.Item>

      <Form.Item style={{ display: "flex", justifyContent: "end" }}>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
        <Button onClick={onCancel}>Cancel</Button>
        <Button htmlType="button" onClick={onReset}>
          Reset
        </Button>
        {/* <Button type="link" htmlType="button" onClick={onFill}>
            Fill form
          </Button> */}
      </Form.Item>
    </Form>
  );
};

export default AddElementForm;
