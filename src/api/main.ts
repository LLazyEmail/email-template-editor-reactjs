import axios from "axios";
import {
  AddElement,
  AddTreeNode,
  DeleteTreeNode,
  GenerateResponse,
  SaveTree,
  UpdateElement,
  UpdateTreeNode,
  DeleteElement,
} from "./main.types";
import { resolveApiUrl } from "./apiUrl";

export const API_URL = resolveApiUrl({
  location: typeof window === "undefined" ? undefined : window.location,
  nodeEnv: process.env.NODE_ENV,
  envUrl: process.env.NEXT_PUBLIC_API_URL,
});

const enc = encodeURIComponent;

export const generate = () =>
  axios
    .post<GenerateResponse>(`${API_URL}/generate`)
    .then((res) => res.data.url);

export const getTree = () =>
  axios.get(`${API_URL}/tree`).then((res) => res.data);

export const saveTree = (data: SaveTree) =>
  axios.put(`${API_URL}/tree`, data).then((res) => res.data);

export const updateTreeNode = ({ key, ...patch }: UpdateTreeNode) =>
  axios
    .patch(`${API_URL}/tree/nodes/${enc(key)}`, patch)
    .then((res) => res.data);

export const addTreeNode = (data: AddTreeNode) =>
  axios.post(`${API_URL}/tree/nodes`, data).then((res) => res.data);

export const deleteTreeNode = ({ key }: DeleteTreeNode) =>
  axios.delete(`${API_URL}/tree/nodes/${enc(key)}`).then((res) => res.data);

export const getAllElements = () =>
  axios.get(`${API_URL}/elements`).then((res) => res.data);

export const addElement = (data: AddElement) =>
  axios.post(`${API_URL}/elements`, data).then((res) => res.data);

export const updateElement = ({ key, ...patch }: UpdateElement) =>
  axios
    .patch(`${API_URL}/elements/${enc(key)}`, patch)
    .then((res) => res.data);

export const deleteElement = ({ key }: DeleteElement) =>
  axios.delete(`${API_URL}/elements/${enc(key)}`).then((res) => res.data);
