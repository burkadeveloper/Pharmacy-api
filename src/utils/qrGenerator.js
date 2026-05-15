import QRCode from "qrcode";

export const generateQR = async (data) => {
  try {
    return await QRCode.toDataURL(JSON.stringify(data));
  } catch (err) {
    console.error("QR generation error:", err);
    return null;
  }
};
