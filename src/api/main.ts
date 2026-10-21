import axios from "axios";
import {
  AddElement,
  AddTreeNode,
  DeleteTreeNode,
  Generate,
  SaveTree,
  UpdateElement,
  UpdateTreeNode,
  DeleteElement,
} from "./main.types";

function getApiUrl(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:9000";
  }
  return `${window.location.protocol}//${window.location.hostname}:9000`;
}

export const API_URL = getApiUrl();

export const generate = () =>
  axios.post<string>(`${API_URL}/generate`).then((res) => res.data);

export const getTree = () =>
  axios.get(`${API_URL}/template-tree`).then((res) => res.data);

export const saveTree = (data: SaveTree) =>
  axios.post(`${API_URL}/save-template-tree`, data).then((res) => res.data);

export const updateTreeNode = (data: UpdateTreeNode) =>
  axios.post(`${API_URL}/update-node-tree`, data).then((res) => res.data);

export const addTreeNode = (data: AddTreeNode) =>
  axios.post(`${API_URL}/add-node-tree`, data).then((res) => res.data);

export const deleteTreeNode = (data: DeleteTreeNode) =>
  axios.post(`${API_URL}/delete-node-tree`, data).then((res) => res.data);

export const getAllElements = () =>
  axios.get(`${API_URL}/all-elements`).then((res) => res.data);

export const addElement = (data: AddElement) =>
  axios.post(`${API_URL}/add-element`, data).then((res) => res.data);

export const updateElement = (data: UpdateElement) =>
  axios.put(`${API_URL}/element`, data).then((res) => res.data);

export const deleteElement = ({ key }: DeleteElement) =>
  axios.delete(`${API_URL}/delete-element/${key}`).then((res) => res.data);
