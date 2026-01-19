import Axios from "axios";

export const downloadFile = async (url: string): Promise<void> => {
  try {
    const res = await Axios.get(url, {
      responseType: "blob",
    });
    const blob = new Blob([res.data], { type: res.headers["content-type"] });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = url.substring(url.lastIndexOf("/") + 1);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    console.log("ERROR - Downloading file failed: ", e);
    throw e;
  }
};

export const toBase64 = (file: File) =>
  new Promise<string | ArrayBuffer | null>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
