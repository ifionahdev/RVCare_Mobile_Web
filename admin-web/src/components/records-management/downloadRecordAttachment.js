import api from "../../api/axios";

const downloadRecordAttachment = async (attachment) => {
  const response = await api.get(`/records/attachments/${attachment.id}`, {
    responseType: "blob",
  });
  const objectUrl = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = attachment.originalName || "record-attachment";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
};

export default downloadRecordAttachment;
